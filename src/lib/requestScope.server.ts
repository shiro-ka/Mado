import { AsyncLocalStorage } from "node:async_hooks";

type Scope = { colo?: string; shared: Map<string, Promise<unknown>> };

const als = new AsyncLocalStorage<Scope>();

export function withRequestScope<T>(colo: string | undefined, run: () => T): T {
  return als.run({ colo, shared: new Map() }, run);
}

export function requestColo(): string | undefined {
  return als.getStore()?.colo;
}

export function sharedInRequest<T>(key: string, make: () => Promise<T>): Promise<T> {
  const scope = als.getStore();
  if (!scope) return make();
  let pending = scope.shared.get(key) as Promise<T> | undefined;
  if (!pending) {
    pending = make();
    scope.shared.set(key, pending);
  }
  return pending;
}
