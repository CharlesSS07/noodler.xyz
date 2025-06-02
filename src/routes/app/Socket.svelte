<script lang="ts">
	import { Handle, Position, type HandleType } from '@xyflow/svelte';

	export let type: HandleType; // 'source' for output, 'target' for input
	export let label: string;
	export let socketType: string; // The data type of the socket (e.g., 'string', 'number', 'boolean')
	export let id: string; // Unique ID for the handle
	export let required: boolean = false; // Optional: to indicate if an input is required
</script>

<div
	class="socket"
	class:input-socket={type === 'target'}
	class:output-socket={type === 'source'}
	class:required
>
	{#if type === 'target'}
		<Handle type="target" position={Position.Left} {id} class="custom-handle-position" />
		<div class="socket-content input-content">
			<span class="socket-label">{label}</span>
			{#if socketType}
				<span class="socket-type">{socketType}</span>
			{/if}
		</div>
	{:else}
		<div class="socket-content output-content">
			<span class="socket-label">{label}</span>
			{#if socketType}
				<span class="socket-type">{socketType}</span>
			{/if}
		</div>
		<Handle type="source" position={Position.Right} {id} class="custom-handle-position" />
	{/if}
</div>

<style>
	/*
      The .socket class represents one row of input/output (handle + label + type).
      It's a flex container to align the handle and content horizontally.
    */
	.socket {
		display: flex;
		align-items: center; /* Vertically center the handle and the socket-content */
		margin-bottom: 6px; /* Spacing between multiple stacked sockets */
		font-size: 12px;
		position: relative; /* Crucial for positioning the Handle absolutely within this socket */
		/* No horizontal padding here. The padding will be on the CustomNode itself */
		min-height: 24px; /* Ensure a minimum height for consistent spacing */
		/*border: 1px solid #ff0000;*/
		/*width: fit-content;*/
	}

	.input-socket {
		justify-content: flex-start;
	}

	.output-socket {
		justify-content: flex-end;
	}

	/* This div wraps the label and type, allowing them to stick together */
	.socket-content {
		display: flex;
		align-items: baseline; /* Align label and type on their baseline */
		flex-grow: 1; /* Allow content to take up available space */
		/* Margin to push content away from the handle */
		padding: 0 10px; /* Padding for the content inside the socket */
	}

	.input-content {
		/* On input, content is to the right of handle, so add left padding */
		padding-left: 15px; /* Adjust this value for desired spacing from left edge */
	}

	.output-content {
		/* On output, content is to the left of handle, so add right padding */
		padding-right: 15px; /* Adjust this value for desired spacing from right edge */
		justify-content: flex-end; /* Push content to the right within its flex container */
		text-align: right; /* Align text to the right within its content area */
	}

	/*
      These styles target the Handle component provided by xyflow.
      We need to override its default absolute positioning.
    */
	.svelte-flow__handle {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #95a5a6;
		border: 2px solid #7f8c8d;
		cursor: grab;
		transition: all 0.2s ease;
		z-index: 10;
		/* Crucial: Override xyflow's default absolute positioning to allow
           our own positioning within the .socket or via flexbox */
		position: static !important; /* Forces it out of xyflow's absolute positioning */
		transform: none !important; /* Removes xyflow's default centering transform */
	}

	.svelte-flow__handle:hover {
		background: #3498db;
		transform: scale(1.2);
	}

	/* Style for required handles */
	.svelte-flow__handle.required {
		border-color: #e74c3c;
	}

	/*
      This class `custom-handle-position` is applied directly to the Handle
      component in the Svelte template. We use it to set the specific absolute
      position relative to its parent `.socket`.
    */
	.socket .custom-handle-position {
		position: absolute;
		top: 50%; /* Vertically center the handle within its .socket container */
		transform: translateY(-50%); /* Adjust for half the handle's height */
		z-index: 10; /* Ensure handle is on top */
	}

	.input-socket .custom-handle-position {
		left: -6px; /* Position half its width outside the left edge of the .socket */
	}

	.output-socket .custom-handle-position {
		right: -6px; /* Position half its width outside the right edge of the .socket */
	}

	.socket-label {
		font-weight: 500;
		color: #333;
		white-space: nowrap; /* Prevent label from wrapping */
	}

	.socket-type {
		font-size: 10px;
		color: #7f8c8d;
		margin-left: 4px;
		text-transform: uppercase;
		white-space: nowrap; /* Prevent type from wrapping */
	}
</style>
