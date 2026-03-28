import {Box, Stack, Typography} from "@mui/material";
import {useState} from "react";
import BlogPostCard from "@ds/cards/BlogPostCard.tsx";
import PinnedPosts from "@feature/home/PinnedPosts.tsx";
import type {Post} from "@core/domain/post.ts";

const PINNED_POSTS: Post[] = [
    {
        id: 1,
        category: "web",
        title: "Web Vitals,\n프론트엔드의 필수 역량",
        excerpt:
            "Web Vitals, 프론트엔드의 필수 역량프론트엔드 개발자에게 Web Vitals는 더 이상 '알면 좋은 교양'이 아닌, 반드시 갖춰야 할 '필수 역량'이다. 웹페이지는 단순히 CSS의 플로우에 따라 순서대로 페인팅되어 사용자에게 …",
        image: "https://tech.kakaopay.com/_astro/thumb.30942a5c_Z1KVXbp.png",
        href: "/posts/web-vitals",
    },
    {
        id: 2,
        category: "react",
        title: "React 18의\n새로운 기능들",
        excerpt:
            "React 18이 정식 출시되며 Concurrent Features, Suspense, Transitions 등 다양한 기능이 추가되었다. 이 글에서는 주요 변경 사항과 실무 적용 방법을 살펴본다 …",
        image: "https://tech.kakaopay.com/_astro/thumb.30942a5c_Z1KVXbp.png",
        href: "/posts/react-18",
    },
    {
        id: 3,
        category: "performance",
        title: "Next.js로\n성능 최적화하기",
        excerpt:
            "Next.js는 SSR, SSG, ISR 등 다양한 렌더링 전략을 제공한다. 각 전략의 차이를 이해하고 상황에 맞게 선택하는 것이 성능 최적화의 핵심이다 …",
        image: "https://tech.kakaopay.com/_astro/thumb.30942a5c_Z1KVXbp.png",
        href: "/posts/nextjs-performance",
    },
    {
        id: 4,
        category: "css",
        title: "CSS Grid로\n레이아웃 마스터하기",
        excerpt:
            "Flexbox와 Grid는 현대 CSS 레이아웃의 양대 산맥이다. 특히 CSS Grid는 2차원 레이아웃을 손쉽게 구현할 수 있어 복잡한 페이지 구조에 매우 유용하다 …",
        image: "https://tech.kakaopay.com/_astro/thumb.30942a5c_Z1KVXbp.png",
        href: "/posts/css-grid",
    },
    {
        id: 5,
        category: "typescript",
        title: "TypeScript\n실전 패턴 모음",
        excerpt:
            "TypeScript를 실무에서 효과적으로 활용하려면 단순한 타입 선언을 넘어 Generic, Utility Types, Conditional Types 등을 능숙하게 다뤄야 한다 …",
        image: "https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=900&q=80",
        href: "/posts/typescript-patterns",
    },
];

const SAMPLE_POSTS = [
    {
        id: 1,
        tag: 'react',
        title: 'Framer Motion 전환과 scrollRestoration 충돌 문제 해결 fix : Double rAF 기반 스크롤 복원',
        excerpt:
            '브라우저는 최적의 사용자 UX 위해, 상세 페이지에서 \'뒤로 가기\'를 했을 때 이전 스크롤 위치를 자동으로 복원하는 기능을 제공합니다...',
        imageUrl: 'https://tech.kakaopay.com/_astro/thumb.30942a5c_Z1KVXbp.png',
        commentCount: 0,
        likeCount: 0,
        date: '25. 11. 19',
    },
    {
        id: 2,
        tag: 'next.js',
        title: 'Next.js App Router에서 Server Actions 완벽 이해하기',
        excerpt:
            'Server Actions는 Next.js 13.4부터 안정화된 기능으로, 클라이언트에서 직접 서버 함수를 호출할 수 있게 해줍니다...',
        imageUrl: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=800&q=80',
        commentCount: 3,
        likeCount: 12,
        date: '25. 11. 10',
    },
    {
        id: 3,
        tag: 'next.js',
        title: 'Next.js App Router에서 Server Actions 완벽 이해하기',
        excerpt:
            'Server Actions는 Next.js 13.4부터 안정화된 기능으로, 클라이언트에서 직접 서버 함수를 호출할 수 있게 해줍니다...',
        imageUrl: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=800&q=80',
        commentCount: 3,
        likeCount: 12,
        date: '25. 11. 10',
    },
    {
        id: 1,
        tag: 'react',
        title: 'Framer Motion 전환과 scrollRestoration 충돌 문제 해결 fix : Double rAF 기반 스크롤 복원',
        excerpt:
            '브라우저는 최적의 사용자 UX 위해, 상세 페이지에서 \'뒤로 가기\'를 했을 때 이전 스크롤 위치를 자동으로 복원하는 기능을 제공합니다...',
        imageUrl: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&q=80',
        commentCount: 0,
        likeCount: 0,
        date: '25. 11. 19',
    },
    {
        id: 2,
        tag: 'next.js',
        title: 'Next.js App Router에서 Server Actions 완벽 이해하기',
        excerpt:
            'Server Actions는 Next.js 13.4부터 안정화된 기능으로, 클라이언트에서 직접 서버 함수를 호출할 수 있게 해줍니다...',
        imageUrl: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=800&q=80',
        commentCount: 3,
        likeCount: 12,
        date: '25. 11. 10',
    },
    {
        id: 3,
        tag: 'next.js',
        title: 'Next.js App Router에서 Server Actions 완벽 이해하기',
        excerpt:
            'Server Actions는 Next.js 13.4부터 안정화된 기능으로, 클라이언트에서 직접 서버 함수를 호출할 수 있게 해줍니다...',
        imageUrl: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=800&q=80',
        commentCount: 3,
        likeCount: 12,
        date: '25. 11. 10',
    },
];

export default function Home() {
    const [likedPosts, setLikedPosts] = useState<Record<number, boolean>>({});
    const [likeCounts, setLikeCounts] = useState<Record<number, number>>(
        Object.fromEntries(SAMPLE_POSTS.map((p) => [p.id, p.likeCount]))
    );

    const handleLike = (id: number) => {
        setLikedPosts((prev) => {
            const nowLiked = !prev[id];
            setLikeCounts((counts) => ({
                ...counts,
                [id]: counts[id] + (nowLiked ? 1 : -1),
            }));
            return { ...prev, [id]: nowLiked };
        });
    };
    return (
        <Stack sx={{ width: '100%', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            <PinnedPosts posts={PINNED_POSTS} />
            <Typography mt={5} variant="body1" color="textSecondary">최근 포스트</Typography>
            <Box
                display="grid"
                gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
                gap={{ xs: 2, md: 3 }}
                mt={2}
            >
                {SAMPLE_POSTS.map((post) => (
                    <BlogPostCard
                        key={post.id}
                        tag={post.tag}
                        title={post.title}
                        excerpt={post.excerpt}
                        imageUrl={post.imageUrl}
                        commentCount={post.commentCount}
                        likeCount={likeCounts[post.id]}
                        liked={likedPosts[post.id]}
                        date={post.date}
                        onLike={() => handleLike(post.id)}
                        onClick={() => console.log('navigate to post', post.id)}
                        sx={{ maxWidth: '100%' }}
                    />
                ))}
            </Box>
        </Stack>
    );
}