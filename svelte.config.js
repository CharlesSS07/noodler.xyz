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
            // default options are shown. On some platforms
            // these options are set automatically — see below
            pages: 'build',
            assets: 'build',
            fallback: 'build',
            precompress: false,
            strict: true,
        }),
        files: {
            // Exclude examplesAndDocs from being processed by SvelteKit
            lib: 'src/lib',
            routes: 'src/routes'
        }
    },
    onwarn: (warning, handler) => {
        // Ignore warnings from examplesAndDocs folder
        if (warning.filename?.includes('examplesAndDocs')) {
            return;
        }
        handler(warning);
    }
};
