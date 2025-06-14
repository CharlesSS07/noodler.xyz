import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
    plugins: [sveltekit()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['src/tests/setup.ts'],
        include: ['src/**/*.{test,spec}.{js,ts}'],
        testTimeout: 60000, // Default 60 seconds
        hookTimeout: 60000, // Setup/teardown timeout
        pool: 'forks', // Use forks for better isolation
        maxConcurrency: 5, // Limit concurrent tests to avoid overwhelming Firebase
        retry: 1, // Retry failed tests once
        bail: 1, // Stop on first failure for stress tests
    },
});
