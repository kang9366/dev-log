import Home from '@feature/home/Home'
import { getPublishedPosts } from '@lib/posts'

// ponytail: 새 글/수정은 최대 60초 뒤 반영. 즉시 반영 필요하면 출간 시 revalidatePath 호출하는 API 추가
export const revalidate = 60

export default async function HomePage() {
  return <Home posts={await getPublishedPosts()} />
}
