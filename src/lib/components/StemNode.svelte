<script module lang="ts">
    import {type Node} from '@xyflow/svelte';

    export type StemNodeType = Node<
        {
            nid: string;
            input: Record<string, unknown>,
        },
        'node-stem'
    >;
</script>

<script lang="ts">
    import {type NodeProps, useNodeConnections, useSvelteFlow} from "@xyflow/svelte";
    const {updateNodeData} = useSvelteFlow();

    import {docStore} from "sveltefire";
    import {firestore} from "../../firebase";
    import type {FirestoreNodeBluePrintModel} from "$lib/compositor/FirestoreNodeBluePrint";
    import StemNodeComponent from "$lib/components/StemNodeComponent.svelte";
    import {untrack} from "svelte";
    import {projectActions} from "$lib/stores/ProjectState";

    let {id, data, selected}: NodeProps<StemNodeType> = $props();
    let nodeBluePrint = docStore<FirestoreNodeBluePrintModel>(firestore, `nodes/${data.nid}`);

    const connections = useNodeConnections();

    let inputSockets = $state([]);
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
                        documentation: socket.documentation,
                        value: data.input[socketId],
                        isConnected,
                        params: socket.params,
                    });
                } else {
                    newInputSockets.push({
                        label: socket.label,
                        id: socketId,
                        type: socket.type,
                        documentation: socket.documentation,
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
                    newOutputSockets.push({
                        label: socket.label,
                        id: socketId,
                        type: socket.type,
                        documentation: socket.documentation,
                    });
                } else {
                    newOutputSockets.push({
                        label: socket.label,
                        id: socketId,
                        type: socket.type,
                        documentation: socket.documentation,
                    });
                }
            }
            outputSockets = newOutputSockets;
        }
    });

    // ensure data.inputs has all sockets and they at lease have devault value
    $effect(() => {
        const blueprint = $nodeBluePrint;
        if (blueprint?.input_sockets) {
            untrack(() => {
                blueprint.input_socket_order.forEach((socketId) => {
                    if ((data as Record<string, unknown>)[socketId]===undefined) {
                        (data as Record<string, unknown>)[socketId] = blueprint.input_sockets[socketId].params.default_value;
                    }
                });
                console.log(id, data);
            });
        }
    });

</script>

{#if $nodeBluePrint}
    <StemNodeComponent
            title={$nodeBluePrint.title}
            inputSockets={inputSockets}
            bind:inputValues={
                () => data,
                (newData) => {
                    // tell firebase to sync
                    // updateNodeData(id, {input: newData});
                    projectActions.updateNodeData(id, {...data, ...newData})
                }
            }
            outputSockets={outputSockets}
            isSelected={selected}
            tooltip={$nodeBluePrint.documentation}
    ></StemNodeComponent>
{/if}