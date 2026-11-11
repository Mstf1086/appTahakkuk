import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env');
const outputPath = resolve(root, 'src/environments/environment.ts');

function parseEnv(content) {
  const values = {};

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separator = line.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }

  return values;
}

const env = existsSync(envPath) ? parseEnv(await readFile(envPath, 'utf8')) : {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: env.VITE_FIREBASE_APP_ID ?? '',
};

const content = `// Bu dosya \`.env\` içeriğinden otomatik üretilir. Elle düzenlemeyin.
export const environment = {
  production: false,
  firebase: ${JSON.stringify(firebaseConfig, null, 2)},
};
`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, content, 'utf8');

const configured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId,
);

console.log(
  configured
    ? 'Ortam dosyası üretildi: src/environments/environment.ts (Firebase yapılandırması tam)'
    : 'Ortam dosyası üretildi: src/environments/environment.ts (Firebase yapılandırması eksik)',
);
