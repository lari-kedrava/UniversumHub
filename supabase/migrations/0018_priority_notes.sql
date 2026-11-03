alter table public.clients
  add column if not exists priority_notes text;
