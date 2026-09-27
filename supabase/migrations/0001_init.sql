-- English learning app: schema, RLS, storage, and CEFR seed data.
-- Run this once in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists pgcrypto;

-- ============================================================
-- Tables
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.dictionary_cache (
  word_en text primary key,
  word_tr text,
  level text check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  source text not null default 'static_list',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_words (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word_en text not null,
  word_tr text not null,
  level text check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  created_at timestamptz not null default now(),
  unique (user_id, word_en)
);

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word_en text not null,
  image_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Adsız not',
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word_en text not null,
  mode text not null check (mode in ('word', 'flashcard', 'daily', 'sentence')),
  correct boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists user_words_user_id_idx on public.user_words (user_id);
create index if not exists user_words_level_idx on public.user_words (level);
create index if not exists flashcards_user_id_idx on public.flashcards (user_id);
create index if not exists notes_user_id_idx on public.notes (user_id);
create index if not exists quiz_attempts_user_id_idx on public.quiz_attempts (user_id);

-- ============================================================
-- Helper functions & triggers
-- ============================================================

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = uid and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists dictionary_cache_set_updated_at on public.dictionary_cache;
create trigger dictionary_cache_set_updated_at
  before update on public.dictionary_cache
  for each row execute function public.set_updated_at();

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.dictionary_cache enable row level security;
alter table public.user_words enable row level security;
alter table public.flashcards enable row level security;
alter table public.notes enable row level security;
alter table public.quiz_attempts enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (id = auth.uid() or public.is_admin(auth.uid()))
  with check (id = auth.uid() or public.is_admin(auth.uid()));

-- dictionary_cache: readable by every signed-in user, writable only by the
-- service-role client (lib/supabase/admin.ts), which bypasses RLS entirely.
drop policy if exists "dictionary_cache_select_all" on public.dictionary_cache;
create policy "dictionary_cache_select_all"
  on public.dictionary_cache for select
  to authenticated
  using (true);

drop policy if exists "user_words_all_own" on public.user_words;
create policy "user_words_all_own"
  on public.user_words for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "flashcards_all_own" on public.flashcards;
create policy "flashcards_all_own"
  on public.flashcards for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notes_all_own" on public.notes;
create policy "notes_all_own"
  on public.notes for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "quiz_attempts_all_own" on public.quiz_attempts;
create policy "quiz_attempts_all_own"
  on public.quiz_attempts for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- Storage: flashcard images, isolated per-user folder
-- ============================================================

insert into storage.buckets (id, name, public)
values ('flashcards', 'flashcards', false)
on conflict (id) do nothing;

drop policy if exists "flashcards_storage_owner_select" on storage.objects;
create policy "flashcards_storage_owner_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'flashcards' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "flashcards_storage_owner_insert" on storage.objects;
create policy "flashcards_storage_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'flashcards' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "flashcards_storage_owner_delete" on storage.objects;
create policy "flashcards_storage_owner_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'flashcards' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- CEFR seed data (word_en/level only — word_tr is filled in lazily via the
-- free translation API the first time any user looks the word up).
-- ============================================================

