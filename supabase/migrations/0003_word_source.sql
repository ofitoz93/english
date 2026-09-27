-- Optional provenance for a saved word: which show/movie it came from and a
-- free-form note (e.g. the line it was heard in). Both are user-entered, not
-- scraped from any third-party source.

alter table public.user_words
  add column if not exists source_title text,
  add column if not exists source_note text;
