<script lang="ts">
    import {type NodeProps} from '@xyflow/svelte';
    import {createNodeStore, type NodeStoreType} from '$lib/components/nodes/NodeInstanceStore';
    import {STANDARD_DATATYPES} from "$shared/DataTypes";
    import NodeWrapper from "$lib/components/nodeComponents/NodeWrapper.svelte";
    import SourceSocket from "$lib/components/nodeComponents/sockets/SourceSocket.svelte";
    import TargetSocket from "$lib/components/nodeComponents/sockets/TargetSocket.svelte";
    import NodeErrorDisplay from "$lib/components/nodeComponents/NodeErrorDisplay.svelte";

    let {id, selected}: NodeProps<NodeStoreType> = $props();

    const nodeStore = createNodeStore(id);
    const inputTextSocket = nodeStore.inputSocketStore('inputText');
    let executionStatus = nodeStore.executionStatus;

    let textarea: HTMLTextAreaElement;

    $effect(() => {
        $inputTextSocket.value;
        if (textarea) autoResize(textarea);
    });

    function handleInput(value: string) {
        console.log(value)
        // nodeStore.updateData({input: {inputText: value}});
        $inputTextSocket.update(value);
        if (textarea) autoResize(textarea);
    }

    function autoResize(textarea: HTMLTextAreaElement) {
        textarea.style.width = 'auto';
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

</script>

<NodeWrapper label="Raw Text" isSelected={selected} executionStatus={$executionStatus}>
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
            {#if $inputTextSocket.isConnected}
                <textarea
                        bind:this={textarea}
                        value={$inputTextSocket.value}
                        class="w-fit p-3 border-0 outline-none font-mono text-sm resize-none overflow-hidden"
                        placeholder='No data supplied by link.'
                        disabled
                        onchange={(e) => autoResize(e.target)}></textarea>
            {:else }
                <textarea
                        bind:this={textarea}
                        value={$inputTextSocket.value}
                        class="w-fit p-3 border-0 outline-none font-mono text-sm resize-none overflow-hidden"
                        placeholder='Enter plain text...'
                        oninput={(e) => handleInput(e.target.value)}></textarea>
            {/if}
        </div>

        {#if $executionStatus}
            <NodeErrorDisplay errorMessage={$executionStatus.logs.map((log) => log[1]).join('<br>')}></NodeErrorDisplay>
        {/if}

    </div>
</NodeWrapper>

<style>
    textarea::placeholder {
        color: #9ca3af;
        font-style: italic;
    }
</style>