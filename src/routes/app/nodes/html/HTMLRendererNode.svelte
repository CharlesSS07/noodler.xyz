<!--Renders HTML content from text input-->
<!--Takes HTML string as input and displays the rendered HTML-->
<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    export type HtmlRendererNodeType = Node<
        {
            input: {html: string};
        },
        'node-html-renderer'
    >;
</script>

<script lang="ts">
    import { Handle, Position, type NodeProps } from '@xyflow/svelte';
    import { getSocketDataTypeByName } from "../../lib/DataTypes";

    let { id, data }: NodeProps<HtmlRendererNodeType> = $props();

    // State for HTML handling
    let inputHtml: string = $state('');
    let iframeRef: HTMLIFrameElement;

    // Socket styling
    let socketStyle = $state('');
    getSocketDataTypeByName('text').then((datatype) => {
        socketStyle = datatype?.style || '';
    });

    // Computed values
    let hasInputHtml = $derived(inputHtml.trim() !== '');

    // Update iframe content when HTML changes
    function updateIframeContent(html: string) {
        if (!iframeRef) return;

        try {
            const doc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
            if (doc) {
                // Create a complete HTML document with proper styling
                const fullHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body {
                                margin: 8px;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                font-size: 14px;
                                line-height: 1.4;
                                color: #333;
                                word-wrap: break-word;
                                overflow-wrap: break-word;
                            }
                            * {
                                max-width: 100%;
                                box-sizing: border-box;
                            }
                            img {
                                max-width: 100%;
                                height: auto;
                            }
                            h1, h2, h3, h4, h5, h6 {
                                margin: 0.5em 0;
                                line-height: 1.2;
                            }
                            p {
                                margin: 0.5em 0;
                            }
                            ul, ol {
                                margin: 0.5em 0;
                                padding-left: 1.5em;
                            }
                        </style>
                    </head>
                    <body>${html}</body>
                    </html>
                `;

                doc.open();
                doc.write(fullHtml);
                doc.close();
            }
        } catch (error) {
            console.error('Error updating iframe content:', error);
        }
    }

    // Handle input HTML changes (from connected nodes)
    $effect(() => {
        if (data.input.html && typeof data.input.html === 'string') {
            inputHtml = data.input.html;
            updateIframeContent(inputHtml);
        } else {
            inputHtml = '';
            updateIframeContent('<div style="text-align: center; color: #999; padding: 20px;">No HTML input</div>');
        }
    });

    // Initialize iframe when mounted
    function handleIframeLoad() {
        if (hasInputHtml) {
            updateIframeContent(inputHtml);
        } else {
            updateIframeContent('<div style="text-align: center; color: #999; padding: 20px;">No HTML input</div>');
        }
    }

    // Fallback HTML for when there's no input
    let fallbackHtml = `
        <div class="flex flex-col items-center justify-center h-full text-gray-400">
            <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span class="text-sm">Connect HTML input</span>
        </div>
    `;
</script>

<div class="w-full h-[200px] relative">
    <!-- HTML Renderer Display with Iframe -->
    <div class="w-full h-full border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
        {#if !hasInputHtml}
            <!-- Show fallback when no input -->
            <div class="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span class="text-sm">Connect HTML input</span>
            </div>
        {:else}
            <!-- Sandboxed iframe for HTML content -->
            <iframe
                    bind:this={iframeRef}
                    on:load={handleIframeLoad}
                    title="HTML Renderer"
                    sandbox="allow-same-origin"
                    class="w-full h-full border-0"
                    style="background: white;"
            ></iframe>
        {/if}
    </div>

    <!-- Input handle for HTML text -->
    <Handle
            type="target"
            position={Position.Left}
            style="top:50%;{socketStyle}"
            id="html"
            class="socket-handle"
    />
</div>

<style>
    /*.html-content {*/
    /*    width: 100%;*/
    /*    height: 100%;*/
    /*    font-family: inherit;*/
    /*}*/

    /*!* Ensure rendered HTML fits within the container *!*/
    /*.html-content :global(*) {*/
    /*    max-width: 100%;*/
    /*    box-sizing: border-box;*/
    /*}*/

    /*!* Style for common HTML elements to ensure good visibility *!*/
    /*.html-content :global(h1, h2, h3, h4, h5, h6) {*/
    /*    margin: 0.5em 0;*/
    /*    line-height: 1.2;*/
    /*}*/

    /*.html-content :global(p) {*/
    /*    margin: 0.5em 0;*/
    /*    line-height: 1.4;*/
    /*}*/

    /*.html-content :global(ul, ol) {*/
    /*    margin: 0.5em 0;*/
    /*    padding-left: 1.5em;*/
    /*}*/

    /*.html-content :global(img) {*/
    /*    max-width: 100%;*/
    /*    height: auto;*/
    /*}*/

    /*!* Ensure text doesn't overflow *!*/
    /*.html-content :global(div, span) {*/
    /*    word-wrap: break-word;*/
    /*    overflow-wrap: break-word;*/
    /*}*/
</style>