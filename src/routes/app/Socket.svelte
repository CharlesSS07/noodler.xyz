<script lang="ts">
	import { Handle, Position, type HandleType } from '@xyflow/svelte';
	import { createEventDispatcher } from 'svelte';

	// Props
	export let type: HandleType; // 'source' for output, 'target' for input
	export let label: string;
	export let socketType: string; // The data type of the socket
	export let id: string; // Unique ID for the handle
	export let required: boolean = false;
	export let color: string = '#95a5a6'; // Color of the socket (varies with type)
	export let onConnect: (() => void) | undefined = undefined; // Connection callback
	export let onDisconnect: (() => void) | undefined = undefined; // Disconnection callback
	export let disabled: boolean = false;
	export let connected: boolean = false;
	export let tooltip: string = '';

	const dispatch = createEventDispatcher();

	// Handle connection events
	function handleConnect(event: CustomEvent) {
		connected = true;
		if (onConnect) {
			onConnect();
		}
		dispatch('connect', {
			socketId: id,
			socketType,
			type,
			event
		});
	}

	function handleDisconnect(event: CustomEvent) {
		connected = false;
		if (onDisconnect) {
			onDisconnect();
		}
		dispatch('disconnect', {
			socketId: id,
			socketType,
			type,
			event
		});
	}

	// Get socket color based on type
	function getSocketColor(socketType: string): string {
		const typeColors: Record<string, string> = {
			string: '#3498db',
			number: '#e74c3c',
			boolean: '#9b59b6',
			object: '#f39c12',
			array: '#2ecc71',
			function: '#e67e22',
			any: '#95a5a6',
			void: '#34495e',
			json: '#1abc9c',
			file: '#8e44ad'
		};
		return typeColors[socketType.toLowerCase()] || color;
	}

	$: socketColor = getSocketColor(socketType);
	$: isRequired = required && type === 'target';
</script>

<div
		class="socket-container {type}"
		class:required={isRequired}
		class:connected
		class:disabled
		title={tooltip || `${label} (${socketType})`}
>
	{#if type === 'target'}
		<Handle
				type="target"
				position={Position.Left}
				{id}
				class="socket-handle"
				style="background-color: {socketColor}; border-color: {socketColor};"
				onconnect={handleConnect}
				ondisconnect={handleDisconnect}
				isConnectable={!disabled}
		/>
		<div class="socket-content input-content">
			<span class="socket-label" class:required={isRequired}>
				{label}
				{#if isRequired}
					<span class="required-indicator">*</span>
				{/if}
			</span>
			{#if socketType}
				<span class="socket-type" style="color: {socketColor};">
					{socketType}
				</span>
			{/if}
		</div>
	{:else}
		<div class="socket-content output-content">
			<span class="socket-label">{label}</span>
			{#if socketType}
				<span class="socket-type" style="color: {socketColor};">
					{socketType}
				</span>
			{/if}
		</div>
		<Handle
				type="source"
				position={Position.Right}
				{id}
				class="socket-handle"
				style="background-color: {socketColor}; border-color: {socketColor};"
				onconnect={handleConnect}
				ondisconnect={handleDisconnect}
				isConnectable={!disabled}
		/>
	{/if}
</div>

<style>
	.socket-container {
		display: flex;
		align-items: center;
		padding: 4px 8px;
		margin: 2px 0;
		border-radius: 4px;
		transition: all 0.2s ease;
		position: relative;
		min-height: 24px;
	}

	.socket-container:hover {
		background-color: rgba(255, 255, 255, 0.05);
	}

	.socket-container.target {
		justify-content: flex-start;
		padding-left: 16px;
	}

	.socket-container.source {
		justify-content: flex-end;
		padding-right: 16px;
	}

	.socket-container.connected {
		background-color: rgba(255, 255, 255, 0.08);
	}

	.socket-container.disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	.socket-container.required {
		border-left: 2px solid #e74c3c;
	}

	.socket-content {
		display: flex;
		flex-direction: column;
		gap: 2px;
		pointer-events: none;
	}

	.input-content {
		align-items: flex-start;
		text-align: left;
	}

	.output-content {
		align-items: flex-end;
		text-align: right;
	}

	.socket-label {
		font-size: 12px;
		font-weight: 500;
		color: #ffffff;
		line-height: 1.2;
		white-space: nowrap;
	}

	.socket-label.required {
		font-weight: 600;
	}

	.required-indicator {
		color: #e74c3c;
		margin-left: 2px;
	}

	.socket-type {
		font-size: 10px;
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		opacity: 0.8;
		line-height: 1;
	}

	:global(.socket-handle) {
		width: 12px !important;
		height: 12px !important;
		border: 2px solid;
		border-radius: 50%;
		transition: all 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	:global(.socket-handle:hover) {
		transform: scale(1.2);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
	}

	/* Connection indicator */
	.socket-container.connected::before {
		content: '';
		position: absolute;
		width: 4px;
		height: 4px;
		background-color: #2ecc71;
		border-radius: 50%;
		top: 50%;
		transform: translateY(-50%);
	}

	.socket-container.target.connected::before {
		left: 2px;
	}

	.socket-container.source.connected::before {
		right: 2px;
	}

	/* Dark theme adjustments */
	@media (prefers-color-scheme: dark) {
		.socket-label {
			color: #e0e0e0;
		}

		.socket-container:hover {
			background-color: rgba(255, 255, 255, 0.1);
		}

		.socket-container.connected {
			background-color: rgba(255, 255, 255, 0.12);
		}
	}
</style>