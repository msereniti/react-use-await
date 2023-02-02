import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type ReactFiberNodeLinkedHook = {
  memoizedState: string;
  next: ReactFiberNodeLinkedHook | null;
};
type ReactFiberNode = unknown & {
  child: any;
  return: any;
  memoizedState: ReactFiberNodeLinkedHook | null;
  elementType: unknown & any;
  pendingProps: unknown & {};
};

export type FiberSelector = (
  /** The current {@link ReactFiberNode} node. */
  node: ReactFiberNode
) => boolean | void;

/**
 * Only in debug mode it will return the current fiber.
 */
const reactLowLevelAccessCurrentComponent = (): ReactFiberNode | undefined => {
  const currentComponent = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentOwner?.current;

  return currentComponent;
};

/**
 * Reimplementation of the traversal algorithm from its-fine.
 * @returns Either the current fiber or undefined if it cannot be found.
 */
function traverseFiber(
  /** Input {@link ReactFiberNode} to traverse. */
  fiber: ReactFiberNode | undefined,
  /** Whether to ascend and walk up the tree. Will walk down if `false`. */
  ascending: boolean,
  /** A {@link ReactFiberNode} node selector, returns the first match when `true` is passed. */
  selector: FiberSelector
): ReactFiberNode | undefined {
  if (!fiber) return;
  if (selector(fiber) === true) return fiber;

  let child = ascending ? fiber.return : fiber.child;
  while (child) {
    const match = traverseFiber(child, ascending, selector);
    if (match) return match;

    child = ascending ? null : child.sibling;
  }

  return;
}

/**
 * Reimplementation of its-fine useFiber. Returns the current react-internal {@link ReactFiberNode}. Ensures we have access to react internals in release mode.
 */
function useFiber(): ReactFiberNode {
  const root = React.useContext(FiberContext);
  if (!root)
    throw new Error('Component, rendered with useAwait should be wrapped into `<AwaitBoundary>...</AwaitBoundary>`');

  // In development mode, React will expose the current component's Fiber as ReactCurrentOwner.
  // In production, we don't have this luxury and must traverse from FiberProvider via useId
  const id = React.useId();
  const fiber = React.useMemo(
    () =>
      reactLowLevelAccessCurrentComponent() ??
      traverseFiber(root, false, (node) => {
        let state = node.memoizedState;
        while (state) {
          if (state.memoizedState === id) return true;
          state = state.next;
        }
        return undefined;
      }),
    [root, id]
  );

  if (!fiber) {
    throw new Error(
      `Unable to access react low level api. Either you are trying to use react-use-await outside of function component, or you are breaking Rules of Hooks, or react-use-await is not compatible with React v${React.version}`
    );
  }

  return fiber;
}

type CallFunc = (...args: any[]) => Promise<any>;
type ExecutionHandler = (func: CallFunc, args: any[], component: ReactFiberNode['elementType']) => void;

export type SyncResolver<Func extends CallFunc, Result = Func extends (...args: any[]) => Promise<infer Result> ? Result : any> = (
  func: Func,
  parameters: Parameters<Func>
) => { resolved: true; result: Result } | { resolved: false };

type ResolvingStatus = 'pending' | 'executing' | 'failured' | 'succeed';

type AwaitCall = {
  func: CallFunc;
  args: any[];
  result?: any;
  error?: Error;
  execution?: Promise<any>;
  status: ResolvingStatus;
};

type AwaitCallsStore = { call: AwaitCall | null; next: WeakMap<unknown & {}, AwaitCallsStore> | Map<unknown & {}, AwaitCallsStore> | null };
type CallExtractor = (func: CallFunc, args: any[], component: ReactFiberNode['elementType']) => AwaitCall | null;

type Ctx = {
  reset: () => void;
  calls: WeakMap<ReactFiberNode['elementType'], { store: WeakMap<CallFunc, AwaitCallsStore>; consumers: Set<number> }>;
  getCall: CallExtractor;
  executingCalls: Set<AwaitCall>;
  status: ResolvingStatus;
  failedCalls: { call: AwaitCall; component: ReactFiberNode['elementType'] }[];
  exec: ExecutionHandler;
  init: boolean;
  syncResolver?: SyncResolver<any>;
};

