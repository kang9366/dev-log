-- 글의 HTML 버전 (에디터에서 .html 업로드). 없으면 null → 글 페이지에 전환 토글 안 보임
alter table public.posts add column html text;
