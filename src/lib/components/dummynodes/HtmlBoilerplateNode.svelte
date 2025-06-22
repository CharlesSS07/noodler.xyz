<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    export type HtmlBoilerplateNodeType = Node<
        {
            input: {
                bodyContent?: string;
                headContent?: string;
                footerContent?: string;
                title?: string;
                viewport?: string;
                charset?: string;
            };
            output: {
                fullHtml?: string;
            };
        },
        'html-boilerplate-node'
    >;
</script>

<script lang="ts">
    import { Handle, type NodeProps } from '@xyflow/svelte';
    import NodeWrapper from "$lib/components/nodeComponents/NodeWrapper.svelte";
    
    let { id, data }: NodeProps<HtmlBoilerplateNodeType> = $props();

    // Node settings
    let doctype = $state('<!DOCTYPE html>');
    let language = $state('en');
    let includeViewport = $state(true);
    let includeCharset = $state(true);
    let cssFramework = $state('none');
    let jsFramework = $state('none');

    // Framework options
    const cssFrameworks = [
        { value: 'none', label: 'None' },
        { value: 'bootstrap', label: 'Bootstrap 5' },
        { value: 'tailwind', label: 'Tailwind CSS' },
        { value: 'bulma', label: 'Bulma' },
        { value: 'foundation', label: 'Foundation' }
    ];

    const jsFrameworks = [
        { value: 'none', label: 'None' },
        { value: 'jquery', label: 'jQuery' },
        { value: 'alpine', label: 'Alpine.js' },
        { value: 'htmx', label: 'HTMX' },
        { value: 'vanilla', label: 'Vanilla JS (placeholder)' }
    ];

    // Initialize data structure
    $effect(() => {
        if (!data.input) data.input = {};
        if (!data.output) data.output = {};
        if (!data.nid) data.nid = 'demo_html_boilerplate_generator';
    });

    // Access input values
    let bodyContent = $derived(data.input?.bodyContent || '');
    let headContent = $derived(data.input?.headContent || '');
    let footerContent = $derived(data.input?.footerContent || '');
    let title = $derived(data.input?.title || 'Untitled Page');
    let viewport = $derived(data.input?.viewport || 'width=device-width, initial-scale=1.0');
    let charset = $derived(data.input?.charset || 'UTF-8');

    // Generate full HTML
    $effect(() => {
        let html = doctype + '\n';
        html += `<html lang="${language}">\n`;
        html += '<head>\n';
        
        // Charset
        if (includeCharset) {
            html += `    <meta charset="${charset}">\n`;
        }
        
        // Viewport
        if (includeViewport) {
            html += `    <meta name="viewport" content="${viewport}">\n`;
        }
        
        // Title
        html += `    <title>${title}</title>\n`;
        
        // CSS Framework
        if (cssFramework !== 'none') {
            html += getCssFrameworkLink(cssFramework);
        }
        
        // Custom head content
        if (headContent) {
            html += `    ${headContent}\n`;
        }
        
        html += '</head>\n';
        html += '<body>\n';
        
        // Body content
        if (bodyContent) {
            html += `    ${bodyContent}\n`;
        }
        
        // Footer content
        if (footerContent) {
            html += `    ${footerContent}\n`;
        }
        
        // JS Framework
        if (jsFramework !== 'none') {
            html += getJsFrameworkScript(jsFramework);
        }
        
        html += '</body>\n';
        html += '</html>';
        
        data.output.fullHtml = html;
    });

    function getCssFrameworkLink(framework: string): string {
        switch (framework) {
            case 'bootstrap':
                return `    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">\n`;
            case 'tailwind':
                return `    <script src="https://cdn.tailwindcss.com"/>\n`;
            case 'bulma':
                return '    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css">\n';
            case 'foundation':
                return '    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/foundation-sites@6.7.5/dist/css/foundation.min.css">\n';
            default:
                return '';
        }
    }

    function getJsFrameworkScript(framework: string): string {
        switch (framework) {
            case 'jquery':
                return '    <script src="https://code.jquery.com/jquery-3.7.1.min.js"/>\n';
            case 'alpine':
                return '    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"/>\n';
            case 'htmx':
                return '    <script src="https://unpkg.com/htmx.org@1.9.10"/>\n';
            default:
                return '';
        }
    }

    const nodeDescription = "Generates complete HTML document structure with framework integration";
