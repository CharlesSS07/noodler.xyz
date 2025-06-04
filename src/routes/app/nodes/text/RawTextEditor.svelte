<!--Plain text node with input and output sockets-->
<!--Allows manual text input via textarea or input from connected nodes-->
<!--Input socket disappears when textarea has text-->
<!--Textarea becomes readonly when input socket is connected-->
<!--No HTML rendering - plain text only-->
<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    export type PlainTextNodeType = Node<
        {
            text: string;
            output: string;
        },
        'node-plain-text'
    >;
</script>

<script lang="ts">
    import { Handle, Position, useNodeConnections, useNodesData, useSvelteFlow, type NodeProps } from '@xyflow/svelte';
    import { getSocketDataTypeByName } from "../../lib/DataTypes";

    let { id, data }: NodeProps<PlainTextNodeType> = $props();

    const { updateNodeData } = useSvelteFlow();
    const connections = useNodeConnections();

    // Initialize data if not set
    if (!data.text) {
        data.text = '';
    }
    if (!data.output) {
        data.output = '';
    }

    // Socket styling
    let socketStyle = $state('');
    getSocketDataTypeByName('string').then((datatype) => {
        socketStyle = datatype?.style || '';
    });

    // Get connected node data for input
    let connectedNodesData = useNodesData(connections.current.map(conn => conn.source));

    // Check if input socket is connected
    let hasInputConnection = $derived(() => {
        return connections.current.some(conn => conn.targetHandle === 'input');
    });

    // Get input value from connected node
    let inputValue = $derived(() => {
        const inputConnection = connections.current.find(conn => conn.targetHandle === 'input');
        if (!inputConnection) return '';

        const connectedNodeIndex = connections.current.findIndex(conn => conn.source === inputConnection.source);
        const nodeData = connectedNodesData.current[connectedNodeIndex];

        if (nodeData?.data) {
            // Try to get text from various possible properties
            if (typeof nodeData.data.output === 'string') {
                return nodeData.data.output;
            } else if (typeof nodeData.data.outputText === 'string') {
                return nodeData.data.outputText;
            } else if (typeof nodeData.data.text === 'string') {
                return nodeData.data.text;
            } else if (typeof nodeData.data === 'string') {
                return nodeData.data;
            }
        }
        return '';
    });

    // Determine if textarea should be readonly
    let isReadonly = $derived(() => hasInputConnection());

    // Determine if input socket should be visible
    let showInputSocket = $derived(() => !data.text || data.text.trim() === '');

    // Determine the current text value to display and output
    let currentText = $derived(() => {
        if (hasInputConnection()) {
            return inputValue();
        }
        return data.text || '';
    });

    // Update output when current text changes
    $effect(() => {
        const output = currentText();
        if (output !== data.output) {
            updateNodeData(id, { output });
        }
    });

    // Handle textarea input
    function handleInput(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        updateNodeData(id, { text: target.value });
    }

    // Auto-resize textarea
    function autoResize(textarea: HTMLTextAreaElement) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(40, textarea.scrollHeight) + 'px';
    }

    // Auto-resize on mount and when text changes
    let textareaRef: HTMLTextAreaElement;
    $effect(() => {
        if (textareaRef) {
            autoResize(textareaRef);
        }
    });
</script>

<div class="w-full h-fit relative">
    <!-- Main textarea -->
    <div class="w-full border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
        <textarea
                bind:this={textareaRef}
                value={currentText()}
                readonly={isReadonly()}
                on:input={(e) => {
                if (!isReadonly()) {
                    handleInput(e);
                    autoResize(e.target as HTMLTextAreaElement);
                }
            }}
                class="w-full p-3 border-0 outline-none resize-none font-mono text-sm {isReadonly() ? 'bg-gray-50 text-gray-700' : 'bg-white'}"
                placeholder={isReadonly() ? "Text from connected input..." : "Enter plain text..."}
        ></textarea>
    </div>

    <!-- Input handle (only visible when textarea is empty) -->
    {#if showInputSocket()}
        <Handle
                type="target"
                position={Position.Left}
                style="top:50%;{socketStyle}"
                id="input"
                class="socket-handle"
        />
    {/if}

    <!-- Output handle (always visible) -->
    <Handle
            type="source"
            position={Position.Right}
            style="top:50%;{socketStyle}"
            id="output"
            class="socket-handle"
    />

<!--    &lt;!&ndash; Status indicator &ndash;&gt;-->
<!--    <div class="absolute -bottom-1 left-0 right-0 bg-gray-100 border border-gray-300 rounded-b-lg p-1 text-xs text-center text-gray-600">-->
<!--        {#if hasInputConnection()}-->
<!--            Input: Connected | Output: {currentText().length} chars-->
<!--        {:else if data.text && data.text.trim()}-->
<!--            Input: Manual | Output: {currentText().length} chars-->
<!--        {:else}-->
<!--            Ready for input...-->
<!--        {/if}-->
<!--    </div>-->
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