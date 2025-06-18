<script module lang="ts">
    import {type Node} from '@xyflow/svelte';

    export type StemNodeType = Node<
        {
            nid: string;
            input: Record<string, unknown>,
            output: Record<string, unknown>,
        },
        'node-stem'
    >;
</script>

<script lang="ts">
    import {type NodeProps, useNodeConnections} from "@xyflow/svelte";
    import {docStore} from "sveltefire";
    import {firestore} from "../../firebase";
    import type {FirestoreNodeBluePrintModel} from "$lib/compositor/FirestoreNodeBluePrint";
    import StemNodeComponent from "$lib/components/StemNodeComponent.svelte";

    let {id, data, selected}: NodeProps<StemNodeType> = $props();
    let nodeBluePrint = docStore<FirestoreNodeBluePrintModel>(firestore, `nodes/${data.nid}`);

    const connections = useNodeConnections();

    let inputSockets = $state.raw([]);
    let outputSockets = $state.raw([]);
    // Initialize default values for input sockets
    $effect(() => {
        const blueprint = $nodeBluePrint;
        if (blueprint?.input_sockets) {
            const newInputSockets = [];
            for (const socketId of blueprint.input_socket_order) {
                const socket = blueprint.input_sockets[socketId];

                // determine if this socket is connected
                let isConnected = false;
                for (const connection of connections.current) {
                    if (connection.target === id && connection.targetHandle === socketId) {
                        isConnected = true;
                        break;
                    }
                }

                // determine if this socket holds data
                if (data.input && data.input[socketId]) {
                    newInputSockets.push({
                        label: socket.label,
                        id: socketId,
                        type: socket.type,
                        value: data.input[socketId],
                        isConnected,
                        params: socket.params,
                    });
                } else {
                    newInputSockets.push({
                        label: socket.label,
                        id: socketId,
                        type: socket.type,
                        value: socket.params.default_value,
                        isConnected,
                        params: socket.params,
                    });
                }
            }
            inputSockets = newInputSockets;
        }
        if (blueprint?.output_sockets) {
            const newOutputSockets = [];
            for (const socketId of blueprint.output_socket_order) {
                const socket = blueprint.output_sockets[socketId];

                if (data.input && data.input[socketId]) {
                    newOutputSockets.push({label: socket.label, id: socketId, type: socket.type});
                } else {
                    newOutputSockets.push({label: socket.label, id: socketId, type: socket.type});
                }
            }
            outputSockets = newOutputSockets;
        }
    });
</script>

{#if $nodeBluePrint}
    <StemNodeComponent
            title={$nodeBluePrint.title}
            inputs={inputSockets}
            outputs={outputSockets}
            isSelected={selected}
    ></StemNodeComponent>
{/if}