import React from 'react';
import { test } from 'uvu';
import assert from 'uvu/assert';

import { AwaitBoundary, useAwait } from '../src/useAwait';
import { mountApp, setup } from './setup';

test.before(setup);

test('nested error priority', async () => {
  const loadData = (id: string) => new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Failed to load data')), 10));

  const Component: React.FC<{ id: string }> = ({ id }) => {
    const data = useAwait(loadData, id);

    return <div>#{data}</div>;
  };

  const ErrorView: React.FC<{ error: Error }> = ({ error }) => <div>{error.message}</div>;

  const app = (
    <div>
      <AwaitBoundary loading="loading" ErrorView={ErrorView}>
        %Before%
        <AwaitBoundary loading="loading" ErrorView={ErrorView}>
          <Component id={'data'} />
        </AwaitBoundary>
        %After%
      </AwaitBoundary>
    </div>
  );

  const { mountedApp } = mountApp(app);

  await new Promise((resolve) => setTimeout(resolve, 50));

  assert.is(mountedApp.textContent, '%Before%Failed to load data%After%');
});

test.run();
