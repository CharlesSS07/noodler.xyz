
<!--Loads images when there are no images in input (hides input socket)-->
<!--Views an image when there is an image in input-->
<!--Always outputs and image either from the loaded image, or passed through from input socket-->
<script module lang="ts">
    import { type Node } from '@xyflow/svelte';
    import type {JimpInstance} from "jimp";

    // Official NIDs for this node: 
    // - node_official_image_loader (when loading files)
    // - node_official_image_viewer (when viewing/passing through images)
    export type ImageNodeType = Node<
        {
            input: {image: JimpInstance | File};
            nid?: string; // Should be 'node_official_image_loader' or 'node_official_image_viewer' when using official blueprint
        },
        'node-image'
    >;

</script>

<script lang="ts">
    import { Handle, Position, type NodeProps, useSvelteFlow } from '@xyflow/svelte';
    import { Jimp } from "jimp";
    import {getSocketDataTypeByName} from "../../lib/DataTypes";

    let { id, data }: NodeProps<ImageNodeType> = $props();
    
    const { updateNodeData } = useSvelteFlow();
    
    // Set the official NID if not already set (default to image_viewer)
    if (!data.nid) {
        updateNodeData(id, { nid: 'node_official_image_viewer' });
    }

    let socketStyle = $state('');
    getSocketDataTypeByName('image/jimp').then((datatype) => {
        socketStyle = datatype?.style || '';
    });

</script>

<!--<NodeWrapper label='Image'>-->
    <div class="w-full h-[200px] relative">
        {#if showImageLoader}
            <!-- Image loader interface -->
            <div class="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <input
                        bind:this={fileInput}
                        type="file"
                        accept="image/*"
                        on:change={handleFileSelect}
                        class="hidden"
                />
                {#if loadImageBase64}
                    <!-- Show loaded image -->
                    <div class="w-full h-full flex items-center justify-center">
                        <img
                                src={loadImageBase64}
                                alt="Loaded"
                                class="max-w-full max-h-full object-contain"
                        />
                    </div>
                    <button
                            on:click={() => fileInput.click()}
                            class="absolute bottom-2 right-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                        Change
                    </button>
                {:else}
                    <!-- Show loader -->
                    <button
                            on:click={() => fileInput.click()}
                            class="flex flex-col items-center gap-2 p-4 hover:bg-gray-100 rounded transition-colors"
                    >
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span class="text-sm text-gray-600">Load Image</span>
                    </button>
                {/if}
            </div>
        {:else}
            <!-- Image viewer interface -->
            <div class="w-full h-full flex items-center justify-center bg-black rounded-lg overflow-hidden">
                {#if currentImage}
                    <img
                            src={currentImage}
                            alt="Input"
                            class="max-w-full max-h-full object-contain"
                    />
                {:else}
                    <span class="text-gray-400">No image</span>
                {/if}
            </div>
        {/if}

        <!-- Input handle - only show when no input image -->
        {#if !loadedImage}
            <Handle
                    type="target"
                    position={Position.Left}
                    style="top:50%;{socketStyle}"
                    id="image"
                    class="socket-handle"/>
        {/if}

        <!-- Output handle - always present -->
        <Handle
                type="source"
                position={Position.Right}
                style="top:50%;{socketStyle}"
                id="output"
                class="socket-handle"/>
    </div>
<!--</NodeWrapper>-->