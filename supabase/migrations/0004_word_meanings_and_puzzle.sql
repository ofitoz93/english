-- Structured "detailed add" flow: each user_words entry can carry one or more
-- meaning tags (Turkish translation + part of speech + CEFR level + example
-- sentence). user_words.word_tr/level stay as a denormalized summary kept in
-- sync by the app so existing quiz/listing code keeps working unmodified.

create table if not exists public.word_meanings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  user_word_id uuid not null references public.user_words (id) on delete cascade,
  word_tr text not null,
  word_type text not null check (word_type in
    ('İsim', 'Fiil', 'Sıfat', 'Zarf', 'Zamir', 'Edat', 'Bağlaç', 'Ünlem', 'Deyim')),
  level text check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  example_sentence text,
  created_at timestamptz not null default now()
);

create index if not exists word_meanings_user_word_id_idx on public.word_meanings (user_word_id);
create index if not exists word_meanings_user_id_idx on public.word_meanings (user_id);

alter table public.word_meanings enable row level security;

drop policy if exists "word_meanings_all_own" on public.word_meanings;
create policy "word_meanings_all_own"
  on public.word_meanings for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- New "puzzle" quiz mode (list-style word puzzle game).
alter table public.quiz_attempts drop constraint if exists quiz_attempts_mode_check;
alter table public.quiz_attempts add constraint quiz_attempts_mode_check
  check (mode in ('word', 'flashcard', 'daily', 'sentence', 'puzzle'));