insert into public.dictionary_cache (word_en, level) values
('i','A1'),('you','A1'),('he','A1'),('she','A1'),('it','A1'),('we','A1'),('they','A1'),
('a','A1'),('an','A1'),('the','A1'),('is','A1'),('am','A1'),('are','A1'),('was','A1'),
('were','A1'),('be','A1'),('have','A1'),('has','A1'),('do','A1'),('does','A1'),('go','A1'),
('goes','A1'),('come','A1'),('see','A1'),('look','A1'),('want','A1'),('like','A1'),('need','A1'),
('good','A1'),('bad','A1'),('big','A1'),('small','A1'),('hot','A1'),('cold','A1'),('new','A1'),
('old','A1'),('happy','A1'),('sad','A1'),('one','A1'),('two','A1'),('three','A1'),('four','A1'),
('five','A1'),('six','A1'),('seven','A1'),('eight','A1'),('nine','A1'),('ten','A1'),('day','A1'),
('night','A1'),('morning','A1'),('evening','A1'),('week','A1'),('month','A1'),('year','A1'),
('time','A1'),('house','A1'),('home','A1'),('family','A1'),('mother','A1'),('father','A1'),
('sister','A1'),('brother','A1'),('friend','A1'),('man','A1'),('woman','A1'),('boy','A1'),
('girl','A1'),('child','A1'),('children','A1'),('school','A1'),('teacher','A1'),('student','A1'),
('book','A1'),('pen','A1'),('pencil','A1'),('table','A1'),('chair','A1'),('door','A1'),
('window','A1'),('water','A1'),('food','A1'),('bread','A1'),('milk','A1'),('tea','A1'),
('coffee','A1'),('apple','A1'),('banana','A1'),('car','A1'),('bus','A1'),('train','A1'),
('dog','A1'),('cat','A1'),('bird','A1'),('fish','A1'),('red','A1'),('blue','A1'),('green','A1'),
('yellow','A1'),('white','A1'),('black','A1'),('hello','A1'),('goodbye','A1'),('please','A1'),
('thank','A1'),('sorry','A1'),('yes','A1'),('no','A1'),('name','A1'),('age','A1'),('city','A1'),
('country','A1'),('street','A1'),('shop','A1'),('money','A1'),('work','A1'),('job','A1'),
('phone','A1'),('computer','A1'),('television','A1'),('radio','A1'),('music','A1'),('film','A1'),
('sport','A1'),('football','A1'),('run','A1'),('walk','A1'),('eat','A1'),('drink','A1'),
('sleep','A1'),('read','A1'),('write','A1'),('speak','A1'),('listen','A1'),('play','A1'),
('study','A1'),('learn','A1'),('open','A1'),('close','A1'),('sit','A1'),('stand','A1'),
('give','A1'),('take','A1'),('buy','A1'),('sell','A1'),('love','A1'),('hate','A1'),('help','A1'),
('hour','A1'),('minute','A1'),('today','A1'),('tomorrow','A1'),('yesterday','A1'),('here','A1'),
('there','A1'),('this','A1'),('that','A1'),('these','A1'),('those','A1'),('my','A1'),
('your','A1'),('his','A1'),('her','A1'),('our','A1'),('their','A1')
on conflict (word_en) do nothing;

insert into public.dictionary_cache (word_en, level) values
('weather','A2'),('sunny','A2'),('rainy','A2'),('cloudy','A2'),('windy','A2'),('snow','A2'),
('season','A2'),('spring','A2'),('summer','A2'),('autumn','A2'),('winter','A2'),('shopping','A2'),
('market','A2'),('restaurant','A2'),('menu','A2'),('waiter','A2'),('bill','A2'),('holiday','A2'),
('travel','A2'),('airport','A2'),('airplane','A2'),('hotel','A2'),('ticket','A2'),('passport','A2'),
('luggage','A2'),('beach','A2'),('mountain','A2'),('river','A2'),('lake','A2'),('forest','A2'),
('village','A2'),('town','A2'),('hospital','A2'),('doctor','A2'),('nurse','A2'),('medicine','A2'),
('sick','A2'),('healthy','A2'),('exercise','A2'),('breakfast','A2'),('lunch','A2'),('dinner','A2'),
('cook','A2'),('kitchen','A2'),('bedroom','A2'),('bathroom','A2'),('garden','A2'),('wall','A2'),
('floor','A2'),('roof','A2'),('key','A2'),('letter','A2'),('postcard','A2'),('email','A2'),
('internet','A2'),('website','A2'),('message','A2'),('call','A2'),('meet','A2'),('invite','A2'),
('party','A2'),('birthday','A2'),('present','A2'),('gift','A2'),('wedding','A2'),('married','A2'),
('single','A2'),('neighbour','A2'),('colleague','A2'),('boss','A2'),('manager','A2'),('company','A2'),
('office','A2'),('meeting','A2'),('interview','A2'),('salary','A2'),('experience','A2'),
('education','A2'),('university','A2'),('college','A2'),('subject','A2'),('homework','A2'),
('exam','A2'),('test','A2'),('grade','A2'),('result','A2'),('museum','A2'),('theatre','A2'),
('concert','A2'),('painting','A2'),('picture','A2'),('photograph','A2'),('camera','A2'),
('newspaper','A2'),('magazine','A2'),('novel','A2'),('poem','A2'),('story','A2'),('character','A2'),
('language','A2'),('foreign','A2'),('culture','A2'),('tradition','A2'),('festival','A2'),
('celebrate','A2'),('custom','A2'),('religion','A2'),('history','A2'),('geography','A2'),
('science','A2'),('mathematics','A2'),('chemistry','A2'),('physics','A2'),('biology','A2'),
('environment','A2'),('pollution','A2'),('recycle','A2'),('energy','A2'),('electricity','A2'),
('gas','A2'),('oil','A2'),('plastic','A2'),('glass','A2'),('metal','A2'),('wood','A2'),
('cotton','A2'),('wool','A2'),('leather','A2'),('size','A2'),('shape','A2'),('round','A2'),
('square','A2'),('height','A2'),('weight','A2'),('length','A2'),('distance','A2'),('speed','A2'),
('direction','A2'),('north','A2'),('south','A2'),('east','A2'),('west','A2'),('left','A2'),
('right','A2'),('straight','A2'),('corner','A2'),('bridge','A2'),('traffic','A2'),('accident','A2'),
('police','A2'),('fire','A2'),('danger','A2'),('safe','A2'),('rule','A2'),('law','A2'),
('government','A2'),('president','A2'),('vote','A2'),('war','A2'),('peace','A2'),('army','A2'),
('soldier','A2')
on conflict (word_en) do nothing;

