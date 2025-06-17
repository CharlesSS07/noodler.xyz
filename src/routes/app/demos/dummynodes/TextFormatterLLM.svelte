<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    export type MagicTextTransformNodeType = Node<
        {
            input: {text: string}
            transformPrompt: string;
            output: {text: string};
        },
        'node-text-transform-llm'
    >;
</script>

<script lang="ts">
    import NodeWrapper from "$lib/components/NodeWrapper.svelte";
    import {Handle, type NodeProps, Position} from "@xyflow/svelte";
    import {fetchSocketDataTypeByName} from "../../lib/DataTypes";
    import SocketStem from "$lib/components/SocketStem.svelte";

    let { id, data }: NodeProps<MagicTextTransformNodeType> = $props();

    // Initialize data structure if needed
    $effect(() => {
        if (!data.input) data.input = {text: ''};
        if (!data.output) data.output = {text: ''};
        if (!data.transformPrompt) data.transformPrompt = '';
        if (!data.nid) data.nid = 'demo_text_formatter_llm';
    });

    let inputSocketStyle = $state('');
    let outputSocketStyle = $state('');
    fetchSocketDataTypeByName('string').then((datatype) => {
        inputSocketStyle = datatype?.style || '';
    });
    fetchSocketDataTypeByName('string').then((datatype) => {
        outputSocketStyle = datatype?.style || '';
    });
</script>

<NodeWrapper label="Text Formatter LLM" documentation="Format text according to natural-language-based rules." >

    <SocketStem
            type="source"
            socket_id='formatted_text'
            label="Formatted Text"
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
            socket_id='messy_text'
            label="Messy Text"
            socketType="text"
            required={false}
            connected={false}
            tooltip="Messy Text to be formatted"
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
    <textarea bind:value={data.transformPrompt} placeholder="Extract proper nouns. Return in list." rows="3"></textarea>
</NodeWrapper>