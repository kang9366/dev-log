create table public.posts (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  tag text not null,
  excerpt text not null default '',
  image_url text not null default '',
  published_at date not null default current_date,
  body text not null default '',
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "posts are publicly readable"
  on public.posts for select
  to anon, authenticated
  using (true);