insert into public.dictionary_cache (word_en, level) values
('achieve','B1'),('advantage','B1'),('disadvantage','B1'),('advice','B1'),('afford','B1'),
('ambition','B1'),('ancient','B1'),('announce','B1'),('anxious','B1'),('apologize','B1'),
('appear','B1'),('appreciate','B1'),('argue','B1'),('argument','B1'),('arrange','B1'),
('attitude','B1'),('attract','B1'),('available','B1'),('average','B1'),('avoid','B1'),
('aware','B1'),('behaviour','B1'),('belief','B1'),('benefit','B1'),('border','B1'),
('brave','B1'),('breathe','B1'),('budget','B1'),('campaign','B1'),('career','B1'),
('cause','B1'),('challenge','B1'),('chance','B1'),('charity','B1'),('cheat','B1'),
('check','B1'),('choice','B1'),('circumstance','B1'),('comfort','B1'),('comment','B1'),
('common','B1'),('community','B1'),('compare','B1'),('compete','B1'),('complain','B1'),
('complex','B1'),('concentrate','B1'),('concern','B1'),('confidence','B1'),('confuse','B1'),
('connect','B1'),('consider','B1'),('consist','B1'),('contain','B1'),('continue','B1'),
('contract','B1'),('contrast','B1'),('contribute','B1'),('control','B1'),('convince','B1'),
('cooperate','B1'),('courage','B1'),('create','B1'),('crime','B1'),('criticize','B1'),
('crowd','B1'),('cure','B1'),('curious','B1'),('damage','B1'),('decision','B1'),
('declare','B1'),('decrease','B1'),('defend','B1'),('definite','B1'),('delay','B1'),
('deliver','B1'),('demand','B1'),('deny','B1'),('depend','B1'),('describe','B1'),
('deserve','B1'),('destroy','B1'),('determine','B1'),('develop','B1'),('device','B1'),
('differ','B1'),('difficulty','B1'),('disappear','B1'),('disappoint','B1'),('discover','B1'),
('discuss','B1'),('disease','B1'),('disturb','B1'),('divide','B1'),('doubt','B1'),
('dream','B1'),('effect','B1'),('effort','B1'),('elect','B1'),('embarrass','B1'),
('emotion','B1'),('employ','B1'),('encourage','B1'),('enemy','B1'),('engine','B1'),
('enormous','B1'),('entertain','B1'),('entire','B1'),('equal','B1'),('escape','B1'),
('especially','B1'),('essential','B1'),('establish','B1'),('estimate','B1'),('event','B1'),
('evidence','B1'),('exact','B1'),('examine','B1'),('example','B1'),('excellent','B1'),
('exchange','B1'),('excite','B1'),('exist','B1'),('expand','B1'),('expect','B1'),
('experiment','B1'),('explain','B1'),('explore','B1'),('export','B1'),('expose','B1'),
('express','B1'),('extra','B1'),('extreme','B1'),('fail','B1'),('fair','B1'),
('familiar','B1'),('fault','B1'),('favour','B1'),('feature','B1'),('financial','B1'),
('fit','B1'),('flexible','B1'),('focus','B1'),('forbid','B1'),('force','B1'),
('forgive','B1'),('fortunate','B1'),('freedom','B1'),('frighten','B1'),('function','B1'),
('furniture','B1')
on conflict (word_en) do nothing;

