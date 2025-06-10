<!--
  Node Blueprint Manager Component
  Demonstrates how to use the NodeBlueprintAPI with real Firebase authentication
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { nodeBlueprintAPI, type NodeBlueprintData, type SearchResult } from '$lib/services/NodeBlueprintAPI.js';
  import { user } from '$lib/stores/AppState.js';

  // Component state
  let loading = false;
  let error = '';
  let success = '';
  
  // Node data
  let nodes: SearchResult[] = [];
  let selectedNode: NodeBlueprintData | null = null;
  
  // Form data for creating nodes
  let newNodeHint = 'math_operation';
  let newNodeTitle = '';
  let newNodeDocs = '';
  let newNodeCode = `
    // Your node implementation here
    const result = inputs.input1 + inputs.input2;
    outputs.set('result', result);
  `;

  // Search
  let searchQuery = '';

  onMount(() => {
    loadNodes();
  });

  async function loadNodes() {
    if (!$user) return;
    
    loading = true;
    error = '';
    
    try {
      const response = await nodeBlueprintAPI.searchNodeBlueprintsByText({
        substring: searchQuery || 'node',
        includeDeployed: true
      });
      
      if (response.success && response.data) {
        nodes = response.data.results;
      } else {
        error = response.error || 'Failed to load nodes';
      }
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function createNode() {
    if (!$user) {
      error = 'You must be logged in to create nodes';
      return;
    }

    loading = true;
    error = '';
    success = '';

    try {
      // Step 1: Create the node
      const createResponse = await nodeBlueprintAPI.createNodeBlueprint({
        hint: newNodeHint
      });

      if (!createResponse.success || !createResponse.data) {
        throw new Error(createResponse.error || 'Failed to create node');
      }

      const nodeId = createResponse.data.nodeId;

      // Step 2: Update documentation if provided
      if (newNodeTitle || newNodeDocs) {
        const docsResponse = await nodeBlueprintAPI.updateNodeBlueprintDocs({
          nodeId,
          title: newNodeTitle || undefined,
          docs: newNodeDocs || undefined
        });

        if (!docsResponse.success) {
          console.warn('Failed to update docs:', docsResponse.error);
        }
      }

      // Step 3: Update code if provided
      if (newNodeCode.trim()) {
        const specResponse = await nodeBlueprintAPI.updateNodeBlueprintSpec({
          nodeId,
          newCode: newNodeCode
        });

        if (!specResponse.success) {
          console.warn('Failed to update code:', specResponse.error);
        }
      }

      success = `Successfully created node: ${nodeId}`;
      
      // Reset form
      newNodeHint = 'math_operation';
      newNodeTitle = '';
      newNodeDocs = '';
      newNodeCode = `
    // Your node implementation here
    const result = inputs.input1 + inputs.input2;
    outputs.set('result', result);
  `;

      // Reload nodes list
      await loadNodes();

    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function selectNode(nodeId: string) {
    loading = true;
    error = '';
    
    try {
      const response = await nodeBlueprintAPI.getNodeBlueprint({ nodeId });
      
      if (response.success && response.data) {
        selectedNode = response.data;
      } else {
        error = response.error || 'Failed to load node details';
      }
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function forkNode(nodeId: string) {
    if (!$user) return;

    loading = true;
    error = '';
    success = '';

    try {
      const response = await nodeBlueprintAPI.forkNodeBlueprint({ nodeId });
      
      if (response.success && response.data) {
        success = `Successfully forked node: ${response.data.nodeId}`;
        await loadNodes();
      } else {
        error = response.error || 'Failed to fork node';
      }
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  async function deployNode(nodeId: string) {
    if (!$user) return;

    if (!confirm('Are you sure you want to deploy this node? Deployed nodes cannot be modified.')) {
      return;
    }

    loading = true;
    error = '';
    success = '';

    try {
      const response = await nodeBlueprintAPI.deployNodeBlueprint({ nodeId });
      
      if (response.success) {
        success = 'Successfully deployed node';
        await loadNodes();
        if (selectedNode && selectedNode.node_key === nodeId.split('/')[0]) {
          await selectNode(nodeId);
        }
      } else {
        error = response.error || 'Failed to deploy node';
      }
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function clearMessages() {
    error = '';
    success = '';
  }
</script>

<div class="node-blueprint-manager">
  <h2>Node Blueprint Manager</h2>
  
  {#if !$user}
    <div class="auth-warning">
      <p>Please log in to manage node blueprints.</p>
    </div>
  {:else}
    
    <!-- Messages -->
    {#if error}
      <div class="error" on:click={clearMessages}>
        <strong>Error:</strong> {error}
        <span class="close">&times;</span>
      </div>
    {/if}
    
    {#if success}
      <div class="success" on:click={clearMessages}>
        <strong>Success:</strong> {success}
        <span class="close">&times;</span>
      </div>
    {/if}

    <!-- Create New Node -->
    <section class="create-node">
      <h3>Create New Node</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="hint">Node Hint:</label>
          <input 
            id="hint"
            type="text" 
            bind:value={newNodeHint} 
            placeholder="e.g., math_operation, text_processor"
          />
        </div>
        
        <div class="form-group">
          <label for="title">Title:</label>
          <input 
            id="title"
            type="text" 
            bind:value={newNodeTitle} 
            placeholder="e.g., Add Two Numbers"
          />
        </div>
        
        <div class="form-group full-width">
          <label for="docs">Documentation:</label>
          <textarea 
            id="docs"
            bind:value={newNodeDocs} 
            placeholder="Describe what this node does..."
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-group full-width">
          <label for="code">Implementation Code:</label>
          <textarea 
            id="code"
            bind:value={newNodeCode} 
            placeholder="// Your node implementation here"
            rows="8"
            style="font-family: monospace;"
          ></textarea>
        </div>
      </div>
      
      <button 
        on:click={createNode} 
        disabled={loading || !newNodeHint.trim()}
        class="btn-primary"
      >
        {loading ? 'Creating...' : 'Create Node'}
      </button>
    </section>

    <!-- Search and Node List -->
    <section class="node-list">
      <h3>Existing Nodes</h3>
      
      <div class="search-bar">
        <input 
          type="text" 
          bind:value={searchQuery} 
          placeholder="Search nodes..."
          on:keydown={(e) => e.key === 'Enter' && loadNodes()}
        />
        <button on:click={loadNodes} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div class="nodes-grid">
        {#each nodes as node (node.nodeId)}
          <div class="node-card" class:deployed={node.isDeployed}>
            <h4>{node.title || 'Untitled Node'}</h4>
            <p class="node-docs">{node.documentation || 'No documentation'}</p>
            <div class="node-meta">
              <span class="node-key">{node.nodeKey}</span>
              <span class="trust-level">{node.trustLevel}</span>
              {#if node.isDeployed}
                <span class="deployed-badge">Deployed</span>
              {/if}
            </div>
            <div class="node-actions">
              <button on:click={() => selectNode(node.nodeId)} class="btn-secondary">
                View Details
              </button>
              <button on:click={() => forkNode(node.nodeId)} class="btn-secondary">
                Fork
              </button>
              {#if !node.isDeployed && $user?.uid === node.authorUid}
                <button on:click={() => deployNode(node.nodeId)} class="btn-warning">
                  Deploy
                </button>
              {/if}
            </div>
          </div>
        {/each}
        
        {#if nodes.length === 0 && !loading}
          <p class="no-nodes">No nodes found. Try creating one or adjusting your search.</p>
        {/if}
      </div>
    </section>

    <!-- Selected Node Details -->
    {#if selectedNode}
      <section class="node-details">
        <h3>Node Details</h3>
        <div class="details-grid">
          <div class="detail-item">
            <strong>Node Key:</strong> {selectedNode.node_key}
          </div>
          <div class="detail-item">
            <strong>Author:</strong> {selectedNode.author_uid}
          </div>
          <div class="detail-item">
            <strong>Created:</strong> {new Date(selectedNode.created_at).toLocaleString()}
          </div>
          <div class="detail-item">
            <strong>Last Updated:</strong> {new Date(selectedNode.last_updated_at).toLocaleString()}
          </div>
          <div class="detail-item">
            <strong>Status:</strong> {selectedNode.is_deployed ? 'Deployed' : 'Development'}
          </div>
          <div class="detail-item">
            <strong>Trust Level:</strong> {selectedNode.trust_level}
          </div>
          
          <div class="detail-item full-width">
            <strong>Implementation Code:</strong>
            <pre class="code-block">{selectedNode.user_defined_code_snippet}</pre>
          </div>
          
          <div class="detail-item full-width">
            <strong>Input Sockets:</strong>
            <pre class="json-block">{JSON.stringify(selectedNode.input_sockets, null, 2)}</pre>
          </div>
          
          <div class="detail-item full-width">
            <strong>Output Sockets:</strong>
            <pre class="json-block">{JSON.stringify(selectedNode.output_sockets, null, 2)}</pre>
          </div>
        </div>
        
        <button on:click={() => selectedNode = null} class="btn-secondary">
          Close Details
        </button>
      </section>
    {/if}
  {/if}
</div>

<style>
  .node-blueprint-manager {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  .auth-warning {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 20px;
  }

  .error, .success {
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 15px;
    cursor: pointer;
    position: relative;
  }

  .error {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
  }

  .success {
    background: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
  }

  .close {
    position: absolute;
    right: 10px;
    top: 10px;
    font-size: 18px;
    font-weight: bold;
  }

  section {
    background: white;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 20px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group.full-width {
    grid-column: 1 / -1;
  }

  label {
    font-weight: 600;
    margin-bottom: 5px;
    color: #333;
  }

  input, textarea {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  input:focus, textarea:focus {
    outline: none;
    border-color: #0066cc;
    box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
  }

  .search-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .search-bar input {
    flex: 1;
  }

  .nodes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 15px;
  }

  .node-card {
    border: 1px solid #e1e5e9;
    border-radius: 6px;
    padding: 15px;
    background: #f8f9fa;
  }

  .node-card.deployed {
    border-color: #28a745;
    background: #f1f8f4;
  }

  .node-card h4 {
    margin: 0 0 10px 0;
    color: #333;
  }

  .node-docs {
    font-size: 14px;
    color: #666;
    margin-bottom: 10px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .node-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 10px;
    font-size: 12px;
  }

  .node-key {
    background: #e9ecef;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: monospace;
  }

  .trust-level {
    background: #cce5ff;
    padding: 2px 6px;
    border-radius: 3px;
  }

  .deployed-badge {
    background: #28a745;
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
  }

  .node-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-bottom: 20px;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .detail-item.full-width {
    grid-column: 1 / -1;
  }

  .code-block, .json-block {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 4px;
    padding: 10px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    overflow-x: auto;
    white-space: pre-wrap;
  }

  .no-nodes {
    grid-column: 1 / -1;
    text-align: center;
    color: #666;
    font-style: italic;
    padding: 40px;
  }

  /* Button styles */
  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: #0066cc;
    color: white;
  }

  .btn-primary:hover:not(:disabled) {
    background: #0052a3;
  }

  .btn-secondary {
    background: #6c757d;
    color: white;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #545b62;
  }

  .btn-warning {
    background: #fd7e14;
    color: white;
  }

  .btn-warning:hover:not(:disabled) {
    background: #e8590c;
  }

  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .details-grid {
      grid-template-columns: 1fr;
    }
    
    .nodes-grid {
      grid-template-columns: 1fr;
    }
  }
</style>