<script module lang="ts">
    import type {Node} from '@xyflow/svelte';

    // Official NID for this node: node_official_raw_text_editor
    export type PlainTextNodeType = Node<
        {
            input: { inputText: string };
            nid?: string; // Should be set to 'node_official_raw_text_editor' when using official blueprint
        },
        'node-raw-text-editor'
    >;
</script>

<script lang="ts">
    import {type NodeProps} from '@xyflow/svelte';
    import {createNodeStore} from '$lib/components/nodes/NodeInstanceStore';
    import {STANDARD_DATATYPES} from "$lib/compositor/DataTypes";
    import NodeWrapper from "$lib/components/nodeComponents/NodeWrapper.svelte";
    import SourceSocket from "$lib/components/nodeComponents/sockets/SourceSocket.svelte";
    import TargetSocket from "$lib/components/nodeComponents/sockets/TargetSocket.svelte";
    import {get} from "svelte/store";
    import NodeErrorDisplay from "$lib/components/nodeComponents/NodeErrorDisplay.svelte";

    let {id, selected}: NodeProps<PlainTextNodeType> = $props();

    const nodeStore = createNodeStore(id);
    const inputSocketData = nodeStore.inputSocketStore('inputText');
    const hasInputConnected = $derived(get(nodeStore.inputConnections).current.length>0);
    const executionTime = $derived(get(nodeStore.executionTime));

    function getDisplayValue(socketData) {
        if (socketData) {
            if (typeof socketData === 'string') {
                return socketData;
            }
            return "<JSON>: "+JSON.stringify(socketData);
        }
        return "EMPTY!";
    }

    let displayValue = $derived(getDisplayValue($inputSocketData));

    let inputText = $derived.by(() => nodeStore.nodeData.current?.data?.input?.inputText || '');
    let textarea: HTMLTextAreaElement;

    $effect(() => {
        if (textarea) autoResize(textarea);
    });
    $effect(() => {
        if (textarea && displayValue) autoResize(textarea);
    });



    function handleInput(value: string) {
        console.log(textarea, value)
        if (textarea) autoResize(textarea);
        nodeStore.updateData({input: {inputText: value}});
    }

    function autoResize(textarea: HTMLTextAreaElement) {
        textarea.style.width = 'auto';
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

</script>

<NodeWrapper label="Raw Text" isSelected={selected} executionTime={executionTime}>
    <div class="relative">
        <!-- Main textarea -->
        <SourceSocket
                id="outputText"
                label="Output Text"
                datatype={STANDARD_DATATYPES.TEXT}
                documentation="Text output from the raw text editor"
        />

        <TargetSocket
            id="inputText"
            label="Input Text"
            datatype={STANDARD_DATATYPES.TEXT}
            documentation="Text input for the raw text editor"
        />

        <div class="border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
            {#if hasInputConnected}
                <textarea
                        bind:this={textarea}
                        value={displayValue}
                        class="w-fit p-3 border-0 outline-none font-mono text-sm resize-none overflow-hidden"
                        placeholder='No data supplied by link.'
                        disabled
                        onchange={(e) => autoResize(e.target)}></textarea>
            {:else }
                <textarea
                        bind:this={textarea}
                        value={inputText}
                        class="w-fit p-3 border-0 outline-none font-mono text-sm resize-none overflow-hidden"
                        placeholder='Enter plain text...'
                        oninput={(e) => handleInput(e.target.value)}></textarea>
            {/if}
        </div>

        <NodeErrorDisplay {id}></NodeErrorDisplay>


    </div>
</NodeWrapper>

<style>
    textarea::placeholder {
        color: #9ca3af;
        font-style: italic;
    }
</style>