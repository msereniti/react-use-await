import React from 'react';
import { test } from 'uvu';
import assert from 'uvu/assert';

import usePromise from '../src';
import { mountApp, setup } from './setup';

test.before(setup);

const noop: (...args: any[]) => void = () => {
  /* do nothing */
};

test('resolve data', async () => {
  let triggerResolve: (data: string) => void = noop;
  const loadData = (...args: any[]) =>
    new Promise<string>((resolve) => {
      triggerResolve = resolve;
    });
  const Component: React.FC = () => {
    const data = usePromise(loadData, ['resolve']);

    return <div>{data}</div>;
  };
  const app = (
    <div>
      <React.Suspense fallback="loading">
        <Component />
      </React.Suspense>
    </div>
  );

  const mountedApp = mountApp(app);

  assert.equal(mountedApp.textContent, 'loading');

  triggerResolve('resolved data');

  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.equal(mountedApp.textContent, 'resolved data');
});

test.run();
