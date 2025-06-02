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
	import { type NodeProps, useSvelteFlow, Handle, Position } from '@xyflow/svelte';
	import Socket from './Socket.svelte';

	let { id, data }: NodeProps<StemNodeType> = $props();

	console.log(id, data);

	// const { updateNodeData } = useSvelteFlow();

	// let nodeBluePrintController: NodeInstanceControllerInterface | undefined = undefined;
	let nodeBluePrint = docStore<NodeBluePrintModel>(firestore, `nodes/${data.nid}`);
	// let nodeInstance = nodeStore<NodeInstance>(
	// 	rtdb,
	// 	`app-my-projects/${data.project_key}/nodes/${data.node_key}`
	// );

	console.log(nodeBluePrint);

	// <!--		style={nodeBluePrint.styling?.color ? `&#45;&#45;node-color: ${nodeBluePrint.styling.color}` : ''}-->

	// style={`
	//     ${nodeBluePrint.styling?.width ? `width: ${nodeBluePrint.styling.width}px;` : ''}
	//     ${nodeBluePrint.styling?.height ? `min-height: ${nodeBluePrint.styling.height}px;` : ''}
	//   `}
</script>

<!--project: {data.project_key} nid: {data.nid} node_key: {data.node_key}-->
{#if $nodeBluePrint}
	<div class="flex w-fit flex-col rounded-xl border border-gray-200 bg-white/70 shadow-sm">
		<div
			class="family-mono flex flex-row rounded-t-xl border-b border-gray-200 px-3 py-1 font-semibold text-gray-900"
		>
			{$nodeBluePrint.title}
			<div class="w-full"></div>
			<Info class="h-fit w-fit scale-200 py-2" />
			<Tooltip>{$nodeBluePrint.documentation}</Tooltip>
		</div>
		<div class="family-sans relative flex rounded-b-xl bg-white p-3 text-xs text-gray-600">
			<div class="node-content">
				{#if $nodeBluePrint.output_sockets}
					<div class="sockets-section">
						<!--					<h4>Outputs</h4>-->
						{#each new Map(Object.entries($nodeBluePrint.output_sockets)) as [socket_id, socket_blueprint]}
							<Socket
								type="source"
								id={socket_id}
								label={socket_blueprint.label}
								socketType={socket_blueprint.type}
								required={socket_blueprint.required || false}
							/>
						{/each}
					</div>
				{/if}

				{#if $nodeBluePrint.input_sockets}
					<div class="sockets-section">
						<!--					<h4>Inputs</h4>-->
						{#each new Map(Object.entries($nodeBluePrint.input_sockets)) as [socket_id, socket_blueprint]}
							<Socket
								type="target"
								id={socket_id}
								label={socket_blueprint.label}
								socketType={socket_blueprint.type}
								required={socket_blueprint.required || false}
							/>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.error-container button {
		background: #3498db;
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 4px;
		cursor: pointer;
	}

	.node-content {
		width: max-content;
		/*min-width: 200px;*/
		/*max-width: 400px;*/
		/*border: 1px solid #f9a825;*/
	}

	.node-documentation {
		font-size: 12px;
		color: #666;
		margin-bottom: 15px;
		font-style: italic;
	}

	.sockets-section {
		margin-bottom: 15px;
	}

	.sockets-section h4 {
		font-size: 12px;
		font-weight: 600;
		margin-bottom: 8px;
		color: #333;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.input-socket .socket-connector {
		margin-right: 8px;
	}

	.output-socket .socket-connector {
		margin-left: 8px;
	}

	/* Assuming family-mono and family-sans are custom font classes */
	.family-mono {
		font-family: 'Mono', monospace; /* Replace 'Mono' with your actual font */
	}
	.family-sans {
		font-family: 'Sans', sans-serif; /* Replace 'Sans', with your actual font */
	}
</style>
