import React from 'react';
import { test } from 'uvu';
import assert from 'uvu/assert';

import { AwaitBoundary, useAwait } from '../src/useAwait';
import { mountApp, setup } from './setup';

test.before(setup);

test('resolve data', async () => {
  let triggerResolve: (data: string) => void = () => {
    throw new Error('Resolve trigger is not set up yet');
  };
  const loadData = (...args: any[]) =>
    new Promise<string>((resolve) => {
      triggerResolve = resolve;
    });

  const Component: React.FC = () => {
    const data = useAwait(loadData);

    return <div>{data}</div>;
  };
  const app = (
    <div>
      <AwaitBoundary loading="loading">
        <Component />
      </AwaitBoundary>
    </div>
  );

  const { mountedApp } = mountApp(app);

  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.is(mountedApp.textContent, 'loading');

  triggerResolve('resolved data');

  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.is(mountedApp.textContent, 'resolved data');
});

test.run();
