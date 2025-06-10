/**
 * Client-side Node Blueprint API Stress Tests
 * Large-scale testing with 1000+ nodes, concurrent operations, and performance metrics
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NodeBlueprintAPI } from '$lib/services/NodeBlueprintAPI.js';
import { getAuth, signInAnonymously, type User } from 'firebase/auth';
import { app } from '../firebase/index.js';

// Stress test configuration
const STRESS_CONFIG = {
  totalNodes: 1000,
  batchSize: 50,
  concurrentRequests: 20,
  forksPerNode: 3,
  deploymentPercentage: 0.3, // 30% of nodes will be deployed
  searchTerms: [
    'calculator', 'processor', 'filter', 'converter', 'analyzer',
    'generator', 'validator', 'transformer', 'optimizer', 'scanner',
    'parser', 'encoder', 'decoder', 'compressor', 'hasher'
  ],
  timeout: 300000 // 5 minutes
};

// Test data generators
const randomHints = [
  'math_operation', 'text_processor', 'image_filter', 'data_converter',
  'signal_analyzer', 'pattern_matcher', 'code_generator', 'file_reader',
  'network_scanner', 'crypto_hasher', 'json_parser', 'xml_validator',
  'email_sender', 'database_query', 'api_client', 'logger_utility',
  'cache_manager', 'queue_processor', 'event_handler', 'scheduler'
];

const randomTitles = [
  'Advanced Calculator', 'Text Processor Pro', 'Image Enhancement Filter',
  'Data Format Converter', 'Signal Pattern Analyzer', 'Smart Validator',
  'Code Generator 3000', 'Universal File Reader', 'Network Security Scanner',
  'Crypto Hash Generator', 'JSON Data Parser', 'XML Schema Validator',
  'Email Notification Service', 'Database Query Builder', 'REST API Client',
  'System Event Logger', 'Machine Learning Predictor', 'Weather Data Fetcher',
  'Cache Optimization Engine', 'Real-time Analytics Dashboard'
];

const randomCodeSnippets = [
  `const input1 = inputs.input1 || 0;
   const input2 = inputs.input2 || 0;
   const result = input1 + input2;
   outputs.set('result', result);`,
  
  `const text = inputs.text || '';
   const processed = text.toUpperCase().trim();
   const wordCount = processed.split(/\\s+/).length;
   outputs.set('processed', processed);
   outputs.set('wordCount', wordCount);`,
  
  `const data = inputs.data || [];
   const filtered = data.filter(item => item.active === true);
   const count = filtered.length;
   outputs.set('filtered', filtered);
   outputs.set('count', count);`,
  
  `const url = inputs.url || '';
   if (url) {
     fetch(url)
       .then(response => response.json())
       .then(data => outputs.set('data', data))
       .catch(error => outputs.set('error', error.message));
   }`,
  
  `const array = inputs.array || [];
   const sum = array.reduce((a, b) => a + b, 0);
   const avg = array.length ? sum / array.length : 0;
   const max = Math.max(...array);
   outputs.set('sum', sum);
   outputs.set('average', avg);
   outputs.set('maximum', max);`,
  
  `const password = inputs.password || '';
   const crypto = require('crypto');
   const hash = crypto.createHash('sha256').update(password).digest('hex');
   const strength = password.length >= 8 ? 'strong' : 'weak';
   outputs.set('hash', hash);
   outputs.set('strength', strength);`,
  
  `const email = inputs.email || '';
   const isValid = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
   const domain = email.split('@')[1] || '';
   outputs.set('valid', isValid);
   outputs.set('domain', domain);`,
  
  `const date = new Date();
   const timestamp = date.getTime();
   const formatted = date.toISOString();
   const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
   outputs.set('timestamp', timestamp);
   outputs.set('formatted', formatted);
   outputs.set('dayOfWeek', dayOfWeek);`
];

const randomDocumentations = [
  'Performs advanced mathematical calculations with precision',
  'Processes text data with various transformation options',
  'Applies sophisticated filters to image data',
  'Converts between different data formats seamlessly',
  'Analyzes signal patterns for anomaly detection',
  'Validates data according to predefined rules',
  'Generates code snippets based on templates',
  'Reads files from various sources and formats',
  'Scans network infrastructure for security issues',
  'Creates cryptographic hashes for data integrity'
];

// Utility functions
const getRandomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateRandomNodeSpec = (index: number) => ({
  hint: getRandomItem(randomHints),
  title: `${getRandomItem(randomTitles)} ${index}`,
  docs: `${getRandomItem(randomDocumentations)} (Auto-generated test node ${index})`,
  code: getRandomItem(randomCodeSnippets)
});

// Batch processing utility
const processBatch = async <T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T, index: number) => Promise<R>,
  delayMs: number = 100
): Promise<R[]> => {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}`);
    
    const batchPromises = batch.map((item, batchIndex) => 
      processor(item, i + batchIndex)
    );
    
    const batchResults = await Promise.allSettled(batchPromises);
    const successfulResults = batchResults
      .filter((result): result is PromiseFulfilledResult<R> => result.status === 'fulfilled')
      .map(result => result.value);
    
    results.push(...successfulResults);
    
    // Small delay between batches to avoid overwhelming the system
    if (delayMs > 0 && i + batchSize < items.length) {
      await sleep(delayMs);
    }
  }
  
  return results;
};

describe('NodeBlueprintAPI - Stress Tests', () => {
  let api: NodeBlueprintAPI;
  let testUser: User;
  let createdNodes: Array<{ nodeId: string, nodeKey: string, spec: any }> = [];
  let deployedNodes: Array<{ nodeId: string, nodeKey: string }> = [];
  let forkedNodes: Array<{ nodeId: string, originalNodeId: string }> = [];

  beforeAll(async () => {
    console.log('🚀 Starting Node Blueprint API Stress Tests...');
    
    // Initialize API
    api = new NodeBlueprintAPI();
    
    // Sign in anonymously for testing
    const auth = getAuth(app);
    const userCredential = await signInAnonymously(auth);
    testUser = userCredential.user;
    
    console.log(`🔐 Signed in as test user: ${testUser.uid}`);
    console.log(`📊 Test configuration: ${STRESS_CONFIG.totalNodes} total nodes, ${STRESS_CONFIG.batchSize} batch size`);
  }, STRESS_CONFIG.timeout);

  afterAll(async () => {
    console.log('🏁 Stress test completed!');
    console.log(`📈 Final statistics:`);
    console.log(`  Total nodes created: ${createdNodes.length}`);
    console.log(`  Total nodes deployed: ${deployedNodes.length}`);
    console.log(`  Total forks created: ${forkedNodes.length}`);
    console.log(`  Total operations: ${createdNodes.length + deployedNodes.length + forkedNodes.length}`);
  });

  describe('Mass Node Creation', () => {
    it(`should create ${STRESS_CONFIG.totalNodes} nodes in batches`, async () => {
      console.log(`\n🔨 Creating ${STRESS_CONFIG.totalNodes} random nodes...`);
      
      const nodeSpecs = Array.from({ length: STRESS_CONFIG.totalNodes }, (_, i) => 
        generateRandomNodeSpec(i + 1)
      );

      const createNode = async (nodeSpec: any, index: number) => {
        const startTime = Date.now();
        
        try {
          // Create node
          const createResponse = await api.createNodeBlueprint({
            hint: `${nodeSpec.hint}_${index}`
          });
          
          if (!createResponse.success || !createResponse.data) {
            throw new Error(createResponse.error || 'Failed to create node');
          }
          
          const nodeId = createResponse.data.nodeId;
          const nodeKey = nodeId.split('/')[0];
          
          // Update documentation
          const docsResponse = await api.updateNodeBlueprintDocs({
            nodeId,
            title: nodeSpec.title,
            docs: nodeSpec.docs
          });
          
          if (!docsResponse.success) {
            console.warn(`Failed to update docs for node ${index}: ${docsResponse.error}`);
          }
          
          // Update code
          const specResponse = await api.updateNodeBlueprintSpec({
            nodeId,
            newCode: nodeSpec.code
          });
          
          if (!specResponse.success) {
            console.warn(`Failed to update spec for node ${index}: ${specResponse.error}`);
          }
          
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          return {
            nodeId,
            nodeKey,
            spec: nodeSpec,
            duration
          };
        } catch (error) {
          console.error(`Failed to create node ${index}:`, error);
          throw error;
        }
      };

      const startTime = Date.now();
      createdNodes = await processBatch(
        nodeSpecs,
        STRESS_CONFIG.batchSize,
        createNode,
        50 // 50ms delay between batches
      );
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const averageTimePerNode = totalTime / createdNodes.length;
      
      console.log(`✅ Successfully created ${createdNodes.length}/${STRESS_CONFIG.totalNodes} nodes`);
      console.log(`⏱️  Total time: ${(totalTime / 1000).toFixed(2)}s`);
      console.log(`📊 Average time per node: ${averageTimePerNode.toFixed(2)}ms`);
      
      expect(createdNodes.length).toBeGreaterThan(STRESS_CONFIG.totalNodes * 0.9); // 90% success rate
    }, STRESS_CONFIG.timeout);

    it('should verify random sampling of created nodes', async () => {
      console.log('\n🔍 Verifying random node samples...');
      
      const sampleSize = Math.min(50, createdNodes.length);
      const sampleIndices = Array.from({ length: sampleSize }, () => 
        Math.floor(Math.random() * createdNodes.length)
      );

      let successCount = 0;
      for (const index of sampleIndices) {
        try {
          const node = createdNodes[index];
          const response = await api.getNodeBlueprint({ nodeId: node.nodeId });
          
          if (response.success && response.data) {
            expect(response.data.node_key).toBe(node.nodeKey);
            expect(response.data.author_uid).toBe(testUser.uid);
            successCount++;
          }
        } catch (error) {
          console.warn(`Failed to verify node at index ${index}`);
        }
      }

      const verificationRate = (successCount / sampleSize) * 100;
      console.log(`✅ Verified ${successCount}/${sampleSize} nodes (${verificationRate.toFixed(1)}%)`);
      
      expect(verificationRate).toBeGreaterThan(95); // 95% verification rate
    }, STRESS_CONFIG.timeout);
  });

  describe('Mass Deployment', () => {
    it('should deploy a percentage of created nodes', async () => {
      const nodesToDeploy = createdNodes.slice(0, 
        Math.floor(createdNodes.length * STRESS_CONFIG.deploymentPercentage)
      );

      console.log(`\n🚀 Deploying ${nodesToDeploy.length} nodes...`);

      const deployNode = async (node: any, index: number) => {
        try {
          const response = await api.deployNodeBlueprint({
            nodeId: node.nodeId
          });
          
          if (!response.success || !response.data?.success) {
            throw new Error(response.error || 'Failed to deploy');
          }
          
          return {
            nodeId: node.nodeId,
            nodeKey: node.nodeKey
          };
        } catch (error) {
          console.error(`Failed to deploy node ${index}:`, error);
          throw error;
        }
      };

      const startTime = Date.now();
      deployedNodes = await processBatch(
        nodesToDeploy,
        Math.floor(STRESS_CONFIG.batchSize / 2), // Smaller batches for deployments
        deployNode,
        100 // 100ms delay between batches
      );
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      console.log(`✅ Successfully deployed ${deployedNodes.length}/${nodesToDeploy.length} nodes`);
      console.log(`⏱️  Deployment time: ${(totalTime / 1000).toFixed(2)}s`);
      
      expect(deployedNodes.length).toBeGreaterThan(nodesToDeploy.length * 0.8); // 80% success rate
    }, STRESS_CONFIG.timeout);

    it('should verify deployed nodes are read-only', async () => {
      console.log('\n🔒 Verifying deployed nodes are read-only...');
      
      const sampleSize = Math.min(10, deployedNodes.length);
      const sampleNodes = deployedNodes.slice(0, sampleSize);
      
      let readOnlyCount = 0;
      for (const node of sampleNodes) {
        try {
          const response = await api.updateNodeBlueprintSpec({
            nodeId: node.nodeId,
            newCode: 'console.log("This should fail");'
          });
          
          if (!response.success && response.error?.includes('deployed')) {
            readOnlyCount++;
          }
        } catch (error) {
          // Expected for deployed nodes
          readOnlyCount++;
        }
      }

      console.log(`✅ Verified ${readOnlyCount}/${sampleSize} deployed nodes are read-only`);
      expect(readOnlyCount).toBe(sampleSize);
    }, STRESS_CONFIG.timeout);
  });

  describe('Mass Forking', () => {
    it('should fork multiple nodes', async () => {
      const nodesToFork = createdNodes.slice(0, Math.min(100, createdNodes.length));
      const forkTasks: Array<{ originalNode: any, forkIndex: number }> = [];

      // Create fork tasks
      for (const node of nodesToFork) {
        for (let i = 0; i < STRESS_CONFIG.forksPerNode; i++) {
          forkTasks.push({ originalNode: node, forkIndex: i });
        }
      }

      console.log(`\n🍴 Creating ${forkTasks.length} forks from ${nodesToFork.length} nodes...`);

      const forkNode = async (task: any, index: number) => {
        try {
          const response = await api.forkNodeBlueprint({
            nodeId: task.originalNode.nodeId
          });
          
          if (!response.success || !response.data) {
            throw new Error(response.error || 'Failed to fork');
          }
          
          return {
            nodeId: response.data.nodeId,
            originalNodeId: task.originalNode.nodeId
          };
        } catch (error) {
          console.error(`Failed to fork node ${index}:`, error);
          throw error;
        }
      };

      const startTime = Date.now();
      forkedNodes = await processBatch(
        forkTasks,
        STRESS_CONFIG.batchSize,
        forkNode,
        75 // 75ms delay between batches
      );
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      console.log(`✅ Successfully created ${forkedNodes.length}/${forkTasks.length} forks`);
      console.log(`⏱️  Forking time: ${(totalTime / 1000).toFixed(2)}s`);
      
      expect(forkedNodes.length).toBeGreaterThan(forkTasks.length * 0.8); // 80% success rate
    }, STRESS_CONFIG.timeout);

    it('should verify fork relationships', async () => {
      console.log('\n🔗 Verifying fork relationships...');
      
      const sampleSize = Math.min(20, forkedNodes.length);
      const sampleForks = forkedNodes.slice(0, sampleSize);
      
      let validRelationships = 0;
      for (const fork of sampleForks) {
        try {
          const response = await api.getNodeBlueprint({ nodeId: fork.nodeId });
          
          if (response.success && response.data) {
            if (response.data.predecessor_nid === fork.originalNodeId &&
                response.data.title.includes('Fork of') &&
                !response.data.is_deployed &&
                response.data.trust_level === 'New') {
              validRelationships++;
            }
          }
        } catch (error) {
          console.warn(`Failed to verify fork relationship for ${fork.nodeId}`);
        }
      }

      console.log(`✅ Verified ${validRelationships}/${sampleSize} fork relationships`);
      expect(validRelationships).toBeGreaterThan(sampleSize * 0.9); // 90% success rate
    }, STRESS_CONFIG.timeout);
  });

  describe('Mass Search Operations', () => {
    it('should perform searches with various terms', async () => {
      console.log('\n🔍 Performing mass search operations...');
      
      const searchResults: Array<{ term: string, count: number, time: number }> = [];

      for (const term of STRESS_CONFIG.searchTerms) {
        const startTime = Date.now();
        
        try {
          const response = await api.searchNodeBlueprintsByText({
            substring: term,
            includeDeployed: true
          });
          
          const endTime = Date.now();
          const searchTime = endTime - startTime;
          
          if (response.success && response.data) {
            searchResults.push({
              term,
              count: response.data.results.length,
              time: searchTime
            });
            
            console.log(`  🔍 "${term}": ${response.data.results.length} results (${searchTime}ms)`);
          }
        } catch (error) {
          console.warn(`Search failed for term "${term}":`, error);
        }
      }

      // Calculate statistics
      const totalSearches = searchResults.length;
      const searchesWithResults = searchResults.filter(r => r.count > 0).length;
      const averageSearchTime = searchResults.reduce((sum, r) => sum + r.time, 0) / totalSearches;
      const totalResults = searchResults.reduce((sum, r) => sum + r.count, 0);

      console.log(`\n📊 Search Statistics:`);
      console.log(`  Total searches: ${totalSearches}`);
      console.log(`  Searches with results: ${searchesWithResults}`);
      console.log(`  Average search time: ${averageSearchTime.toFixed(2)}ms`);
      console.log(`  Total results returned: ${totalResults}`);

      expect(averageSearchTime).toBeLessThan(3000); // Should be under 3 seconds
      expect(searchesWithResults).toBeGreaterThan(0); // At least some searches should return results
    }, STRESS_CONFIG.timeout);

    it('should handle concurrent search requests', async () => {
      console.log('\n⚡ Testing concurrent search operations...');
      
      const concurrentSearches = STRESS_CONFIG.searchTerms.slice(0, 10).map(term => 
        api.searchNodeBlueprintsByText({
          substring: term,
          includeDeployed: true
        }).then(result => ({ term, success: result.success, count: result.data?.results.length || 0 }))
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(concurrentSearches);
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const totalTime = endTime - startTime;

      console.log(`✅ Concurrent searches: ${concurrentSearches.length}`);
      console.log(`✅ Successful: ${successful}`);
      console.log(`⏱️  Total time: ${totalTime}ms`);
      console.log(`📊 Average time per search: ${(totalTime / concurrentSearches.length).toFixed(2)}ms`);

      expect(successful).toBeGreaterThan(concurrentSearches.length * 0.8); // 80% success rate
    }, STRESS_CONFIG.timeout);
  });

  describe('Performance Analysis', () => {
    it('should analyze overall system performance', async () => {
      console.log('\n📊 Performing comprehensive performance analysis...');
      
      const totalOperations = createdNodes.length + deployedNodes.length + forkedNodes.length;
      
      console.log(`\n📈 Performance Summary:`);
      console.log(`  Total nodes created: ${createdNodes.length}`);
      console.log(`  Total nodes deployed: ${deployedNodes.length}`);
      console.log(`  Total forks created: ${forkedNodes.length}`);
      console.log(`  Total operations: ${totalOperations}`);
      console.log(`  Success rate: ${((totalOperations / (STRESS_CONFIG.totalNodes * 2)).toFixed(2))}%`);

      // Verify data integrity with random sampling
      const sampleSize = Math.min(50, createdNodes.length);
      console.log(`\n🔍 Performing data integrity check on ${sampleSize} random nodes...`);
      
      let successfulReads = 0;
      const samplePromises = Array.from({ length: sampleSize }, async () => {
        const randomNode = createdNodes[Math.floor(Math.random() * createdNodes.length)];
        try {
          const response = await api.getNodeBlueprint({ nodeId: randomNode.nodeId });
          return response.success && response.data && response.data.node_key === randomNode.nodeKey;
        } catch {
          return false;
        }
      });

      const integrityResults = await Promise.all(samplePromises);
      successfulReads = integrityResults.filter(Boolean).length;

      const integrityRate = (successfulReads / sampleSize) * 100;
      console.log(`✅ Data integrity rate: ${integrityRate.toFixed(1)}%`);
      
      expect(integrityRate).toBeGreaterThan(95); // 95% integrity threshold
      expect(totalOperations).toBeGreaterThan(STRESS_CONFIG.totalNodes * 1.5); // Should have at least 1.5x operations
    }, STRESS_CONFIG.timeout);

    it('should test mixed concurrent operations', async () => {
      console.log('\n⚡ Testing mixed concurrent operations...');
      
      const concurrentTasks = [
        // Create new nodes
        ...Array.from({ length: 5 }, (_, i) => 
          api.createNodeBlueprint({ hint: `concurrent_final_${i}` })
        ),
        // Search operations
        ...Array.from({ length: 5 }, (_, i) => 
          api.searchNodeBlueprintsByText({ 
            substring: STRESS_CONFIG.searchTerms[i % STRESS_CONFIG.searchTerms.length],
            includeDeployed: true 
          })
        ),
        // Get operations
        ...Array.from({ length: 5 }, () => {
          const randomNode = createdNodes[Math.floor(Math.random() * createdNodes.length)];
          return api.getNodeBlueprint({ nodeId: randomNode.nodeId });
        })
      ];

      const startTime = Date.now();
      const results = await Promise.allSettled(concurrentTasks);
      const endTime = Date.now();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const totalTime = endTime - startTime;

      console.log(`📊 Mixed concurrent operations:`);
      console.log(`  Total operations: ${concurrentTasks.length}`);
      console.log(`  Successful: ${successful}`);
      console.log(`  Failed: ${failed}`);
      console.log(`  Success rate: ${((successful / concurrentTasks.length) * 100).toFixed(1)}%`);
      console.log(`  Total time: ${totalTime}ms`);
      console.log(`  Average time per operation: ${(totalTime / concurrentTasks.length).toFixed(2)}ms`);

      expect(successful).toBeGreaterThan(concurrentTasks.length * 0.8); // 80% success rate
    }, STRESS_CONFIG.timeout);
  });
});