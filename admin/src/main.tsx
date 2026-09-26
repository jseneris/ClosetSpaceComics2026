import './styles/index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import { Auth0ProviderWithConfig } from './auth/Auth0ProviderWithConfig';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Auth0ProviderWithConfig>
      <App />
    </Auth0ProviderWithConfig>
  </React.StrictMode>
);
