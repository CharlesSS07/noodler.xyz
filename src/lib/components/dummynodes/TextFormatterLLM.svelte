<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    export type MagicTextTransformNodeType = Node<
        {
            nid:string;
            input: {text: string}
            transformPrompt: string;
            output: {text: string};
        },
        'node-text-transform-llm'
    >;
</script>

<script lang="ts">
    import NodeWrapper from "$lib/components/nodeComponents/NodeWrapper.svelte";
    import {Handle, type NodeProps, Position} from "@xyflow/svelte";
    import {fetchSocketDataTypeByName, STANDARD_DATATYPES} from "$shared/DataTypes";
    import {Tooltip} from "flowbite-svelte";

    let { id, data, selected }: NodeProps<MagicTextTransformNodeType> = $props();

    // Initialize data structure if needed
    $effect(() => {
        if (!data.input) data.input = {text: ''};
        if (!data.output) data.output = {text: ''};
        if (!data.transformPrompt) data.transformPrompt = '';
        if (!data.nid) data.nid = 'demo_text_formatter_llm';
    });
</script>

<NodeWrapper label="Text Formatter LLM" documentation="Format text according to natural-language-based rules." isSelected={selected}>
    <div class="relative">
        <!-- Input Socket -->
        {#await fetchSocketDataTypeByName(STANDARD_DATATYPES.TEXT)}
            Loading Input Socket
        {:then datatype}
            <Handle
                    type="target"
                    position={Position.Left}
                    id="messy_text"
                    class="socket-handle"
                    style="top: 30%;{datatype?.style || ''}"
            />
            <Tooltip placement="top">
                <b>Messy Text</b> - Text to be formatted<br>
                <b>Type ({datatype?.name}):</b> {datatype?.description}
            </Tooltip>
        {:catch error}
            Error loading input socket: {JSON.stringify(error, null, 2)}
        {/await}

        <!-- Output Socket -->
        {#await fetchSocketDataTypeByName(STANDARD_DATATYPES.TEXT)}
            Loading Output Socket
        {:then datatype}
            <Handle
                    type="source"
                    position={Position.Right}
                    id="formatted_text"
                    class="socket-handle"
                    style="top: 30%;{datatype?.style || ''}"
            />
            <Tooltip placement="top">
                <b>Formatted Text</b> - Formatted text output<br>
                <b>Type ({datatype?.name}):</b> {datatype?.description}
            </Tooltip>
        {:catch error}
            Error loading output socket: {JSON.stringify(error, null, 2)}
        {/await}

        <!-- Node Content -->
        <div class="p-3">
            <h3 class="text-sm font-semibold mb-2">Text Formatting Guidelines</h3>
            <textarea 
                bind:value={data.transformPrompt} 
                placeholder="Extract proper nouns. Return in list." 
                rows="3"
                class="w-full p-2 border border-gray-300 rounded text-sm resize-none"
            ></textarea>
        </div>
    </div>
</NodeWrapper>