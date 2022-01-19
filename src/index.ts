import { dequal } from 'dequal';

type PromiseCache<Result = unknown, Error = unknown> = {
  getPromiseArgs?: Array<any>;
  error?: Error;
  result?: any;
  resolved: boolean;
  rejected: boolean;
  promise?: Promise<Result>;
};

type Required<T> = T extends object
  ? { [P in keyof T]-?: NonNullable<T[P]> }
  : T;
type Comparer = (a: any, b: any) => boolean;

type CacheOptions = {
  lifetime?: number;
  maxSize?: number;
  isEqual?: Comparer;
};
/** @deprecated cache argument as a number is deprecated, use `{ lifetime: number }` object instead  */
type CacheLegacyOptions = number;
type CacheOptionsArg = CacheOptions | CacheLegacyOptions;

type UsePromiseHook = <Result extends any, Args extends any[], Error = unknown>(
  promise: (...getPromiseArgs: Args) => Promise<Result>,
  getPromiseArgs?: Args,
  cacheOptions?: CacheOptionsArg
) => Result;
type UsePromise = UsePromiseHook & {
  maxCachedPromisesCount: number;
};

const defaultOptions: Required<CacheOptions> = {
  lifetime: Infinity,
  maxSize: 1000,
  isEqual: dequal,
};
const defaultMaxCachedPromisesCount = 1000;

const promisesCaches = new Map<() => Promise<any>, PromiseCache[]>();

const usePromiseHook: UsePromiseHook = <
  Result extends any,
  Args extends any[],
  Error = unknown
>(
  getPromise: (...getPromiseArgs: Args) => Promise<Result>,
  getPromiseArgs?: Args,
  cacheOptions: CacheOptionsArg = defaultOptions
): Result => {
  const options: Required<CacheOptions> =
    typeof cacheOptions === 'number'
      ? { ...defaultOptions, lifetime: cacheOptions }
      : { ...defaultOptions, ...cacheOptions };

  if (!promisesCaches.has(getPromise)) {
    promisesCaches.set(getPromise, []);
  }
  if (promisesCaches.size > usePromise.maxCachedPromisesCount) {
    const cacheOverflow =
      promisesCaches.size - usePromise.maxCachedPromisesCount;
    const toDelete = [...promisesCaches.keys()].slice(0, cacheOverflow);

    while (toDelete.length > 0) {
      promisesCaches.delete(toDelete.pop()!);
    }
  }
  const caches = promisesCaches.get(getPromise)!;

  for (const promiseCache of caches) {
    if (options.isEqual(getPromiseArgs, promiseCache.getPromiseArgs)) {
      if (promiseCache.rejected) {
        throw promiseCache.error;
      }

      if (promiseCache.resolved) {
        return promiseCache.result;
      }
      throw promiseCache.promise;
    }
  }

  // The request is new or has changed.
  const promiseCache: PromiseCache<Result, Error> = {
    resolved: false,
    rejected: false,
    getPromiseArgs,
    promise: getPromise(...(getPromiseArgs || ([] as unknown as Args)))
      .then((result: Result) => {
        promiseCache.result = result;
        promiseCache.resolved = true;

        return result;
      })
      .catch((error: Error) => {
        promiseCache.error = error;
        promiseCache.rejected = true;
      })
      .then(() => {
        if (options.lifetime > 0 && Number.isFinite(options.lifetime)) {
          setTimeout(() => {
            const index = caches.indexOf(promiseCache);

            if (index !== -1) {
              caches.splice(index, 1);
            }
          }, options.lifetime);
        }

        return promiseCache.result;
      }),
  };

  caches.push(promiseCache);
  if (caches.length === options.maxSize + 1) {
    caches.shift();
  } else if (caches.length > options.maxSize) {
    caches.reverse();
    caches.length = options.maxSize;
    caches.reverse();
  }

  throw promiseCache.promise;
};

const usePromise = usePromiseHook as UsePromise;

usePromise.maxCachedPromisesCount = defaultMaxCachedPromisesCount;

/**
 * @description hook-like function that triggers closes parent React.Suspense to
 * render `fallback` instead of `children` until Promise from provided `getPromise`
 * is not resolved or rejected.
 *
 * @param getPromise – function that returns promise (like a `fetch`).
 * Note: `usePromise` will call it using `getPromiseArgs` parameter, don't call it by yourself!
 *
 * @param getPromiseArgs – arguments, that will be spread into `getPromise` call.
 * Don't pass it or pass empty array/`undefined` to call `getPromise` without arguments.
 *
 * @param cacheOptions – options to control cache of promises call
 * @type `{ lifetime?: number; maxSize?: number; isEqual?: Comparer; }`
 *
 * @returns result of fulfilled promise from `getPromise` call.
 */
export default usePromise as UsePromise;
