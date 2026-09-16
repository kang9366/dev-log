alter table public.posts add column published boolean not null default true;
alter table public.posts alter column published set default false;

drop policy "posts are publicly readable" on public.posts;
create policy "published posts are publicly readable"
  on public.posts for select
  to anon, authenticated
  using (published);
