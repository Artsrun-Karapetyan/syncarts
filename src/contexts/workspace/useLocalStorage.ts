import { useCallback, useEffect, useState } from 'react';

const INDEXED_DB_NAME = 'syncarts-client-storage';
const INDEXED_DB_STORE = 'values';
const INDEXED_DB_MARKER = '__syncarts_indexeddb__';
const LOCAL_STORAGE_MAX_CHARS = 1_000_000;

export function useLocalStorage<T>(key: string, initialValue: T) {
  const hasIndexedDbValue = () => {
    try {
      return window.localStorage.getItem(key) === INDEXED_DB_MARKER;
    } catch {
      return false;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item && item !== INDEXED_DB_MARKER ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });
  const [isHydrated, setIsHydrated] = useState(() => !hasIndexedDbValue());

  useEffect(() => {
    let isMounted = true;

    if (!hasIndexedDbValue()) {
      setIsHydrated(true);
      return;
    }

    setIsHydrated(false);
    readIndexedDbValue(key)
      .then((item) => {
        if (!isMounted || !item) return;
        setStoredValue(JSON.parse(item));
      })
      .catch((error) => {
        console.error('Failed to load large local value', error);
      })
      .finally(() => {
        if (isMounted) setIsHydrated(true);
      });

    return () => {
      isMounted = false;
    };
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue(prev => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      void persistValue(key, valueToStore).catch((error) => {
        console.error('Failed to persist local value', error);
      });
      return valueToStore;
    });
  }, [key]);

  return [storedValue, setValue, isHydrated] as const;
}

async function persistValue<T>(key: string, value: T) {
  const serialized = JSON.stringify(value);

  if (serialized.length > LOCAL_STORAGE_MAX_CHARS) {
    await persistIndexedDbValue(key, serialized);
    return;
  }

  try {
    window.localStorage.setItem(key, serialized);
    return;
  } catch (error) {
    if (!isQuotaExceededError(error)) throw error;
  }

  await persistIndexedDbValue(key, serialized);
}

async function persistIndexedDbValue(key: string, serialized: string) {
  await writeIndexedDbValue(key, serialized);

  try {
    window.localStorage.removeItem(key);
    window.localStorage.setItem(key, INDEXED_DB_MARKER);
  } catch (error) {
    console.error('Saved large local value, but failed to write localStorage marker', error);
  }
}

function isQuotaExceededError(error: unknown) {
  return error instanceof DOMException && (
    error.name === 'QuotaExceededError'
    || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || error.message.includes('quota')
  );
}

function openStorageDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(INDEXED_DB_NAME, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(INDEXED_DB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readIndexedDbValue(key: string) {
  const db = await openStorageDb();

  return new Promise<string | null>((resolve, reject) => {
    const transaction = db.transaction(INDEXED_DB_STORE, 'readonly');
    const request = transaction.objectStore(INDEXED_DB_STORE).get(key);

    request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

async function writeIndexedDbValue(key: string, value: string) {
  const db = await openStorageDb();

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(INDEXED_DB_STORE, 'readwrite');
    transaction.objectStore(INDEXED_DB_STORE).put(value, key);

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}
