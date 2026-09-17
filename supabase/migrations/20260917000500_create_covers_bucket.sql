-- 글 표지 이미지 저장소. 공개 버킷이라 public URL 로 누구나 이미지 조회 가능
-- select 정책은 두지 않음 → API 로 파일 목록 조회는 불가 (public URL 은 정책과 무관하게 동작)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'covers', 'covers', true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
);

-- 업로드는 관리자만. 파일명은 매번 새로 만들어 덮어쓰기(update)·삭제 정책은 두지 않음
create policy "admins can upload covers"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'covers' and (select public.is_admin()));
