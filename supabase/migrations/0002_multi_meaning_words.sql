-- Words can have more than one valid translation (e.g. "evaluate" ->
-- "değerlendirmek" / "değerlendirmeye almak"). Store translations as an
-- ordered array instead of a single string so the UI can show every meaning
-- and quizzes can accept any of them as a correct typed answer.

alter table public.dictionary_cache
  alter column word_tr type text[]
  using (case when word_tr is null then null else array[word_tr] end);

alter table public.user_words
  alter column word_tr type text[]
  using array[word_tr];
