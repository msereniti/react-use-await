import React from 'react';
import { test } from 'uvu';
import assert from 'uvu/assert';

import useAwait from '../src';
import { mountApp, setup } from './setup';

test.before(setup);

test('suspense component', () => {
  const loadData = (...args: any[]) =>
    new Promise<string>(() => {
      /* Gonna never resolve */
    });
  const Component: React.FC = () => {
    const data = useAwait(loadData, ['suspense']);

    return <div>{data}</div>;
  };
  const app = (
    <div>
      <React.Suspense fallback="loading">
        <Component />
      </React.Suspense>
    </div>
  );

  assert.equal(mountApp(app).textContent, 'loading');
});

test.run();
