<script module lang="ts">
    import {type Node} from '@xyflow/svelte';
    import {NID} from './lib/NodeModels.js';

    export type StemNodeType = Node<
        {
            nid: NID;
            socketValues: Record<string, unknown>;
        },
        'node-dna'
    >;
</script>

<script lang="ts">
    import {type NodeProps, useNodeConnections, useSvelteFlow} from '@xyflow/svelte';
    import {Spinner} from 'flowbite-svelte';
    import {createEventDispatcher, onMount} from 'svelte';
    import {docStore} from 'sveltefire';
    import {firestore} from '../../firebase';
    import type {NodeBluePrintModel} from './lib/NodeBluePrint.js';
    import type {InputSocketParams} from "./lib/SocketModels";
    import SocketStem from './SocketStem.svelte';
    import NodeWrapper from './NodeWrapper.svelte';

    let {id, data}: NodeProps<StemNodeType> = $props();

    const {updateNodeData} = useSvelteFlow();

    let nodeBluePrint = docStore<NodeBluePrintModel>(firestore, `nodes/${data.nid}`);

    let nodeState: 'idle' | 'running' | 'success' | 'error' = 'idle';
    let executionTime: number = 0;
    let errorMessage: string = '';
    let isSelected: boolean = false;
    let connectedInputs: Set<string> = new Set();
    let connectedOutputs: Set<string> = new Set();

    const html_input_types = [
        "button",
        "checkbox",
        "color",
        "date",
        "datetime-local",
        "email",
        "file",
        "hidden",
        "image",
        "month",
        "number",
        "password",
        "radio",
        "range",
        "reset",
        "search",
        "submit",
        "tel",
        "text",
        "time",
        "url",
        "week"
    ];

    const otherCompatibleDatatypes = new Map<string, string>(Object.entries({
        'string': 'text',
    }));

    function datatypeIsInputTypeCompatible(datatype: string): boolean {
        const datatypeLowercase = datatype.toLowerCase();
        if (html_input_types.indexOf(datatypeLowercase) !== -1 || otherCompatibleDatatypes.has(datatypeLowercase)) {
            return true;
        }
        return false;
    }

    function convertDatatypeToInputType(datatype: string): string {
        const datatypeLowercase = datatype.toLowerCase();

        if (html_input_types.indexOf(datatypeLowercase) !== -1) {
            return datatypeLowercase;
        }

        if (otherCompatibleDatatypes.has(datatypeLowercase)) {
            return otherCompatibleDatatypes.get(datatypeLowercase) || 'text';
        }

        throw new Error("Unknown datatype");
    }

    function ensureSocketDataDefined(socket_id: string, params: InputSocketParams) {
        if (!data.socketValues[socket_id]) {
            data.socketValues[socket_id] = params.default_value;
        }
    }
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
                    {ensureSocketDataDefined(socket_id, socket_blueprint.params)}
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
                            let:socketStyle={socketStyle}
                    >
                        {#if datatypeIsInputTypeCompatible(socketType)}
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
                                <input
                                        type="{convertDatatypeToInputType(socketType)}"
                                        bind:value={data.socketValues[socket_id]}
                                >
                            </div>
                        {:else}
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
                            </div>
                        {/if}
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