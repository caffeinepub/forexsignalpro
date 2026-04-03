/**
 * Backend singleton for direct actor access outside of React Query context.
 * This creates an anonymous actor for components that call the backend directly.
 */
import type { backendInterface } from "./backend";
import { createActorWithConfig } from "./config";

let _backend: backendInterface | null = null;
let _creating = false;
let _queue: Array<(b: backendInterface) => void> = [];

async function getOrCreateBackend(): Promise<backendInterface> {
  if (_backend) return _backend;

  if (_creating) {
    return new Promise((resolve) => {
      _queue.push(resolve);
    });
  }

  _creating = true;
  try {
    _backend = await createActorWithConfig();
    for (const resolve of _queue) {
      resolve(_backend!);
    }
    _queue = [];
    return _backend;
  } finally {
    _creating = false;
  }
}

// Lazy proxy: each method call triggers actor initialization if needed
export const backend = new Proxy({} as backendInterface, {
  get(_target, prop: string) {
    return async (...args: unknown[]) => {
      const actor = await getOrCreateBackend();
      const method = actor[prop as keyof backendInterface];
      if (typeof method === "function") {
        return (method as (...a: unknown[]) => Promise<unknown>).apply(
          actor,
          args,
        );
      }
      throw new Error(`Unknown backend method: ${prop}`);
    };
  },
});
