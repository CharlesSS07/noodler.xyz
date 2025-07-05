<script lang="ts">
    import {type NodeProps} from '@xyflow/svelte';
    import {createNodeStore, type NodeStoreType} from '$lib/components/nodes/NodeInstanceStore';
    import {STANDARD_DATATYPES} from "$shared/DataTypes";
    import NodeWrapper from "$lib/components/nodeComponents/NodeWrapper.svelte";
    import TargetSocket from "$lib/components/nodeComponents/sockets/TargetSocket.svelte";
    import NodeErrorDisplay from "$lib/components/nodeComponents/NodeErrorDisplay.svelte";

    let {id, selected}: NodeProps<NodeStoreType> = $props();

    const nodeStore = createNodeStore(id);
    const htmlInputSocket = nodeStore.inputSocketStore('html');
    let executionStatus = nodeStore.executionStatus;

    // Update display value when connection source becomes available
    let displayValue = $state('');
    let hasValidData = $state(false);
    $effect(() => {
        const htmlData = $htmlInputSocket.value;
        
        // Check if we have valid data (not null, undefined, or empty)
        if (htmlData === null || htmlData === undefined || htmlData === '') {
            hasValidData = false;
            displayValue = '';
        } else if (typeof htmlData === 'string') {
            displayValue = htmlData as string;
            hasValidData = true;
        } else {
            displayValue = '<<OBJECT>>\n' + JSON.stringify(htmlData, null, 2);
            hasValidData = true;
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
        if ($htmlInputSocket.isConnected && hasValidData) {
            updateIframeContent(displayValue);
        } else {
            updateIframeContent('<div style="text-align: center; color: #999; padding: 20px;">Waiting for data...</div>');
        }
    }

    // Update iframe when display value changes (only for connected inputs with valid data)
    $effect(() => {
        if (iframeRef && $htmlInputSocket.isConnected && hasValidData) {
            updateIframeContent(displayValue);
        } else if (iframeRef && $htmlInputSocket.isConnected && !hasValidData) {
            updateIframeContent('<div style="text-align: center; color: #999; padding: 20px;">Waiting for data...</div>');
        }
    });

</script>

<NodeWrapper label="HTML Renderer" isSelected={selected} executionStatus={$executionStatus}>
    <div class="relative">
        <!-- Sockets -->
        <TargetSocket
            id="html"
            label="HTML Input"
            datatype={STANDARD_DATATYPES.TEXT}
            documentation="HTML content to render in iframe"
        />

        <!-- Main content area -->
        <div class="border-2 border-gray-300 rounded-lg bg-white overflow-hidden w-80 h-48">
            {#if $htmlInputSocket.isConnected}
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

        {#if $executionStatus}
            <NodeErrorDisplay errorMessage={$executionStatus.logs.map((log) => log[1]).join('<br>')}></NodeErrorDisplay>
        {/if}
    </div>
</NodeWrapper>

<style>
    textarea::placeholder {
        color: #9ca3af;
        font-style: italic;
    }
</style>