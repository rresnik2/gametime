-- GameTime schema v1 (Phase 1). See PHASE_1_PLAN.md §3–4 for the reasoning behind each table.
--
-- Security model:
--   * RLS is on for every table.
--   * Anyone (including signed-out viewers) can read public data: profiles, games, streams,
--     follows, chat, reactions.
--   * Users write only their own rows.
--   * Stream status, playback info and viewer counts are written only by the service role
--     (the video-provider webhook), never by clients.
--   * Stream keys and birth dates are readable only by their owner.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

-- 'pending' = created in the Go Live flow, waiting for OBS to connect.
create type public.stream_status as enum ('pending', 'live', 'ended');
create type public.report_target as enum ('user', 'stream', 'chat_message');
create type public.report_status as enum ('open', 'reviewed', 'actioned', 'dismissed');

-- ---------------------------------------------------------------------------
-- Profiles (public) and account details (private)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    check (username ~ '^[a-z0-9_]{3,20}$'),
  avatar_url text,
  bio text check (char_length(bio) <= 160),
  created_at timestamptz not null default now()
);

-- Kept apart from profiles because profiles are public and birth dates are not.
create table public.account_details (
  user_id uuid primary key references auth.users (id) on delete cascade,
  birth_date date not null,
  created_at timestamptz not null default now()
);

-- Age gate (product plan): 13+ to use the app, 16+ to stream.
create function public.enforce_minimum_age()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.birth_date > (current_date - interval '13 years') then
    raise exception 'GameTime is for ages 13 and up' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger account_details_minimum_age
  before insert or update on public.account_details
  for each row execute function public.enforce_minimum_age();

create function public.can_stream(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.account_details
    where user_id = uid
      and birth_date <= (current_date - interval '16 years')
  );
$$;

-- Create the profile (and account details, if a birth date was given) when someone signs up.
-- The app passes `username` and `birth_date` in the sign-up metadata.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text := lower(new.raw_user_meta_data ->> 'username');
  requested_birth_date date := (new.raw_user_meta_data ->> 'birth_date')::date;
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(requested_username, 'user_' || substr(replace(new.id::text, '-', ''), 1, 12))
  );

  if requested_birth_date is not null then
    insert into public.account_details (user_id, birth_date)
    values (new.id, requested_birth_date);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Games
-- ---------------------------------------------------------------------------

create table public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  cover_art_url text,
  color text not null default '#7C5CFF' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  -- True for GameTime's own in-app game (decision D2).
  is_original boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.favorite_games (
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

-- ---------------------------------------------------------------------------
-- Streaming
-- ---------------------------------------------------------------------------

-- One persistent ingest per streamer, created by an Edge Function with the video provider.
create table public.stream_keys (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  provider text not null,
  provider_stream_id text not null unique,
  stream_key text not null,
  playback_id text,
  created_at timestamptz not null default now()
);

create table public.streams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 140),
  game_id uuid not null references public.games (id),
  status public.stream_status not null default 'pending',
  playback_id text,
  -- Full HLS URL. Lets seed data and the client stay provider-agnostic until D1 is decided.
  playback_url text,
  -- Periodic snapshot of Realtime Presence on the stream's channel (decision D3).
  viewer_count integer not null default 0 check (viewer_count >= 0),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

-- A streamer can only have one pending or live stream at a time.
create unique index streams_one_active_per_user
  on public.streams (user_id) where status in ('pending', 'live');
