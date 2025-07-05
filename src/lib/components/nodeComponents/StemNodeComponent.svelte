<script lang="ts">

    import type {InputSocketParams} from "$shared/SocketModels";

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
    import {getInputComponentForDataType} from "$lib/components/nodeComponents/sockets/socket-inputs/SocketInputMapping";
    import TargetSocketLabelled from "$lib/components/nodeComponents/sockets/TargetSocketLabelled.svelte";
    import SourceSocketLabelled from "$lib/components/nodeComponents/sockets/SourceSocketLabelled.svelte";
    import {STANDARD_DATATYPES} from "$shared/DataTypes";

</script>


<div>

    <div class="flex flex-col">
        {#each outputSockets as outputSocket}
            <div class="socket-content output-content">
                <SourceSocketLabelled
                        id={outputSocket.id}
                        label={outputSocket.label}
                        datatype={outputSocket.type}
                        documentation={outputSocket.documentation}></SourceSocketLabelled>

            </div>
        {/each}
    </div>

    <div class="flex flex-col">
        {#each inputSockets as inputSocket}
            <div class="socket-content input-content">

                <TargetSocketLabelled
                        id={inputSocket.id}
                        label={inputSocket.label}
                        datatype={inputSocket.type}
                        documentation={inputSocket.documentation}></TargetSocketLabelled>
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