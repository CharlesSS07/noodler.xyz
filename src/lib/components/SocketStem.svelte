<script lang="ts">
	import {Handle, Position, type HandleType } from '@xyflow/svelte';
	import {fetchSocketDataTypeByName} from "../../routes/app/lib/DataTypes";

	// Props
	export let type: HandleType; // 'source' for output, 'target' for input
	export let label: string;
	export let socketType: string; // The data type of the socket
	export let socket_id: string; // Unique ID for the handle
	export let required: boolean = false;
	export let disabled: boolean = false;
	export let connected: boolean = false;
	export let tooltip: string = '';


	let socketStyle = '';
	fetchSocketDataTypeByName(socketType).then((datatype) => {
		socketStyle = datatype?.style || '';
	});
	$: isRequired = required && type === 'target';


	// const connections = useNodeConnections({ handleType: 'target' });
	// let isConnectable = $derived(connections.current.length === 0);

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
				id={socket_id}
				class="socket-handle"
				style="{socketStyle}"
				isConnectable={!disabled}
		/>
		<slot type={type} label={label} socketType={socketType} socketStyle={socketStyle} isRequired={isRequired} ></slot>
	{:else}
		<Handle
				type="source"
				position={Position.Right}
				id={socket_id}
				class="socket-handle"
				style="{socketStyle}"
				isConnectable={!disabled}
		/>
		<slot type={type} label={label} socketType={socketType} socketStyle={socketStyle} isRequired={isRequired} ></slot>
	{/if}
</div>

<style>

</style>