const isPrimitive = (toCheck: any) => typeof toCheck !== 'object' || toCheck === null;
const thrower = () => {
  throw new Error('Component, rendered with useAwait should be wrapped into `<AwaitBoundary>...</AwaitBoundary>`');
};
const unresolvablePromise = new Promise(() => {});
const makeCtxValue = (): Ctx => ({
  reset: thrower,
  calls: new WeakMap(),
  getCall: thrower,
  executingCalls: new Set(),
  status: 'succeed',
  failedCalls: [],
  exec: thrower,
  init: false,
  syncResolver: undefined,
});
const Context = createContext<Ctx>(makeCtxValue());

const useRerender = () => {
  const [, setCounter] = React.useState(0);

  return useCallback(() => setCounter((x) => x + 1), [setCounter]);
};
let uniqeId = 0;
const useUniqueId = () => {
  const ref = useRef<number | null>(null);
  if (ref.current === null) {
    ref.current = uniqeId++;
  }

  return ref as { current: number };
};

const FiberContext = React.createContext<ReactFiberNode>(null!);

/**
 * A react-internal {@link ReactFiberNode} provider. This component binds React children to the React Fiber tree. Call its-fine hooks within this.
 */
export class FiberProvider extends React.Component<{ children?: React.ReactNode }> {
  private _reactInternals!: ReactFiberNode;

  render() {
    return (
      <FiberContext.Provider value={this._reactInternals}>
        {this.props.children}
      </FiberContext.Provider>
    );
  }
}

