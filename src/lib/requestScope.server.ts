import { AsyncLocalStorage } from "node:async_hooks";

const als = new AsyncLocalStorage<Map<string, Promise<unknown>>>();

export function withRequestScope<T>(run: () => T): T {
  return als.run(new Map(), run);
}

export function sharedInRequest<T>(key: string, make: () => Promise<T>): Promise<T> {
  const scope = als.getStore();
  if (!scope) return make();
  let pending = scope.get(key) as Promise<T> | undefined;
  if (!pending) {
    pending = make();
    scope.set(key, pending);
  }
  return pending;
}
