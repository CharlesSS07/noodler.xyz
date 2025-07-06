import { Jimp } from 'jimp';
import { aiServiceInstance } from '$lib/services/AIInferenceService';
import * as d3 from 'd3';
import * as unpdf from 'unpdf';
import type {OutputSocketAsyncReturner} from "$lib/compositor/Interpreter";

export const utils = {
    Jimp: Jimp,
    aiServices: aiServiceInstance,
    unpdf: unpdf,
    d3: d3,
    proxyFetch: async (url: string) => {
        const proxyBaseUrl = "https://us-central1-chuck-65c6e.cloudfunctions.net";
        const proxyUrl = proxyBaseUrl + "/proxy?url=" + encodeURIComponent(url);
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error("HTTP error! status: " + response.status);
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
