
<script module lang="ts">
    import { type Node } from '@xyflow/svelte';
    import type { BigDataRef } from "$lib/compositor/BigData";

    // Official NID for this node: image_loader
    export type ImageNodeType = Node<
        {
            input: { imageOrFileOrString: BigDataRef | string | null };
            nid?: string; // Should be set to 'image_loader' when using official blueprint
        },
        'node-image'
    >;
</script>

<script lang="ts">
    import { Handle, Position, type NodeProps, useSvelteFlow, useNodeConnections } from '@xyflow/svelte';
    import { fetchSocketDataTypeByName } from "$lib/compositor/DataTypes";
    import { projectOutputDataCache } from "$lib/stores/ProjectState";
    import { untrack } from "svelte";
    import { 
        getBigData, 
        storeImage,
        isBigDataRef,
    } from "$lib/compositor/BigData";

    import NodeWrapper from '$lib/components/NodeWrapper.svelte';

    const { updateNodeData } = useSvelteFlow();

    let { id, data }: NodeProps<ImageNodeType> = $props();

    let loadedImageData: BigDataRef | string | null = $state(data.input?.imageOrFileOrString || null);
    let displayImageUrl = $state('');
    let fileInput: HTMLInputElement;

    const inputConnections = useNodeConnections({ id, handleType: 'target' });
    let hasInputConnection = $derived(inputConnections.current.length > 0);

    // Update node data when local image changes
    $effect(() => {
        if (loadedImageData) {
            updateNodeData(untrack(() => id), { input: { imageOrFileOrString: loadedImageData } });
        }
    });

    // Handle connected input data with loop prevention
    let lastProcessedSocketData: any = Symbol('initial');
    let sourceNode = $derived(inputConnections.current[0]?.source);
    let sourceSocket = $derived(inputConnections.current[0]?.sourceHandle || 'input');
    $effect(() => {
        if (hasInputConnection) {
            const unsubscribeSocket = projectOutputDataCache.useSocketStore(
                sourceNode,
                sourceSocket
            ).subscribe(async (socketData) => {

                const previousValue = untrack(() => lastProcessedSocketData);

                // Prevent infinite loops by checking if data actually changed
                if (socketData === previousValue) {
                    return;
                }
                
                lastProcessedSocketData = socketData;
                
                try {
                    if (socketData) {
                        await handleImageData(socketData);
                    } else {
                        // Handle null/empty data
                        displayImageUrl = '';
                    }
                } catch (error) {
                    console.error('Error processing socket data:', error);
                    displayImageUrl = '';
                }
            });
            
            return () => {
                unsubscribeSocket();
            };
        }
    });

    // Handle file selection
    async function handleFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            try {
                // Create display URL immediately
                displayImageUrl = URL.createObjectURL(file);

                // Store as BigData and update node
                const bigDataRef = await storeImage(file);
                loadedImageData = bigDataRef;

                // // Optionally convert to Jimp for processing
                // try {
                //     const arrayBuffer = await file.arrayBuffer();
                //     const jimp = await Jimp.fromBuffer(arrayBuffer);
                //     const jimpRef = await storeJimpImage(jimp);
                //     loadedImageData = jimpRef; // Use Jimp version as the primary data
                //     console.log('Converted to Jimp and stored as BigData');
                // } catch (jimpError) {
                //     console.warn('Failed to convert to Jimp, using file data:', jimpError);
                // }
            } catch (error) {
                console.error('Error loading image:', error);
            }
        }
    }

    // Handle different types of image data
    async function handleImageData(imageData: any) {
        try {
            if (isBigDataRef(imageData)) {
                // Get actual data from BigData reference
                const actualData = await getBigData(imageData);
                if (actualData === null) {
                    console.warn('BigData reference points to missing data, clearing display');
                    displayImageUrl = '';
                    return;
                }
                await handleImageData(actualData); // Recursive call with actual data
                return;
            }

            if (typeof imageData === 'string') {
                // Base64 or URL
                displayImageUrl = imageData;
            } else if (imageData instanceof File) {
                // File object
                displayImageUrl = URL.createObjectURL(imageData);
            } else if (imageData && typeof imageData === 'object' && imageData.bitmap) {
                // Jimp instance
                const base64 = await imageData.getBase64('image/png');
                displayImageUrl = base64;
            } else if (!imageData || imageData === 'empty') {
                // Empty or null data
                displayImageUrl = '';
            } else {
                console.warn('Unknown image data type:', typeof imageData, imageData);
                displayImageUrl = '';
            }
        } catch (error) {
            console.error('Error handling image data:', error);
            displayImageUrl = '';
        }
    }

    // Initialize display when component loads
    $effect(() => {
        if (loadedImageData && !hasInputConnection) {
            handleImageData(loadedImageData);
        }
    });

    let socketStyle = $state('');
    fetchSocketDataTypeByName('image/jimp').then((datatype) => {
        socketStyle = datatype?.style || 'background: #10b981';
    });
</script>

<NodeWrapper
    label="Image"
    documentation="View an image from an output, or load in an image to use as input.">
<div class="relative">
    <!-- Main image container -->
    <div class="border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
        {#if hasInputConnection}
            <!-- Display connected image -->
            <div class="min-h-[150px] max-h-[400px] flex items-center justify-center bg-gray-50">
                {#if displayImageUrl}
                    <img
                        src={displayImageUrl}
                        alt="Connected image"
                        class="max-w-full max-h-full object-contain"
                        style="min-width: 100px; max-width: 400px;"
                    />
                {:else}
                    <div class="p-4 text-gray-500 text-center">
                        <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                        </svg>
                        <p class="text-sm">No image data from connection</p>
                    </div>
                {/if}
            </div>
        {:else}
            <!-- Image loader interface -->
            {#if displayImageUrl}
                <!-- Show loaded image -->
                <div class="relative min-h-[150px] max-h-[400px] flex items-center justify-center">
                    <img
                        src={displayImageUrl}
                        alt="Loaded image"
                        class="max-w-full max-h-full object-contain"
                        style="min-width: 100px; max-width: 400px;"
                    />
                    <button
                        onclick={() => fileInput.click()}
                        class="absolute top-2 right-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                    >
                        Change
                    </button>
                </div>
            {:else}
                <!-- Show upload area -->
                <div class="min-h-[150px] flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50">
                    <button
                        onclick={() => fileInput.click()}
                        class="flex flex-col items-center gap-3 p-6 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <div class="text-center">
                            <p class="text-sm font-medium text-gray-700">Load Image</p>
                            <p class="text-xs text-gray-500">PNG, JPG, GIF - automatically stored as BigData</p>
                        </div>
                    </button>
                </div>
            {/if}
            
            <!-- Hidden file input -->
            <input
                bind:this={fileInput}
                type="file"
                accept="image/*"
                onchange={handleFileSelect}
                class="hidden"
            />
        {/if}
    </div>

    <!-- Input handle -->
    <Handle
        type="target"
        position={Position.Left}
        style="top:50%;{socketStyle}"
        id="imageOrFileOrString"
        class="socket-handle"
    />

    <!-- Output handle -->
    <Handle
        type="source"
        position={Position.Right}
        style="top:50%;{socketStyle}"
        id="image"
        class="socket-handle"
    />
</div>
</NodeWrapper>