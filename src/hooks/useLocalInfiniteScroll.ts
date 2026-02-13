import { useEffect, useMemo, useRef, useState } from "react";

type UseLocalInfiniteScrollOptions<T> = {
  items: T[];
  pageSize?: number;
};

export const useLocalInfiniteScroll = <T>({
  items,
  pageSize = 20,
}: UseLocalInfiniteScrollOptions<T>) => {
  const [visible, setVisible] = useState<T[]>([]);
  const itemsRef = useRef<T[]>(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  /**
   * Reset visible items whenever list changes
   */
  useEffect(() => {
    setVisible(items.slice(0, pageSize));
  }, [items, pageSize]);

  /**
   * Ionic load more handler
   */
  const loadMore = async (ev: CustomEvent<void>) => {
    const currentVisible = visible.length;
    const next = currentVisible + pageSize;

    const all = itemsRef.current;
    const nextItems = all.slice(0, next);

    setVisible(nextItems);

    // IMPORTANT: complete after UI updates
    requestAnimationFrame(() => {
      const target = ev.target as HTMLIonInfiniteScrollElement;

      target.complete();

      if (nextItems.length >= all.length) {
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
    setVisible,
    loadMore,
    resetKey,
  };
};
