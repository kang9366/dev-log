-- posts: 관리자만 글 삭제
grant delete on public.posts to authenticated;

create policy "admins can delete posts"
  on public.posts for delete
  to authenticated
  using ((select public.is_admin()));
