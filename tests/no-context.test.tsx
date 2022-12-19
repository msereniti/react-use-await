import React from 'react';
import { beforeAll, expect, test } from 'vitest';

import { useAwait } from '../src/useAwait';
import { mountApp, setup } from './setup';

beforeAll(setup);

test('throw without context', async () => {
  // eslint-disable-next-line prettier/prettier
  const loadData = (...args: any[]) => new Promise<string>((resolve) => { });
  let loadDataAttempts = 0;

  const Component: React.FC = () => {
    try {
      loadDataAttempts++;
      useAwait(loadData);
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
    }

    return <div>data</div>;
  };
  const app = (
    <div>
      <Component />
    </div>
  );

  mountApp(app);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(loadDataAttempts).toBe(1);
});
