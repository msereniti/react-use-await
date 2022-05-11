import React from 'react';
import { test } from 'uvu';
import assert from 'uvu/assert';

import { AwaitBoundary, useAwait } from '../src/useAwait';
import { mountApp, setup } from './setup';

test.before(setup);

test('reject data', async () => {
  let triggerReject: () => void = () => {
    throw new Error('Reject trigger is not set up yet');
  };
  const loadData = (...args: any[]) =>
    new Promise<string>((_resolve, reject) => {
      triggerReject = reject;
    });

  const Component: React.FC = () => {
    const data = useAwait(loadData);

    return <div>{data}</div>;
  };
  const app = (
    <div>
      <AwaitBoundary loading="loading" ErrorView={'error'}>
        <Component />
      </AwaitBoundary>
    </div>
  );

  const { mountedApp } = mountApp(app);

  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.is(mountedApp.textContent, 'loading');

  triggerReject();

  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.is(mountedApp.textContent, 'error');
});

test.run();
