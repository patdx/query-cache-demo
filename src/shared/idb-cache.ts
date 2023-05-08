import { QueryClient } from "@tanstack/react-query";
import { Cache, CacheEntry, totalTtl } from "cachified";
import { DBSchema, IDBPDatabase, openDB } from "idb/with-async-ittr";
import { once } from "lodash-es";

export const queryClient = new QueryClient();

interface MyDB extends DBSchema {
  keyval: {
    key: string;
    value: CacheEntry & { expires?: number };
    indexes: { expires: number };
  };
}

export async function optimizeCache(db: IDBPDatabase<MyDB>) {
  console.log("Optimizing cache...");
  const tx = db.transaction("keyval", "readwrite");
  const store = tx.objectStore("keyval");

  const index = store.index("expires");

  const range = IDBKeyRange.upperBound(Date.now());

  let cursor = await index.openKeyCursor(range);

  while (cursor) {
    console.log(cursor.key, cursor.primaryKey);
    console.log(`Deleting expired key ` + cursor.primaryKey);
    await store.delete(cursor.primaryKey);
    cursor = await cursor.continue();
  }

  await tx.done;

  queryClient.invalidateQueries(["cached_keys"]);
  console.log("Optimized cache");
}

const schedule = (fn: () => any) => {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(fn);
  } else {
    setTimeout(fn, 1);
  }
};

export const getDb = once(() =>
  openDB<MyDB>("keyval-store", 1, {
    upgrade(db) {
      const store = db.createObjectStore("keyval");
      store.createIndex("expires", "expires");
    },
  }).then(async (db) => {
    // Optimizing the cache does not need to happen right at startup, the app should
    // just ignore expired keys anyway
    // so we tell it to do it when the app is idle
    schedule(() => {
      optimizeCache(db);
    });

    return db;
  })
);

export const handleKey = (key: string) => {
  const parsed = JSON.parse(key);
  if (!Array.isArray(parsed)) throw new Error("Invalid key " + key);
  return parsed.join(":");
};

// sqlite
// minio
export const idbCache: Cache = {
  async get(key) {
    const db = await getDb();
    const result = await db.get("keyval", handleKey(key));
    console.log(`got result ? ${Boolean(result)}`);
    return result;
  },
  async delete(key) {
    const db = await getDb();
    await db.delete("keyval", handleKey(key));
    queryClient.invalidateQueries(["cached_keys"]);
  },
  async set(key, value) {
    const db = await getDb();
    console.log(`set ` + handleKey(key));
    const ttl = totalTtl(value?.metadata);
    const createdTime = value?.metadata?.createdTime;
    if (ttl > 0 && ttl < Infinity && typeof createdTime === "number") {
      await db.put(
        "keyval",
        {
          ...value,
          expires: ttl + createdTime,
        },
        handleKey(key),
      );

      // Try to clear by timeout
      // TODO: This code needs to make sure the cache has not been overwritten
      // with fresher data since the timeout was set

      setTimeout(() => {
        console.log(`clearing expired value ` + handleKey(key));

        schedule(() => {
          optimizeCache(db);
        });

        // return del(handleKey(key));
      }, ttl);
    } else {
      await db.put("keyval", value, handleKey(key));
    }

    queryClient.invalidateQueries(["cached_keys"]);
  },
};
