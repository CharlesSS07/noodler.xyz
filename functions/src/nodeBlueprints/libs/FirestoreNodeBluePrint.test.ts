// Load environment variables from .env file
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({path: path.join(__dirname, "../../../.env")});

// Set emulator environment variables BEFORE importing anything
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import { FirestoreNodeBluePrintControllerFactoryInterface, NodeBluePrintInFirestore } from './FirestoreNodeBluePrint';
import * as admin from 'firebase-admin';

describe('FirestoreNodeBluePrint Integration Tests', () => {
    let factory: FirestoreNodeBluePrintControllerFactoryInterface;
    let testNodeIds: string[] = [];
    let testNodeInstances: NodeBluePrintInFirestore[] = [];

    before(() => {
        // Initialize Firebase Admin if not already done
        if (admin.apps.length === 0) {
            admin.initializeApp();
        }
        factory = new FirestoreNodeBluePrintControllerFactoryInterface();
    });

    after(async () => {
        // First destroy all node instances to clean up listeners
        for (const nodeInstance of testNodeInstances) {
            try {
                nodeInstance.destroy();
            } catch (error) {
                // Ignore errors during cleanup
            }
        }
        
        // Then clean up test nodes from database
        const firestore = admin.firestore();
        const batch = firestore.batch();
        
        for (const nodeId of testNodeIds) {
            batch.delete(firestore.collection('nodes').doc(nodeId));
        }
        
        if (testNodeIds.length > 0) {
            await batch.commit();
        }
    });

    describe('FirestoreNodeBluePrintControllerFactoryInterface', () => {
        describe('initOfficialNodeBluePrint', () => {
            it('should create official node blueprint with correct data', async () => {
                const uniqueFunctionName = `test_official_${Date.now()}`;
                
                const result = await factory.initOfficialNodeBluePrint(uniqueFunctionName);
                testNodeIds.push(uniqueFunctionName);
                testNodeInstances.push(result as NodeBluePrintInFirestore);
                
                expect(result).to.be.instanceOf(NodeBluePrintInFirestore);
                expect(result.nid).to.equal(uniqueFunctionName);
                
                // Wait for Firestore to sync
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                expect(result.title).to.equal(uniqueFunctionName);
                expect(result.owner).to.equal('official');
                expect(result.trust_level).to.equal('Official');
                expect(result.tags).to.deep.equal(['official']);
                expect(result.is_frozen).to.equal(false);
                expect(result.searchable).to.equal(true);
                expect(result.input_spec_strict).to.equal(true);
                expect(result.predecessor_nid).to.equal('root');
            });
        });

        describe('initNewNodeBluePrint', () => {
            it('should create new node blueprint with default title', async () => {
                const authorUid = 'test-author-123';
                
                const result = await factory.initNewNodeBluePrint(authorUid);
                testNodeIds.push(result.nid);
                testNodeInstances.push(result as NodeBluePrintInFirestore);
                
                expect(result).to.be.instanceOf(NodeBluePrintInFirestore);
                expect(result.nid).to.match(/^node_custom_/);
                
                // Wait for Firestore to sync
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                expect(result.title).to.equal('Untitled Node');
                expect(result.owner).to.equal(authorUid);
                expect(result.trust_level).to.equal('New');
                expect(result.tags).to.deep.equal([]);
                expect(result.is_frozen).to.equal(false);
                expect(result.searchable).to.equal(true);
                expect(result.input_spec_strict).to.equal(true);
                expect(result.predecessor_nid).to.equal('root');
            });

            it('should create new node blueprint with custom hint as title', async () => {
                const authorUid = 'test-author-456';
                const hint = 'Custom Node Title';
                
                const result = await factory.initNewNodeBluePrint(authorUid, hint);
                testNodeIds.push(result.nid);
                testNodeInstances.push(result as NodeBluePrintInFirestore);
                
                expect(result).to.be.instanceOf(NodeBluePrintInFirestore);
                
                // Wait for Firestore to sync
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                expect(result.title).to.equal(hint);
                expect(result.owner).to.equal(authorUid);
            });
        });

        describe('forkNode', () => {
            let sourceNodeId: string;
            let sourceNode: NodeBluePrintInFirestore;

            beforeEach(async () => {
                // Create a source node to fork
                sourceNode = await factory.initNewNodeBluePrint('original-owner') as NodeBluePrintInFirestore;
                sourceNodeId = sourceNode.nid;
                testNodeIds.push(sourceNodeId);
                testNodeInstances.push(sourceNode);
                
                // Wait for initialization and set some properties
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                sourceNode.title = 'Original Node';
                sourceNode.documentation = 'Original documentation';
                sourceNode.code = 'console.log("original")';
                sourceNode.trust_level = 'Trusted';
                
                // Wait for updates to propagate
                await new Promise(resolve => setTimeout(resolve, 1000));
            });

            it('should fork existing node with updated data', async () => {
                const authorUid = 'fork-author-123';
                
                const result = await factory.forkNode(sourceNodeId, authorUid);
                testNodeIds.push(result.nid);
                testNodeInstances.push(result as NodeBluePrintInFirestore);
                
                expect(result).to.be.instanceOf(NodeBluePrintInFirestore);
                expect(result.nid).to.match(/^node_forked_/);
                
                // Wait for Firestore to sync
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                expect(result.title).to.equal('Fork of Original Node');
                expect(result.owner).to.equal(authorUid); // Should change to new owner
                expect(result.documentation).to.equal('Original documentation');
                expect(result.code).to.equal('console.log("original")');
                expect(result.trust_level).to.equal('New'); // Should be reset
                expect(result.is_frozen).to.equal(false); // Should be reset
                expect(result.predecessor_nid).to.equal(sourceNodeId);
            });

            it('should throw error for non-existent node', async () => {
                const sourceNid = 'non-existent-node-123';
                const authorUid = 'test-author-789';
                
                try {
                    await factory.forkNode(sourceNid, authorUid);
                    expect.fail('Expected error to be thrown');
                } catch (error) {
                    expect(error.message).to.equal(`Node not found: ${sourceNid}`);
                }
            });
        });
    });

    describe('NodeBluePrintInFirestore', () => {

        describe('basic functionality', () => {
            it('should create node and test basic getters', async () => {
                const testNode = await factory.initNewNodeBluePrint('test-owner') as NodeBluePrintInFirestore;
                testNodeIds.push(testNode.nid);
                testNodeInstances.push(testNode);
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Test basic getters
                expect(testNode.owner).to.equal('test-owner');
                expect(testNode.trust_level).to.equal('New');
                expect(testNode.created_at).to.be.instanceOf(Date);
                expect(testNode.last_updated_at).to.be.instanceOf(Date);
                expect(testNode.predecessor_nid).to.equal('root');
                expect(testNode.is_frozen).to.equal(false);
                expect(testNode.searchable).to.equal(true);
                expect(testNode.input_spec_strict).to.equal(true);
                expect(testNode.inputSocketOrder).to.be.an('array');
                expect(testNode.outputSocketOrder).to.be.an('array');
                expect(testNode.inputSockets).to.be.an('array');
                expect(testNode.outputSockets).to.be.an('array');
                expect(testNode.official_note).to.equal('');
                
                // Test destroy function
                expect(() => testNode.destroy()).to.not.throw();
            });
        });

        describe('setters', () => {
            it('should test all setter functions', async () => {
                const testNode = await factory.initNewNodeBluePrint('test-owner-2') as NodeBluePrintInFirestore;
                testNodeIds.push(testNode.nid);
                testNodeInstances.push(testNode);
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Test owner setter throws error
                expect(() => {
                    testNode.owner = 'new-owner';
                }).to.throw('Not implemented: You cannot change node ownership right now.');
                
                // Test trust_level official restriction
                expect(() => {
                    testNode.trust_level = 'official';
                }).to.throw('Official is a reserved trust level.');
                
                // Test valid setters
                testNode.title = 'New Title';
                testNode.documentation = 'New docs';
                testNode.code = 'console.log("new code")';
                testNode.trust_level = 'Trusted';
                testNode.tags = ['tag1', 'tag2'];
                testNode.input_spec_strict = false;
                testNode.searchable = false;
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Verify updates
                expect(testNode.title).to.equal('New Title');
                expect(testNode.documentation).to.equal('New docs');
                expect(testNode.code).to.equal('console.log("new code")');
                expect(testNode.trust_level).to.equal('Trusted');
                expect(testNode.tags).to.deep.equal(['tag1', 'tag2']);
                expect(testNode.input_spec_strict).to.equal(false);
                expect(testNode.searchable).to.equal(false);
                
                testNode.destroy();
            });
        });

        describe('management functions', () => {
            it('should test editor and viewer management', async () => {
                const testNode = await factory.initNewNodeBluePrint('test-owner-3') as NodeBluePrintInFirestore;
                testNodeIds.push(testNode.nid);
                testNodeInstances.push(testNode);
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Test editor management
                const initialEditorCount = testNode.editors.length;
                testNode.addEditor('editor1');
                await new Promise(resolve => setTimeout(resolve, 500));
                testNode.addEditor('new-editor');
                await new Promise(resolve => setTimeout(resolve, 500));
                
                expect(testNode.editors).to.include('editor1');
                expect(testNode.editors).to.include('new-editor');
                expect(testNode.editors.length).to.equal(initialEditorCount + 2);
                
                testNode.removeEditor('editor1');
                await new Promise(resolve => setTimeout(resolve, 500));
                expect(testNode.editors).to.not.include('editor1');
                
                // Test viewer management
                const initialViewerCount = testNode.viewers.length;
                testNode.addViewer('viewer1');
                await new Promise(resolve => setTimeout(resolve, 500));
                testNode.addViewer('new-viewer');
                await new Promise(resolve => setTimeout(resolve, 500));
                
                expect(testNode.viewers).to.include('viewer1');
                expect(testNode.viewers).to.include('new-viewer');
                expect(testNode.viewers.length).to.equal(initialViewerCount + 2);
                
                testNode.removeViewer('viewer1');
                await new Promise(resolve => setTimeout(resolve, 500));
                expect(testNode.viewers).to.not.include('viewer1');
                
                testNode.destroy();
            });
            
            it('should test socket management', async () => {
                const testNode = await factory.initNewNodeBluePrint('test-owner-4') as NodeBluePrintInFirestore;
                testNodeIds.push(testNode.nid);
                testNodeInstances.push(testNode);
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Test input socket
                const inputSocketKey = 'input1';
                const inputSocket = { 
                    type: 'text', 
                    required: true,
                    label: 'Input Socket',
                    documentation: 'Test input socket',
                    params: { default_value: 'test' }
                };
                
                testNode.newInputSocket(inputSocketKey, inputSocket);
                await new Promise(resolve => setTimeout(resolve, 500));
                
                expect(testNode.inputSocketOrder).to.include(inputSocketKey);
                expect(testNode.inputSockets.length).to.be.greaterThan(0);
                
                // Test output socket
                const outputSocketKey = 'output1';
                const outputSocket = { 
                    type: 'text',
                    label: 'Output Socket',
                    documentation: 'Test output socket'
                };
                
                testNode.newOutputSocket(outputSocketKey, outputSocket);
                await new Promise(resolve => setTimeout(resolve, 500));
                
                expect(testNode.outputSocketOrder).to.include(outputSocketKey);
                expect(testNode.outputSockets.length).to.be.greaterThan(0);
                
                testNode.destroy();
            });
            
            it('should test searchability functions', async () => {
                const testNode = await factory.initNewNodeBluePrint('test-owner-5') as NodeBluePrintInFirestore;
                testNodeIds.push(testNode.nid);
                testNodeInstances.push(testNode);
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                testNode.notSearchable();
                await new Promise(resolve => setTimeout(resolve, 500));
                expect(testNode.searchable).to.equal(false);
                
                testNode.isSearchable();
                await new Promise(resolve => setTimeout(resolve, 500));
                expect(testNode.searchable).to.equal(true);
                
                testNode.destroy();
            });
            
            it('should test freeze functionality', async () => {
                const testNode = await factory.initNewNodeBluePrint('test-owner-6') as NodeBluePrintInFirestore;
                testNodeIds.push(testNode.nid);
                testNodeInstances.push(testNode);
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                testNode.freeze();
                await new Promise(resolve => setTimeout(resolve, 500));
                expect(testNode.is_frozen).to.equal(true);
                
                expect(() => {
                    testNode.code = 'New Title';
                }).to.throw(`Node is frozen. Cannot be modified. Fork to modify: ${testNode.nid}`);
                
                testNode.destroy();
            });
        });
    });
});