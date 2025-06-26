<script lang="ts">

    import {Handle, Position} from "@xyflow/svelte";

    interface Props {
        inputSockets?: {
            label: string,
            id: string,
            type: string,
            documentation: string,
            isConnected: boolean,
            params: InputSocketParams
        }[];
        inputValues?: Record<string, unknown>;
        outputSockets?: { label: string, id: string, type: string, documentation: string }[];
    }

    let {
        inputSockets = [],
        inputValues = $bindable({}),
        outputSockets = [],
    }: Props = $props();

    import '$lib/css/nodes.css';
    import {STANDARD_DATATYPES} from "$lib/compositor/DataTypes";
    import {getInputComponentForDataType} from "$lib/components/sockets/socket-inputs/SocketInputMapping";
    import type {InputSocketParams} from "$lib/compositor/SocketModels";
    import TargetSocket from "$lib/components/sockets/TargetSocket.svelte";
    import SourceSocket from "$lib/components/sockets/SourceSocket.svelte";

</script>


<div>

    <div class="flex flex-col">
        {#each outputSockets as outputSocket}
            <div class="socket-content output-content">
                <SourceSocket id={outputSocket.id} label={outputSocket.label} type={outputSocket.type}
                              documentation={outputSocket.documentation}></SourceSocket>

            </div>
        {/each}
    </div>

    <div class="flex flex-col">
        {#each inputSockets as inputSocket}
            <div class="socket-content input-content">

                <TargetSocket id={inputSocket.id} label={inputSocket.label} type={inputSocket.type}
                              documentation={inputSocket.documentation}></TargetSocket>
                {#if !inputSocket.isConnected && inputSocket.type !== STANDARD_DATATYPES.UNKNOWN && inputSocket.type !== STANDARD_DATATYPES.UNREGISTER}
                    {@const inputMapping = getInputComponentForDataType(inputSocket.type)}
                    {#if inputMapping && inputValues[inputSocket.id] !== undefined}
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
                                    socketId={inputSocket.id}
                                    {...{...(inputSocket.options || {}), params: inputSocket.params}}
                            />
                            <!--{JSON.stringify(inputSocket.params, null, 2)}-->
                        </div>
                    {/if}
                {/if}
            </div>
        {/each}
    </div>

</div>