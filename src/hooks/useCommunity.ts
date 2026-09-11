import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApiQuery } from './useApiQuery';
import { postsService } from '../services/api/posts.service';
import { groupsService } from '../services/api/groups.service';
import type { Post, Group } from '../types/api';
import type { Post as PostCardItem } from '../components/PostCard';

// Map backend post shape → PostCard shape
function mapPosts(posts: Post[]):PostCardItem[] {
  return posts.map((p) => {
    const authorId = p.user?.id ?? p.user_id;
    if (!authorId) {
      console.warn('Post missing authorId:', p.id, 'user:', p.user, 'user_id:', p.user_id);
    }
    
    // Build combined photos + video array with media types
    const photos: string[] = [];
    const mediaTypes: ('image' | 'video')[] = [];
    
    // Add images first
    const imageUrls = p.image_urls?.length ? p.image_urls : p.image ? [p.image] : [];
    imageUrls.forEach(url => {
      photos.push(url);
      mediaTypes.push('image');
    });
    
    // For videos, use a solid color data URI as thumbnail
    // This will always load instantly without network request
    if (p.video) {
      // 1x1 dark gray pixel as data URI - guaranteed to work
      const videoThumbnail = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mM0NDT8DwADgwF/h8xGvAAAAABJRU5ErkJggg==';
      photos.push(videoThumbnail);
      mediaTypes.push('video');
    }
    
    return {
      id: p.id,
      authorId,
      authorName: p.user?.name ?? 'Unknown',
      authorAvatar: p.user?.avatar ?? '',
      time: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      caption: p.text,
      photos,
      mediaTypes,
      videos: p.video ? [p.video] : undefined,
      likes: p.likes,
      comments: p.comments_count||0,
      liked: Boolean(p.liked),
    };
  });
}

const FEED_PAGE_SIZE = 20;
const FEED_REFRESH_MS = 60_000;

/**
 * Infinite feed with keyset pagination. The first page is (re)loaded on mount
 * and every 60s; `loadMore()` appends older pages using the last post's
 * created_at as the cursor. Pages are flattened and de-duped by id so a
 * background refresh that overlaps already-loaded posts doesn't create
 * duplicate rows.
 */
export function useFeed() {
  const [pages, setPages] = useState<Post[][]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kept in sync with `pages` so loadMore can read the tail cursor without
  // depending on (and being recreated by) every page append.
  const pagesRef = useRef<Post[][]>([]);
  const busyRef = useRef(false);
  useEffect(() => { pagesRef.current = pages; }, [pages]);

  const loadFirst = useCallback(async () => {
    try {
      const first = await postsService.getFeed(FEED_PAGE_SIZE);
      setPages([first]);
      setReachedEnd(first.length < FEED_PAGE_SIZE);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (busyRef.current || reachedEnd) return;
    const flat = pagesRef.current.flat();
    const cursor = flat[flat.length - 1]?.created_at;
    if (!cursor) return;
    busyRef.current = true;
    setLoadingMore(true);
    try {
      const next = await postsService.getFeed(FEED_PAGE_SIZE, { before: cursor });
      setPages((prev) => [...prev, next]);
      if (next.length < FEED_PAGE_SIZE) setReachedEnd(true);
    } catch {
      /* keep what we have; scrolling again retries */
    } finally {
      busyRef.current = false;
      setLoadingMore(false);
    }
  }, [reachedEnd]);

  useEffect(() => {
    loadFirst();
    const timer = setInterval(() => {
      // Don't yank the user back to the top mid-scroll; once they've paged in
      // older posts, only an explicit pull-to-refresh (refetch) resets the feed.
      if (pagesRef.current.length <= 1) loadFirst();
    }, FEED_REFRESH_MS);
    return () => clearInterval(timer);
  }, [loadFirst]);

  const mapped = useMemo(() => {
    const seen = new Set<string>();
    const unique: Post[] = [];
    for (const post of pages.flat()) {
      if (seen.has(post.id)) continue;
      seen.add(post.id);
      unique.push(post);
    }
    return mapPosts(unique);
  }, [pages]);

  return { posts: mapped, loading, loadingMore, reachedEnd, error, refetch: loadFirst, loadMore };
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
