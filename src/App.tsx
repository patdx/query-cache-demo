import { useQuery } from '@tanstack/react-query';
import { dbPromise, optimizeCache, queryClient } from './idb-cache';
import { useCachedQuery } from './use-cached-query';
import { useEffect, useState } from 'react';

async function fetchJson(...args: any[]) {
  const res = await (fetch as any)(...args);
  await new Promise((resolve) => setTimeout(resolve, 1_000));
  return await res.json();
}

function App() {
  const database = useQuery({
    queryKey: ['cached_keys'],
    queryFn: async () => {
      const db = await dbPromise;
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
      <h2>
        Indexeddb Cache
        <button
          type="button"
          onClick={() => dbPromise.then((db) => optimizeCache(db))}
        >
          Remove expired cache items
        </button>
        <button
          type="button"
          onClick={async () => {
            const db = await dbPromise;
            await db.clear('keyval');
            queryClient.invalidateQueries(['cached_keys']);
          }}
        >
          Delete all
        </button>
      </h2>
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

function CacheItem(props: CacheItemProps) {
  const [, render] = useState({});
  let countdown = Infinity;
  if (props.expires) {
    countdown = props.expires - Date.now();
  }

  useEffect(() => {
    const timer = setInterval(() => render({}), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <tr>
      <td>{props.name}</td>
      <td>{new Date(props.expires ?? 0).toJSON()}</td>
      <td>{Math.round(countdown / 1000)} seconds</td>
    </tr>
  );
}

const CatFact = () => {
  const { data, status, error, fetchStatus, isStorageFetching } =
    useCachedQuery({
      queryKey: ['cat-fact'],
      queryFn: () => fetchJson('https://catfact.ninja/fact'),
    });

  return (
    <>
      <h2>Cat fact</h2>
      <pre>
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
        fetchJson('https://official-joke-api.appspot.com/random_joke'),
    });

  return (
    <>
      <h2>Joke</h2>
      <pre>
        {JSON.stringify(
          { data, status, error, fetchStatus, isStorageFetching },
          undefined,
          2
        )}
      </pre>
    </>
  );
};

//

export default App;