export const AwaitBoundary: React.FC<{
  loading: React.ReactNode;
  children: React.ReactNode;
  ErrorView?: React.FC<{ error: Error }> | React.ReactNode;
  onError?: (error: unknown) => void;
  syncResolver?: SyncResolver<any>;
}> = ({ loading: loadingView, ErrorView: errorView, onError, syncResolver, children }) => {
  const ctxInitValue = useMemo<Ctx>(makeCtxValue, []);
  const ctx = useRef<Ctx>(ctxInitValue);
  const boundaryIdRef = useUniqueId();
  const [pendingQueue, setPendingQueue] = useState<{ call: AwaitCall; component: ReactFiberNode['elementType'] }[]>([]);

  const consumedComponentsInitValue = useMemo(() => new Set<ReactFiberNode['elementType']>(), []);
  const consumedComponents = useRef(consumedComponentsInitValue);

  const parentCtx = useContext(Context);
  if (parentCtx.init) ctx.current.calls = parentCtx.calls;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const rerender = useRerender();
  const reset = React.useCallback(() => {
    ctx.current.status = 'pending';
    setPendingQueue((queue) => [...queue, ...ctx.current.failedCalls]);
  }, [rerender]);
  const exec = useCallback<ExecutionHandler>(
    (func, args, component) => {
      requestAnimationFrame(() => {
        ctx.current.status = 'executing';
        setPendingQueue((queue) => [...queue, { component, call: { status: 'pending', func, args } }]);
      });
    },
    [setPendingQueue]
  );
  const getCall = useCallback<CallExtractor>((func, args, component) => {
    const byComponent = ctx.current.calls.get(component);
    const byFunc = byComponent?.store.get(func);
    let byArgs = byFunc;
    for (const arg of args) {
      byArgs = byArgs?.next?.get(arg);
    }

    return byArgs?.call ?? null;
  }, []);
  const handleError = React.useCallback(
    (throwed: unknown, source?: { call: AwaitCall; component: ReactFiberNode['elementType'] }) => {
      onErrorRef.current?.(throwed);
      const error = throwed instanceof Error ? throwed : new Error(throwed as any);

      ctx.current.status = 'failured';
      if (source) {
        ctx.current.failedCalls.push(source);
        source.call.status = 'failured';
        source.call.error = error;
      }

      rerender();
    },
    [rerender, getCall]
  );
  useEffect(() => {
    if (pendingQueue.length === 0) return;
    for (const {
      component,
      call: { func, args },
    } of pendingQueue) {
      try {
        const call: AwaitCall = {
          status: 'executing',
          func,
          args,
        };

        call.execution = func(...args)
          .then((result) => {
            call.status = 'succeed';
            call.result = result;
            ctx.current.executingCalls.delete(call);
            if (ctx.current.status === 'pending' || (ctx.current.status === 'executing' && ctx.current.executingCalls.size === 0)) {
              ctx.current.status = 'succeed';
            }
            rerender();
          })
          .catch((throwed) => {
            ctx.current.executingCalls.delete(call);
            handleError(throwed, { call, component });
          });

        if (!ctx.current.calls.has(component)) {
          ctx.current.calls.set(component, { store: new WeakMap(), consumers: new Set([boundaryIdRef.current]) });
        }
        if (!ctx.current.calls.get(component)!.store.has(func)) {
          ctx.current.calls.get(component)!.store.set(func, { call: null, next: null });
        }

        ctx.current.calls.get(component)!.consumers.add(boundaryIdRef.current);
        consumedComponents.current.add(component);

        let callsStore = ctx.current.calls.get(component)!.store.get(func)!;

        for (const arg of args) {
          const expectedNextStoreType = isPrimitive(arg) ? Map : WeakMap;
          if (callsStore.next === null || !(callsStore.next instanceof expectedNextStoreType)) {
            callsStore.next = new expectedNextStoreType();
          }
          if (!callsStore.next.has(arg)) {
            callsStore.next.set(arg, { call: null, next: null });
          }
          callsStore = callsStore.next.get(arg)!;
        }

        callsStore.call = call;
        ctx.current.executingCalls.add(call);
      } catch (throwed) {
        handleError(throwed);
      }
    }
    setPendingQueue([]);
  }, [pendingQueue]);

  useEffect(() => {
    return () => {
      for (const component of [...consumedComponents.current]) {
        if (!ctx.current.calls.has(component)) continue;
        ctx.current.calls.get(component)?.consumers.delete(boundaryIdRef.current);
        if (ctx.current.calls.get(component)?.consumers.size === 0) {
          ctx.current.calls.delete(component);
        }
      }
    };
  }, []);

  ctx.current.init = true;
  ctx.current.syncResolver = syncResolver ?? parentCtx.syncResolver;
  ctx.current.reset = reset;
  ctx.current.exec = exec;
  ctx.current.getCall = getCall;

  if (ctx.current.status === 'failured') {
    const error = ctx.current.failedCalls[0]?.call.error;
    if (!errorView) throw error;

    const ErrorView = typeof errorView === 'function' ? errorView : ((() => errorView) as React.FC<{ error: Error }>);

    return (
      <Context.Provider value={ctx.current}>
        <ErrorView error={error!} />
      </Context.Provider>
    );
  }

  if (ctx.current.status === 'pending' || ctx.current.status === 'executing') {
    return <>{loadingView}</>;
  }

  return (
    <FiberProvider>
      <Context.Provider value={ctx.current}>
        <React.Suspense fallback={loadingView}>{children}</React.Suspense>
      </Context.Provider>
    </FiberProvider>
  );
};

export const useAwait = <Func extends (...args: any[]) => Promise<any>, Result = Func extends (...args: any[]) => Promise<infer Result> ? Result : any>(
  func: Func,
  ...args: Parameters<Func>
): Result => {
  const ctx = useContext(Context);

  const syncResolved = React.useMemo(() => ctx.syncResolver?.(func, args), [ctx.syncResolver, func, ...args]);

  if (syncResolved?.resolved) return syncResolved.result;

  const currentComponent = useFiber();
  const componentRefId = currentComponent.elementType;

  const call = ctx.getCall(func, args, componentRefId);

  if (call?.status === 'succeed') {
    return call.result;
  }

  ctx.exec(func, args, componentRefId);

  throw unresolvablePromise;
};

export const useAwaitErrorReset = () => {
  const ctx = useContext(Context);

  return ctx.reset;
};
