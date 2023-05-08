# Query Cache Demo

I am curious if it is possible to extend a tool like TanStack query with a cache.

While [persistQueryClient](https://tanstack.com/query/v4/docs/react/plugins/persistQueryClient) is quite nice, I think it has some shortfalls. If you have many query keys, the cache could become larger than a megabyte, which incurs a real CPU cost every time it is serialized or deserialized. This can be mitigated slightly by changing the debounce settings, but this increases of risk of not caching useful data if the app is closed during the debounce period, and this will still be a serialization cost on startup.

I would also like to have granular access to clear/modify individual cache items instead of the cache as a whole.

So, I want to try using TanStack Query with a cache on a per-key level instead.

Right now this demo is using `idb` and `cachified` to use IndexedDB in the browser as a cache.
