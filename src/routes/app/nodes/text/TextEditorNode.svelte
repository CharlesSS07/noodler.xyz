<!--Markdown text editor with input/output-->
<!--When input is connected, shows rendered markdown (read-only)-->
<!--When no input, allows editing markdown with click-to-edit functionality-->
<!--Always outputs the current markdown text content-->
<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    export type MarkdownEditorNodeType = Node<
        {
            inputText: string;
            outputText: string;
        },
        'node-markdown-editor'
    >;
</script>

<script lang="ts">
    import { Handle, Position, type NodeProps } from '@xyflow/svelte';
    import { marked } from 'marked';
    import { getSocketDataTypeByName } from "../../lib/DataTypes";

    let { id, data }: NodeProps<MarkdownEditorNodeType> = $props();

    // State for markdown handling
    let inputText: string = $state('');
    let isEditing: boolean = $state(false);
    let textareaRef: HTMLTextAreaElement;

    // Initialize data.outputText if not set
    if (!data.outputText) {
        data.outputText = '# Hello World\n\nClick to edit this **markdown** content!\n\n- Item 1\n- Item 2\n- Item 3';
    }

    // Socket styling
    let inputSocketStyle = $state('');
    let outputSocketStyle = $state('');

    getSocketDataTypeByName('text').then((datatype) => {
        inputSocketStyle = datatype?.style || '';
        outputSocketStyle = datatype?.style || '';
    });

    // Computed values
    let hasInputText = $derived(inputText.trim() !== '');
    let currentMarkdownText = $derived(hasInputText ? inputText : data.outputText || '');
    let isReadOnly = $derived(hasInputText);
    let renderedHtml = $derived.by(() => {
        try {
            return marked.parse(currentMarkdownText);
        } catch (error) {
            console.error('Markdown parsing error:', error);
            return '<p>Error parsing markdown</p>';
        }
    });

    // Handle input text changes (from connected nodes)
    $effect(() => {
        if (data.inputText && typeof data.inputText === 'string') {
            inputText = data.inputText;
            isEditing = false; // Exit edit mode when input is connected
        } else {
            inputText = '';
        }
    });

    // Always output the current text content
    $effect(() => {
        if (!hasInputText) {
            // Only update output when we're in editor mode (not when input is connected)
            data.outputText = data.outputText || '';
        }
    });

    // Handle click to edit (only when not read-only)
    function handleClick() {
        if (!isReadOnly && !isEditing) {
            isEditing = true;
            // Focus textarea on next tick
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

    // Finish editing and render markdown
    function finishEditing() {
        isEditing = false;
    }

    // Handle textarea input
    function handleInput(event: Event) {
        const target = event.target as HTMLTextAreaElement;
        data.outputText = target.value;
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
</script>

<div class="w-full h-[200px] relative">
    <!-- Markdown Editor/Renderer Display -->
    <div class="w-full h-full border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
        {#if isEditing && !isReadOnly}
            <!-- Edit Mode: Textarea -->
            <textarea
                    bind:this={textareaRef}
                    value={data.outputText || ''}
                    on:blur={handleBlur}
                    on:keydown={handleKeydown}
                    on:input={(e) => {
                    handleInput(e);
                    autoResize(e.target as HTMLTextAreaElement);
                }}
                    class="w-full h-full p-3 border-0 outline-none resize-none font-mono text-sm"
                    placeholder="Enter your markdown here..."
                    style="min-height: 100%;"
            ></textarea>
        {:else}
            <!-- Render Mode: Display rendered markdown -->
            <div
                    class="w-full h-full overflow-auto p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    class:cursor-default={isReadOnly}
                    class:hover:bg-transparent={isReadOnly}
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
                {#if currentMarkdownText.trim()}
                    <!-- Render markdown content -->
                    <div class="markdown-content">
                        {@html renderedHtml}
                    </div>
                {:else}
                    <!-- Empty state -->
                    <div class="text-gray-400 text-center flex flex-col items-center justify-center h-full">
                        <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span class="text-sm">
                            {isReadOnly ? 'No input content' : 'Click to edit markdown'}
                        </span>
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

        <!-- Read-only indicator -->
        {#if isReadOnly}
            <div class="absolute top-2 right-2 px-2 py-1 bg-gray-500 text-white text-xs rounded">
                Read-only
            </div>
        {/if}
    </div>

    <!-- Input handle for text -->
    {#if !currentMarkdownText || currentMarkdownText===''}
        <Handle
                type="target"
                position={Position.Left}
                style="top:20%;{inputSocketStyle}"
                id="input"
                class="socket-handle"
        />
    {/if}

    <!-- Output handle for text -->
    <Handle
            type="source"
            position={Position.Right}
            style="top:50%;{outputSocketStyle}"
            id="output"
            class="socket-handle"
    />
</div>

<style>
    .markdown-content {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #333;
    }

    .markdown-content :global(h1) {
        font-size: 1.5em;
        font-weight: 600;
        margin: 0.5em 0;
        border-bottom: 1px solid #eee;
        padding-bottom: 0.3em;
    }

    .markdown-content :global(h2) {
        font-size: 1.3em;
        font-weight: 600;
        margin: 0.5em 0;
    }

    .markdown-content :global(h3) {
        font-size: 1.1em;
        font-weight: 600;
        margin: 0.5em 0;
    }

    .markdown-content :global(p) {
        margin: 0.5em 0;
    }

    .markdown-content ul ol {
        margin: 0.5em 0;
        padding-left: 1.5em;
    }

    .markdown-content :global(li) {
        margin: 0.2em 0;
    }

    .markdown-content :global(code) {
        background-color: #f5f5f5;
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 0.9em;
    }

    .markdown-content :global(pre) {
        background-color: #f5f5f5;
        padding: 1em;
        border-radius: 5px;
        overflow-x: auto;
        margin: 0.5em 0;
    }

    .markdown-content :global(pre code) {
        background: none;
        padding: 0;
    }

    .markdown-content :global(blockquote) {
        border-left: 4px solid #ddd;
        margin: 0.5em 0;
        padding-left: 1em;
        color: #666;
    }

    .markdown-content :global(strong) {
        font-weight: 600;
    }

    .markdown-content :global(em) {
        font-style: italic;
    }

    .markdown-content :global(a) {
        color: #0066cc;
        text-decoration: none;
    }

    .markdown-content :global(a:hover) {
        text-decoration: underline;
    }

    .markdown-content :global(table) {
        border-collapse: collapse;
        width: 100%;
        margin: 0.5em 0;
    }

    .markdown-content th td {
        border: 1px solid #ddd;
        padding: 0.5em;
        text-align: left;
    }

    .markdown-content :global(th) {
        background-color: #f5f5f5;
        font-weight: 600;
    }
</style>