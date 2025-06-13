<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    // Official NID for this node: node_official_template
    export type TemplateFillinNodeType = Node<
        {
            input: Record<string, string>; // Stores connected input values for variables
            template: string; // The user-defined template string
            nid?: string; // Should be set to 'node_official_template' when using official blueprint
        },
        'node-template-fillin'
    >;
</script>

<script lang="ts">
    import {
        Handle,
        Position,
        useNodeConnections,
        useNodesData,
        useSvelteFlow,
        type NodeProps,
        NodeResizeControl
    } from '@xyflow/svelte';
    import { getSocketDataTypeByName } from '../../lib/DataTypes';
    import {Tooltip} from "flowbite-svelte";

    let { id, data }: NodeProps<TemplateFillinNodeType> = $props();

    const { updateNodeData } = useSvelteFlow();
    
    // Set the official NID if not already set
    if (!data.nid) {
        updateNodeData(id, { nid: 'node_official_template' });
    }
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

    // Get all connected node data (though we'll use `data.input` which XYFlow handles)
    let connectedNodesData = useNodesData(connections.current.map((conn) => conn.source));

    // Extract unique variables from template
    let templateVariables = $derived(() => {
        const matches = data.template.match(/@(\w+)/g);
        if (!matches) return [];

        // Get unique variable names (remove @ prefix and dedupe)
        const uniqueVars = [...new Set(matches.map((match) => match.slice(1)))];
        return uniqueVars;
    });

    // Process template with variables - this effect will update the output
    $effect(() => {
        if (data.input) {
            let result = data.template;

            // Replace each variable with its value from data.input
            Object.entries(data.input).forEach(([key, value]) => {
                const placeholder = `@${key}`;
                // Ensure that if a variable is not provided, its placeholder remains or is replaced by empty string
                result = result.replaceAll(placeholder, value || ''); // Replaced with empty string if value is falsy
            });

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
                    autoResize(textareaRef); // Ensure correct size on focus
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

    // Auto-resize textarea based on scrollHeight, with a minimum height
    function autoResize(textarea: HTMLTextAreaElement) {
        textarea.style.height = 'auto'; // Reset height
        // Set a minimum height based on a few rows for better UX
        // text-sm has line-height: 1.25rem = 20px (assuming 1rem = 16px)
        const minHeightBasedOnRows = 3 * 20; // 3 rows * 20px/row
        textarea.style.height = Math.max(minHeightBasedOnRows, textarea.scrollHeight) + 'px';
    }

    // Resize textarea when editing starts
    $effect(() => {
        if (isEditing && textareaRef) {
            autoResize(textareaRef);
        }
    });

    // Check if a template variable has a connected value
    function getTemplateVariable(varname: string): string | boolean {
        if (data && data.input) {
            // Check if the variable exists as a key in data.input and has a non-empty value
            return typeof data.input[varname] === 'string' && data.input[varname] !== '';
        }
        return false;
    }

    // Highlight variables in display text
    function highlightVariables(text: string): string {
        return text.replace(/@(\w+)/g, (match, varName) => {
            const hasValue = getTemplateVariable(varName);
            const className = hasValue ? 'variable-filled' : 'variable-empty';
            return `<span class="${className}">${match}</span>`;
        });
    }
</script>

<div class="w-[300px] max-w-[400px] flex flex-col border-2 border-gray-300 rounded-lg bg-white relative">
    <div class="p-3"> {#if isEditing}
            <textarea
                    bind:this={textareaRef}
                    value={data.template}
                    on:blur={handleBlur}
                    on:keydown={handleKeydown}
                    on:input={(e) => {
                    handleInput(e);
                    autoResize(e.target as HTMLTextAreaElement);
                }}
                    class="w-full border-0 outline-none resize-y font-mono text-sm"
                    placeholder="Enter template with @variable placeholders..."
                    rows="3"
                    style="min-height: 60px;"
            ></textarea>
    {:else}
        <div
                class="min-h-[60px] overflow-auto cursor-pointer hover:bg-gray-50 transition-colors"
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
                        <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    <span class="text-sm">Click to edit template</span>
                </div>
            {/if}
        </div>
    {/if}

        {#if isEditing}
            <div class="absolute top-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                Editing (ESC to finish)
            </div>
        {/if}
    </div>

    <!--{#if templateVariables().length > 0}-->
    <!--    <div class="bg-gray-100 border-t border-gray-300 rounded-b-lg p-2 text-xs">-->
    <!--        <div class="text-gray-600 mb-1">Variables:</div>-->
    <!--        <div class="flex flex-wrap gap-1">-->
    <!--            {#each templateVariables() as variable}-->
    <!--                <span class="px-1 py-0.5 rounded text-xs {getTemplateVariable(variable) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">-->
    <!--                    @{variable}-->
    <!--                </span>-->
    <!--            {/each}-->
    <!--        </div>-->
    <!--    </div>-->
    <!--{/if}-->

    {#each templateVariables() as variable, index}
        <Handle
                type="target"
                position={Position.Left}
                style="top:{5 + index * 10}%;{inputSocketStyle}"
                id={variable}
                class="socket-handle"
        />
        <Tooltip placement="left">{variable}</Tooltip>
    {/each}

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