-- Edge Function(admin-otp)이 서버 전용 키로 관리자 이메일을 읽기 위함
grant select on public.admins to service_role;
