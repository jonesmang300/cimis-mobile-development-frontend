import { useEffect, useMemo, useRef, useState } from "react";

type UseLocalInfiniteScrollOptions<T> = {
  items: T[];
  pageSize?: number;
};

export const useLocalInfiniteScroll = <T>({
  items,
  pageSize = 20,
}: UseLocalInfiniteScrollOptions<T>) => {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const itemsRef = useRef<T[]>(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  /**
   * Reset visible items whenever list changes
   */
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  const visible = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount],
  );

  /**
   * Ionic load more handler
   */
  const loadMore = async (ev: CustomEvent<void>) => {
    const next = Math.min(visibleCount + pageSize, itemsRef.current.length);

    setVisibleCount(next);

    // IMPORTANT: complete after UI updates
    requestAnimationFrame(() => {
      const target = ev.target as HTMLIonInfiniteScrollElement;

      target.complete();

      if (next >= itemsRef.current.length) {
        target.disabled = true;
      }
    });
  };

  /**
   * Reset key forces Ionic InfiniteScroll to rebuild
   */
  const resetKey = useMemo(() => {
    return `${items.length}-${pageSize}`;
  }, [items.length, pageSize]);

  return {
    visible,
    visibleCount,
    loadMore,
    resetKey,
  };
};
