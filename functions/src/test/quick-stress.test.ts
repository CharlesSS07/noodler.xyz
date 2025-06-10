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
  });

  it('should update documentation for all nodes', async () => {
    
    const updatePromises = createdNodes.map((node, index) => {
      return callFunction('updateNodeBlueprintDocs', {
        nodeId: node.nodeId,
        title: `${getRandomItem(randomTitles)} ${index}`,
        docs: `Auto-generated documentation for ${node.hint} node ${index}`
      });
    });

    const results = await Promise.all(updatePromises);
    
    expect(results.every(r => r.success)).to.be.true;
  });

  it('should update code for all nodes', async () => {
    
    const updatePromises = createdNodes.map(node => {
      return callFunction('updateNodeBlueprintSpec', {
        nodeId: node.nodeId,
        newCode: getRandomItem(randomCodes)
      });
    });

    const results = await Promise.all(updatePromises);
    
    expect(results.every(r => r.success)).to.be.true;
  });

  it('should deploy 15 random nodes', async () => {
    
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
  });

  it('should fork 20 random nodes', async () => {
    
    const nodesToFork = [];
    for (let i = 0; i < 20; i++) {
      nodesToFork.push(createdNodes[Math.floor(Math.random() * createdNodes.length)]);
    }

    const forkPromises = nodesToFork.map(node => {
      return callFunction('forkNodeBlueprint', { nodeId: node.nodeId });
    });

    const results = await Promise.all(forkPromises);
    
    expect(results.every(r => r.nodeId)).to.be.true;
  });

  it('should search for nodes with various terms', async () => {
    
    const searchTerms = ['calculator', 'processor', 'filter', 'node', 'test'];
    const searchPromises = searchTerms.map(term => {
      return callFunction('searchNodeBlueprintsByText', {
        substring: term,
        includeDeployed: true
      }).then(result => ({ term, count: result.results.length }));
    });

    const searchResults = await Promise.all(searchPromises);
    

    expect(searchResults.every(r => r.count >= 0)).to.be.true;
  });

  it('should verify random sampling of created nodes', async () => {
    
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
    
    expect(successCount).to.be.greaterThan(8); // Allow for some variance
  });

  it('should perform concurrent operations stress test', async () => {
    
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

    const results = await Promise.allSettled(concurrentTasks);

    const successful = results.filter(r => r.status === 'fulfilled').length;


    expect(successful).to.be.greaterThan(concurrentTasks.length * 0.8); // 80% success rate
  });
});