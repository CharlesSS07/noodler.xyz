<script lang="ts">
    import HTMLRendererNode from "./nodes/html/HTMLRendererNode.svelte";

    let {project_key = 'project_key_not_assigned'} = $props<{ project_key?: string }>();

    import {
        SvelteFlow,
        Controls,
        Background,
        BackgroundVariant,
        MiniMap, Panel,
        type Node,
        type Edge,
        type ColorMode, useNodeConnections
    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';

    import NoteNode from './nodes/NoteNode.svelte';
    import {auth, rtdb} from '../../firebase';
    import StemNode from './StemNode.svelte';
    import {onValue, ref, update, child, remove, off} from 'firebase/database';
    import TextTemplateFillinNode from "./nodes/text/TextTemplateFillinNode.svelte";
    import ImageNode from "./nodes/images/ImageNode.svelte";
    import TextEditorNode from "./nodes/text/TextEditorNode.svelte";
    import RawTextEditor from "./nodes/text/RawTextEditor.svelte";
    import {onMount, untrack} from "svelte";
    import Logo from "../../components/Logo.svelte";
    import {promptDesign} from "./lib/UnitTestProjects";

    let nodes = $state.raw<Node[]>([]);

    let edges = $state.raw<Edge[]>([]);

    // Firebase references - reactive to project_key changes
    let nodesRef = $derived(ref(rtdb, `fridge/${project_key}/nodes`));
    let edgesRef = $derived(ref(rtdb, `fridge/${project_key}/edges`));

    // Track if we're currently syncing to prevent infinite loops
    let isSyncingNodes = false;
    let isSyncingEdges = false;
    let firebaseNodesUnsubscribe: (() => void) | null = null;
    let firebaseEdgesUnsubscribe: (() => void) | null = null;

    // Maps to track previous states for change detection
    let previousNodes = new Map<string, Node>();
    let previousEdges = new Map<string, Edge>();

    // Helper function to deep compare nodes
    function nodesEqual(node1: Node, node2: Node): boolean {
        if (!node1 || !node2) return false;
        try {
            return JSON.stringify(node1) === JSON.stringify(node2);
        } catch (e) {
            console.warn('Error comparing nodes:', e);
            return false;
        }
    }

    // Helper function to deep compare edges
    function edgesEqual(edge1: Edge, edge2: Edge): boolean {
        if (!edge1 || !edge2) return false;
        try {
            return JSON.stringify(edge1) === JSON.stringify(edge2);
        } catch (e) {
            console.warn('Error comparing edges:', e);
            return false;
        }
    }

    // Helper function to convert Firebase data to Node array
    function firebaseDataToNodes(snapshot: any): Node[] {
        try {
            if (!snapshot || !snapshot.exists()) return [];

            const data = snapshot.val();
            if (!data || typeof data !== 'object') return [];

            return Object.entries(data)
                .map(([id, nodeData]: [string, any]) => {
                    if (!nodeData || typeof nodeData !== 'object') return null;
                    return {
                        id,
                        ...nodeData
                    };
                })
                .filter(Boolean) as Node[];
        } catch (error) {
            console.error('Error converting Firebase data to nodes:', error);
            return [];
        }
    }

    // Helper function to convert Firebase data to Edge array
    function firebaseDataToEdges(snapshot: any): Edge[] {
        try {
            if (!snapshot || !snapshot.exists()) return [];

            const data = snapshot.val();
            if (!data || typeof data !== 'object') return [];

            return Object.entries(data)
                .map(([id, edgeData]: [string, any]) => {
                    if (!edgeData || typeof edgeData !== 'object') return null;
                    return {
                        id,
                        ...edgeData
                    };
                })
                .filter(Boolean) as Edge[];
        } catch (error) {
            console.error('Error converting Firebase data to edges:', error);
            return [];
        }
    }

    // Sync local node changes to Firebase
    async function syncNodesToFirebase(localNodes: Node[]) {
        if (isSyncingNodes || !nodesRef) return;

        try {
            const currentNodeMap = new Map(localNodes.map(node => [node.id, node]));
            const updates: Record<string, any> = {};
            const nodesToRemove: string[] = [];

            // Check for new or changed nodes
            for (const [id, node] of currentNodeMap) {
                if (!node || !node.id) continue;

                const previousNode = previousNodes.get(id);

                if (!previousNode || !nodesEqual(node, previousNode)) {
                    const {id: nodeId, ...nodeWithoutId} = node;
                    updates[id] = nodeWithoutId;
                }
            }

            // Check for removed nodes
            for (const [id] of previousNodes) {
                if (!currentNodeMap.has(id)) {
                    nodesToRemove.push(id);
                }
            }

            // Apply updates to Firebase
            if (Object.keys(updates).length > 0) {
                await update(nodesRef, updates);
            }

            // Remove deleted nodes
            for (const nodeId of nodesToRemove) {
                if (nodeId) {
                    await remove(child(nodesRef, nodeId));
                }
            }

            // Update our tracking map
            previousNodes = new Map(currentNodeMap);

        } catch (error) {
            console.error('Error syncing nodes to Firebase:', error);
        }
    }

    // Sync local edge changes to Firebase
    async function syncEdgesToFirebase(localEdges: Edge[]) {
        if (isSyncingEdges || !edgesRef) return;

        try {
            const currentEdgeMap = new Map(localEdges.map(edge => [edge.id, edge]));
            const updates: Record<string, any> = {};
            const edgesToRemove: string[] = [];

            // Check for new or changed edges
            for (const [id, edge] of currentEdgeMap) {
                if (!edge || !edge.id) continue;

                const previousEdge = previousEdges.get(id);

                if (!previousEdge || !edgesEqual(edge, previousEdge)) {
                    const {id: edgeId, ...edgeWithoutId} = edge;
                    updates[id] = edgeWithoutId;
                }
            }

            // Check for removed edges
            for (const [id] of previousEdges) {
                if (!currentEdgeMap.has(id)) {
                    edgesToRemove.push(id);
                }
            }

            // Apply updates to Firebase
            if (Object.keys(updates).length > 0) {
                await update(edgesRef, updates);
            }

            // Remove deleted edges
            for (const edgeId of edgesToRemove) {
                if (edgeId) {
                    await remove(child(edgesRef, edgeId));
                }
            }

            // Update our tracking map
            previousEdges = new Map(currentEdgeMap);

        } catch (error) {
            console.error('Error syncing edges to Firebase:', error);
        }
    }

    // Set up Firebase listener for nodes
    function setupFirebaseNodesListener() {
        if (firebaseNodesUnsubscribe) {
            firebaseNodesUnsubscribe();
        }

        const listener = (snapshot: any) => {
            if (isSyncingNodes) return;

            try {
                isSyncingNodes = true;

                const firebaseNodes = firebaseDataToNodes(snapshot);

                // Direct assignment with $state.raw
                // const localNodeMap = new Map(nodes.map(node => [node.id, node]));
                const firebaseNodeMap = new Map(firebaseNodes.map(node => [node.id, node]));

                // Start with existing local nodes
                const updatedNodes = [...nodes];

                // Update existing nodes or add new ones from Firebase
                for (const [id, firebaseNode] of firebaseNodeMap) {
                    const localNodeIndex = updatedNodes.findIndex(node => node.id === id);

                    if (localNodeIndex >= 0) {
                        // Update existing node if different
                        if (!nodesEqual(updatedNodes[localNodeIndex], firebaseNode)) {
                            updatedNodes[localNodeIndex] = firebaseNode;
                        }
                    } else {
                        // Add new node from Firebase
                        updatedNodes.push(firebaseNode);
                    }
                }

                // Remove nodes that no longer exist in Firebase
                const finalNodes = updatedNodes.filter(node => firebaseNodeMap.has(node.id));

                // Update our tracking map
                previousNodes = new Map(finalNodes.map(node => [node.id, node]));

                // Direct assignment to trigger reactivity
                nodes = finalNodes;

            } catch (error) {
                console.error('Error syncing from Firebase:', error);
            } finally {
                setTimeout(() => {
                    isSyncingNodes = false;
                }, 50);
            }
        };

        const errorHandler = (error: any) => {
            console.error('Firebase nodes listener error:', error);
        };

        onValue(nodesRef, listener, errorHandler);

        firebaseNodesUnsubscribe = () => {
            if (nodesRef) {
                off(nodesRef, 'value', listener);
            }
        };
    }

    // Set up Firebase listener for edges
    function setupFirebaseEdgesListener() {
        if (firebaseEdgesUnsubscribe) {
            firebaseEdgesUnsubscribe();
        }

        const listener = (snapshot: any) => {
            if (isSyncingEdges) return;

            try {
                isSyncingEdges = true;

                const firebaseEdges = firebaseDataToEdges(snapshot);

                // Direct assignment with $state.raw
                // const localEdgeMap = new Map(edges.map(edge => [edge.id, edge]));
                const firebaseEdgeMap = new Map(firebaseEdges.map(edge => [edge.id, edge]));

                // Start with existing local edges
                const updatedEdges = [...edges];

                // Update existing edges or add new ones from Firebase
                for (const [id, firebaseEdge] of firebaseEdgeMap) {
                    const localEdgeIndex = updatedEdges.findIndex(edge => edge.id === id);

                    if (localEdgeIndex >= 0) {
                        // Update existing edge if different
                        if (!edgesEqual(updatedEdges[localEdgeIndex], firebaseEdge)) {
                            updatedEdges[localEdgeIndex] = firebaseEdge;
                        }
                    } else {
                        // Add new edge from Firebase
                        updatedEdges.push(firebaseEdge);
                    }
                }

                // Remove edges that no longer exist in Firebase
                const finalEdges = updatedEdges.filter(edge => firebaseEdgeMap.has(edge.id));

                // Update our tracking map
                previousEdges = new Map(finalEdges.map(edge => [edge.id, edge]));

                // Direct assignment to trigger reactivity
                edges = finalEdges;

            } catch (error) {
                console.error('Error syncing edges from Firebase:', error);
            } finally {
                setTimeout(() => {
                    isSyncingEdges = false;
                }, 50);
            }
        };

        const errorHandler = (error: any) => {
            console.error('Firebase edges listener error:', error);
        };

        onValue(edgesRef, listener, errorHandler);

        firebaseEdgesUnsubscribe = () => {
            if (edgesRef) {
                off(edgesRef, 'value', listener);
            }
        };
    }

    // Watch for changes to nodes and sync to Firebase
    $effect(() => {
        if (nodes && nodes.length >= 0) {
            const timeoutId = setTimeout(() => {
                syncNodesToFirebase(nodes);
            }, 100);

            return () => clearTimeout(timeoutId);
        }
    });

    // Watch for changes to edges and sync to Firebase
    $effect(() => {
        if (edges && edges.length >= 0) {
            const timeoutId = setTimeout(() => {
                syncEdgesToFirebase(edges);
            }, 100);

            return () => clearTimeout(timeoutId);
        }
    });

    // Watch for project_key changes and set up Firebase listeners
    $effect(() => {
        if (project_key && project_key !== 'project_key_not_assigned') {
            console.log('Setting up Firebase listeners for project:', project_key);
            setupFirebaseNodesListener();
            setupFirebaseEdgesListener();
        }

        // Cleanup function
        return () => {
            if (firebaseNodesUnsubscribe) {
                firebaseNodesUnsubscribe();
                firebaseNodesUnsubscribe = null;
            }
            if (firebaseEdgesUnsubscribe) {
                firebaseEdgesUnsubscribe();
                firebaseEdgesUnsubscribe = null;
            }
        };
    });

    // Helper functions for manual node operations
    export function addNode(node: Omit<Node, 'id'>, id?: string): void {
        try {
            const newNode: Node = {
                id: id || crypto.randomUUID(),
                ...node
            };

            nodes = [...nodes, newNode];
        } catch (error) {
            console.error('Error adding node:', error);
        }
    }

    export function updateNode(nodeId: string, updates: Partial<Node>): void {
        if (!nodeId || !updates) return;

        try {
            nodes = nodes.map(node =>
                node && node.id === nodeId ? {...node, ...updates} : node
            );
        } catch (error) {
            console.error('Error updating node:', error);
        }
    }

    export function deleteNode(nodeId: string): void {
        if (!nodeId) return;

        try {
            nodes = nodes.filter(node => node && node.id !== nodeId);
        } catch (error) {
            console.error('Error deleting node:', error);
        }
    }

    // Helper functions for manual edge operations
    export function addEdge(edge: Omit<Edge, 'id'>): void {
        try {
            const newEdge: Edge = {
                id: crypto.randomUUID(),
                ...edge
            };

            edges = [...edges, newEdge];
        } catch (error) {
            console.error('Error adding edge:', error);
        }
    }

    const nodeTypes = {
        note: NoteNode,
        node: StemNode, // a node which takes on the properties stored by the server
        image: ImageNode,
        html: HTMLRendererNode,
        textTemplate: TextTemplateFillinNode,
        textEditor: TextEditorNode,
        textEditorRaw: RawTextEditor
    };

    let selectedNodeNID = $state('official_node_fetch_url');

    let colorMode: ColorMode = $state('light');

    // async function executeSelectedNodes() {
    //     // Step 1: Identify selected nodes
    //     const selected: Node[] = nodes.filter(node => node.selected);
    //     if (selected.length === 0) {
    //         console.warn('No nodes selected for execution.');
    //         return;
    //     }
    //
    //     if (selected.length >= 2) {
    //         console.warn('Too many nodes selected. Select one node.');
    //         return;
    //     }
    //
    //     console.log('Executing flow starting at', selected);
    //
    //     executeStartingAtNode(nodes, edges, selected[0].id);
    // }

    onMount(() => {

        auth.authStateReady().then(() => {
            console.log('Auth state ready');
            setTimeout(() => {
                const introNodeId = 'defaultIntroNodeId';
                if (nodes.length == 0) {
                    addNode({
                        type: 'note',
                        data: {
                            markdown: `# Welcome to noodler.xyz!
A project by Charles Strauss (c-shelby-07@proton.me <-- reach out for support)

* Pan around by clicking and dragging on the canvas.
* Scroll to zoom.
* Add a node by clicking on one of the buttons above. Wire nodes together to create flow functionality.

## TODO:
1. Node search tool --> KNN over embeddings of node code, name, and descriptions. Also just plain old text comparison.
2. More standard nodes
3. Oauth integrations to cut costs
4. NodeAI for developing new nodes
5. FlowAI for developing flows`
                        },
                        position: {x: 0, y: 100}
                    }, introNodeId);
                }
            }, 500);
        });
    });


</script>

<div style="height: 100vh;">
    <SvelteFlow bind:nodes bind:edges {nodeTypes} {colorMode} fitView>
        <Logo></Logo>
        <Panel position="top-right">
            <input type="text" bind:value={selectedNodeNID}/>
            <button onclick={() => addNode({
                type: 'node',
                data: {
                    nid: selectedNodeNID,
                    input: {},
                    output: {}
                },
                position: { x: 0, y: 0 },
            })}>Add Node 🛠️</button> | <button onclick={() => addNode({
                type: 'image',
                data: {
                    input: {},
                    output: {}
                },
                position: { x: 0, y: 0 },
            })}>Add Image 🌠</button> |
            <button onclick={() => addNode({
                type: 'html',
                data: {
                    input: {},
                    output: {}
                },
                position: { x: 0, y: 0 },
            })}>Add HTML Renderer 🌐</button> |
            <button onclick={() => addNode({
                type: 'textEditor',
                data: {
                    input: {text: ''},
                    currentText: '# markdown',
                    output: {text: ''}
                },
                position: { x: 0, y: 0 },
            })}>Add Md TextEditor 📑</button> |
            <button onclick={() => addNode({
                type: 'textTemplate',
                data: {
                    template: 'Hello @name. It is @degrees degrees F outside.',
                    input: {},
                    output: {text: ''},
                },
                position: { x: 0, y: 0 },
            })}>Add Text Template 𝓍</button> |
            <button onclick={() => addNode({
                type: 'textEditorRaw',
                data: {
                    input: {text: ''},
                    currentText: 'change me',
                    output: {text: ''}
                },
                position: { x: 0, y: 0 },
            })}>Add Raw TextEditor 💻</button> |
            <button onclick={() => addNode({
                type: 'note',
                data: {
                    markdown: `# Welcome to the Noodle Board! 🍜

---

Here's what you can do on the Noodle Board:

* Describe your project to get better AI assistance (comments help! 💡).
* This is a **procedural flow language** (Functional Paradigm). Take the output of one function and **pipe it into another** ➡️.
* Login to your service 🔑, noodle the credentials into their API Node, then access data using the sockets. *Iterate*! 🔄
* Build & test your **own** nodes 🛠️ and deploy them to your **own** API for autoscaling! 🚀
* Be creative. Think different**ly**! ✨`
                },
                position: { x: 0, y: 100 }
            })}>Note 📝</button> |
            <button onclick={() => {nodes = promptDesign.nodes;edges=promptDesign.edges}}>Prompt Design Demo</button> |
<!--            <button onclick={() => executeSelectedNodes()}>Execute Selected Nodes ▶️</button>-->
        </Panel>
        <Controls/>
        <Background variant={BackgroundVariant.Dots}/>
        <MiniMap/>
    </SvelteFlow>
</div>