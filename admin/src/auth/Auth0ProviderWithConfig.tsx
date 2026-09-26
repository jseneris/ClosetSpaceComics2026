import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';

// Wraps the admin app with Auth0 so only authenticated users can manage catalog visibility.
export function Auth0ProviderWithConfig({ children }: { children: React.ReactNode }) {
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      }}
    >
      {children}
    </Auth0Provider>
  );
}

export default Auth0ProviderWithConfig;
