-- Adds formatting preset + options to matters for exhibit generation.
alter table public.matters
  add column if not exists format_preset text not null default 'quick';

alter table public.matters
  add column if not exists format_options jsonb not null default '{}'::jsonb;
