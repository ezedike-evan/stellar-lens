import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 30_000,
    // Live-network tests may hit a stale keep-alive connection on the first
    // attempt after a warmup. Allow two silent retries before failing.
    retry: 2,
  },
});
