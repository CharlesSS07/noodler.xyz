<script module lang="ts">
    import type {Node} from '@xyflow/svelte';

    // Official NID for this node: html_renderer
    export type HtmlRendererNodeType = Node<
        {
            input: { html: string };
            nid?: string; // Should be set to 'html_renderer' when using official blueprint
        },
        'node-html-renderer'
    >;
</script>

<script lang="ts">
    import {Handle, Position, type NodeProps, useNodeConnections} from '@xyflow/svelte';

    import {projectComputedDataCache} from "$lib/stores/ProjectState";
    import {fetchSocketDataTypeByName, STANDARD_DATATYPES} from "$lib/compositor/DataTypes";
    import NodeWrapper from "$lib/components/nodeComponents/NodeWrapper.svelte";
    import {Tooltip} from "flowbite-svelte";

    let {id, data, selected}: NodeProps<HtmlRendererNodeType> = $props();

    const inputConnections = useNodeConnections({id, handleType: 'target'});
    let hasInputConnection = $derived(inputConnections.current.length > 0);

    // Update display value when connection source becomes available
    let displayValue = $state('');
    let hasValidData = $state(false);
    $effect(() => {
        if (hasInputConnection) {
            // only one way to have an input connection to this node, so 0 index is a-ok
            const source = inputConnections.current[0].source;
            const sourceHandle = inputConnections.current[0].sourceHandle;
            if (sourceHandle) {
                const unsubscribeSocket = projectComputedDataCache.useSocketStore(
                    source,
                    sourceHandle
                ).subscribe((socketData) => {
                    console.log('output socket data updated:', socketData, id)
                    
                    // Check if we have valid data (not null, undefined, or empty)
                    if (socketData === null || socketData === undefined || socketData === '') {
                        hasValidData = false;
                        displayValue = '';
                    } else if (typeof socketData === 'string') {
                        displayValue = socketData as string;
                        hasValidData = true;
                    } else {
                        displayValue = '<<OBJECT>>\n' + JSON.stringify(socketData, null, 2);
                        hasValidData = true;
                    }
                });
                return unsubscribeSocket;
            }
        } else {
            hasValidData = false;
            displayValue = '';
        }
    });

    let iframeRef: HTMLIFrameElement;

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

    // Initialize iframe when mounted
    function handleIframeLoad() {
        if (hasInputConnection && hasValidData) {
            updateIframeContent(displayValue);
        } else {
            updateIframeContent('<div style="text-align: center; color: #999; padding: 20px;">Waiting for data...</div>');
        }
    }

    // Update iframe when display value changes (only for connected inputs with valid data)
    $effect(() => {
        if (iframeRef && hasInputConnection && hasValidData) {
            updateIframeContent(displayValue);
        } else if (iframeRef && hasInputConnection && !hasValidData) {
            updateIframeContent('<div style="text-align: center; color: #999; padding: 20px;">Waiting for data...</div>');
        }
    });

</script>

<NodeWrapper label="HTML Renderer" isSelected={selected}>
    <div class="relative">
        <!-- Main content area -->
        <div class="border-2 border-gray-300 rounded-lg bg-white overflow-hidden w-80 h-48">
            {#if hasInputConnection}
                <!-- Connected input - show iframe with display value -->
                <iframe
                    bind:this={iframeRef}
                    onload={handleIframeLoad}
                    title="HTML Renderer"
                    sandbox="allow-same-origin"
                    class="w-full h-full border-0"
                    style="background: white;"
                ></iframe>
            {:else}
                <!-- No connection - show placeholder -->
                <div class="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <svg class="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <span class="text-sm">Connect HTML input</span>
                </div>
            {/if}
        </div>

        <!-- Input handle -->
        {#await fetchSocketDataTypeByName(STANDARD_DATATYPES.TEXT)}
            Loading Target Socket
        {:then datatype}
            <Handle
                    type="target"
                    position={Position.Left}
                    id="html"
                    class="socket-handle"
                    style="top: 50%;{datatype?.style || ''}"
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
    textarea::placeholder {
        color: #9ca3af;
        font-style: italic;
    }
</style>