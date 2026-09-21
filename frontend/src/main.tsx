import './styles/normalize.css';
import './styles/grid.css';
import './styles/index.css';
import './styles/queries.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
