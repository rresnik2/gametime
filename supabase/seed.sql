-- Local development seed data. Runs on `npm run db:reset`; never pushed to the hosted project.
--
-- Test accounts (local only): every seed user signs in with their email below and the
-- password `gametime-local-dev`.
--
-- The "live" streams point at public HLS test videos so the feed can be built in Phase 2
-- without anyone streaming.

-- ---------------------------------------------------------------------------
-- Games. Names are placeholders; the team replaces them with the real launch list.
-- ---------------------------------------------------------------------------

insert into public.games (id, slug, name, color, is_original) values
  ('00000000-0000-4000-a000-000000000001', 'gametime-original', 'GameTime Original (TBD)', '#7C5CFF', true),
  ('00000000-0000-4000-a000-000000000002', 'arena-shooter',     'Arena Shooter',            '#FF3B5C', false),
  ('00000000-0000-4000-a000-000000000003', 'battle-royale',     'Battle Royale',            '#FF9F1C', false),
  ('00000000-0000-4000-a000-000000000004', 'kart-racing',       'Kart Racing',              '#2EF2C3', false),
  ('00000000-0000-4000-a000-000000000005', 'block-builder',     'Block Builder',            '#4CAF50', false),
  ('00000000-0000-4000-a000-000000000006', 'moba',              'MOBA',                     '#3D8BFF', false),
  ('00000000-0000-4000-a000-000000000007', 'fighting',          'Fighting',                 '#E040FB', false),
  ('00000000-0000-4000-a000-000000000008', 'puzzle',            'Puzzle',                   '#FFD60A', false),
  ('00000000-0000-4000-a000-000000000009', 'mobile-strategy',   'Mobile Strategy',          '#00BCD4', false),
  ('00000000-0000-4000-a000-00000000000a', 'just-chatting',     'Just Chatting',            '#A1A1B5', false);

-- ---------------------------------------------------------------------------
-- Test users. The on_auth_user_created trigger creates their profiles and account details
-- from the metadata. `minor13` is 14, so it can watch and chat but not stream.
-- ---------------------------------------------------------------------------

with seed_users (id, email, username, birth_date) as (
  values
    ('00000000-0000-4000-b000-000000000001'::uuid, 'pixelpilot@gametime.test',  'pixelpilot',  '2003-04-12'),
    ('00000000-0000-4000-b000-000000000002'::uuid, 'nova@gametime.test',        'nova',        '2001-09-30'),
    ('00000000-0000-4000-b000-000000000003'::uuid, 'kartqueen@gametime.test',   'kartqueen',   '2005-01-22'),
    ('00000000-0000-4000-b000-000000000004'::uuid, 'blockhead@gametime.test',   'blockhead',   '2004-07-04'),
    ('00000000-0000-4000-b000-000000000005'::uuid, 'combo_king@gametime.test',  'combo_king',  '1999-11-11'),
    ('00000000-0000-4000-b000-000000000006'::uuid, 'scroller@gametime.test',    'scroller',    '2006-02-14'),
    ('00000000-0000-4000-b000-000000000007'::uuid, 'squadseeker@gametime.test', 'squadseeker', '2002-06-18'),
    ('00000000-0000-4000-b000-000000000008'::uuid, 'minor13@gametime.test',     'minor13',     (current_date - interval '14 years')::date::text)
),
inserted as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  )
  select
    '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
    extensions.crypt('gametime-local-dev', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('username', username, 'birth_date', birth_date),
    now(), now(), '', '', '', ''
  from seed_users
  returning id, email
)
insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
select
  gen_random_uuid(), id, id::text,
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  'email', now(), now(), now()
from inserted;

-- ---------------------------------------------------------------------------
-- Favorite games, follows
-- ---------------------------------------------------------------------------

insert into public.favorite_games (user_id, game_id) values
  ('00000000-0000-4000-b000-000000000006', '00000000-0000-4000-a000-000000000002'),
  ('00000000-0000-4000-b000-000000000006', '00000000-0000-4000-a000-000000000004'),
  ('00000000-0000-4000-b000-000000000006', '00000000-0000-4000-a000-000000000008'),
  ('00000000-0000-4000-b000-000000000007', '00000000-0000-4000-a000-000000000003'),
  ('00000000-0000-4000-b000-000000000007', '00000000-0000-4000-a000-000000000006'),
  ('00000000-0000-4000-b000-000000000007', '00000000-0000-4000-a000-000000000007');

insert into public.follows (follower_id, followee_id) values
  ('00000000-0000-4000-b000-000000000006', '00000000-0000-4000-b000-000000000001'),
  ('00000000-0000-4000-b000-000000000006', '00000000-0000-4000-b000-000000000003'),
  ('00000000-0000-4000-b000-000000000007', '00000000-0000-4000-b000-000000000002'),
  ('00000000-0000-4000-b000-000000000007', '00000000-0000-4000-b000-000000000005');

-- ---------------------------------------------------------------------------
-- Streams: 5 live (public HLS test videos), 2 ended
-- ---------------------------------------------------------------------------

insert into public.streams (user_id, title, game_id, status, playback_url, viewer_count, started_at, ended_at) values
  ('00000000-0000-4000-b000-000000000001', 'Ranked grind to Diamond, come hang', '00000000-0000-4000-a000-000000000002', 'live',
   'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 1243, now() - interval '42 minutes', null),
  ('00000000-0000-4000-b000-000000000002', 'Solo squads, no mercy',              '00000000-0000-4000-a000-000000000003', 'live',
   'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8', 87, now() - interval '15 minutes', null),
  ('00000000-0000-4000-b000-000000000003', 'Time trials + viewer races',         '00000000-0000-4000-a000-000000000004', 'live',
   'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 6, now() - interval '5 minutes', null),
  ('00000000-0000-4000-b000-000000000004', 'Building a castle, day 12',          '00000000-0000-4000-a000-000000000005', 'live',
   'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8', 3, now() - interval '1 hour', null),
  ('00000000-0000-4000-b000-000000000005', 'Lab session: new combos',            '00000000-0000-4000-a000-000000000007', 'live',
   'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 412, now() - interval '2 hours', null),
  ('00000000-0000-4000-b000-000000000001', 'Late night casuals',                 '00000000-0000-4000-a000-000000000002', 'ended',
   null, 0, now() - interval '1 day 3 hours', now() - interval '1 day 1 hour'),
  ('00000000-0000-4000-b000-000000000002', 'Patch day first look',               '00000000-0000-4000-a000-000000000003', 'ended',
   null, 0, now() - interval '2 days', now() - interval '2 days' + interval '90 minutes');

-- ---------------------------------------------------------------------------
-- A little chat on the first stream
-- ---------------------------------------------------------------------------

insert into public.chat_messages (stream_id, user_id, text)
select s.id, m.user_id, m.text
from public.streams s
cross join (values
  ('00000000-0000-4000-b000-000000000006'::uuid, 'that flick was insane'),
  ('00000000-0000-4000-b000-000000000007'::uuid, 'gg'),
  ('00000000-0000-4000-b000-000000000002'::uuid, 'Diamond tonight for sure')
) as m (user_id, text)
where s.user_id = '00000000-0000-4000-b000-000000000001' and s.status = 'live';
