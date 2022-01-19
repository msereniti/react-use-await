declare const usePromise: <Result extends unknown, Args extends any[]>(promise: (...inputs: Args) => Promise<Result>, inputs: Args, lifespan?: number) => Result;
export default usePromise;
