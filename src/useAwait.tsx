import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type ExecutionHandler = (func: (...args: any[]) => Promise<any>, args: any[], hook: number) => void;

export type SyncResolver<Func extends (...args: any[]) => Promise<any>, Result = Func extends (...args: any[]) => Promise<infer Result> ? Result : any> = (
  func: Func,
  parameters: Parameters<Func>
) => { resolved: true; result: Result } | { resolved: false };

type AwaitCall = {
  func: (...args: any[]) => Promise<any>;
  args: any[];
  result: any;
  execution?: Promise<any>;
  status: 'pending' | 'executing' | 'fullfilled';
};
type ContextType = {
  hook: number;
  reset: () => void;
  calls: AwaitCall[];
  exec: ExecutionHandler;
  init: boolean;
  syncResolver?: SyncResolver<any>;
};
const arrsShallowCompare = <T extends any>(a: T[], b: T[]) => a.length === b.length && a.every((el, index) => el === b[index]);
const thrower = () => {
  throw new Error('Component, rendered with useAwait should be wrapped into `<AwaitBoundary>...</AwaitBoundary>`');
};
const unresolvablePromise = new Promise(() => {});
const Context = createContext<ContextType>({
  hook: 0,
  calls: [],
  reset: thrower,
  exec: thrower,
  init: false,
  syncResolver: undefined,
});

export const AwaitBoundary: React.FC<{
  loading: React.ReactNode;
  children: React.ReactNode;
  ErrorView?: React.FC<{ error: Error }> | React.ReactNode;
  onError?: (error: unknown) => void;
  syncResolver?: SyncResolver<any>;
}> = ({ loading: loadingView, ErrorView: errorView, onError, syncResolver, children }) => {
  const [calls, setCalls] = useState<AwaitCall[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const parentCtx = useContext(Context);
  const localCtx = useRef<ContextType>({ ...parentCtx });
  const ctx = useRef<ContextType>({ ...localCtx.current });

  const handleError = useCallback(
    (error: unknown) => {
      setError(error instanceof Error ? error : new Error(error as any));
      onError?.(error);
    },
    [onError]
  );

  const exec = useCallback<ExecutionHandler>(
    (func, args, hook) => {
      requestAnimationFrame(async () => {
        setCalls((calls) => {
          calls[hook] = { func, args, result: null, status: 'pending' };

          return [...calls];
        });
      });
    },
    [setCalls]
  );

  const handleResolving = useCallback(
    (callSnapshot: AwaitCall) => (result: any) => {
      setCalls((calls) => {
        for (let i = 0; i < calls.length; i++) {
          if (calls[i].status === 'executing' && calls[i].func === callSnapshot.func && arrsShallowCompare(calls[i].args, callSnapshot.args)) {
            calls = [...calls];
            calls[i].status = 'fullfilled';
            calls[i].result = result;

            return calls;
          }
        }

        return calls;
      });
    },
    [setCalls]
  );

  useEffect(() => {
    setCalls((calls) => {
      const needProcessing = calls.filter((call) => call.status === 'pending').length > 0;

      if (!needProcessing) return calls;

      try {
        for (const call of calls) {
          if (call.status === 'pending') {
            const { func, args } = call;

            call.status = 'executing';
            call.execution = func(...args)
              .then(handleResolving(call))
              .catch(handleError);
          }
        }
      } catch (error) {
        handleError(error);
      }

      return [...calls];
    });
  }, [calls, setCalls, handleError]);

  const reset = useCallback(() => {
    setCalls([]);
    setError(null);
  }, [setCalls, setError]);

  const localCtxValue = localCtx.current;
  const ctxValue = ctx.current;

  localCtxValue.hook = 0;
  localCtxValue.calls = calls;
  localCtxValue.reset = reset;
  localCtxValue.exec = exec;
  localCtxValue.syncResolver = syncResolver;
  localCtxValue.init = true;

  ctxValue.hook = parentCtx.init ? parentCtx.hook : localCtxValue.hook;
  ctxValue.calls = parentCtx.init ? parentCtx.calls : localCtxValue.calls;
  ctxValue.reset = parentCtx.init ? parentCtx.reset : localCtxValue.reset;
  ctxValue.exec = parentCtx.init ? parentCtx.exec : localCtxValue.exec;
  ctxValue.syncResolver = parentCtx.syncResolver ?? localCtxValue.syncResolver;
  ctxValue.init = true;

  if (error) {
    if (!errorView) throw error;

    const ErrorView = typeof errorView === 'function' ? errorView : ((() => errorView) as React.FC<{ error: Error }>);

    return (
      <Context.Provider value={ctxValue}>
        <ErrorView error={error} />
      </Context.Provider>
    );
  } else if (calls.some((call) => call.status !== 'fullfilled')) {
    return <>{loadingView}</>;
  }

  return (
    <Context.Provider value={ctxValue}>
      <React.Suspense fallback={loadingView}>{children}</React.Suspense>
    </Context.Provider>
  );
};

export const useAwait = <Func extends (...args: any[]) => Promise<any>, Result = Func extends (...args: any[]) => Promise<infer Result> ? Result : any>(
  func: Func,
  ...args: Parameters<Func>
): Result => {
  const ctx = useContext(Context);

  const { calls, exec, syncResolver } = ctx;

  const hook = ctx.hook++;

  if (calls[hook]?.status === 'fullfilled' && calls[hook]?.func === func && arrsShallowCompare(calls[hook]?.args, args)) {
    return calls[hook].result;
  }

  const syncResolved = syncResolver && syncResolver(func, args);

  if (syncResolved?.resolved) return syncResolved.result;

  exec(func, args, hook);

  throw unresolvablePromise;
};

export const useAwaitErrorReset = () => {
  const ctx = useContext(Context);

  return ctx.reset;
};
