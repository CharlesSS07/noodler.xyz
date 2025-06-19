<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    export type HtmlTagNodeType = Node<
        {
            input: {
                innerHTML?: string;
                [key: string]: string | undefined; // Dynamic attributes
            };
            output: {
                htmlOutput?: string;
            };
        },
        'html-tag-node'
    >;
</script>

<script lang="ts">
    import { Handle, type NodeProps } from '@xyflow/svelte';
    import NodeWrapper from "$lib/components/NodeWrapper.svelte";
    
    let { id, data }: NodeProps<HtmlTagNodeType> = $props();

    // Node settings
    let tagType = $state('div');
    let customTag = $state('');
    let useCustomTag = $state(false);
    let attributes = $state<{name: string, value: string}[]>([]);
    
    // Common HTML tags
    const commonTags = [
        'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'a', 'img', 'button', 'input', 'textarea', 'select', 'option',
        'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
        'nav', 'header', 'main', 'section', 'article', 'aside', 'footer',
        'form', 'label', 'fieldset', 'legend'
    ];

    // Initialize data structure
    $effect(() => {
        if (!data.input) data.input = {};
        if (!data.output) data.output = {};
        if (!data.nid) data.nid = 'demo_html_tag_builder';
    });

    // Access input values
    let innerHTML = $derived(data.input?.innerHTML || '');

    // Generate HTML output
    $effect(() => {
        const finalTag = useCustomTag ? customTag : tagType;
        if (!finalTag.trim()) {
            data.output.htmlOutput = '';
            return;
        }

        let attributeStr = '';
        attributes.forEach(attr => {
            if (attr.name.trim() && attr.value.trim()) {
                attributeStr += ` ${attr.name}="${attr.value}"`;
            }
        });

        // Check for dynamic attribute inputs
        Object.keys(data.input || {}).forEach(key => {
            if (key !== 'innerHTML' && data.input![key]) {
                attributeStr += ` ${key}="${data.input![key]}"`;
            }
        });

        const isSelfClosing = ['img', 'input', 'br', 'hr', 'meta', 'link'].includes(finalTag);
        
        if (isSelfClosing) {
            data.output.htmlOutput = `<${finalTag}${attributeStr} />`;
        } else {
            data.output.htmlOutput = `<${finalTag}${attributeStr}>${innerHTML}</${finalTag}>`;
        }
    });

    function addAttribute() {
        attributes = [...attributes, { name: '', value: '' }];
    }

    function removeAttribute(index: number) {
        attributes = attributes.filter((_, i) => i !== index);
    }

    function updateAttribute(index: number, field: 'name' | 'value', value: string) {
        attributes = attributes.map((attr, i) => 
            i === index ? { ...attr, [field]: value } : attr
        );
    }

    const nodeTitle = "HTML Tag Builder";
    const nodeDescription = "Builds HTML tags with dynamic attributes and content";
</script>

<NodeWrapper title={nodeTitle} description={nodeDescription} label="HTML Tag">
    <!-- Input Socket for innerHTML -->
    <Handle 
        type="target"
        socketType="string"
        label="Inner HTML"
        socket_id="innerHTML"
        tooltip="Content inside the HTML tag"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Inner HTML</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>

    <!-- Node Content -->
    <div class="tag-content">
        <!-- Tag Selection -->
        <div class="tag-selection">
            <div class="tag-mode">
                <label>
                    <input 
                        type="radio" 
                        bind:group={useCustomTag} 
                        value={false}
                    /> 
                    Common Tags
                </label>
                <label>
                    <input 
                        type="radio" 
                        bind:group={useCustomTag} 
                        value={true}
                    /> 
                    Custom Tag
                </label>
            </div>
            
            {#if useCustomTag}
                <input 
                    type="text" 
                    bind:value={customTag} 
                    placeholder="Enter custom tag name"
                    class="custom-tag-input"
                />
            {:else}
                <select bind:value={tagType} class="tag-select">
                    {#each commonTags as tag}
                        <option value={tag}>{tag}</option>
                    {/each}
                </select>
            {/if}
        </div>

        <!-- Attributes Section -->
        <div class="attributes-section">
            <div class="section-header">
                <h4>Attributes</h4>
                <button onclick={addAttribute} class="add-btn">+ Add</button>
            </div>
            
            {#each attributes as attr, index}
                <div class="attribute-row">
                    <input 
                        type="text" 
                        value={attr.name}
                        oninput={(e) => updateAttribute(index, 'name', e.target.value)}
                        placeholder="name"
                        class="attr-input"
                    />
                    <input 
                        type="text" 
                        value={attr.value}
                        oninput={(e) => updateAttribute(index, 'value', e.target.value)}
                        placeholder="value"
                        class="attr-input"
                    />
                    <button onclick={() => removeAttribute(index)} class="remove-btn">×</button>
                </div>
            {/each}
        </div>

        <!-- Preview -->
        <div class="preview-section">
            <h4>Generated HTML:</h4>
            <div class="html-preview">
                {data.output.htmlOutput || '<tag>content</tag>'}
            </div>
        </div>
    </div>

    <!-- Output Socket -->
    <Handle 
        type="source"
        socketType="string"
        label="HTML Output"
        socket_id="htmlOutput"
        tooltip="Generated HTML tag"
    >
        <div class="socket-content output-content">
            <span class="socket-label">HTML Output</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>
</NodeWrapper>

<style>
    .tag-content {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-width: 280px;
    }

    .tag-selection {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .tag-mode {
        display: flex;
        gap: 1rem;
        font-size: 0.75rem;
    }

    .tag-mode label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        cursor: pointer;
    }

    .custom-tag-input, .tag-select {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        font-size: 0.875rem;
    }

    .attributes-section {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.75rem;
        background: #f9fafb;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .section-header h4 {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
    }

    .add-btn {
        background: #10b981;
        color: white;
        border: none;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        cursor: pointer;
        font-weight: 500;
    }

    .add-btn:hover {
        background: #059669;
    }

    .attribute-row {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        align-items: center;
    }

    .attr-input {
        flex: 1;
        padding: 0.25rem 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        font-size: 0.75rem;
    }

    .remove-btn {
        background: #ef4444;
        color: white;
        border: none;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        cursor: pointer;
        font-weight: bold;
        width: 1.5rem;
        height: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .remove-btn:hover {
        background: #dc2626;
    }

    .preview-section {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.75rem;
        background: #f9fafb;
    }

    .preview-section h4 {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
    }

    .html-preview {
        background: #1f2937;
        color: #f9fafb;
        padding: 0.75rem;
        border-radius: 0.25rem;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.75rem;
        word-break: break-all;
        white-space: pre-wrap;
    }

    .socket-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .input-content {
        align-items: flex-start;
        text-align: left;
    }

    .output-content {
        align-items: flex-end;
        text-align: right;
    }

    .socket-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #374151;
    }

    .socket-type {
        font-size: 0.625rem;
        font-weight: 400;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.8;
    }
</style>