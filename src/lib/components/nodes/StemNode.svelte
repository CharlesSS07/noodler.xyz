<script lang="ts">
    import {type NodeProps} from "@xyflow/svelte";
    import StemNodeComponent from "$lib/components/nodeComponents/StemNodeComponent.svelte";
    import NodeErrorDisplay from "$lib/components/nodeComponents/NodeErrorDisplay.svelte";
    import NodeWrapper from "$lib/components/nodeComponents/NodeWrapper.svelte";
    import {createNodeStore, InputSocketState, type NodeStoreType} from "$lib/components/nodes/NodeInstanceStore";

    let {id, selected}: NodeProps<NodeStoreType> = $props();
    let nodeStore = createNodeStore(id);
    let nodeBluePrint = nodeStore.nodeBluePrint;
    let nodeInputDataStore = nodeStore.nodeInputDataStore;
    let executionStatus = nodeStore.executionStatus;

    let allInputSocketStates = nodeStore.allInputSocketsStore();

    let inputSocketStates = $derived.by<Map<string, InputSocketState>>(() => {
        if ($nodeBluePrint) {
            return new Map($nodeBluePrint.input_socket_order.map((socketId: string) => [socketId, $allInputSocketStates.get(socketId)]));
        }
        return new Map();
    });

    let inputSockets = $derived.by(() => {
        if ($nodeBluePrint) {
            return $nodeBluePrint.input_socket_order.map((socketId: string, idx: number) => {
                const socketBluePrint = $nodeBluePrint.input_sockets[socketId];
                const socket = inputSocketStates.get(socketId);
                return {
                    label: socketBluePrint.label,
                    id: socketId,
                    type: socketBluePrint.type,
                    documentation: socketBluePrint.documentation,
                    isConnected: socket?.isConnected ?? true,
                    params: socketBluePrint.params,
                };
            })
        }
        return [];
    });

    let outputSockets = $derived.by(() => {
        if ($nodeBluePrint) {
            return $nodeBluePrint.output_socket_order.map((socketId: string, idx: number) => {
                const socketBluePrint = $nodeBluePrint.output_sockets[socketId];
                return {
                    label: socketBluePrint.label,
                    id: socketId,
                    type: socketBluePrint.type,
                    documentation: socketBluePrint.documentation,
                };
            })
        }
        return [];
    });

</script>

{#if $nodeBluePrint}

    <!--{JSON.stringify($inputConnections, null, 2)}-->
    <NodeWrapper
            label={$nodeBluePrint.title}
            documentation={$nodeBluePrint.documentation}
            isSelected={selected}
            executionStatus={$executionStatus}>
        <StemNodeComponent
                inputSockets={inputSockets}
                bind:inputValues={
                    () => $nodeInputDataStore,
                    (newData) => {
                        nodeStore.updateData({input: newData});
                    }
                }
                outputSockets={outputSockets}
        ></StemNodeComponent>

        {#if $executionStatus}
            <NodeErrorDisplay 
                errorMessage={$executionStatus.logs.map((log) => log[1]).join('\n')}
                nodeBlueprint={$nodeBluePrint}
                nodeInputData={$nodeInputDataStore}
            ></NodeErrorDisplay>
        {/if}
    </NodeWrapper>

{/if}