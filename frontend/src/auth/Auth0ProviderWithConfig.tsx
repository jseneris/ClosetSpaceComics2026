import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';

// Wraps the app with Auth0 so the SPA can log in and attach access tokens to
// API requests. Replaces the legacy Firebase-header (`userId`) auth scheme.
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
