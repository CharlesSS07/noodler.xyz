<script lang="ts">

    import {Handle, Position} from "@xyflow/svelte";

    interface Props {
        title?: string;
        tooltip?: string;
        inputs?: {label: string, id: string, type: string, value: unknown, isConnected: boolean}[];
        outputs?: {label: string, id: string, type: string}[];
        executionTime?: number;
        errorMessage?: string | undefined;
        isSelected?: boolean;
    }

    let {
        title = 'Untitled Node',
        tooltip = 'a tooltip',
        inputs = [],
        outputs = [],
        executionTime = 0,
        errorMessage = undefined,
        isSelected = false
    }: Props = $props();

    import NodeWrapper from '$lib/components/NodeWrapper.svelte';

    import '$lib/css/nodes.css';
    import {fetchSocketDataTypeByName, type SocketDataType} from "../../routes/app/lib/DataTypes";

    let inputDataTypes = $state(new Map<string, SocketDataType>());
    let outputDataTypes = $state(new Map<string, SocketDataType>());

    $effect(() => {
        inputs.forEach((inputSocket) => {
            fetchSocketDataTypeByName(inputSocket.type).then((datatype) => {
                console.log(datatype)
                if (datatype) {
                    inputDataTypes.set(inputSocket.id, datatype);
                    inputDataTypes = new Map(inputDataTypes); // Trigger reactivity
                }
            });
        });
    });

    $effect(() => {
        outputs.forEach((outputSocket) => {
            fetchSocketDataTypeByName(outputSocket.type).then((datatype) => {
                if (datatype) {
                    outputDataTypes.set(outputSocket.id, datatype);
                    outputDataTypes = new Map(outputDataTypes); // Trigger reactivity
                }
            });
        });
    });

</script>


<div>
    <NodeWrapper
            label={title}
            documentation={tooltip}
            {executionTime}
            {isSelected}>

        <div class="flex flex-col">
            {#each outputs as outputSocket}
                <div class="socket-content output-content socket-container">
                    <div class="output-text-container">
                        <span class="socket-label">{outputSocket.label}</span>
                        {#if outputSocket.type}
                            <span class="socket-type" >
                                {outputSocket.type}
                            </span>
                        {/if}
                    </div>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="{outputSocket.id}"
                        style={outputDataTypes.get(outputSocket.id)?.style || ''}
                        class="socket-handle"
                    />
                </div>
            {/each}
        </div>

        <div class="flex flex-col">
            {#each inputs as inputSocket}
                <div class="socket-content input-content socket-container">
                    <div class="flex flex-col">
                        <span class="socket-label">{inputSocket.label}</span>
                        {#if inputSocket.type}
                            <span class="socket-type" >
                                Type: {inputSocket.type}
                            </span>
                        {/if}
                    </div>
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="{inputSocket.id}"
                        class="socket-handle"
                        style={inputDataTypes.get(inputSocket.id)?.style || ''}
                        isConnectable={!inputSocket.isConnected}
                    />
                </div>
            {/each}
        </div>

    </NodeWrapper>
</div>