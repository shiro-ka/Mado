export function runtimeProbe() {
  return {
    typeof: {
      WeakRef: typeof (globalThis as unknown as { WeakRef?: unknown }).WeakRef,
      WeakMap: typeof (globalThis as unknown as { WeakMap?: unknown }).WeakMap,
      WeakSet: typeof (globalThis as unknown as { WeakSet?: unknown }).WeakSet,
      FinalizationRegistry: typeof (globalThis as unknown as { FinalizationRegistry?: unknown }).FinalizationRegistry,
      crypto: typeof crypto,
      fetch: typeof fetch,
      Buffer: typeof (globalThis as unknown as { Buffer?: unknown }).Buffer,
    },
    userAgent: (globalThis as unknown as { navigator?: { userAgent?: string } }).navigator?.userAgent,
  };
}
