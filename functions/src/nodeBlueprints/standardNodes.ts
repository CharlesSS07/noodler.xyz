import { generateStandardNodeSuite } from './libs/FirestoreStandardNodeSet.js';

export async function runStandardNodeOperations() {
    try {
        console.log('Starting standard node operations...');
        
        // Generate the standard node suite
        await generateStandardNodeSuite();

    } catch (error) {
        console.error('Error running standard node operations:', error);
        throw error;
    }
}