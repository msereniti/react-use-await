import deepEqual from 'fast-deep-equal';

type PromiseCache<Result = unknown, Error = unknown> = {
  inputs?: Array<any>;
  error?: Error;
  result?: any;
  resolved: boolean;
  rejected: boolean;
  promise?: Promise<Result>;
};

const promiseCaches: PromiseCache[] = [];

const usePromise = <Result extends any, Args extends any[], Error = unknown>(
  promise: (...inputs: Args) => Promise<Result>,
  inputs?: Args,
  lifespan: number = Infinity
): Result => {
  for (const promiseCache of promiseCaches) {
    if (deepEqual(inputs, promiseCache.inputs)) {
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
        if (lifespan > 0 && Number.isFinite(lifespan)) {
          setTimeout(() => {
            const index = promiseCaches.indexOf(promiseCache);

            if (index !== -1) {
              promiseCaches.splice(index, 1);
            }
          }, lifespan);
        }

        return promiseCache.result;
      }),
  };

  promiseCaches.push(promiseCache);
  throw promiseCache.promise;
};

export default usePromise;
