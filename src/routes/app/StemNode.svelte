<script module lang="ts">
	import { Tooltip } from 'flowbite-svelte';
	import { Info } from 'lucide-svelte';
	import { NID } from './lib/NodeModels.js';
	import { docStore } from 'sveltefire';
	import { firestore } from '../../firebase';
	import type { NodeBluePrintModel } from './lib/NodeBluePrint.js';
	import { type Node } from '@xyflow/svelte';

	export type StemNodeType = Node<
			{
				project_key: string;
				nid: NID;
			},
			'node-dna'
	>;
</script>

<script lang="ts">
	import { type NodeProps, useSvelteFlow } from '@xyflow/svelte';
	import { Card, Badge, Button, Spinner } from 'flowbite-svelte';
	import { Play, Pause, AlertCircle, CheckCircle, Clock } from 'lucide-svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import Socket from './Socket.svelte';

	let { id, data }: NodeProps<StemNodeType> = $props();

	const dispatch = createEventDispatcher();
	const { updateNodeData } = useSvelteFlow();

	// Reactive stores and state
	let nodeBluePrint = docStore<NodeBluePrintModel>(firestore, `nodes/${data.nid}`);
	let nodeState: 'idle' | 'running' | 'success' | 'error' = 'idle';
	let executionTime: number = 0;
	let errorMessage: string = '';
	let isSelected: boolean = false;
	let connectedInputs: Set<string> = new Set();
	let connectedOutputs: Set<string> = new Set();

	// Node execution state
	let canExecute = $derived.by(() => {
		if (!$nodeBluePrint?.input_sockets) return true;

		const requiredInputs = Object.entries($nodeBluePrint.input_sockets)
				.filter(([_, socket]) => socket.required)
				.map(([id, _]) => id);

		return requiredInputs.every(inputId => connectedInputs.has(inputId));
	});

	// Socket event handlers
	function handleSocketConnect(event: CustomEvent) {
		const { socketId, type } = event.detail;

		if (type === 'target') {
			connectedInputs.add(socketId);
			connectedInputs = connectedInputs;
		} else {
			connectedOutputs.add(socketId);
			connectedOutputs = connectedOutputs;
		}

		dispatch('socketConnect', {
			nodeId: id,
			socketId,
			type,
			...event.detail
		});
	}

	function handleSocketDisconnect(event: CustomEvent) {
		const { socketId, type } = event.detail;

		if (type === 'target') {
			connectedInputs.delete(socketId);
			connectedInputs = connectedInputs;
		} else {
			connectedOutputs.delete(socketId);
			connectedOutputs = connectedOutputs;
		}

		dispatch('socketDisconnect', {
			nodeId: id,
			socketId,
			type,
			...event.detail
		});
	}

	// Node execution
	async function executeNode() {
		if (!canExecute || nodeState === 'running') return;

		nodeState = 'running';
		errorMessage = '';
		const startTime = Date.now();

		try {
			dispatch('nodeExecute', {
				nodeId: id,
				nid: data.nid,
				projectKey: data.project_key
			});

			// Simulate execution time (replace with actual execution logic)
			await new Promise(resolve => setTimeout(resolve, 1000));

			nodeState = 'success';
			executionTime = Date.now() - startTime;

			// Auto-reset after success
			setTimeout(() => {
				if (nodeState === 'success') nodeState = 'idle';
			}, 2000);

		} catch (error) {
			nodeState = 'error';
			errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			executionTime = Date.now() - startTime;
		}
	}

	// Get node status color
	function getStatusColor(state: typeof nodeState): string {
		switch (state) {
			case 'running': return 'blue';
			case 'success': return 'green';
			case 'error': return 'red';
			default: return 'gray';
		}
	}

	// Get category color for badge
	function getCategoryColor(category?: string): string {
		const colors = {
			'input': 'blue',
			'output': 'green',
			'transform': 'purple',
			'logic': 'yellow',
			'utility': 'gray',
			'custom': 'pink'
		};
		return colors[category?.toLowerCase() || 'custom'] || 'gray';
	}

	onMount(() => {
		// Initialize node state if needed
		dispatch('nodeMount', {
			nodeId: id,
			nid: data.nid,
			projectKey: data.project_key
		});
	});
</script>

