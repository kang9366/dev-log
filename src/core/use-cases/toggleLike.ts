export type LikeState = Record<number, boolean>
export type LikeCounts = Record<number, number>

export function toggleLike(
  id: number,
  liked: LikeState,
  counts: LikeCounts
): { liked: LikeState; counts: LikeCounts } {
  const nextLiked = { ...liked, [id]: !liked[id] }
  const delta = nextLiked[id] ? 1 : -1
  return {
    liked: nextLiked,
    counts: { ...counts, [id]: (counts[id] ?? 0) + delta },
  }
}

