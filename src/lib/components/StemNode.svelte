<script module lang="ts">
    import {type Node} from '@xyflow/svelte';

    export type StemNodeType = Node<
        {
            nid: string;
            input: Record<string, unknown>,
            output: Record<string, unknown>,
        },
        'node-dna'
    >;
</script>

<script lang="ts">
    import {type NodeProps} from '@xyflow/svelte';
    import {Spinner} from 'flowbite-svelte';
    import {untrack} from 'svelte';
    import {docStore} from 'sveltefire';
    import {firestore} from '../../firebase';
    import SocketStem from '$lib/components/SocketStem.svelte';
    import NodeWrapper from '$lib/components/NodeWrapper.svelte';
    import { getInputComponentForDataType, canDataTypeHaveInput } from '$lib/components/socket-inputs/SocketInputMapping';
    import {
        type FirestoreNodeBluePrintModel
    } from "../../routes/app/lib/FirestoreNodeBluePrint";

    let {id, data}: NodeProps<StemNodeType> = $props();

    let nodeBluePrint = docStore<FirestoreNodeBluePrintModel>(firestore, `nodes/${data.nid}`);

    let nodeState: 'idle' | 'running' | 'success' | 'error' = 'idle';
    let executionTime: number = 0;
    let errorMessage: string = '';
    let isSelected: boolean = false;
    let connectedInputs: Set<string> = new Set();
    let connectedOutputs: Set<string> = new Set();

    // Initialize data.input if it doesn't exist
    $effect(() => {
        if (!data.input) {
            data.input = {};
        }
    });

    // Initialize default values for input sockets
    $effect(() => {
        const blueprint = untrack(() => $nodeBluePrint);
        if (blueprint?.input_sockets) {
            for (const [socketId, socket] of Object.entries(blueprint.input_sockets)) {
                if (data.input[socketId] === undefined && socket.params?.default_value !== undefined) {
                    data.input[socketId] = socket.params.default_value;
                }
            }
        }
    });

    // Function to update input data
    function updateInputData(socketId: string, value: unknown) {
        data.input = { ...data.input, [socketId]: value };
    }


    // $effect(() => {
    //     if (data.input) {
    //         const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    //         const nodeBluePrintSnapshot = untrack(() => $nodeBluePrint);
    //         if (nodeBluePrintSnapshot && nodeBluePrintSnapshot.output_socket_order && nodeBluePrintSnapshot.user_defined_code_snippet) {
    //             const outputCollection: OutputSocketDataCollection = new OutputSocketDataCollection(new Set<string>(nodeBluePrintSnapshot.output_socket_order));
    //             const wrappedFn = new AsyncFunction('inputs', 'outputs', 'utils', nodeBluePrintSnapshot.user_defined_code_snippet) as UserFunction;
    //
    //             const output: Record<string, unknown> = {};
    //
    //             nodeBluePrintSnapshot.output_socket_order.forEach((socket_id: string) => {
    //                 outputCollection.on(socket_id, async (value: unknown) => {
    //                     output[socket_id] = value;
    //                 });
    //             });
    //
    //             wrappedFn(data.input, outputCollection, userFunctionAllowedModules);
    //
    //             outputCollection.waitForAllSocketsSet().then(() => {
    //                 data.output = output;
    //             });
    //         }
    //     }
    // });
</script>

