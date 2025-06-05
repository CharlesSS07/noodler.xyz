<script module lang="ts">
    import type { Node } from '@xyflow/svelte';

    export type PlainTextNodeType = Node<
        {
            input: { text: string };
            currentText: string;
            output: { text: string };
        },
        'node-plain-text'
    >;
</script>

<script lang="ts">
    import {
        Handle,
        Position,
        useNodeConnections,
        useSvelteFlow,
        type NodeProps
    } from '@xyflow/svelte';

    import { getSocketDataTypeByName } from '../../lib/DataTypes';
    import { untrack } from 'svelte';
    import { marked } from 'marked'; // Import marked

    let { id, data }: NodeProps<PlainTextNodeType> = $props();

    const { updateNodeData } = useSvelteFlow();
    const connections = useNodeConnections();
    let socketStyle = $state('');

    let isFocused = $state(false); // New state variable

    // Handle style loading
    getSocketDataTypeByName('string').then((datatype) => {
        socketStyle = datatype?.style || '';
    });

    // Whether the input socket is connected
    let hasInputConnection = $derived(
        () => connections.current.some((conn) => conn.target === id && conn.targetHandle === 'input')
    );

    // Sync data.output.text depending on connection
    $effect(() => {
        if (hasInputConnection()) {
            updateNodeData(id, {
                output: { text: untrack(() => data.input.text) }
            });
        } else {
            updateNodeData(id, {
                output: { text: untrack(() => data.currentText) ?? '' }
            });
        }
    });

    // Handle manual input
    function handleManualInput(event: Event) {
        const text = (event.target as HTMLTextAreaElement).value;
        updateNodeData(id, {
            currentText: text
        });
    }

    // Auto-resizing textarea
    let textareaRef: HTMLTextAreaElement;
    function autoResize(textarea: HTMLTextAreaElement) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(40, textarea.scrollHeight) + 'px';
    }
    $effect(() => {
        if (textareaRef) autoResize(textareaRef);
    });

    // Focus textarea when isFocused becomes true
    $effect(() => {
        if (isFocused && textareaRef) {
            textareaRef.focus();
            autoResize(textareaRef);
        }
    });
</script>

<div class="w-full h-fit relative">
    <div
            class="w-full border-2 border-gray-300 rounded-lg bg-white overflow-hidden"
            tabindex="0"
            onclick={() => {
			if (!hasInputConnection()) {
				isFocused = true;
			}
		}}
            onfocus={() => {
			if (!hasInputConnection()) {
				isFocused = true;
			}
		}}
    >
        {#if isFocused && !hasInputConnection()}
			<textarea
                    bind:this={textareaRef}
                    value={data.currentText ?? ''}
                    oninput={(e) => {
					handleManualInput(e);
					autoResize(e.target as HTMLTextAreaElement);
				}}
                    onblur={() => (isFocused = false)}
                    class="w-full p-3 border-0 outline-none resize-none font-mono text-sm bg-white"
                    placeholder="Enter plain text..."
            ></textarea>
        {:else}
            <div
                    class="w-full p-3 text-sm prose max-w-none"
                    class:text-gray-700={hasInputConnection()}
                    class:bg-gray-50={hasInputConnection()}
                    class:bg-white={!hasInputConnection()}
                    onclick={() => {
					if (!hasInputConnection()) {
						isFocused = true;
					}
				}}
                    onkeypress={() => {
					if (!hasInputConnection()) {
						isFocused = true;
					}
				}}
            >
                {@html marked.parse(hasInputConnection() ? data.input.text : data.currentText ?? '')}
            </div>
        {/if}
    </div>

    <Handle
            type="target"
            position={Position.Left}
            style="top:50%;{socketStyle}"
            id="input"
            class="socket-handle"
    />

    <Handle
            type="source"
            position={Position.Right}
            style="top:50%;{socketStyle}"
            id="output"
            class="socket-handle"
    />
</div>

<style>
    .socket-handle {
        width: 8px;
        height: 8px;
    }

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