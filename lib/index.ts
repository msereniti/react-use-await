import deepEqual from 'fast-deep-equal';

type PromiseCache = {
  promise?: Promise<void>;
  inputs: Array<any>;
  error?: unknown;
  response?: any;
  resolved: boolean;
  rejected: boolean;
};

const promiseCaches: PromiseCache[] = [];

const usePromise = <Result extends any, Args extends any[]>(
  promise: (...inputs: Args) => Promise<Result>,
  inputs: Args,
  lifespan: number = 0
): Result => {
  for (const promiseCache of promiseCaches) {
    if (deepEqual(inputs, promiseCache.inputs)) {
      if (promiseCache.rejected) {
        throw promiseCache.error;
      }

      if (promiseCache.resolved) {
        return promiseCache.response;
      }
      throw promiseCache.promise;
    }
  }

  // The request is new or has changed.
  const promiseCache: PromiseCache = {
    resolved: false,
    rejected: false,
    promise:
      // Make the promise request.
      promise(...inputs)
        .then((response: any) => {
          promiseCache.response = response;
          promiseCache.resolved = true;
        })
        .catch((error: unknown) => {
          promiseCache.error = error;
          promiseCache.rejected = true;
        })
        .then(() => {
          if (lifespan > 0) {
            setTimeout(() => {
              const index = promiseCaches.indexOf(promiseCache);

              if (index !== -1) {
                promiseCaches.splice(index, 1);
              }
            }, lifespan);
          }
        }),
    inputs,
  };

  promiseCaches.push(promiseCache);
  throw promiseCache.promise;
};

export default usePromise;
