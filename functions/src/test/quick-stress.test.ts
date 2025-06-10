/**
 * Quick Stress Test - Small scale version to verify system works
 */

import { describe, it } from 'mocha';
const { expect } = require('chai');
import fetch from 'node-fetch';

const FUNCTIONS_BASE_URL = 'http://127.0.0.1:5001/chuck-65c6e/us-central1';

// Helper to create proper Firebase callable function payload
const createPayload = (data: any) => ({ data });

// Helper to call Firebase Functions
const callFunction = async (functionName: string, data: any) => {
  const response = await fetch(`${FUNCTIONS_BASE_URL}/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload(data))
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${functionName} failed (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return result.result;
};

// Test data generators
const randomHints = ['calculator', 'processor', 'filter', 'converter', 'analyzer'];
const randomTitles = ['Math Calculator', 'Text Processor', 'Data Filter', 'Format Converter', 'Pattern Analyzer'];
const randomCodes = [
  'const result = inputs.a + inputs.b; outputs.set("result", result);',
  'const text = inputs.text.toUpperCase(); outputs.set("text", text);',
  'const filtered = inputs.data.filter(x => x > 0); outputs.set("data", filtered);',
  'const converted = JSON.stringify(inputs.obj); outputs.set("json", converted);',
  'const pattern = /\\d+/g.test(inputs.text); outputs.set("hasNumbers", pattern);'
];

const getRandomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

describe('Quick Stress Test - Node Blueprint API', function() {
  this.timeout(60000); // 1 minute

  let createdNodes: Array<{ nodeId: string, nodeKey: string, hint: string }> = [];

  it('should create 50 random nodes quickly', async () => {
    console.log('\n🚀 Creating 50 random nodes...');
    
    const nodePromises = [];
    for (let i = 0; i < 50; i++) {
      const hint = getRandomItem(randomHints);
      const promise = callFunction('createNodeBlueprint', { hint: `${hint}_${i}` });
      nodePromises.push(promise.then(result => ({
        nodeId: result.nodeId,
        nodeKey: result.nodeId.split('/')[0],
        hint
      })));
    }

    createdNodes = await Promise.all(nodePromises);
    
    expect(createdNodes).to.have.length(50);
    console.log(`✅ Successfully created ${createdNodes.length} nodes`);
  });

  it('should update documentation for all nodes', async () => {
    console.log('\n📝 Updating documentation for all nodes...');
    
    const updatePromises = createdNodes.map((node, index) => {
      return callFunction('updateNodeBlueprintDocs', {
        nodeId: node.nodeId,
        title: `${getRandomItem(randomTitles)} ${index}`,
        docs: `Auto-generated documentation for ${node.hint} node ${index}`
      });
    });

    const results = await Promise.all(updatePromises);
    
    expect(results.every(r => r.success)).to.be.true;
    console.log(`✅ Successfully updated documentation for ${results.length} nodes`);
  });

  it('should update code for all nodes', async () => {
    console.log('\n💻 Updating code for all nodes...');
    
    const updatePromises = createdNodes.map(node => {
      return callFunction('updateNodeBlueprintSpec', {
        nodeId: node.nodeId,
        newCode: getRandomItem(randomCodes)
      });
    });

    const results = await Promise.all(updatePromises);
    
    expect(results.every(r => r.success)).to.be.true;
    console.log(`✅ Successfully updated code for ${results.length} nodes`);
  });

  it('should deploy 15 random nodes', async () => {
    console.log('\n🚀 Deploying 15 random nodes...');
    
    // Select 15 random nodes to deploy
    const nodesToDeploy = [];
    for (let i = 0; i < 15; i++) {
      nodesToDeploy.push(createdNodes[Math.floor(Math.random() * createdNodes.length)]);
    }

    const deployPromises = nodesToDeploy.map(node => {
      return callFunction('deployNodeBlueprint', { nodeId: node.nodeId });
    });

    const results = await Promise.all(deployPromises);
    
    expect(results.every(r => r.success)).to.be.true;
    console.log(`✅ Successfully deployed ${results.length} nodes`);
  });

  it('should fork 20 random nodes', async () => {
    console.log('\n🍴 Forking 20 random nodes...');
    
    const nodesToFork = [];
    for (let i = 0; i < 20; i++) {
      nodesToFork.push(createdNodes[Math.floor(Math.random() * createdNodes.length)]);
    }

    const forkPromises = nodesToFork.map(node => {
      return callFunction('forkNodeBlueprint', { nodeId: node.nodeId });
    });

    const results = await Promise.all(forkPromises);
    
    expect(results.every(r => r.nodeId)).to.be.true;
    console.log(`✅ Successfully forked ${results.length} nodes`);
  });

  it('should search for nodes with various terms', async () => {
    console.log('\n🔍 Searching for nodes...');
    
    const searchTerms = ['calculator', 'processor', 'filter', 'node', 'test'];
    const searchPromises = searchTerms.map(term => {
      return callFunction('searchNodeBlueprintsByText', {
        substring: term,
        includeDeployed: true
      }).then(result => ({ term, count: result.results.length }));
    });

    const searchResults = await Promise.all(searchPromises);
    
    searchResults.forEach(result => {
      console.log(`  🔍 "${result.term}": ${result.count} results`);
    });

    expect(searchResults.every(r => r.count >= 0)).to.be.true;
    console.log(`✅ Successfully completed ${searchResults.length} searches`);
  });

  it('should verify random sampling of created nodes', async () => {
    console.log('\n✅ Verifying random node samples...');
    
    // Test 10 random nodes
    const samplePromises = [];
    for (let i = 0; i < 10; i++) {
      const randomNode = createdNodes[Math.floor(Math.random() * createdNodes.length)];
      samplePromises.push(
        callFunction('getNodeBlueprint', { nodeId: randomNode.nodeId })
          .then(result => ({ nodeId: randomNode.nodeId, success: !!result }))
      );
    }

    const samples = await Promise.all(samplePromises);
    const successCount = samples.filter(s => s.success).length;
    
    console.log(`✅ Successfully verified ${successCount}/${samples.length} random nodes`);
    expect(successCount).to.be.greaterThan(8); // Allow for some variance
  });

  it('should perform concurrent operations stress test', async () => {
    console.log('\n⚡ Performing concurrent operations...');
    
    const concurrentTasks = [
      // Create 5 new nodes
      ...Array.from({ length: 5 }, (_, i) => 
        callFunction('createNodeBlueprint', { hint: `concurrent_${i}` })
      ),
      // Search 5 times
      ...Array.from({ length: 5 }, (_, i) => 
        callFunction('searchNodeBlueprintsByText', { 
          substring: randomHints[i % randomHints.length],
          includeDeployed: true 
        })
      ),
      // Get 5 random nodes
      ...Array.from({ length: 5 }, () => {
        const randomNode = createdNodes[Math.floor(Math.random() * createdNodes.length)];
        return callFunction('getNodeBlueprint', { nodeId: randomNode.nodeId });
      })
    ];

    const startTime = Date.now();
    const results = await Promise.allSettled(concurrentTasks);
    const endTime = Date.now();

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`  Concurrent operations: ${concurrentTasks.length}`);
    console.log(`  Successful: ${successful}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Total time: ${endTime - startTime}ms`);

    expect(successful).to.be.greaterThan(concurrentTasks.length * 0.8); // 80% success rate
    console.log(`✅ Concurrent operations test passed`);
  });
});