</script>

<NodeWrapper documentation={nodeDescription} label="HTML Boilerplate">
    <!-- Input Sockets -->
    <Handle 
        type="target"
        socketType="string"
        label="Title"
        socket_id="title"
        tooltip="Page title"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Title</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>
    
    <Handle 
        type="target"
        socketType="string"
        label="Head Content"
        socket_id="headContent"
        tooltip="Additional head tags"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Head Content</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>
    
    <Handle 
        type="target"
        socketType="string"
        label="Body Content"
        socket_id="bodyContent"
        tooltip="Main page content"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Body Content</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>
    
    <Handle 
        type="target"
        socketType="string"
        label="Footer Content"
        socket_id="footerContent"
        tooltip="Footer scripts and content"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Footer Content</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>

    <!-- Node Content -->
    <div class="boilerplate-content">
        <!-- Document Settings -->
        <div class="settings-section">
            <h4>Document Settings</h4>
            
            <div class="setting">
                <label for="language">Language:</label>
                <input 
                    type="text" 
                    id="language"
                    bind:value={language} 
                    class="setting-input"
                />
            </div>
            
            <div class="checkbox-setting">
                <label>
                    <input type="checkbox" bind:checked={includeCharset} />
                    Include charset meta tag
                </label>
            </div>
            
            <div class="checkbox-setting">
                <label>
                    <input type="checkbox" bind:checked={includeViewport} />
                    Include viewport meta tag
                </label>
            </div>
        </div>

        <!-- Framework Selection -->
        <div class="frameworks-section">
            <h4>Frameworks</h4>
            
            <div class="setting">
                <label for="css-framework">CSS Framework:</label>
                <select id="css-framework" bind:value={cssFramework} class="setting-select">
                    {#each cssFrameworks as fw}
                        <option value={fw.value}>{fw.label}</option>
                    {/each}
                </select>
            </div>
            
            <div class="setting">
                <label for="js-framework">JS Framework:</label>
                <select id="js-framework" bind:value={jsFramework} class="setting-select">
                    {#each jsFrameworks as fw}
                        <option value={fw.value}>{fw.label}</option>
                    {/each}
                </select>
            </div>
        </div>

        <!-- Preview -->
        <div class="preview-section">
            <h4>Generated Structure:</h4>
            <div class="html-preview">
                {data.output.fullHtml?.split('\n').slice(0, 10).join('\n') || 'HTML structure will appear here...'}
                {#if data.output.fullHtml && data.output.fullHtml.split('\n').length > 10}
                    <div class="preview-truncated">... (truncated)</div>
                {/if}
            </div>
        </div>
    </div>

    <!-- Output Socket -->
    <Handle 
        type="source"
        socketType="string"
        label="Full HTML"
        socket_id="fullHtml"
        tooltip="Complete HTML document"
    >
        <div class="socket-content output-content">
            <span class="socket-label">Full HTML</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>
</NodeWrapper>

<style>
    .boilerplate-content {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-width: 300px;
    }

    .settings-section, .frameworks-section {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.75rem;
        background: #f9fafb;
    }

    .settings-section h4, .frameworks-section h4 {
        margin: 0 0 0.75rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
    }

    .setting {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-bottom: 0.75rem;
    }

    .setting:last-child {
        margin-bottom: 0;
    }

    .setting label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #374151;
    }

    .setting-input, .setting-select {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        font-size: 0.875rem;
    }

    .checkbox-setting {
        margin-bottom: 0.5rem;
    }

    .checkbox-setting label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        cursor: pointer;
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
        white-space: pre-wrap;
        max-height: 200px;
        overflow-y: auto;
    }

    .preview-truncated {
        color: #9ca3af;
        font-style: italic;
        margin-top: 0.5rem;
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