import { useQuery } from '@tanstack/react-query';
import { getDb, optimizeCache, queryClient } from '../../shared/idb-cache';
import { useCachedQuery } from '../../shared/use-cached-query';
import { useEffect, useState } from 'react';
import ky from 'ky';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { now } from 'mobx-utils';

export function Page() {
  const database = useQuery({
    queryKey: ['cached_keys'],
    queryFn: async () => {
      const db = await getDb();
      const tx = db.transaction('keyval', 'readonly');
      const store = tx.objectStore('keyval');

      const result: CacheItemProps[] = [];

      let cursor = await store.openCursor();
      while (cursor) {
        result.push({
          name: cursor.primaryKey,
          expires: cursor.value.expires,
        });
        cursor = await cursor.continue();
      }

      await tx.done;

      return result;
    },
  });

  return (
    <div>
      <h2>IndexedDB Cache</h2>
      <div>
        <button
          type="button"
          onClick={() => getDb().then((db) => optimizeCache(db))}
        >
          Remove expired cache items
        </button>
        <button
          type="button"
          onClick={async () => {
            const db = await getDb();
            await db.clear('keyval');
            queryClient.invalidateQueries(['cached_keys']);
          }}
        >
          Delete all
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Expires</th>
          </tr>
        </thead>
        <tbody>
          {database.data?.map((row) => (
            <CacheItem key={row.name} {...row} />
          ))}
          {database.data?.length === 0 ? (
            <tr>
              <td colSpan={3}>No cached items</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <CatFact />
      <Joke />
    </div>
  );
}

type CacheItemProps = {
  name: string;
  expires?: number;
};

const CacheItem = observer(function CacheItem({
  name,
  expires,
}: CacheItemProps) {
  const state = useLocalObservable(() => ({
    expires,
    get pretty() {
      if (typeof this.expires !== 'number') {
        return undefined;
      }

      return new Date(this.expires ?? 0).toJSON();
    },
    get secondsLeft() {
      if (typeof this.expires !== 'number') {
        return undefined;
      }

      return ((this.expires - now(100)) / 1000).toFixed(1);
    },
  }));

  // sync state
  useEffect(() => {
    state.expires = expires;
  }, [expires, state]);

  return (
    <tr>
      <td>{name}</td>
      <td>{state.pretty}</td>
      <td className="tabular-nums">{state.secondsLeft} seconds</td>
    </tr>
  );
});

const CatFact = () => {
  const { data, status, error, fetchStatus, isStorageFetching } =
    useCachedQuery({
      queryKey: ['cat-fact'],
      queryFn: () => ky('https://catfact.ninja/fact').json(),
    });

  return (
    <>
      <h2>Cat fact</h2>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(
          { data, status, error, fetchStatus, isStorageFetching },
          undefined,
          2
        )}
      </pre>
    </>
  );
};

const Joke = () => {
  const { data, status, error, fetchStatus, isStorageFetching } =
    useCachedQuery({
      queryKey: ['joke'],
      queryFn: () =>
        ky('https://official-joke-api.appspot.com/random_joke').json(),
    });

  return (
    <>
      <h2>Joke</h2>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(
          { data, status, error, fetchStatus, isStorageFetching },
          undefined,
          2
        )}
      </pre>
    </>
  );
};
