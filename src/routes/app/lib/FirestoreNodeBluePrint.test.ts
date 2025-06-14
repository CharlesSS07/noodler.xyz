import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import {
    FirestoreNodeBluePrintControllerFactoryInterface,
    NodeBluePrintInFirestore,
} from './FirestoreNodeBluePrint.js';
import {createNodeBluePrintStore, NodeBluePrint, updateNodeBluePrintStore} from './NodeBluePrint.js';
import { OutputSocketAsyncReturner } from './Interpreter.js';
import type { InputSocketModel, InputSocketParams, OutputSocketModel } from './SocketModels.js';
import { getAuth, signInAnonymously, type User } from 'firebase/auth';
import { app } from '../../../firebase';
import {OutputSocketDataCache} from "./OutputSocketDataCache";

// Test configuration
const TEST_CONFIG = {
    timeout: 30000,
    batchSize: 10,
    maxRetries: 3
};

describe('FirestoreNodeBluePrint Test Suite', () => {
    let factory: FirestoreNodeBluePrintControllerFactoryInterface;
    let testUser: User;
    let createdNodes: string[] = [];

    beforeAll(async () => {
        // Setup Firebase auth for testing
        const auth = getAuth(app);
        const userCredential = await signInAnonymously(auth);
        testUser = userCredential.user;
        
        factory = new FirestoreNodeBluePrintControllerFactoryInterface();
        console.log(`🔐 Signed in as test user: ${testUser.uid}`);
    }, TEST_CONFIG.timeout);

    afterEach(async () => {
        // Clean up created nodes
        console.log(`🧹 Cleaning up ${createdNodes.length} test nodes`);
        createdNodes = [];
    });

    describe('1. Factory Method Tests', () => {
        it('should create official node blueprint', async () => {
            const uniqueName = `test_official_${Date.now()}`;
            const node = await factory.initOfficialNodeBluePrint(uniqueName);

            expect(node).toBeInstanceOf(NodeBluePrintInFirestore);
            expect(node.nid).toBe(`node_official_${uniqueName}`);
            expect(node.title).toBe(uniqueName);
            expect(node.author_uid).toBe('official');
            expect(node.trust_level).toBe('Official');
            expect(node.is_frozen).toBe(false);
            expect(node.predecessor_nid).toBe('root');
            
            createdNodes.push(node.nid);
        }, TEST_CONFIG.timeout);

        it('should create new custom node blueprint', async () => {
            const hint = `Custom Node ${Date.now()}`;
            const node = await factory.initNewNodeBluePrint(testUser.uid, hint);

            console.log(node);
            
            expect(node).toBeInstanceOf(NodeBluePrintInFirestore);
            expect(node.nid).toMatch(/^node_custom_/);
            expect(node.title).toBe(hint);
            expect(node.author_uid).toBe(testUser.uid);
            expect(node.trust_level).toBe('New');
            expect(node.is_frozen).toBe(false);
            expect(node.predecessor_nid).toBe('root');
            
            createdNodes.push(node.nid);
        }, TEST_CONFIG.timeout);

        it('should create new node blueprint without hint', async () => {
            const node = await factory.initNewNodeBluePrint(testUser.uid);

            expect(node).toBeInstanceOf(NodeBluePrintInFirestore);
            expect(node.title).toBe('Untitled Node');
            expect(node.author_uid).toBe(testUser.uid);
            
            createdNodes.push(node.nid);
        }, TEST_CONFIG.timeout);

        it('should fork existing node blueprint', async () => {
            // First create a node to fork
            const originalNode = await factory.initNewNodeBluePrint(testUser.uid, 'Original Node');
            createdNodes.push(originalNode.nid);

            // Add some content to the original node
            originalNode.title = 'Original with Content';
            originalNode.documentation = 'Original documentation';
            
            // Wait a bit for data to propagate
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Fork the node
            const forkedNode = await factory.forkNode(originalNode.nid, testUser.uid);

            expect(forkedNode).toBeInstanceOf(NodeBluePrintInFirestore);
            expect(forkedNode.nid).toMatch(/^node_forked_/);
            expect(forkedNode.predecessor_nid).toBe(originalNode.nid);
            expect(forkedNode.title).toBe(`Fork of ${originalNode.title}`);
            
            createdNodes.push(forkedNode.nid);
        }, TEST_CONFIG.timeout);
    });

    describe('2. Socket Management Tests', () => {
        let testNode: NodeBluePrint;

        beforeAll(async () => {
            testNode = await factory.initNewNodeBluePrint(testUser.uid, 'Socket Test Node');
            createdNodes.push(testNode.nid);
            
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 1000));
        });

        it('should add input sockets and retrieve them correctly', async () => {
            const inputSocket: InputSocketModel<InputSocketParams> = {
                label: 'Test Input',
                documentation: 'A test input socket',
                type: 'string',
                required: true,
                params: {
                    default_value: 'default test value'
                }
            };

            await testNode.newInputSocket('test_input', inputSocket);
            
            expect(testNode.inputSocketKeys).toContain('test_input');
            expect(testNode.inputSockets).toHaveLength(1);
            expect(testNode.inputSockets[0].label).toBe('Test Input');
            expect(testNode.inputSockets[0].type).toBe('string');
            expect(testNode.inputSockets[0].params.default_value).toBe('default test value');
        });

        it('should add multiple input sockets in correct order', async () => {
            const socket1: InputSocketModel<InputSocketParams> = {
                label: 'Input 1',
                documentation: 'First input',
                type: 'number',
                params: { default_value: 42 }
            };

            const socket2: InputSocketModel<InputSocketParams> = {
                label: 'Input 2', 
                documentation: 'Second input',
                type: 'boolean',
                params: { default_value: true }
            };

            await testNode.newInputSocket('input1', socket1);
            await testNode.newInputSocket('input2', socket2);

            expect(testNode.inputSocketKeys).toEqual(['test_input', 'input1', 'input2']);
            expect(testNode.inputSockets).toHaveLength(3);
            expect(testNode.inputSockets[1].label).toBe('Input 1');
            expect(testNode.inputSockets[2].label).toBe('Input 2');
        });

        it('should add output sockets and retrieve them correctly', async () => {
            const outputSocket: OutputSocketModel = {
                label: 'Test Output',
                documentation: 'A test output socket',
                type: 'string'
            };

            testNode.newOutputSocket('test_output', outputSocket);
            
            expect(testNode.outputSocketKeys()).toContain('test_output');
            expect(testNode.outputSockets).toHaveLength(1);
            expect(testNode.outputSockets[0].label).toBe('Test Output');
            expect(testNode.outputSockets[0].type).toBe('string');
        });

        it('should add multiple output sockets in correct order', async () => {
            const socket1: OutputSocketModel = {
                label: 'Output 1',
                documentation: 'First output',
                type: 'number'
            };

            const socket2: OutputSocketModel = {
                label: 'Output 2',
                documentation: 'Second output', 
                type: 'object'
            };

            testNode.newOutputSocket('output1', socket1);
            testNode.newOutputSocket('output2', socket2);

            expect(testNode.outputSocketKeys()).toEqual(['test_output', 'output1', 'output2']);
            expect(testNode.outputSockets).toHaveLength(3);
            expect(testNode.outputSockets[1].label).toBe('Output 1');
            expect(testNode.outputSockets[2].label).toBe('Output 2');
        });
    });

    describe('3. Last Updated Tracking Tests', () => {
        let testNode: NodeBluePrint;
        let initialUpdateTime: Date;

        beforeAll(async () => {
            testNode = await factory.initNewNodeBluePrint(testUser.uid, 'Update Tracking Node');
            createdNodes.push(testNode.nid);
            
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 1000));
            initialUpdateTime = testNode.last_updated_at;
        });

        it('should update last_updated_at when title is changed', async () => {
            await new Promise(resolve => setTimeout(resolve, 100)); // Ensure time difference
            testNode.title = 'Updated Title';
            
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for update
            expect(testNode.last_updated_at.getTime()).toBeGreaterThan(initialUpdateTime.getTime());
        });

        it('should update last_updated_at when documentation is changed', async () => {
            const beforeUpdate = testNode.last_updated_at;
            await new Promise(resolve => setTimeout(resolve, 100));
            
            testNode.documentation = 'Updated documentation';
            
            await new Promise(resolve => setTimeout(resolve, 500));
            expect(testNode.last_updated_at.getTime()).toBeGreaterThan(beforeUpdate.getTime());
        });

        it('should update last_updated_at when code is changed', async () => {
            const beforeUpdate = testNode.last_updated_at; 
            await new Promise(resolve => setTimeout(resolve, 100));
            
            testNode.code = 'console.log("Updated code");';
            
            await new Promise(resolve => setTimeout(resolve, 500));
            expect(testNode.last_updated_at.getTime()).toBeGreaterThan(beforeUpdate.getTime());
        });

        it('should update last_updated_at when sockets are added', async () => {
            const beforeUpdate = testNode.last_updated_at;
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const socket: InputSocketModel<InputSocketParams> = {
                label: 'New Socket',
                documentation: 'A new socket',
                type: 'string',
                params: { default_value: 'test' }
            };
            
            await testNode.newInputSocket('new_socket', socket);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            expect(testNode.last_updated_at.getTime()).toBeGreaterThan(beforeUpdate.getTime());
        });
    });

    describe('4. Store Creation Tests', () => {
        it('should create reactive store for NodeBluePrint', async () => {
            const node = await factory.initNewNodeBluePrint(testUser.uid, 'Store Test Node');
            createdNodes.push(node.nid);
            
            const store = createNodeBluePrintStore(node);
            
            expect(store).toBeDefined();
            expect(store.subscribe).toBeDefined();
            expect(store.set).toBeDefined();
            expect(store.update).toBeDefined();
            
            // Test that store contains the node
            let storeValue: any;
            const unsubscribe = store.subscribe(value => {
                storeValue = value;
            });
            
            expect(storeValue).toBe(node);
            expect(storeValue.nid).toBe(node.nid);
            
            unsubscribe();
        });
    });

    describe('5. Store Update Reactivity Tests', () => {
        it('should update store reactively with updateNodeBluePrintStore', async () => {
            const node = await factory.initNewNodeBluePrint(testUser.uid, 'Reactive Store Test');
            createdNodes.push(node.nid);
            
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for initialization
            
            const store = createNodeBluePrintStore(node);
            
            let updateCount = 0;
            let latestValue: any;
            
            const unsubscribe = store.subscribe(value => {
                updateCount++;
                latestValue = value;
            });
            
            const initialCount = updateCount;
            
            // Use updateNodeBluePrintStore to modify the node
            updateNodeBluePrintStore(store, (n) => {
                n.title = 'Reactively Updated Title';
                n.documentation = 'Reactively updated documentation';
            });
            
            // Wait for reactive update
            await new Promise(resolve => setTimeout(resolve, 500));
            
            expect(updateCount).toBeGreaterThan(initialCount);
            expect(latestValue.title).toBe('Reactively Updated Title');
            expect(latestValue.documentation).toBe('Reactively updated documentation');
            
            unsubscribe();
        });

        it('should handle async updates in updateNodeBluePrintStore', async () => {
            const node = await factory.initNewNodeBluePrint(testUser.uid, 'Async Update Test');
            createdNodes.push(node.nid);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const store = createNodeBluePrintStore(node);
            
            let finalValue: any;
            const unsubscribe = store.subscribe(value => {
                finalValue = value;
            });
            
            // Test async update function
            updateNodeBluePrintStore(store, async (n) => {
                await new Promise(resolve => setTimeout(resolve, 100));
                n.title = 'Async Updated Title';
                
                const socket: InputSocketModel<InputSocketParams> = {
                    label: 'Async Socket',
                    documentation: 'Added asynchronously',
                    type: 'string',
                    params: { default_value: 'async_value' }
                };
                
                await n.newInputSocket('async_socket', socket);
            });
            
            // Wait for async operations to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            expect(finalValue.title).toBe('Async Updated Title');
            expect(finalValue.inputSocketKeys).toContain('async_socket');
            
            unsubscribe();
        });
    });

    describe('6. FirestoreNodeBluePrint Stress Tests', () => {
        it('should handle rapid successive updates', async () => {
            const node = await factory.initNewNodeBluePrint(testUser.uid, 'Stress Test Node');
            createdNodes.push(node.nid);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const updatePromises: Promise<void>[] = [];
            
            // Perform many rapid updates
            for (let i = 0; i < 20; i++) {
                updatePromises.push(
                    (async () => {
                        node.title = `Stress Test ${i}`;
                        node.documentation = `Documentation update ${i}`;
                        
                        const socket: InputSocketModel<InputSocketParams> = {
                            label: `Socket ${i}`,
                            documentation: `Socket ${i} documentation`,
                            type: 'string',
                            params: { default_value: `value_${i}` }
                        };
                        
                        await node.newInputSocket(`socket_${i}`, socket);
                    })()
                );
            }
            
            // Wait for all updates to complete
            await Promise.all(updatePromises);
            
            // Verify final state
            expect(node.inputSocketKeys).toHaveLength(20);
            expect(node.title).toMatch(/^Stress Test/);
        }, TEST_CONFIG.timeout);

        it('should handle concurrent node creation', async () => {
            const createPromises: Promise<NodeBluePrint>[] = [];
            
            // Create multiple nodes concurrently
            for (let i = 0; i < 10; i++) {
                createPromises.push(
                    factory.initNewNodeBluePrint(testUser.uid, `Concurrent Node ${i}`)
                );
            }
            
            const nodes = await Promise.all(createPromises);
            
            // Verify all nodes were created successfully
            expect(nodes).toHaveLength(10);
            nodes.forEach((node, index) => {
                expect(node.title).toBe(`Concurrent Node ${index}`);
                expect(node.author_uid).toBe(testUser.uid);
                createdNodes.push(node.nid);
            });
        }, TEST_CONFIG.timeout);
    });

    describe('7. Combined Store and Firestore Stress Tests', () => {
        it('should handle reactive updates under stress', async () => {
            const nodes: NodeBluePrint[] = [];
            const stores: any[] = [];
            
            // Create multiple nodes with stores
            for (let i = 0; i < 5; i++) {
                const node = await factory.initNewNodeBluePrint(testUser.uid, `Multi Store Node ${i}`);
                const store = createNodeBluePrintStore(node);
                
                nodes.push(node);
                stores.push(store);
                createdNodes.push(node.nid);
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Track all store updates
            const updateCounts = new Array(5).fill(0);
            const unsubscribers = stores.map((store, index) => 
                store.subscribe(() => updateCounts[index]++)
            );
            
            const initialCounts = [...updateCounts];
            
            // Perform rapid updates on all stores simultaneously
            const updatePromises: Promise<void>[] = [];
            
            for (let storeIndex = 0; storeIndex < stores.length; storeIndex++) {
                for (let updateIndex = 0; updateIndex < 10; updateIndex++) {
                    updatePromises.push(
                        new Promise<void>((resolve) => {
                            updateNodeBluePrintStore(stores[storeIndex], async (node) => {
                                node.title = `Multi Update ${storeIndex}-${updateIndex}`;
                                
                                const socket: OutputSocketModel = {
                                    label: `Output ${storeIndex}-${updateIndex}`,
                                    documentation: `Output socket ${updateIndex}`,
                                    type: 'string'
                                };
                                
                                node.newOutputSocket(`output_${storeIndex}_${updateIndex}`, socket);
                                resolve();
                            });
                        })
                    );
                }
            }
            
            await Promise.all(updatePromises);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for all reactive updates
            
            // Verify updates occurred
            updateCounts.forEach((count, index) => {
                expect(count).toBeGreaterThan(initialCounts[index]);
            });
            
            // Verify final state
            nodes.forEach((node, index) => {
                expect(node.title).toMatch(new RegExp(`Multi Update ${index}-`));
                expect(node.outputSocketKeys().length).toBeGreaterThan(0);
            });
            
            // Clean up subscriptions
            unsubscribers.forEach(unsub => unsub());
        }, TEST_CONFIG.timeout);
    });

    describe('8. Code Execution Tests', () => {
        let testNode: NodeBluePrint;

        beforeAll(async () => {
            testNode = await factory.initNewNodeBluePrint(testUser.uid, 'Code Execution Test');
            createdNodes.push(testNode.nid);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Add input and output sockets
            const inputSocket: InputSocketModel<InputSocketParams> = {
                label: 'Number Input',
                documentation: 'A number to process',
                type: 'number',
                params: { default_value: 0 }
            };
            
            const outputSocket: OutputSocketModel = {
                label: 'Result Output',
                documentation: 'The processed result',
                type: 'number'
            };
            
            await testNode.newInputSocket('number', inputSocket);
            testNode.newOutputSocket('result', outputSocket);
        });

        it('should execute simple code correctly', async () => {
            testNode.code = `
                const inputNumber = inputs.number || 0;
                const result = inputNumber * 2;
                await outputs.set('result', result);
            `;
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const dataCache = new OutputSocketDataCache();
            const outputReturner = new OutputSocketAsyncReturner(
                dataCache,
                testNode.nid,
                new Set(['result'])
            );
            
            const inputs = { number: 5 };
            
            await testNode.call(inputs, outputReturner);
            
            const result = await dataCache.get(testNode.nid, 'result');
            expect(result).toBe(10);
        });

        it('should handle code with error correctly', async () => {
            testNode.code = `
                throw new Error('Test error from node code');
            `;
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const dataCache = new OutputSocketDataCache();
            const outputReturner = new OutputSocketAsyncReturner(
                dataCache,
                testNode.nid,
                new Set(['result'])
            );
            
            const inputs = { number: 5 };
            
            await expect(testNode.call(inputs, outputReturner)).rejects.toThrow('Test error from node code');
        });

        it('should handle async code execution', async () => {
            testNode.code = `
                const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
                
                await delay(100);
                const inputNumber = inputs.number || 1;
                const result = inputNumber + 42;
                await outputs.set('result', result);
            `;
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const dataCache = new OutputSocketDataCache();
            const outputReturner = new OutputSocketAsyncReturner(
                dataCache,
                testNode.nid,
                new Set(['result'])
            );
            
            const inputs = { number: 8 };
            
            const startTime = Date.now();
            await testNode.call(inputs, outputReturner);
            const executionTime = Date.now() - startTime;
            
            expect(executionTime).toBeGreaterThanOrEqual(100); // Should take at least 100ms due to delay
            
            const result = await dataCache.get(testNode.nid, 'result');
            expect(result).toBe(50);
        });

        it('should handle code with multiple outputs', async () => {
            // Add another output socket
            const outputSocket2: OutputSocketModel = {
                label: 'Secondary Output',
                documentation: 'Secondary result',
                type: 'string'
            };
            
            testNode.newOutputSocket('secondary', outputSocket2);
            
            testNode.code = `
                const inputNumber = inputs.number || 0;
                await outputs.set('result', inputNumber * 3);
                await outputs.set('secondary', 'Number was: ' + inputNumber);
            `;
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const dataCache = new OutputSocketDataCache();
            const outputReturner = new OutputSocketAsyncReturner(
                dataCache,
                testNode.nid,
                new Set(['result', 'secondary'])
            );
            
            const inputs = { number: 7 };
            
            await testNode.call(inputs, outputReturner);
            
            const numericResult = await dataCache.get(testNode.nid, 'result');
            const stringResult = await dataCache.get(testNode.nid, 'secondary');
            
            expect(numericResult).toBe(21);
            expect(stringResult).toBe('Number was: 7');
        });

        it('should fail execution on frozen node', async () => {
            // Create an official (frozen) node
            const frozenNode = await factory.initOfficialNodeBluePrint(`frozen_test_${Date.now()}`);
            await frozenNode.freeze();
            createdNodes.push(frozenNode.nid);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            expect(() => {
                frozenNode.code = 'console.log("different code")';
            }).toThrow();
        });
    });
});