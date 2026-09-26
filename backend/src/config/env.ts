import path from 'node:path';
import dotenv from 'dotenv';

const backendDir = path.resolve(__dirname, '../..');

dotenv.config({ path: path.join(backendDir, '.env.local') });
dotenv.config({ path: path.join(backendDir, '.env') });

function normalizeDatabaseUrl(value: string): string {
  if (!value.startsWith('sqlserver://') || !value.includes('Initial Catalog=')) {
    return value;
  }

  const [serverPart, ...optionParts] = value.slice('sqlserver://'.length).split(';');
  const options = new Map(
    optionParts
      .map((part) => part.split('='))
      .filter(([key, optionValue]) => key && optionValue)
      .map(([key, optionValue]) => [key.toLowerCase(), optionValue])
  );
  const server = serverPart.replace(',', ':');
  const database = options.get('initial catalog');
  const user = options.get('user id');
  const password = options.get('password');
  const encrypt = options.get('encrypt')?.toLowerCase();
  const trustServerCertificate = options.get('trustservercertificate')?.toLowerCase();

  if (!database || !user || !password) {
    return value;
  }

  const query = new URLSearchParams({ database, user, password });
  if (encrypt) query.set('encrypt', encrypt);
  if (trustServerCertificate) query.set('trustServerCertificate', trustServerCertificate);
  return `sqlserver://${server};${query.toString().replace(/&/g, ';')}`;
}

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = normalizeDatabaseUrl(process.env.DATABASE_URL);
}

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: required('CORS_ORIGIN', 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
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
