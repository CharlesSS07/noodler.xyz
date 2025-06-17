<script lang="ts">

    import {Handle, Position} from "@xyflow/svelte";

    export let title = 'Untitled Node';
    export let tooltip = 'a tooltip';
    export let inputs:  {label: string, id: string, type: string, socketStyle?: string, value: unknown, isConnected: boolean}[] = [];
    export let outputs: {label: string, id: string, type: string, socketStyle?: string}[] = [];
    export let nodeState: 'idle' | 'running' | 'success' | 'error' = 'idle';
    export let executionTime = 0;
    export let errorMessage: string | undefined = undefined;
    export let isSelected = false;

    import NodeWrapper from '$lib/components/NodeWrapper.svelte';

    import '$lib/css/nodes.css';

</script>

<div>
    <NodeWrapper
            label={title}
            documentation={tooltip}
            {nodeState}
            {executionTime}
            {errorMessage}
            {isSelected}>

        <div class="flex flex-col">
            {#each outputs as outputSocket}
                <div class="socket-content output-content socket-container">
<!--                    Right here make the text hang to the right side of the socket which is mounted on the right edge of the node. the socket is already properly placed. just position the text proplerly-->
                    <span class="socket-label">{outputSocket.label}</span>
                    {#if outputSocket.type}
                        <span class="socket-type" >
                            {outputSocket.type}
                        </span>
                    {/if}
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="{outputSocket.id}"
                        class="socket-handle {outputSocket.socketStyle || ''}"
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
                        class="socket-handle {inputSocket.socketStyle || ''}"
                    />
                </div>
            {/each}
        </div>
    </NodeWrapper>
</div>