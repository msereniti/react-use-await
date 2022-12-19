import React from 'react';
import { beforeAll, expect, test } from 'vitest';

import { AwaitBoundary, useAwait } from '../src/useAwait';
import { mountApp, setup } from './setup';

beforeAll(setup);

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

  expect(mountedApp.textContent).toBe('%Before%loading%After%');
});
