import { preview } from 'astro';
import { fileURLToPath } from 'node:url';

const server = await preview({
  root: fileURLToPath(new URL('../', import.meta.url)),
  server: {
    host: '127.0.0.1',
    port: 4321,
  },
});

const shutdown = (): void => {
  void server.stop().finally(() => process.exit(0));
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

await new Promise<void>(() => undefined);
