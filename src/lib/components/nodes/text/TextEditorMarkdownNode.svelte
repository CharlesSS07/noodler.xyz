<script module lang="ts">
    import type {Node} from '@xyflow/svelte';

    // Official NID for this node: md_text_editor
    export type MarkdownTextNodeType = Node<
        {
            input: { text: string };
            nid?: string; // Should be set to 'md_text_editor' when using official blueprint
        },
        'node-markdown-text-editor'
    >;
</script>

<script lang="ts">
    import {Handle, Position, type NodeProps, useNodeConnections} from '@xyflow/svelte';

    import {projectActions, projectOutputDataCache} from "$lib/stores/ProjectState";
    import {untrack} from "svelte";
    import {fetchSocketDataTypeByName, STANDARD_DATATYPES} from "$lib/compositor/DataTypes";
    import NodeWrapper from "$lib/components/nodeComponents/NodeWrapper.svelte";
    import {Tooltip} from "flowbite-svelte";
    import {marked} from 'marked';

    let {id, data, selected}: NodeProps<MarkdownTextNodeType> = $props();

    const inputConnections = useNodeConnections({id, handleType: 'target'});
    let hasInputConnection = $derived(inputConnections.current.length > 0);

    // Update display value when connection source becomes available
    let displayValue = $state('');
    $effect(() => {
        if (hasInputConnection) {
            // only one way to have an input connection to this node, so 0 index is a-ok
            const source = inputConnections.current[0].source;
            const sourceHandle = inputConnections.current[0].sourceHandle;
            if (sourceHandle) {
                const unsubscribeSocket = projectOutputDataCache.useSocketStore(
                    source,
                    sourceHandle
                ).subscribe((socketData) => {
                    console.log('output socket data updated:', socketData, id)
                    if (typeof socketData === 'string')
                        displayValue = socketData as string;
                    else
                        displayValue = '<<OBJECT>>\n' + JSON.stringify(socketData, null, 2);
                });
                return unsubscribeSocket;
            }
        }
    });

    let inputText = $state(data.input.text || '');
    let textarea: HTMLTextAreaElement;
    let isEditing = $state(false);

    // Initialize without triggering update
    $effect(() => {
        projectActions.updateNodeData(untrack(() => id), {input: {text: inputText}});
    });

    $effect(() => {
        if (data.input.text && textarea) {
            inputText = data.input.text;
            autoResize(textarea);
        }
    })

    // Auto-resize effect for textarea
    $effect(() => {
        if (textarea) {
            autoResize(textarea);
        }
    });

    function autoResize(textarea: HTMLTextAreaElement) {
        textarea.style.width = 'auto';
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    function startEditing() {
        if (!hasInputConnection) {
            isEditing = true;
        }
    }

    function stopEditing() {
        isEditing = false;
    }

</script>

<NodeWrapper label="Markdown Text" isSelected={selected}>
    <div class="relative">
        <!-- Main content area -->
        <div class="border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
            {#if hasInputConnection}
                <!-- Connected input - show markdown rendered display value -->
                <div class="w-fit p-3 prose max-w-none text-sm">
                    {@html marked.parse(displayValue || 'No data supplied by link.')}
                </div>
            {:else if isEditing}
                <!-- Editing mode - show textarea -->
                <textarea
                        bind:this={textarea}
                        value={inputText}
                        class="w-fit p-3 border-0 outline-none font-mono text-sm resize-none overflow-hidden"
                        placeholder='Enter markdown text...'
                        oninput={(e) => {
                            const value = e.target.value;
                            inputText = value;
                            autoResize(e.target);
                        }}
                        onblur={stopEditing}
                        onfocusout={stopEditing}
                ></textarea>
            {:else}
                <!-- Display mode - show rendered markdown -->
                <div 
                    class="w-fit p-3 prose max-w-none text-sm cursor-pointer"
                    onclick={startEditing}
                    onkeypress={startEditing}
                >
                    {@html marked.parse(inputText || 'Click to enter markdown...')}
                </div>
            {/if}
        </div>

        <!-- Input handle -->
        {#await fetchSocketDataTypeByName(STANDARD_DATATYPES.TEXT)}
            Loading Target Socket
        {:then datatype}
            <Handle
                    type="target"
                    position={Position.Left}
                    id="text"
                    class="socket-handle"
                    style="top: 50%;{datatype?.style || ''}"
            />
            <Tooltip placement="top">
                <b>Type ({datatype?.name}):</b> {datatype?.description}
            </Tooltip>
        {:catch error}
            Error; could not load input socket: {JSON.stringify(error, null, 2)}
        {/await}

        <!-- Output handle -->
        {#await fetchSocketDataTypeByName(STANDARD_DATATYPES.TEXT)}
            Loading Source Socket
        {:then datatype}
            <Handle
                    type="source"
                    position={Position.Right}
                    id='text'
                    style="top: 50%;{datatype?.style || ''}"
                    class="socket-handle"
            />
            <Tooltip placement="top">
                <b>Type ({datatype?.name}):</b> {datatype?.description}
            </Tooltip>
        {:catch error}
            Error; could not load output socket: {JSON.stringify(error, null, 2)}
        {/await}

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