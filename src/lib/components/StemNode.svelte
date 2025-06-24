<script module lang="ts">
    import {type Node} from '@xyflow/svelte';

    export type StemNodeType = Node<
        {
            nid: string;
            input: Record<string, unknown>,
            errorMessage: string;
            status: string;
        },
        'node-stem'
    >;
</script>

<script lang="ts">
    import {type NodeProps, useNodeConnections, useSvelteFlow} from "@xyflow/svelte";

    import {docStore} from "sveltefire";
    import {firestore} from "../../firebase";
    import type {FirestoreNodeBluePrintModel} from "$lib/compositor/nodes/firestore/FirestoreNodeBluePrint";
    import StemNodeComponent from "$lib/components/StemNodeComponent.svelte";
    import {untrack} from "svelte";
    import NodeErrorDisplay from "$lib/components/nodeComponents/NodeErrorDisplay.svelte";
    import NodeWrapper from "$lib/components/nodeComponents/NodeWrapper.svelte";

    let {id, data, selected}: NodeProps<StemNodeType> = $props();
    let nodeBluePrint = docStore<FirestoreNodeBluePrintModel>(firestore, `nodes/${data.nid}`);

    if (!data.errorMessage)
        data.errorMessage = '';

    const inputConnections = useNodeConnections({id, handleType: 'target'});

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
                for (const connection of inputConnections.current) {
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

    // ensure data.inputs has all sockets and they at least has default values
    $effect(() => {
        const blueprint = $nodeBluePrint;
        if (blueprint?.input_sockets) {
            untrack(() => {
                if (data.input === undefined) {
                    data.input = {};
                }
                blueprint.input_socket_order.forEach((socketId) => {
                    if (data.input[socketId] === undefined) {
                        data.input[socketId] = blueprint.input_sockets[socketId].params.default_value;
                    }
                });
                console.log(id, data);
            });
        }
    });


    let errorMessage: string = $state('');
    $effect(() => {
        console.log('errorMessage', errorMessage)
        if (errorMessage !== undefined && errorMessage !== null) {
            data.errorMessage = errorMessage;
        }
    })

</script>

{#if $nodeBluePrint}

    <NodeWrapper
            label={$nodeBluePrint.title}
            documentation={$nodeBluePrint.documentation}
            executionTime={0}
            isSelected={selected}>
        <StemNodeComponent
                inputSockets={inputSockets}
                bind:inputValues={
                    () => data.input,
                    (newData) => {
                        // tell firebase to sync
                        // updateNodeData(id, {input: newData});
                        // projectActions.updateNodeData(id, {...data, input: {...data.input, ...newData}})
                        data.input = {...data.input, ...newData};
                    }
                }
                outputSockets={outputSockets}
        ></StemNodeComponent>
        <NodeErrorDisplay {id} bind:errorMessage={errorMessage}></NodeErrorDisplay>

    </NodeWrapper>
{/if}