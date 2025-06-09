import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [sveltekit(), tailwindcss()],
    server: {
        watch: {
            ignored: ['**/examplesAndDocs/**']
        }
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: []
    }
});
