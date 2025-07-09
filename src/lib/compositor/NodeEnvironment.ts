import { Jimp } from 'jimp';
import { aiServiceInstance } from '$lib/services/AIInferenceService';
import * as d3 from 'd3';
import * as unpdf from 'unpdf';
import type {OutputSocketAsyncReturner} from "$lib/compositor/Interpreter";
import { auth, isUsingEmulators } from '../../firebase';

// Determine the base URL for cloud functions based on the environment
const functionsBaseUrl = isUsingEmulators
    ? 'http://127.0.0.1:5001/chuck-65c6e/us-central1'
    : 'https://us-central1-chuck-65c6e.cloudfunctions.net';

export const utils = {
    Jimp: Jimp,
    aiServices: aiServiceInstance,
    unpdf: unpdf,
    d3: d3,
    proxyFetch: async (url: string) => {
        const proxyUrl = `${functionsBaseUrl}/proxy?url=${encodeURIComponent(url)}`;

        const user = auth.currentUser;
        if (!user) {
            throw new Error("User not authenticated. You must be logged in to use the proxy.");
        }
        const token = await user.getIdToken();

        const response = await fetch(proxyUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response from proxy:", errorText);
            throw new Error(`Error while fetching resource through proxy: HTTP error! status: (${response.status}) ${response.statusText}. Body: ${errorText}`);
        }
        return response;
    },
};

export async function executeNode(
    nid: string,
    code: string,
    inputs: Record<string, unknown>,
    outputs: OutputSocketAsyncReturner
): Promise<void> {
    try {

        if (!code || code.trim() === '') {
            throw new Error(`No code defined for node: ${nid}`);
        }

        console.log(`[DEBUG] Executing code for ${nid}:`, code);

        const executionContext = {
            inputs,
            outputs,
            utils: utils,
            console: console,
        };

        const asyncFunction = new Function(
            'inputs',
            'outputs',
            'utils',
            'console',
            `return (async function() {
    ${code}
})();`
        );

// Execute the code with the context
        await asyncFunction(
            executionContext.inputs,
            executionContext.outputs,
            executionContext.utils,
            executionContext.console
        );
    } catch (error) {
        console.error(`Error executing node ${nid}:`, error);
        throw new Error(`Error during execution of ${nid}: ${error}`);
    }
}
