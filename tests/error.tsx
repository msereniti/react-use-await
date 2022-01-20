import React from 'react';
import { useErrorBoundary } from 'use-error-boundary';
import { test } from 'uvu';
import assert from 'uvu/assert';

import useAwait from '../src';
import { mountApp, setup } from './setup';

test.before(setup);

const noop: (...args: any[]) => void = () => {
  /* do nothing */
};

test('throw error', async () => {
  const customError = new Error();
  let throwedError: Error | null = null;
  let triggerThrow: () => void = noop;
  const loadData = (...args: any[]) =>
    new Promise<string>((_resolve, reject) => {
      triggerThrow = () => reject(customError);
    });

  const ErrorBoundaryWrapper: React.FC = ({ children }) => {
    const { error, ErrorBoundary } = useErrorBoundary();

    throwedError = error;

    return <ErrorBoundary>{children}</ErrorBoundary>;
  };
  const Component: React.FC = () => {
    const data = useAwait(loadData, ['throw']);

    return <div>{data}</div>;
  };
  const app = (
    <div>
      <ErrorBoundaryWrapper>
        <React.Suspense fallback="loading">
          <Component />
        </React.Suspense>
      </ErrorBoundaryWrapper>
    </div>
  );

  const mountedApp = mountApp(app);

  assert.equal(mountedApp.textContent, 'loading');

  // https://github.com/facebook/react/issues/11098#issuecomment-653208411
  const console = global.console;

  global.console = {
    ...console,
    error: (...args) => {
      if (
        !String(args).includes(
          'React will try to recreate this component tree from scratch using the error boundary you provided'
        )
      ) {
        console.error(...args);
      }
    },
  };

  triggerThrow();

  await new Promise((resolve) => setTimeout(resolve, 10));
  global.console = console;

  assert.equal(throwedError, customError);
});

test.run();
