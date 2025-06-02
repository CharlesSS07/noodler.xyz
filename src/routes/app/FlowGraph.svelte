<script lang="ts">
	let { project_key = 'project_key_not_assigned' } = $props<{ project_key?: string }>();

	import {
		SvelteFlow,
		Controls,
		Background,
		BackgroundVariant,
		MiniMap,
		type Node,
		type Edge
	} from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';

	import NoteNode from './NoteNode.svelte';
	import { rtdb } from '../../firebase';
	import StemNode from './StemNode.svelte';
	import { onValue, ref, update, child, remove, off } from 'firebase/database';
	import { onMount } from 'svelte';

	let nodes = $state.raw<Node[]>([
		{
			id: 'default_note',
			type: 'note',
			data: {
				text: 'hello'
			},
			position: { x: 0, y: 100 }
		}
	]);

	let edges = $state.raw<Edge[]>([]);

	// Firebase reference - reactive to project_key changes
	let nodesRef = $derived(ref(rtdb, `fridge/${project_key}/nodes`));
	let edgesRef = $derived(ref(rtdb, `fridge/${project_key}/edges`));

	// Track if we're currently syncing to prevent infinite loops
	let isSyncing = false;
	let firebaseUnsubscribe: (() => void) | null = null;

	// Map to track previous node states for change detection
	let previousNodes = new Map<string, Node>();

	// Helper function to deep compare nodes (simplified version)
	function nodesEqual(node1: Node, node2: Node): boolean {
		if (!node1 || !node2) return false;
		try {
			return JSON.stringify(node1) === JSON.stringify(node2);
		} catch (e) {
			console.warn('Error comparing nodes:', e);
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

	// Sync local changes to Firebase
	async function syncToFirebase(localNodes: Node[]) {
		if (isSyncing || !nodesRef) return;

		try {
			const currentNodeMap = new Map(localNodes.map(node => [node.id, node]));
			const updates: Record<string, any> = {};
			const nodesToRemove: string[] = [];

			// Check for new or changed nodes
			for (const [id, node] of currentNodeMap) {
				if (!node || !node.id) continue;

				const previousNode = previousNodes.get(id);

				if (!previousNode || !nodesEqual(node, previousNode)) {
					const { id: nodeId, ...nodeWithoutId } = node;
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

	// Set up Firebase listener
	function setupFirebaseListener() {
		if (firebaseUnsubscribe) {
			firebaseUnsubscribe();
		}

		const listener = (snapshot: any) => {
			if (isSyncing) return;

			try {
				isSyncing = true;

				const firebaseNodes = firebaseDataToNodes(snapshot);

				// Direct assignment with $state.raw
				const localNodeMap = new Map(nodes.map(node => [node.id, node]));
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
					isSyncing = false;
				}, 50);
			}
		};

		const errorHandler = (error: any) => {
			console.error('Firebase listener error:', error);
		};

		onValue(nodesRef, listener, errorHandler);

		firebaseUnsubscribe = () => {
			if (nodesRef) {
				off(nodesRef, 'value', listener);
			}
		};
	}

	// Watch for changes to nodes and sync to Firebase
	// Using $effect to watch the nodes state
	$effect(() => {
		// This effect runs whenever nodes changes
		if (nodes && nodes.length >= 0) {
			// Debounce the sync operation
			const timeoutId = setTimeout(() => {
				syncToFirebase(nodes);
			}, 100);

			return () => clearTimeout(timeoutId);
		}
	});

	// Watch for project_key changes and set up Firebase listener
	$effect(() => {
		if (project_key && project_key !== 'project_key_not_assigned') {
			console.log('Setting up Firebase listener for project:', project_key);
			setupFirebaseListener();
		}

		// Cleanup function
		return () => {
			if (firebaseUnsubscribe) {
				firebaseUnsubscribe();
				firebaseUnsubscribe = null;
			}
		};
	});

	// Helper functions for manual operations
	export function addNode(node: Omit<Node, 'id'>): void {
		try {
			const newNode: Node = {
				id: crypto.randomUUID(),
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
					node && node.id === nodeId ? { ...node, ...updates } : node
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

	const nodeTypes = {
		note: NoteNode,
		node: StemNode // a node which takes on the properties stored by the server
	};

	let selectedNodeNID = $state('official_node_image_cropper');
</script>

<input type="text" bind:value={selectedNodeNID} />
<button onclick={() => addNode({
	data: {
		nid: selectedNodeNID,
		project_key: project_key
	},
	type: 'node',
	position: { x: 0, y: 0 },
})}>Add Node</button>

<div style="height: 100vh;">
	<SvelteFlow bind:nodes bind:edges {nodeTypes} fitView>
		<Controls />
		<Background variant={BackgroundVariant.Dots} />
		<MiniMap />
	</SvelteFlow>
</div>