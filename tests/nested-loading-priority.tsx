import React from 'react';
import { test } from 'uvu';
import assert from 'uvu/assert';

import { AwaitBoundary, useAwait } from '../src/useAwait';
import { mountApp, setup } from './setup';

test.before(setup);

test('nested loading priority', async () => {
  const loadData = (id: string) => new Promise<string>((resolve) => setTimeout(() => resolve(id), 10));

  const Component: React.FC<{ id: string }> = ({ id }) => {
    const data = useAwait(loadData, id);

    return <div>{data}</div>;
  };

  const app = (
    <div>
      <AwaitBoundary loading="loading">
        %Before%
        <AwaitBoundary loading="loading">
          <Component id={'data'} />
        </AwaitBoundary>
        %After%
      </AwaitBoundary>
    </div>
  );

  const { mountedApp } = mountApp(app);

  await new Promise((resolve) => setTimeout(resolve, 5));

  assert.is(mountedApp.textContent, '%Before%loading%After%');
});

test.run();
