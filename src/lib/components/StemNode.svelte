<script module lang="ts">
    import {type Node} from '@xyflow/svelte';

    export type StemNodeType = Node<
        {
            nid: string;
            input: Record<string, unknown>,
            errorMessage: string
        },
        'node-stem'
    >;
</script>

<script lang="ts">
    import {type NodeProps, useNodeConnections, useSvelteFlow} from "@xyflow/svelte";
    let {updateNodeData} = useSvelteFlow();


    import {docStore} from "sveltefire";
    import {firestore} from "../../firebase";
    import type {FirestoreNodeBluePrintModel} from "$lib/compositor/FirestoreNodeBluePrint";
    import StemNodeComponent from "$lib/components/StemNodeComponent.svelte";
    import {untrack} from "svelte";
    import {projectActions, projectOutputDataCache} from "$lib/stores/ProjectState";

    let {id, data, selected}: NodeProps<StemNodeType> = $props();
    let nodeBluePrint = docStore<FirestoreNodeBluePrintModel>(firestore, `nodes/${data.nid}`);

    // const connections = useNodeConnections();
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
                if (data.input===undefined) {
                    data.input = {};
                }
                blueprint.input_socket_order.forEach((socketId) => {
                    if (data.input[socketId]===undefined) {
                        data.input[socketId] = blueprint.input_sockets[socketId].params.default_value;
                    }
                });
                console.log(id, data);
            });
        }
    });

    // show the error when an error happens on node execution
    // let error = $state('');
    let nid = $state(data.nid);
    let input = $state.raw(data.input || {});
    let errorMessage = $state(data.errorMessage || '');

    $effect(() => {
        // nid does not change
        console.log(`data changed for ${id}`, data);
        if (data.errorMessage) {
            errorMessage = data.errorMessage;
        }
        if (data.input) {
            input = data.input;
        }
    });

    $effect(() => {
        console.log(`error changed for ${id}:`, errorMessage);
    });

    $effect(() => {
        const unsubscribeSocket = projectOutputDataCache.useSocketStore(
            id,
            '__error__'
        ).subscribe((socketData) => {
            untrack(() => {
                if (socketData) {
                    console.log('displaying error', "error:"+socketData as string, JSON.stringify(socketData, null, 2), typeof socketData, socketData instanceof Error);
                    updateNodeData(id, {errorMessage: ''+socketData as string});
                    // projectActions.updateNodeData(id, {errorMessage: socketData as string});
                    // data.error = socketData as string;
                    // projectActions.updateNodeData(id, data);
                    // projectActions.updateNodeData(id, { errorMessage: socketData as string });
                    // projectActions.updateNodeData(id, { ...data, errorMessage: socketData as string });
                }
            });
        });
        return unsubscribeSocket;
    });

</script>

{#if $nodeBluePrint}
    <StemNodeComponent
            title={$nodeBluePrint.title}
            inputSockets={inputSockets}
            bind:inputValues={
                () => data.input,
                (newData) => {
                    // tell firebase to sync
                    // updateNodeData(id, {input: newData});
                    projectActions.updateNodeData(id, {...data, input: {...data.input, ...newData}})
                }
            }
            outputSockets={outputSockets}
            isSelected={selected}
            tooltip={$nodeBluePrint.documentation}
            errorMessage={errorMessage}
    ></StemNodeComponent>
{/if}