<!--project: {data.project_key} nid: {data.nid}-->
{#if $nodeBluePrint}
	<div
			class="node-container"
			class:selected={isSelected}
			class:executing={nodeState === 'running'}
			class:success={nodeState === 'success'}
			class:error={nodeState === 'error'}
	>
		<Card class="node-card" padding="none">
			<!-- Node Header -->
			<div class="node-header" role="button" tabindex="0">
				<div class="header-content">
					<div class="title-section">
						<h3 class="node-title">{$nodeBluePrint.title}</h3>
					</div>

					<div class="header-actions">
						<!-- Status indicator -->
						<div class="status-indicator">
							{#if nodeState === 'running'}
								<Spinner size="4" />
							{:else if nodeState === 'success'}
								<CheckCircle size={16} class="text-green-600" />
							{:else if nodeState === 'error'}
								<AlertCircle size={16} class="text-red-600" />
							{:else}
								<Clock size={16} class="text-gray-500" />
							{/if}
						</div>

						<!-- Info tooltip -->
						{#if $nodeBluePrint.documentation}
							<div class="info-icon">
								<Info size={16} />
								<Tooltip placement="top">{$nodeBluePrint.documentation}</Tooltip>
							</div>
						{/if}
					</div>
				</div>

				<!-- Execution info -->
				{#if executionTime > 0}
					<div class="execution-info">
                        <span class="execution-time">
                            {executionTime}ms
                        </span>
						{#if nodeState === 'error' && errorMessage}
                            <span class="error-message" title={errorMessage}>
                                {errorMessage.length > 30 ? errorMessage.substring(0, 30) + '...' : errorMessage}
                            </span>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Node Body -->
			<div class="node-body">
				<div class="node-content">

					<!-- Output Sockets -->
					{#if $nodeBluePrint.output_sockets && Object.keys($nodeBluePrint.output_sockets).length > 0}
						<div class="sockets-section output-sockets">
							{#each Object.entries($nodeBluePrint.output_sockets) as [socket_id, socket_blueprint]}
								<Socket
										type="source"
										id={socket_id}
										label={socket_blueprint.label}
										socketType={socket_blueprint.type}
										connected={connectedOutputs.has(socket_id)}
										tooltip={socket_blueprint.documentation}
										disabled={nodeState === 'running'}
										on:connect={handleSocketConnect}
										on:disconnect={handleSocketDisconnect}
								/>
							{/each}
						</div>
					{/if}

					<!-- Input Sockets -->
					{#if $nodeBluePrint.input_sockets && Object.keys($nodeBluePrint.input_sockets).length > 0}
						<div class="sockets-section">
							{#each Object.entries($nodeBluePrint.input_sockets) as [socket_id, socket_blueprint]}
								<Socket
										type="target"
										id={socket_id}
										label={socket_blueprint.label}
										socketType={socket_blueprint.type}
										required={false}
										connected={connectedInputs.has(socket_id)}
										tooltip={socket_blueprint.documentation}
										disabled={nodeState === 'running'}
										on:connect={handleSocketConnect}
										on:disconnect={handleSocketDisconnect}
								/>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</Card>
	</div>
{:else}
	<!-- Loading state -->
	<div class="node-container loading">
		<Card class="node-card loading-card">
			<div class="loading-content">
				<Spinner size="6" />
				<span>Loading node...</span>
			</div>
		</Card>
	</div>
{/if}

<style>
	.node-container {
		min-width: 200px;
		max-width: 350px;
		transition: all 0.2s ease;
		user-select: none;
	}

	.node-container.selected {
		transform: scale(1.02);
		filter: drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3));
	}

	.node-container.executing {
		animation: pulse 2s infinite;
	}

	.node-container.success .node-card {
		border-color: #10b981;
		box-shadow: 0 0 0 1px #10b981;
	}

	.node-container.error .node-card {
		border-color: #ef4444;
		box-shadow: 0 0 0 1px #ef4444;
	}

	.node-card {
		border: 1px solid #d1d5db;
		background: #ffffff;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		transition: all 0.2s ease;
	}

	.node-header {
		padding: 12px 16px;
		border-bottom: 1px solid #e5e7eb;
		cursor: pointer;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
	}

	.title-section {
		display: flex;
		flex-direction: column;
		gap: 6px;
		flex: 1;
	}

	.node-title {
		font-size: 14px;
		font-weight: 600;
		color: #e9f2ff;
		margin: 0;
		line-height: 1.2;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.status-indicator {
		display: flex;
		align-items: center;
	}

	.info-icon {
		color: #6b7280;
		cursor: help;
		transition: color 0.2s ease;
	}

	.info-icon:hover {
		color: #374151;
	}

	.execution-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px solid #e5e7eb;
		font-size: 11px;
	}

	.execution-time {
		color: #10b981;
		font-weight: 500;
	}

	.error-message {
		color: #ef4444;
		font-weight: 500;
		flex: 1;
		text-align: right;
		cursor: help;
	}

	.node-body {
		padding: 0;
	}

	.node-content {
		display: flex;
		flex-direction: column;
	}

	.sockets-section {
		padding: 8px 0;
	}

	.loading {
		opacity: 0.7;
	}

	.loading-card {
		border: 1px dashed #9ca3af !important;
	}

	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 24px;
		color: #6b7280;
		font-size: 12px;
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.01);
		}
	}
</style>