insert into public.dictionary_cache (word_en, level) values
('abandon','B2'),('abolish','B2'),('absolute','B2'),('absorb','B2'),('abstract','B2'),
('abundant','B2'),('accelerate','B2'),('accompany','B2'),('accomplish','B2'),('accumulate','B2'),
('accurate','B2'),('accuse','B2'),('acknowledge','B2'),('acquire','B2'),('adapt','B2'),
('adequate','B2'),('adjust','B2'),('administer','B2'),('adopt','B2'),('advocate','B2'),
('aggressive','B2'),('alienate','B2'),('allocate','B2'),('alter','B2'),('ambiguous','B2'),
('amend','B2'),('analogy','B2'),('analyze','B2'),('anticipate','B2'),('arbitrary','B2'),
('articulate','B2'),('aspect','B2'),('assemble','B2'),('assert','B2'),('assess','B2'),
('asset','B2'),('assign','B2'),('assist','B2'),('assume','B2'),('assure','B2'),
('attain','B2'),('attribute','B2'),('authentic','B2'),('authority','B2'),('autonomy','B2'),
('behalf','B2'),('benevolent','B2'),('bias','B2'),('bulk','B2'),('capable','B2'),
('capacity','B2'),('coincide','B2'),('collaborate','B2'),('collapse','B2'),('commence','B2'),
('commodity','B2'),('compensate','B2'),('compile','B2'),('complement','B2'),('comply','B2'),
('component','B2'),('comprehend','B2'),('comprehensive','B2'),('compromise','B2'),('conceive','B2'),
('concede','B2'),('conclude','B2'),('concurrent','B2'),('conduct','B2'),('confer','B2'),
('configure','B2'),('confine','B2'),('conform','B2'),('consequent','B2'),('considerable','B2'),
('consistent','B2'),('constant','B2'),('constitute','B2'),('constrain','B2'),('construct','B2'),
('consult','B2'),('consume','B2'),('contemporary','B2'),('context','B2'),('contradict','B2'),
('contrary','B2'),('convert','B2'),('convey','B2'),('coordinate','B2'),('core','B2'),
('correspond','B2'),('criteria','B2'),('crucial','B2'),('cumulative','B2'),('decline','B2')
on conflict (word_en) do nothing;

insert into public.dictionary_cache (word_en, level) values
('abrogate','C1'),('acumen','C1'),('adjudicate','C1'),('aesthetic','C1'),('alacrity','C1'),
('ambivalent','C1'),('anomaly','C1'),('antithesis','C1'),('apathy','C1'),('arbitrate','C1'),
('ascertain','C1'),('assiduous','C1'),('audacious','C1'),('austere','C1'),('autonomous','C1'),
('cacophony','C1'),('candid','C1'),('capitulate','C1'),('catalyst','C1'),('circumvent','C1'),
('coalesce','C1'),('cogent','C1'),('coherent','C1'),('complacent','C1'),('conducive','C1'),
('conjecture','C1'),('connotation','C1'),('contentious','C1'),('conundrum','C1'),('convoluted','C1'),
('corroborate','C1'),('credible','C1'),('cynical','C1'),('deference','C1'),('deleterious','C1'),
('deploy','C1'),('deprecate','C1'),('derivative','C1'),('deter','C1'),('deviate','C1'),
('dichotomy','C1'),('discern','C1'),('discrepancy','C1'),('disparate','C1'),('disseminate','C1'),
('dogmatic','C1'),('dubious','C1'),('eclectic','C1'),('elicit','C1')
on conflict (word_en) do nothing;

insert into public.dictionary_cache (word_en, level) values
('anathema','C2'),('apocryphal','C2'),('arcane','C2'),('avarice','C2'),('bombastic','C2'),
('cajole','C2'),('castigate','C2'),('circumlocution','C2'),('contumacious','C2'),('desultory','C2'),
('didactic','C2'),('ebullient','C2'),('effervescent','C2'),('egregious','C2'),('ephemeral','C2'),
('equanimity','C2'),('esoteric','C2'),('euphemism','C2'),('excoriate','C2'),('exigent','C2'),
('expiate','C2'),('extemporaneous','C2'),('facetious','C2'),('fastidious','C2')
on conflict (word_en) do nothing;
