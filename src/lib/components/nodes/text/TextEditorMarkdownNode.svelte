<script lang="ts">
    import {type NodeProps} from '@xyflow/svelte';
    import {createNodeStore, type NodeStoreType} from '$lib/components/nodes/NodeInstanceStore';
    import {STANDARD_DATATYPES} from "$shared/SocketDataTypes";
    import NodeWrapper from "$lib/components/nodeComponents/NodeWrapper.svelte";
    import SourceSocket from "$lib/components/nodeComponents/sockets/SourceSocket.svelte";
    import TargetSocket from "$lib/components/nodeComponents/sockets/TargetSocket.svelte";
    import NodeErrorDisplay from "$lib/components/nodeComponents/NodeErrorDisplay.svelte";
    import {Button} from "flowbite-svelte";
    import {Copy, Check} from 'lucide-svelte';
    import {marked} from 'marked';

    let {id, selected}: NodeProps<NodeStoreType> = $props();

    const nodeStore = createNodeStore(id);
    const textSocket = nodeStore.inputSocketStore('text');
    let executionStatus = nodeStore.executionStatus;

    let textarea: HTMLTextAreaElement;
    let isEditing = $state(false);
    let copySuccess = $state(false);

    $effect(() => {
        $textSocket.value;
        if (textarea) autoResize(textarea);
    });

    function handleInput(value: string) {
        $textSocket.update(value);
        if (textarea) autoResize(textarea);
    }

    function autoResize(textarea: HTMLTextAreaElement) {
        textarea.style.width = 'auto';
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    function startEditing() {
        if (!$textSocket.isConnected) {
            isEditing = true;
        }
    }

    function stopEditing() {
        isEditing = false;
    }

    async function copyToClipboard(): Promise<void> {
        try {
            const value = typeof $textSocket.value === 'string' ? $textSocket.value : JSON.stringify($textSocket.value, null, 2);
            await navigator.clipboard.writeText(value);
            copySuccess = true;
            setTimeout(() => {
                copySuccess = false;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

</script>

<NodeWrapper label="Markdown Text" isSelected={selected} executionStatus={$executionStatus}>
    <div class="relative">
        <!-- Sockets -->
        <SourceSocket
            id="text"
            label="Output Text"
            datatype={STANDARD_DATATYPES.TEXT}
            documentation="Markdown text output"
        />

        <TargetSocket
            id="text"
            label="Input Text"
            datatype={STANDARD_DATATYPES.TEXT}
            documentation="Markdown text input"
        />

        <!-- Main content area -->
        <div class="border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
            {#if $textSocket.isConnected}
                <!-- Connected input - show markdown rendered display value -->
                <div class="relative group">
                    <div class="w-fit p-3 prose max-w-none text-sm">
                        {@html marked.parse(typeof $textSocket.value === 'string' ? $textSocket.value : 'No data supplied by link.')}
                    </div>
                    <!-- Copy button - only visible when connected and has content -->
                    {#if $textSocket.value}
                        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                size="xs"
                                color="light"
                                outline
                                onclick={copyToClipboard}
                                title="Copy content to clipboard"
                                class="shadow-sm"
                            >
                                {#if copySuccess}
                                    <Check size={12} />
                                {:else}
                                    <Copy size={12} />
                                {/if}
                            </Button>
                        </div>
                    {/if}
                </div>
            {:else if isEditing}
                <!-- Editing mode - show textarea -->
                <textarea
                    bind:this={textarea}
                    value={$textSocket.value}
                    class="w-fit p-3 border-0 outline-none font-mono text-sm resize-none overflow-hidden"
                    placeholder='Enter markdown text...'
                    oninput={(e) => handleInput(e.target.value)}
                    onblur={stopEditing}
                    onfocusout={stopEditing}
                ></textarea>
            {:else}
                <!-- Display mode - show rendered markdown -->
                <div class="relative group">
                    <div 
                        class="w-fit p-3 prose max-w-none text-sm cursor-pointer"
                        onclick={startEditing}
                        onkeypress={startEditing}
                    >
                        {@html marked.parse(typeof $textSocket.value === 'string' ? $textSocket.value : 'Click to enter markdown...')}
                    </div>
                    <!-- Copy button - only visible when there's content -->
                    {#if $textSocket.value}
                        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                size="xs"
                                color="light"
                                outline
                                onclick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard();
                                }}
                                title="Copy content to clipboard"
                                class="shadow-sm"
                            >
                                {#if copySuccess}
                                    <Check size={12} />
                                {:else}
                                    <Copy size={12} />
                                {/if}
                            </Button>
                        </div>
                    {/if}
                </div>
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

    /* Basic prose styles for markdown rendering */
    .prose :global(h1),
    .prose :global(h2),
    .prose :global(h3),
    .prose :global(h4),
    .prose :global(h5),
    .prose :global(h6) {
        font-weight: bold;
        margin-top: 1em;
        margin-bottom: 0.5em;
        line-height: 1.25;
    }

    .prose :global(h1) {
        font-size: 1.5em;
    }
    .prose :global(h2) {
        font-size: 1.25em;
    }
    .prose :global(h3) {
        font-size: 1.1em;
    }

    .prose :global(p) {
        margin-bottom: 1em;
    }

    .prose :global(ul),
    .prose :global(ol) {
        margin-left: 1.5em;
        margin-bottom: 1em;
    }

    .prose :global(li) {
        margin-bottom: 0.5em;
    }

    .prose :global(code) {
        background-color: #f3f4f6; /* gray-100 */
        padding: 0.2em 0.4em;
        border-radius: 4px;
        font-family: monospace;
    }

    .prose :global(pre) {
        background-color: #f3f4f6; /* gray-100 */
        padding: 1em;
        border-radius: 6px;
        overflow-x: auto;
    }

    .prose :global(blockquote) {
        border-left: 4px solid #d1d5db; /* gray-300 */
        padding-left: 1em;
        color: #6b7280; /* gray-500 */
        margin-left: 0;
        margin-right: 0;
    }

    .prose :global(a) {
        color: #2563eb; /* blue-600 */
        text-decoration: underline;
    }
</style>