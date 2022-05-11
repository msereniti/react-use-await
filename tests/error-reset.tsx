import React from 'react';
import { test } from 'uvu';
import assert from 'uvu/assert';

import { AwaitBoundary, useAwait, useAwaitErrorReset } from '../src/useAwait';
import { mountApp, setup } from './setup';

test.before(setup);

test('error reset', async () => {
  let triggerResolve: (data: string) => void = () => {
    throw new Error('Resolve trigger is not set up yet');
  };
  let triggerReject: () => void = () => {
    throw new Error('Reject trigger is not set up yet');
  };
  let triggerReset: () => void = () => {
    throw new Error('Reset trigger is not set up yet');
  };
  const loadData = (...args: any[]) =>
    new Promise<string>((resolve, reject) => {
      triggerResolve = resolve;
      triggerReject = reject;
    });

  const Component: React.FC = () => {
    const data = useAwait(loadData);

    return <div>{data}</div>;
  };
  const ErrorView: React.FC<{ error: Error }> = ({ error }) => {
    triggerReset = useAwaitErrorReset();

    assert.instance(error, Error);

    return <button onClick={triggerReset}>Reset error</button>;
  };
  const app = (
    <div>
      <AwaitBoundary loading="loading" ErrorView={ErrorView}>
        <Component />
      </AwaitBoundary>
    </div>
  );

  const { mountedApp } = mountApp(app);

  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.is(mountedApp.textContent, 'loading');

  triggerReject();

  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.is(mountedApp.textContent, 'Reset error');

  triggerReset();

  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.is(mountedApp.textContent, 'loading');

  triggerResolve('hello world');

  await new Promise((resolve) => setTimeout(resolve, 10));

  assert.is(mountedApp.textContent, 'hello world');
});

test.run();
