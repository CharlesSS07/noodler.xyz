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
    import {untrack} from "svelte";

    let { id, data }: NodeProps<PlainTextNodeType> = $props();

    const { updateNodeData } = useSvelteFlow();
    const connections = useNodeConnections();
    let socketStyle = $state('');

    // Handle style loading
    getSocketDataTypeByName('string').then((datatype) => {
        socketStyle = datatype?.style || '';
    });

    // Whether the input socket is connected
    let hasInputConnection = $derived(() =>
        connections.current.some((conn) => conn.target === id && conn.targetHandle === 'input')
    );

    // Sync data.output.text depending on connection
    $effect(() => {
        if (hasInputConnection()) {
            updateNodeData(id, {
                output: { text: untrack(() => data.input.text) }
            });
        } else {
            updateNodeData(id, {
                output: { text: (untrack(() => data.currentText) ?? '') }
            });
        }
    });

    // Whether to show input socket (only if input is empty and not connected)
    let showInputSocket = $derived(() => {
        return (!data.input.text || data.input.text.trim() === '') && !hasInputConnection();
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
</script>

<div class="w-full h-fit relative">
    <!-- Main textarea -->
    <div class="w-full border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
		<textarea
                bind:this={textareaRef}
                value={hasInputConnection() ? data.input.text : data.currentText ?? ''}
                readonly={hasInputConnection()}
                on:input={(e) => {
				if (!hasInputConnection()) {
					handleManualInput(e);
					autoResize(e.target as HTMLTextAreaElement);
				}
			}}
                class="w-full p-3 border-0 outline-none resize-none font-mono text-sm {hasInputConnection() ? 'bg-gray-50 text-gray-700' : 'bg-white'}"
                placeholder={hasInputConnection() ? 'Text from connected input...' : 'Enter plain text...'}
        ></textarea>
    </div>

    <!-- Input handle (conditionally shown) -->
    {#if showInputSocket()}
        <Handle
                type="target"
                position={Position.Left}
                style="top:50%;{socketStyle}"
                id="input"
                class="socket-handle"
        />
    {/if}

    <!-- Output handle -->
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
</style>