create index streams_live_feed on public.streams (started_at desc) where status = 'live';
create index streams_by_game on public.streams (game_id) where status = 'live';
create index streams_by_user on public.streams (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Social
-- ---------------------------------------------------------------------------

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index follows_by_followee on public.follows (followee_id);

create table public.chat_messages (
  id bigint generated always as identity primary key,
  stream_id uuid not null references public.streams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  created_at timestamptz not null default now()
);

create index chat_messages_by_stream on public.chat_messages (stream_id, created_at desc);

create table public.reactions (
  id bigint generated always as identity primary key,
  stream_id uuid not null references public.streams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null default 'heart' check (type in ('heart')),
  created_at timestamptz not null default now()
);

create index reactions_by_stream on public.reactions (stream_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Safety
-- ---------------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target_type public.report_target not null,
  target_id text not null,
  reason text not null check (char_length(reason) between 1 and 500),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now()
);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- Block lists are private to the blocker, so policies that check "has X blocked me?" must
-- read them with elevated rights. This only ever answers yes/no for one pair.
create function public.is_blocked_by(blocker uuid, blocked uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks where blocker_id = blocker and blocked_id = blocked
  );
$$;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.account_details enable row level security;
alter table public.games enable row level security;
alter table public.favorite_games enable row level security;
alter table public.stream_keys enable row level security;
alter table public.streams enable row level security;
alter table public.follows enable row level security;
alter table public.chat_messages enable row level security;
alter table public.reactions enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;

-- profiles: public read; owners update their own (inserts come from the sign-up trigger).
create policy "Profiles are public" on public.profiles
  for select to anon, authenticated using (true);
create policy "Users update their own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- account_details: owner only. Insert covers users who sign up without a birth date.
create policy "Users read their own account details" on public.account_details
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add their own birth date" on public.account_details
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- games: public read; managed by the team with the service role.
create policy "Games are public" on public.games
  for select to anon, authenticated using (true);

-- favorite_games: owner manages their own.
create policy "Favorite games are public" on public.favorite_games
  for select to anon, authenticated using (true);
create policy "Users add their own favorite games" on public.favorite_games
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users remove their own favorite games" on public.favorite_games
  for delete to authenticated using ((select auth.uid()) = user_id);

-- stream_keys: owner can read; only the service role writes (Edge Function).
create policy "Streamers read their own stream key" on public.stream_keys
  for select to authenticated using ((select auth.uid()) = user_id);

-- streams: public read. Owners (16+) create pending streams and edit title/game.
create policy "Streams are public" on public.streams
  for select to anon, authenticated using (true);
create policy "Streamers 16+ create their own streams" on public.streams
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'pending'
    and public.can_stream((select auth.uid()))
  );
create policy "Streamers edit their own streams" on public.streams
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Column privileges: clients may only set these columns. Status, playback info, viewer counts
-- and timestamps are set by the service role.
revoke insert, update on public.streams from anon, authenticated;
grant insert (user_id, title, game_id) on public.streams to authenticated;
grant update (title, game_id) on public.streams to authenticated;

-- follows: public read (follower counts); users follow and unfollow as themselves.
create policy "Follows are public" on public.follows
  for select to anon, authenticated using (true);
create policy "Users follow as themselves" on public.follows
  for insert to authenticated with check ((select auth.uid()) = follower_id);
create policy "Users unfollow as themselves" on public.follows
  for delete to authenticated using ((select auth.uid()) = follower_id);

-- chat_messages: public read; signed-in users post as themselves to live streams,
-- unless the streamer has blocked them.
create policy "Chat is public" on public.chat_messages
  for select to anon, authenticated using (true);
create policy "Users chat as themselves in live streams" on public.chat_messages
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.streams s
      where s.id = stream_id
        and s.status = 'live'
        and not public.is_blocked_by(s.user_id, (select auth.uid()))
    )
  );
create policy "Users delete their own messages" on public.chat_messages
  for delete to authenticated using ((select auth.uid()) = user_id);

-- reactions: public read; users react as themselves to live streams.
create policy "Reactions are public" on public.reactions
  for select to anon, authenticated using (true);
create policy "Users react as themselves in live streams" on public.reactions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.streams s where s.id = stream_id and s.status = 'live')
  );

-- reports: insert-only for users; reviewed by the team with the service role.
create policy "Users file reports as themselves" on public.reports
  for insert to authenticated with check ((select auth.uid()) = reporter_id);

-- blocks: users see and manage only their own block list.
create policy "Users see their own blocks" on public.blocks
  for select to authenticated using ((select auth.uid()) = blocker_id);
create policy "Users block as themselves" on public.blocks
  for insert to authenticated with check ((select auth.uid()) = blocker_id);
create policy "Users unblock as themselves" on public.blocks
  for delete to authenticated using ((select auth.uid()) = blocker_id);

-- ---------------------------------------------------------------------------
-- Feed (placeholder ranking; the real MVP ranking is Phase 2 work)
-- ---------------------------------------------------------------------------

create function public.get_live_feed(page_size integer default 20)
returns table (
  stream_id uuid,
  title text,
  playback_id text,
  playback_url text,
  viewer_count integer,
  started_at timestamptz,
  streamer_id uuid,
  streamer_username text,
  streamer_avatar_url text,
  game_id uuid,
  game_name text,
  game_color text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    s.id, s.title, s.playback_id, s.playback_url, s.viewer_count, s.started_at,
    p.id, p.username, p.avatar_url,
    g.id, g.name, g.color
  from public.streams s
  join public.profiles p on p.id = s.user_id
  join public.games g on g.id = s.game_id
  where s.status = 'live'
  order by s.started_at desc
  limit least(greatest(page_size, 1), 50);
$$;

-- ---------------------------------------------------------------------------
-- Realtime: chat, reactions and stream status changes are pushed to clients.
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.chat_messages, public.reactions, public.streams;
