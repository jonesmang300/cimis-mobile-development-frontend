import { DependencyList, useEffect } from "react";
import { subscribeSyncUpdates } from "../data/sync";

export const useSyncRefresh = (
  callback: () => void,
  deps: DependencyList = [],
) => {
  useEffect(() => {
    const unsubscribe = subscribeSyncUpdates(() => {
      callback();
    });

    return () => unsubscribe();
  }, deps);
};
