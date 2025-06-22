<script module lang="ts">
    import {type Node} from '@xyflow/svelte';

    // Official NID for this node: template
    export type TemplateFillinNodeType = Node<
        {
            input: {
                template: string; // The user-defined template string
            },
            nid?: string; // Should be set to 'template' when using official blueprint
        },
        'node-template-fillin'
    >;
</script>

<script lang="ts">
    import {
        Handle,
        Position,
        type NodeProps,
        NodeResizeControl
    } from '@xyflow/svelte';
    import {fetchSocketDataTypeByName, STANDARD_DATATYPES} from '$lib/compositor/DataTypes';
    import {Tooltip} from "flowbite-svelte";
    import NodeWrapper from "$lib/components/nodeComponents/NodeWrapper.svelte";
    import {projectActions} from "$lib/stores/ProjectState.js";

    let {id, data, selected}: NodeProps<TemplateFillinNodeType> = $props();

    // initialize data if defaults not given
    if (data.input === undefined) {
        data.input = {template: ""};
    }
    if (data.input.template === undefined) {
        data.input.template = "";
    }

    // State for template handling
    let isEditing: boolean = $state(false);
    let textareaRef: HTMLTextAreaElement;

    // Extract unique variables from template
    let templateVariables = $derived(() => {
        const matches = data.input.template.match(/@(\w+)/g);
        if (!matches) return [];

        // Get unique variable names (remove @ prefix and dedupe)
        const uniqueVars = [...new Set(matches.map((match) => match.slice(1)))];
        return uniqueVars;
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
        data.input.template = target.value;
        projectActions.updateNodeData(id, {input: data.input});
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

    // Highlight variables in display text
    function highlightVariables(text: string): string {
        return text.replace(/@(\w+)/g, (match, varName) => {
            // const hasValue = getTemplateVariable(varName);
            const hasValue = false;
            const className = hasValue ? 'variable-filled' : 'variable-empty';
            return `<span class="${className}">${match}</span>`;
        });
    }
</script>

<NodeWrapper
        label="Template"
        documentation="Fill in your text with variables from links. Useful for prompt design."
        isSelected={selected}
>
    <div class="flex flex-col border-2 border-gray-300 rounded-lg bg-white relative">

        <NodeResizeControl
                minWidth={100}
                minHeight={50}
                style="background: transparent; border: none;"
        >
            <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="rgb(128, 128, 128)"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    style="position: absolute; right: 5px; bottom: 5px;"
            >
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <polyline points="16 20 20 20 20 16"/>
                <line x1="14" y1="14" x2="20" y2="20"/>
                <polyline points="8 4 4 4 4 8"/>
                <line x1="4" y1="4" x2="10" y2="10"/>
            </svg>
        </NodeResizeControl>

        <div class="p-3">
            {#if isEditing}
                <textarea
                        bind:this={textareaRef}
                        value={data.input.template}
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
                    {#if data.input.template.trim()}
                        <div class="template-display font-mono text-sm whitespace-pre-wrap">
                            {@html highlightVariables(data.input.template)}
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
        </div>

        {#each templateVariables() as variable, index}
            <!--            <TargetSocket id={index.toString()} label={variable} type={STANDARD_DATATYPES.TEXT}-->
            <!--                          documentation={'Fills in @'+variable}></TargetSocket>-->
            {#await fetchSocketDataTypeByName(STANDARD_DATATYPES.TEXT)}
                Loading Target Socket
            {:then datatype}
                <Handle
                        type="target"
                        position={Position.Left}
                        id="{variable}"
                        class="socket-handle"
                        style="top: {30 * index}px;{datatype?.style || ''}"
                />
                <Tooltip placement="top">
                    <b>{variable}</b>
                </Tooltip>
            {:catch error}
                Error; could not load input socket: {JSON.stringify(error, null, 2)}
            {/await}
        {/each}

        <!--        <SourceSocket id="text" label="Text" type={STANDARD_DATATYPES.TEXT} documentation=''></SourceSocket>-->

        {#await fetchSocketDataTypeByName(STANDARD_DATATYPES.TEXT)}
            Loading Target Socket
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
            Error; could not load input socket: {JSON.stringify(error, null, 2)}
        {/await}

    </div>
</NodeWrapper>

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
</style>