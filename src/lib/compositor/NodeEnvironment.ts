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
};

async function executeNode(
    code: string,
    inputs: Record<string, unknown>,
    outputs: OutputSocketAsyncReturner
): Promise<void> {
    try {

        if (!code || code.trim() === '') {
            throw new Error(`Code not defined, cannot execute.`);
        }

        // Create execution context
        const executionContext = {
            inputs,
            outputs,
            utils: utils,
            console: console,
        };

        // Create async function from the code
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
        throw new Error(`Error during execution of node code: ${error}`);
    }
}