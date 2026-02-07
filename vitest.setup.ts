const ensureStorage = () => {
  const storage = globalThis.localStorage as Storage | undefined;
  if (storage && typeof storage.clear === "function") {
    return;
  }

  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    }
  };

  Object.defineProperty(globalThis, "localStorage", {
    value: memoryStorage,
    configurable: true,
    writable: true
  });

  if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", {
      value: memoryStorage,
      configurable: true,
      writable: true
    });
  }
};

ensureStorage();
