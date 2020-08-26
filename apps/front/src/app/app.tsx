import React from 'react';
import './app.scss';
import Chat from './chat';

import "bootstrap/dist/css/bootstrap.min.css";
import "shards-ui/dist/css/shards.min.css"

export const App = () => {
  return (
    <div className="app">
      <h1>GraphQL Chat</h1>
      <Chat />
    </div>
  );
};

export default App;
