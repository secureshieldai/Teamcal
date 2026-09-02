import { useMemo, useState } from 'react';
import { useApiQuery } from './useApiQuery';
import { postsService } from '../services/api/posts.service';
import { groupsService } from '../services/api/groups.service';
import type { Post, Group } from '../types/api';
import type { Post as PostCardItem } from '../components/PostCard';

// Map backend post shape → PostCard shape
function mapPosts(posts: Post[]):PostCardItem[] {
  return posts.map((p) => ({
    id: p.id,
    authorId: p.user?.id ?? p.user_id,
    authorName: p.user?.name ?? 'Unknown',
    authorAvatar: p.user?.avatar ?? '',
    time: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    caption: p.text,
    photos: p.image_urls?.length ? p.image_urls : p.image ? [p.image] : [],
    likes: p.likes,
    comments: p.comments_count||0,
    liked: Boolean(p.liked),
  }));
}

export function useFeed() {
  // GET /api/posts/feed
  const { data: posts, loading, error, refetch } = useApiQuery(
    () => postsService.getFeed(),
    [] as Post[],
    []
  );

  const mapped = useMemo(() => mapPosts(posts), [posts]);
  return { posts: mapped, loading, error, refetch };
}

export function useMyPosts() {
  // GET /api/posts/mine
  const { data: posts, loading, error, refetch } = useApiQuery(
    () => postsService.getMyPosts(),
    [] as Post[],
    []
  );

  const mapped = useMemo(() => mapPosts(posts), [posts]);
  return { posts: mapped, loading, error, refetch };
}

export function useGroups() {
  // GET /api/groups
  const { data: groups, loading, refetch } = useApiQuery(
    () => groupsService.getMyGroups(),
    [] as Group[],
    []
  );
  return { groups, loading, refetch };
}

export function useDiscoverGroups() {
  // GET /api/groups/discover
  const { data: groups, loading, error, refetch } = useApiQuery(
    () => groupsService.discover(),
    [] as Group[],
    []
  );
  return { groups, loading, error, refetch };
}

export function useGroupDetail(id: string) {
  return useApiQuery(
    () => groupsService.get(id),
    null,
    [id]
  );
}

export function useGroupActivity(id: string) {
  // GET /api/groups/:id/activity — returns { posts }
  return useApiQuery(
    () => groupsService.getActivity(id),
    [] as Post[],
    [id]
  );
}

export function useCreatePost() {
  const [loading, setLoading] = useState(false);

  // POST /api/posts
  const createPost = async (text: string, images: string[] = [], video?: string, community?: string) => {
    setLoading(true);
    try {
      return await postsService.create({ text, images, image: images[0], video, community });
    } finally {
      setLoading(false);
    }
  };

  return { createPost, loading };
}
