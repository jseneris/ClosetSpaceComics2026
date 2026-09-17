import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: required('CORS_ORIGIN', 'http://localhost:5173'),
  databaseUrl: required('DATABASE_URL'),
  azure: {
    storageConnectionString: required('AZURE_STORAGE_CONNECTION_STRING'),
    storageContainer: required('AZURE_STORAGE_CONTAINER', 'comic-images'),
  },
  auth0: {
    domain: required('AUTH0_DOMAIN'),
    audience: required('AUTH0_AUDIENCE'),
  },
};