{#if $nodeBluePrint}
    <NodeWrapper
            label={$nodeBluePrint.title}
            documentation={$nodeBluePrint.documentation}
            {nodeState}
            {executionTime}
            {errorMessage}
            {isSelected}
    >
        <!-- Output Sockets -->
        {#if $nodeBluePrint.output_sockets && Object.keys($nodeBluePrint.output_sockets).length > 0}
            <div class="sockets-section">
                {#each Object.entries($nodeBluePrint.output_sockets) as [socket_id, socket_blueprint]}
                    <SocketStem
                            type="source"
                            socket_id={socket_id}
                            label={socket_blueprint.label}
                            socketType={socket_blueprint.type}
                            connected={connectedOutputs.has(socket_id)}
                            tooltip={socket_blueprint.documentation}
                            disabled={nodeState === 'running'}
                            let:socketType={socketType}
                            let:label={label}
                            let:socketStyle={socketStyle}
                    >
                        <div class="socket-content output-content">
                            <span class="socket-label">{label}</span>
                            {#if socketType}
                                <span class="socket-type" style="{socketStyle}">
                                    {socketType}
                                </span>
                            {/if}
                        </div>
                    </SocketStem>
                {/each}
            </div>
        {/if}

        <!-- Input Sockets -->
        {#if $nodeBluePrint.input_sockets && Object.keys($nodeBluePrint.input_sockets).length > 0}
            <div class="sockets-section">
                {#each Object.entries($nodeBluePrint.input_sockets) as [socket_id, socket_blueprint]}
                    <SocketStem
                            type="target"
                            socket_id={socket_id}
                            label={socket_blueprint.label}
                            socketType={socket_blueprint.type}
                            required={false}
                            connected={connectedInputs.has(socket_id)}
                            tooltip={socket_blueprint.documentation}
                            disabled={nodeState === 'running'}
                            let:socketType={socketType}
                            let:label={label}
                            let:isRequired={isRequired}
                            let:socketStyle={socketStyle}>
                        <div class="socket-content input-content">
                            <span class="socket-label" class:required={isRequired}>
                                {label} <small>.{socket_id}</small>
                                {#if isRequired}
                                    <span class="required-indicator">*</span>
                                {/if}
                            </span>
                            {#if socketType}
                                <span class="socket-type" style="{socketStyle}">
                                    {socketType}
                                </span>
                            {/if}
                            
                            <!-- Dynamic input component based on socket type -->
                            {#if canDataTypeHaveInput(socket_blueprint.type) && !connectedInputs.has(socket_id)}
                                {@const inputMapping = getInputComponentForDataType(socket_blueprint.type)}
                                {#if inputMapping}
                                    {@const Component = inputMapping.component}
                                    <div class="socket-input-container">
                                        <Component
                                            bind:value={data.input[socket_id]}
                                            params={socket_blueprint.params}
                                            disabled={nodeState === 'running'}
                                            socketId={socket_id}
                                            label={socket_blueprint.label}
                                            on:change={() => updateInputData(socket_id, data.input[socket_id])}
                                        />
                                    </div>
                                {/if}
                            {/if}
                        </div>
                    </SocketStem>
                {/each}
            </div>
        {/if}
    </NodeWrapper>
{:else}
    <!-- Loading state -->
    <div class="node-container loading">
        <div class="node-card loading-card">
            <div class="loading-content">
                <Spinner size="6"/>
                <span>Loading node...</span>
            </div>
        </div>
    </div>
{/if}

<style>
    .sockets-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .sockets-section:last-child {
        margin-bottom: 0;
    }

    .socket-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .output-content {
        align-items: flex-end;
        text-align: right;
    }

    .input-content {
        align-items: flex-start;
        text-align: left;
    }

    .socket-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #374151;
    }

    .socket-label.required {
        color: #dc2626;
    }

    .socket-label small {
        font-weight: 400;
        color: #6b7280;
        opacity: 0.7;
    }

    .required-indicator {
        color: #dc2626;
        margin-left: 0.125rem;
    }

    .socket-type {
        font-size: 0.625rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .input-content input {
        margin-top: 0.25rem;
        padding: 0.25rem 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        background: white;
    }

    .input-content input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 1px #3b82f6;
    }

    .socket-input-container {
        margin-top: 0.5rem;
        width: 100%;
    }

    .loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 2rem;
        color: #6b7280;
    }

    .node-container.loading {
        opacity: 0.7;
    }

    .loading-card {
        border: 2px dashed #d1d5db;
        background: #f9fafb;
    }
</style>