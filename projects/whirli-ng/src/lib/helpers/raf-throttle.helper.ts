export function rafThrottle<T extends (...args: never[]) => void>(fn: T): T {
  let scheduled = false;
  let lastArgs: Parameters<T> | null = null;
  return function (this: unknown, ...args: Parameters<T>) {
    lastArgs = args;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      if (lastArgs !== null) {
        fn.apply(this, lastArgs);
        lastArgs = null;
      }
    });
  } as T;
}
