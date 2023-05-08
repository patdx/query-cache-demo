import { QueryKey, useQuery, useQueryClient } from "@tanstack/react-query";
import { cachified, verboseReporter } from "cachified";
import { idbCache } from "./idb-cache";
import { useState } from "react";

export function useCachedQuery<T extends () => unknown>(
  {
    queryKey,
    queryFn,
    memoryStaleMs = 5_000,
    memoryCacheMs = 10_000,
    // memoryCacheMs = 5 * 60 * 1_000,
    storageStaleMs = 5_000,
    storageCacheMs = 10_000,
  }: {
    queryKey: QueryKey;
    queryFn: T;
    memoryStaleMs?: number;
    memoryCacheMs?: number;
    storageStaleMs?: number;
    storageCacheMs?: number;
  },
) {
  const [isStorageFetching, setIsStorageFetching] = useState(false);
  const queryClient = useQueryClient();
  const result = useQuery({
    queryKey,
    queryFn: async (queryContext) => {
      const result = await cachified({
        key: JSON.stringify(queryContext.queryKey),
        cache: idbCache,
        async getFreshValue(cacheContext) {
          if (cacheContext.background) {
            setIsStorageFetching(true);
            console.log(`Refreshing in background...`);
          }

          const result = await queryFn();

          if (cacheContext.background) {
            // Call event.waitUntil(...) on CF Workers
            // so it can process in the background
            console.log(`Refreshed in background`);
            setTimeout(() => {
              queryClient.setQueryData(queryContext.queryKey, result);
            });
            setIsStorageFetching(false);
          }
          return result as Awaited<ReturnType<T>>;
        },

        // this lib stores ttl as the diff between swr and total ttl
        ttl: storageCacheMs - storageStaleMs,

        staleWhileRevalidate: storageStaleMs,

        reporter: verboseReporter({ performance: Date }),
      });
      return result;
    },

    // TODO: need to reconcile react query fetching mechanism with cacheified
    // react-query already has logic for stale fetches built in
    // I think we should let react-query handle stale fetches so that
    // it can reflect the status properly
    //
    // However I am not exactly sure how to do this.
    // I think we would need to do something like the "persister".
    // And inject the stale cache data separately from the standard querynFn.
    staleTime: memoryStaleMs,
    cacheTime: memoryCacheMs,
    // cacheTime: 12_000, // default is 5 minutes
  });

  return {
    ...result,
    isStorageFetching,
  };
}
