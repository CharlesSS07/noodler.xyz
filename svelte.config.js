// import adapter from '@sveltejs/adapter-auto';
// import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
//
// /** @type {import('@sveltejs/kit').Config} */
// const config = {
// 	// Consult https://svelte.dev/docs/kit/integrations
// 	// for more information about-me preprocessors
// 	preprocess: vitePreprocess(),
//
// 	kit: {
// 		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
// 		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
// 		// See https://svelte.dev/docs/kit/adapters for more information about-me adapters.
// 		adapter: adapter()
// 	}
// };
//
// export default config;

import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter({
            pages: 'build',
            assets: 'build',
            fallback: 'index.html',
            precompress: false,
            strict: false,
        }),
        files: {
            routes: 'src/routes',
        },
        alias: {
            $lib: 'src/lib',
            $shared: 'functions/src/shared',
        },
    },
    onwarn: (warning, handler) => {
        // Ignore warnings from examplesAndDocs folder
        if (warning.filename?.includes('examplesAndDocs')) {
            return;
        }
        handler(warning);
    },
};
