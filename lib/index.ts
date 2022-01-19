import deepEqual from 'fast-deep-equal';

type PromiseCache<Result = unknown, Error = unknown> = {
  inputs?: Array<any>;
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
type CacheLegacyOptions = number;
type CacheOptionsArg = CacheOptions | CacheLegacyOptions;

const defaultOptions: CacheOptions = {
  lifetime: Infinity,
  maxSize: 1000,
  isEqual: deepEqual,
};

const promisesCaches = new Map<() => Promise<any>, PromiseCache[]>();

const usePromise = <Result extends any, Args extends any[], Error = unknown>(
  promise: (...inputs: Args) => Promise<Result>,
  inputs?: Args,
  cacheOptions: CacheOptionsArg = defaultOptions
): Result => {
  const options = (
    typeof cacheOptions === 'number'
      ? { ...defaultOptions, lifetime: cacheOptions }
      : { ...defaultOptions, ...cacheOptions }
  ) as Required<CacheOptions>;

  if (!promisesCaches.has(promise)) {
    promisesCaches.set(promise, []);
  }
  const caches = promisesCaches.get(promise)!;

  for (const promiseCache of caches) {
    if (options.isEqual(inputs, promiseCache.inputs)) {
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
    inputs,
    promise: promise(...(inputs || ([] as unknown as Args)))
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

export default usePromise;
