<script module lang="ts">
    import type {Node} from '@xyflow/svelte';

    // Official NID for this node: node_official_raw_text_editor
    export type PlainTextNodeType = Node<
        {
            input: { inputText: string };
            nid?: string; // Should be set to 'node_official_raw_text_editor' when using official blueprint
        },
        'node-raw-text-editor'
    >;
</script>

<script lang="ts">
    import {Handle, Position, type NodeProps, useNodeConnections} from '@xyflow/svelte';

    import {projectActions, projectOutputDataCache} from "$lib/stores/ProjectState";
    import {untrack} from "svelte";
    import {fetchSocketDataTypeByName, STANDARD_DATATYPES} from "$lib/compositor/DataTypes";
    import NodeWrapper from "$lib/components/nodeComponents/NodeWrapper.svelte";
    import {Tooltip} from "flowbite-svelte";

    let {id, data, selected}: NodeProps<PlainTextNodeType> = $props();

    const inputConnections = useNodeConnections({id, handleType: 'target'});
    let hasInputConnection = $derived(inputConnections.current.length > 0);

    // Update display value when connection source becomes avaliable
    let displayValue = $state('');
    $effect(() => {
        if (hasInputConnection) {
            // only one way to have an input connection to this node, so 0 index is a-ok
            const source = inputConnections.current[0].source;
            const sourceHandle = inputConnections.current[0].sourceHandle;
            if (sourceHandle) {
                const unsubscribeSocket = projectOutputDataCache.useSocketStore(
                    source,
                    sourceHandle
                ).subscribe((socketData) => {
                    console.log('output socket data updated:', socketData, id)
                    if (typeof socketData === 'string')
                        displayValue = socketData as string;
                    else
                        displayValue = '<<OBJECT>>\n' + JSON.stringify(socketData, null, 2);
                    autoResize(textarea);
                });
                return unsubscribeSocket;
            }
        }
    });

    let inputText = $state(data.input.inputText || '');
    let textarea: HTMLTextAreaElement;

    // Initialize without triggering update
    $effect(() => {
        projectActions.updateNodeData(untrack(() => id), {input: {inputText: inputText}});
    });

    $effect(() => {
        if (data.input.inputText && textarea) {
            inputText = data.input.inputText;
            autoResize(textarea);
        }
    })

    // Auto-resize effect
    $effect(() => {
        if (textarea) {
            autoResize(textarea);
        }
    });

    // Resize when displayValue changes
    $effect(() => {
        if (textarea && displayValue) {
            autoResize(textarea);
        }
    });

    function autoResize(textarea: HTMLTextAreaElement) {
        textarea.style.width = 'auto';
        // textarea.style.width = Math.min(textarea.style.width, 400) + 'px';
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

</script>

<NodeWrapper label="Raw Text" isSelected={selected}>
    <div class="relative">
        <!-- Main textarea -->
        <div class="border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
            <!--{id}-->
            {#if hasInputConnection}
            <textarea
                    bind:this={textarea}
                    value={displayValue}
                    class="w-fit p-3 border-0 outline-none font-mono text-sm resize-none overflow-hidden"
                    placeholder='No data supplied by link.'
                    disabled
                    onchange={(e) => autoResize(e.target)}
            ></textarea>
            {:else }
            <textarea
                    bind:this={textarea}
                    value={inputText}
                    class="w-fit p-3 border-0 outline-none font-mono text-sm resize-none overflow-hidden"
                    placeholder='Enter plain text...'
                    oninput={(e) => {
                        const value = e.target.value;
                        inputText = value;
                        autoResize(e.target);
                    }}
            ></textarea>
            {/if}
        </div>

        {#await fetchSocketDataTypeByName(STANDARD_DATATYPES.TEXT)}
            Loading Target Socket
        {:then datatype}
            <Handle
                    type="target"
                    position={Position.Left}
                    id="inputText"
                    class="socket-handle"
                    style="top: 50%;{datatype?.style || ''}"
            />
            <Tooltip placement="top">
                <b>Type ({datatype?.name}):</b> {datatype?.description}
            </Tooltip>
        {:catch error}
            Error; could not load input socket: {JSON.stringify(error, null, 2)}
        {/await}

        <!-- Output handle -->

        {#await fetchSocketDataTypeByName(STANDARD_DATATYPES.TEXT)}
            Loading Target Socket
        {:then datatype}
            <Handle
                    type="source"
                    position={Position.Right}
                    id='outputText'
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
    textarea::placeholder {
        color: #9ca3af;
        font-style: italic;
    }
</style>