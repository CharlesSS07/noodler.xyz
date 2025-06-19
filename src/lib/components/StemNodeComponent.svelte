<script lang="ts">

    import {Handle, Position} from "@xyflow/svelte";

    interface Props {
        title?: string;
        tooltip?: string;
        inputSockets?: {label: string, id: string, type: string, documentation: string, isConnected: boolean, params: InputSocketParams}[];
        inputValues?: Record<string, unknown>;
        outputSockets?: {label: string, id: string, type: string, documentation: string}[];
        executionTime?: number;
        errorMessage?: string | undefined;
        isSelected?: boolean;
    }

    let {
        title = 'Untitled Node',
        tooltip = 'a tooltip',
        inputSockets = [],
        inputValues = $bindable({}),
        outputSockets = [],
        executionTime = 0,
        errorMessage = undefined,
        isSelected = false
    }: Props = $props();

    import NodeWrapper from '$lib/components/NodeWrapper.svelte';

    import '$lib/css/nodes.css';
    import {fetchSocketDataTypeByName} from "$lib/compositor/DataTypes";
    import {getInputComponentForDataType} from "$lib/components/socket-inputs/SocketInputMapping";
    import type {InputSocketParams} from "$lib/compositor/SocketModels";
    import {Tooltip} from "flowbite-svelte";

</script>


<div>
    <NodeWrapper
            label={title}
            documentation={tooltip}
            {executionTime}
            {isSelected}>

        <div class="flex flex-col">
            {#each outputSockets as outputSocket}
                <div class="socket-content output-content socket-container">
                    <div class="output-text-container">
                        <span class="socket-label">{outputSocket.label}</span>
                        {#if outputSocket.type}
                            <span class="socket-type" >
                                {outputSocket.type}
                            </span>
                        {/if}
                    </div>
                    {#await fetchSocketDataTypeByName(outputSocket.type)}
                        Loading Socket
                    {:then datatype}
                        <Handle
                                type="source"
                                position={Position.Right}
                                id={outputSocket.id}
                                style={datatype?.style || ''}
                                class="socket-handle"
                        />
                        <Tooltip placement="top">
                            <b>{outputSocket.label}</b>--{outputSocket.documentation}<br>
                            <b>Type ({datatype?.name}):</b> {datatype?.description}
                        </Tooltip>
                    {:catch error}
                        Error; could not load input socket: {JSON.stringify(error, null, 2)}
                    {/await}
                </div>
            {/each}
        </div>

        <div class="flex flex-col">
            {#each inputSockets as inputSocket}
                <div class="socket-content input-content socket-container">
                    <div class="flex flex-col">
                        <span class="socket-label">{inputSocket.label}</span>
                        {#if inputSocket.type}
                            <span class="socket-type" >
                                Type: {inputSocket.type}
                            </span>
                        {/if}
                    </div>

                    {#await fetchSocketDataTypeByName(inputSocket.type)}
                        Loading Socket
                    {:then datatype}
                        <Handle
                                type="target"
                                position={Position.Left}
                                id={inputSocket.id}
                                class="socket-handle"
                                style={datatype?.style || ''}
                                isConnectable={!inputSocket.isConnected}
                        />
                        <Tooltip placement="top">
                            <b>{inputSocket.label}</b>--{inputSocket.documentation}<br>
                            <b>Type ({datatype?.name}):</b> {datatype?.description}
                        </Tooltip>
                    {:catch error}
                        Error; could not load input socket: {JSON.stringify(error, null, 2)}
                    {/await}
                    {#if !inputSocket.isConnected && inputSocket.type !== "unknown" && inputSocket.type !== "unregistered"}
                        {@const inputMapping = getInputComponentForDataType(inputSocket.type)}
                        {#if inputMapping && inputValues[inputSocket.id]!==undefined}
                            {@const Component = inputMapping.component}
                            <div class="socket-input-container">
                                <Component
                                    bind:value={
                                        () => {
                                            return inputValues[inputSocket.id];
                                        },
                                        (newValue) => {
                                            inputValues[inputSocket.id] = newValue;
                                            inputValues = inputValues; // reactive update
                                        }
                                    }
                                    {...{...(inputSocket.options || {}), params: inputSocket.params}}
                                />
                                <!--{JSON.stringify(inputSocket.params, null, 2)}-->
                            </div>
                        {/if}
                    {/if}
                </div>
            {/each}
        </div>

    </NodeWrapper>
</div>