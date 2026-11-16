-- Row-level security and age-gate tests. Run with `npm run db:test` (needs the local stack).
-- Uses the users and streams from supabase/seed.sql.
begin;
select plan(16);

-- Seed user ids
--   pixelpilot  ...b001 (adult, has a live stream)
--   scroller    ...b006 (adult viewer)
--   minor13     ...b008 (14 years old)

-- ---------------------------------------------------------------------------
-- Signed-out viewers
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select is((select count(*)::int from public.get_live_feed()), 5, 'anon sees the 5 seeded live streams');
select is((select count(*)::int from public.stream_keys), 0, 'anon cannot read stream keys');
select is((select count(*)::int from public.account_details), 0, 'anon cannot read birth dates');
select throws_ok(
  $$ insert into public.follows (follower_id, followee_id)
     values ('00000000-0000-4000-b000-000000000006', '00000000-0000-4000-b000-000000000001') $$,
  '42501', null, 'anon cannot follow'
);

-- ---------------------------------------------------------------------------
-- Signed in as scroller (adult viewer)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-4000-b000-000000000006", "role": "authenticated"}';

select is((select count(*)::int from public.account_details), 1, 'users see only their own birth date');

select lives_ok(
  $$ insert into public.chat_messages (stream_id, user_id, text)
     select id, '00000000-0000-4000-b000-000000000006', 'hello'
     from public.streams where user_id = '00000000-0000-4000-b000-000000000001' and status = 'live' $$,
  'users can chat in a live stream'
);

select throws_ok(
  $$ insert into public.chat_messages (stream_id, user_id, text)
     select id, '00000000-0000-4000-b000-000000000007', 'impersonating'
     from public.streams where user_id = '00000000-0000-4000-b000-000000000001' and status = 'live' $$,
  '42501', null, 'users cannot chat as someone else'
);

select throws_ok(
  $$ insert into public.chat_messages (stream_id, user_id, text)
     select id, '00000000-0000-4000-b000-000000000006', 'too late'
     from public.streams where status = 'ended' limit 1 $$,
  '42501', null, 'users cannot chat in an ended stream'
);

select throws_ok(
  $$ update public.streams set status = 'ended'
     where user_id = '00000000-0000-4000-b000-000000000001' $$,
  '42501', null, 'clients cannot change stream status'
);

select lives_ok(
  $$ insert into public.reports (target_type, target_id, reason)
     values ('user', '00000000-0000-4000-b000-000000000007', 'spam') $$,
  'users can file a report'
);
select is((select count(*)::int from public.reports), 0, 'reports are insert-only for users');

select lives_ok(
  $$ insert into public.streams (user_id, title, game_id)
     values ('00000000-0000-4000-b000-000000000006', 'My first stream', '00000000-0000-4000-a000-000000000004') $$,
  'adults can create a pending stream'
);

-- ---------------------------------------------------------------------------
-- Signed in as minor13 (14 years old)
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "00000000-0000-4000-b000-000000000008", "role": "authenticated"}';

select throws_ok(
  $$ insert into public.streams (user_id, title, game_id)
     values ('00000000-0000-4000-b000-000000000008', 'too young', '00000000-0000-4000-a000-000000000004') $$,
  '42501', null, 'under-16s cannot create a stream'
);

-- ---------------------------------------------------------------------------
-- Blocks: pixelpilot blocks squadseeker, who then cannot chat in pixelpilot's stream
-- ---------------------------------------------------------------------------
set local request.jwt.claims = '{"sub": "00000000-0000-4000-b000-000000000001", "role": "authenticated"}';
insert into public.blocks (blocker_id, blocked_id)
values ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-b000-000000000007');

set local request.jwt.claims = '{"sub": "00000000-0000-4000-b000-000000000007", "role": "authenticated"}';
select throws_ok(
  $$ insert into public.chat_messages (stream_id, user_id, text)
     select id, '00000000-0000-4000-b000-000000000007', 'hi'
     from public.streams where user_id = '00000000-0000-4000-b000-000000000001' and status = 'live' $$,
  '42501', null, 'blocked users cannot chat in the blocker''s stream'
);

-- ---------------------------------------------------------------------------
-- Sign-up age gate (runs as the database owner, like the auth service)
-- ---------------------------------------------------------------------------
reset role;

select throws_ok(
  $$ insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
     values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
             'kid@gametime.test',
             jsonb_build_object('username', 'kid', 'birth_date', (current_date - interval '12 years')::date)) $$,
  '23514', 'GameTime is for ages 13 and up', 'sign-up is rejected for under-13s'
);

select lives_ok(
  $$ insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data)
     values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
             'newbie@gametime.test', '{}'::jsonb) $$,
  'sign-up without metadata gets a generated username'
);

select * from finish();
rollback;
