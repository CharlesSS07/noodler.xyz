<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    export type CompleteTextNodeType = Node<
        {
            input: {text: string, modelId: string, maxTokens: number},
            output: {text: string}
        },
        'node-text-complete-llm'
    >;
</script>

<script lang="ts">
    import NodeWrapper from "../../NodeWrapper.svelte";
    import {Handle, type NodeProps, Position} from "@xyflow/svelte";
    import {getSocketDataTypeByName} from "../../lib/DataTypes";
    import SocketStem from "../../SocketStem.svelte";

    let { id, data }: NodeProps<CompleteTextNodeType> = $props();


</script>

<NodeWrapper label="Text Complete LLM" documentation="Format text according to natural-language-based rules." >

    <SocketStem
            type="source"
            socket_id='complete_text'
            label="Complete Text"
            socketType="text"
            required={false}
            connected={false}
            tooltip="Formatted text, equivalent to messy text"
            disabled={false}
            let:socketType={socketType}
            let:label={label}
            let:isRequired={isRequired}
            let:socketStyle={socketStyle}
    >
        <div class="socket-content input-content">
                            <span class="socket-label" class:required={isRequired}>
                                {label}
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
    </SocketStem>

    <SocketStem
            type="target"
            socket_id='text'
            label="Incomplete Text"
            socketType="text"
            required={false}
            connected={false}
            tooltip="Text to be completed"
            disabled={false}
            let:socketType={socketType}
            let:label={label}
            let:isRequired={isRequired}
            let:socketStyle={socketStyle}
    >
        <div class="socket-content input-content">
                            <span class="socket-label" class:required={isRequired}>
                                {label}
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
    </SocketStem>

    <SocketStem
            type="target"
            socket_id='model'
            label="HF Model ID"
            socketType="text"
            required={false}
            connected={false}
            tooltip="Huggingface model to use"
            disabled={false}
            let:socketType={socketType}
            let:label={label}
            let:isRequired={isRequired}
            let:socketStyle={socketStyle}
    >
        <div class="socket-content input-content">
                            <span class="socket-label" class:required={isRequired}>
                                {label}
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
    </SocketStem>
    <h2>Text Formatting Prompt/Guidlines</h2>
</NodeWrapper>