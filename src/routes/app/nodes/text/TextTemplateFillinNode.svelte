<!--String template node with variable placeholders-->
<!--Allows editing template text with @variable placeholders-->
<!--Automatically fills in variables from connected input nodes-->
<!--Outputs the processed template string-->
<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    export type StringTemplateNodeType = Node<
        {
            template: string;
            output: string;
        },
        'node-string-template'
    >;
</script>

<script lang="ts">
    import { Handle, Position, useNodeConnections, useNodesData, useSvelteFlow, type NodeProps } from '@xyflow/svelte';
    import { getSocketDataTypeByName } from "../../lib/DataTypes";

    let { id, data }: NodeProps<StringTemplateNodeType> = $props();

    const { updateNodeData } = useSvelteFlow();
    const connections = useNodeConnections();

    // State for template handling
    let isEditing: boolean = $state(false);
    let textareaRef: HTMLTextAreaElement;

    // Initialize data.template if not set
    if (!data.template) {
        data.template = 'Hello @name, welcome to @city!\nYour age is @age years old.';
    }

    // Socket styling for string inputs and output
    let inputSocketStyle = $state('');
    let outputSocketStyle = $state('');
    getSocketDataTypeByName('string').then((datatype) => {
        inputSocketStyle = datatype?.style || '';
    });
    getSocketDataTypeByName('string').then((datatype) => {
        outputSocketStyle = datatype?.style || '';
    });

    // Get all connected node data
    let connectedNodesData = useNodesData(connections.current.map(conn => conn.source));

    // Extract unique variables from template
    let templateVariables = $derived(() => {
        const matches = data.template.match(/@(\w+)/g);
        if (!matches) return [];

        // Get unique variable names (remove @ prefix and dedupe)
        const uniqueVars = [...new Set(matches.map(match => match.slice(1)))];
        return uniqueVars;
    });

    // Create variable map from connected nodes
    let variableMap = $derived(() => {
        const map: Record<string, string> = {};

        connections.current.forEach((connection, index) => {
            const nodeData = connectedNodesData.current[index];
            if (nodeData?.data) {
                // Try to get text from various possible properties
                let value = '';
                if (typeof nodeData.data.output === 'string') {
                    value = nodeData.data.output;
                } else if (typeof nodeData.data.outputText === 'string') {
                    value = nodeData.data.outputText;
                } else if (typeof nodeData.data.text === 'string') {
                    value = nodeData.data.text;
                } else if (typeof nodeData.data === 'string') {
                    value = nodeData.data;
                }

                // Use the target handle id as the variable name, or fall back to index
                const variableName = connection.targetHandle || `var${index + 1}`;
                map[variableName] = value;
            }
        });

        return map;
    });

    // Process template with variables - this effect will update the output
    $effect(() => {
        let result = data.template;

        // Replace each variable with its value
        Object.entries(variableMap).forEach(([key, value]) => {
            const placeholder = `@${key}`;
            result = result.replaceAll(placeholder, value || `@${key}`);
        });

        // Only update if the output has actually changed
        if (result !== data.output) {
            updateNodeData(id, { output: result });
        }
    });

    // Handle click to edit
    function handleClick() {
        if (!isEditing) {
            isEditing = true;
            setTimeout(() => {
                if (textareaRef) {
                    textareaRef.focus();
                    textareaRef.setSelectionRange(textareaRef.value.length, textareaRef.value.length);
                }
            }, 0);
        }
    }

    // Handle escape key
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            event.preventDefault();
            finishEditing();
        }
    }

    // Handle blur (defocus)
    function handleBlur() {
        finishEditing();
    }

    // Finish editing
    function finishEditing() {
        isEditing = false;
    }

    // Handle textarea input
    function handleInput(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        updateNodeData(id, { template: target.value });
    }

    // Auto-resize textarea
    function autoResize(textarea: HTMLTextAreaElement) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    // Resize textarea when editing starts
    $effect(() => {
        if (isEditing && textareaRef) {
            autoResize(textareaRef);
        }
    });

    // Highlight variables in display text
    function highlightVariables(text: string): string {
        return text.replace(/@(\w+)/g, (match, varName) => {
            const hasValue = variableMap[varName];
            const className = hasValue ? 'variable-filled' : 'variable-empty';
            return `<span class="${className}">${match}</span>`;
        });
    }
</script>

<div class="w-full h-[200px] relative">
    <!-- Template Editor/Display -->
    <div class="w-full h-full border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
        {#if isEditing}
            <!-- Edit Mode: Textarea -->
            <textarea
                    bind:this={textareaRef}
                    value={data.template}
                    on:blur={handleBlur}
                    on:keydown={handleKeydown}
                    on:input={(e) => {
                    handleInput(e);
                    autoResize(e.target as HTMLTextAreaElement);
                }}
                    class="w-full h-full p-3 border-0 outline-none resize-none font-mono text-sm"
                    placeholder="Enter template with @variable placeholders..."
                    style="min-height: 100%;"
            ></textarea>
        {:else}
            <!-- Display Mode: Show template with highlighted variables -->
            <div
                    class="w-full h-full overflow-auto p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    on:click={handleClick}
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleClick();
                    }
                }}
            >
                {#if data.template.trim()}
                    <div class="template-display font-mono text-sm whitespace-pre-wrap">
                        {@html highlightVariables(data.template)}
                    </div>
                {:else}
                    <div class="text-gray-400 text-center flex flex-col items-center justify-center h-full">
                        <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span class="text-sm">Click to edit template</span>
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Edit indicator -->
        {#if isEditing}
            <div class="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                Editing (ESC to finish)
            </div>
        {/if}
    </div>

    <!-- Variable info panel -->
    {#if templateVariables.length > 0}
        <div class="absolute -bottom-1 left-0 right-0 bg-gray-100 border border-gray-300 rounded-b-lg p-2 text-xs">
            <div class="text-gray-600 mb-1">Variables:</div>
            <div class="flex flex-wrap gap-1">
                {#each templateVariables() as variable}
                    <span class="px-1 py-0.5 rounded text-xs {variableMap[variable] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        @{variable}
                    </span>
                {/each}
            </div>
        </div>
    {/if}

    <!-- Input handles for variables -->
    {#each templateVariables() as variable, index}
        <Handle
                type="target"
                position={Position.Left}
                style="top:{20 + (index * 20)}%;{inputSocketStyle}"
                id={variable}
                class="socket-handle"
        />
    {/each}

    <!-- Output handle -->
    <Handle
            type="source"
            position={Position.Right}
            style="top:50%;{outputSocketStyle}"
            id="output"
            class="socket-handle"
    />
</div>

<style>
    .template-display :global(.variable-filled) {
        background-color: #dcfce7;
        color: #166534;
        padding: 1px 3px;
        border-radius: 3px;
        font-weight: 500;
    }

    .template-display :global(.variable-empty) {
        background-color: #fef2f2;
        color: #dc2626;
        padding: 1px 3px;
        border-radius: 3px;
        font-weight: 500;
        border: 1px dashed #fca5a5;
    }

    .socket-handle {
        width: 8px;
        height: 8px;
    }
</style>