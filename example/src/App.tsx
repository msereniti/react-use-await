import './App.css';

import React from 'react';
import { AwaitBoundary, useAwait, useAwaitErrorReset } from 'react-use-await';

const fakeApi = async (id: number) => {
  // eslint-disable-next-line no-console
  console.log(`Requesting a name of #${id} cat...`);
  await new Promise((resolve) => setTimeout(resolve, 200 + id * 200));

  const catName = ['Luna', 'Milo', null, 'Oliver', 'Leo', 'Loki'][id];

  if (!catName) {
    throw new Error(`Oh no, cat with id ${id} not found in out little database!`);
  }

  // eslint-disable-next-line no-console
  console.log(`Loaded the name of #${id} cat (${catName})`);

  return catName;
};

const CatCard: React.FC<{ id: number }> = ({ id }) => {
  const catName = useAwait(fakeApi, id);

  return (
    <div className="cat-card">
      <p className="cat-id">#{id}</p>
      <p className="cat-name">{catName}</p>
      <img className="cat-pic" src={`https://cataas.com/cat/gif?hash=${id}`} />
    </div>
  );
};

const LoadError: React.FC<{ error: Error }> = ({ error }) => {
  const tryAgain = useAwaitErrorReset();

  return (
    <div className="cat-card error">
      <p className="error-text">{error.message}</p>
      <button className="load-again" onClick={tryAgain}>
        Try again
      </button>
    </div>
  );
};

const loadingPlaceholder = <div className="cat-card loading">Loading...</div>;

const App: React.FC = () => {
  const [id, setId] = React.useState(3);

  return (
    <>
      <button onClick={() => setId((prev) => prev + 1)}>+</button>
      <AwaitBoundary ErrorView={LoadError} loading={loadingPlaceholder}>
        <CatCard id={0} />
      </AwaitBoundary>
      <AwaitBoundary ErrorView={LoadError} loading={loadingPlaceholder}>
        <CatCard id={1} />
      </AwaitBoundary>
      <AwaitBoundary ErrorView={LoadError} loading={loadingPlaceholder}>
        <CatCard id={2} />
      </AwaitBoundary>
      <AwaitBoundary ErrorView={LoadError} loading={loadingPlaceholder}>
        <CatCard id={id} />
        <div>
          <CatCard id={4} />
        </div>
        <CatCard id={5} />
      </AwaitBoundary>
    </>
  );
};

export default App;
