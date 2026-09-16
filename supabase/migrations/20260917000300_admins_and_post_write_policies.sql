-- 관리자 이메일 목록 (클라이언트에서 직접 조회 불가)
-- 실제 이메일은 저장소에 커밋하지 않고 DB에만 넣음:
--   insert into public.admins (email) values ('<관리자 이메일 소문자>');
create table public.admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- 현재 JWT 이메일이 관리자인지
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins
    where email = lower(auth.jwt() ->> 'email')
  )
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Before User Created 훅: admins 에 없는 이메일은 가입(=인증번호 발송) 거절
-- 대시보드 Authentication > Hooks 에서 이 함수를 연결해야 동작함
create function public.hook_restrict_signup_to_admins(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.admins
    where email = lower(event -> 'user' ->> 'email')
  ) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object('http_code', 403, 'message', 'Signups are restricted.')
  );
end;
$$;
grant execute on function public.hook_restrict_signup_to_admins to supabase_auth_admin;
revoke execute on function public.hook_restrict_signup_to_admins from public, anon, authenticated;

-- posts: 관리자만 임시저장 글 조회 / 작성 / 수정 (삭제 없음)
grant insert, update on public.posts to authenticated;

create policy "admins can read all posts"
  on public.posts for select
  to authenticated
  using ((select public.is_admin()));

create policy "admins can insert posts"
  on public.posts for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "admins can update posts"
  on public.posts for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
