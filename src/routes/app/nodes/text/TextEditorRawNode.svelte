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
    import {Handle, Position, type NodeProps, useSvelteFlow, useNodeConnections} from '@xyflow/svelte';

    const {updateNodeData} = useSvelteFlow();
    import {getSocketDataTypeByName} from "../../lib/DataTypes";
    import {projectOutputDataCache} from "$lib/stores/ProjectState";
    import {untrack} from "svelte";

    let {id, data}: NodeProps<PlainTextNodeType> = $props();

    let inputText = $state(data.input.inputText || '');
    let textarea: HTMLTextAreaElement;
    $effect(() => {
        updateNodeData(untrack(() => id), {input: {inputText: inputText}});
    });

    // const factory = new FirestoreNodeBluePrintControllerFactoryInterface();
    // let blueprint: Writable<NodeBluePrint> | undefined = undefined;
    // factory.getNodeBluePrintFromNID(data.nid).then((bp) => {
    //     blueprint = createNodeBluePrintStore(bp);
    // });

    const inputConnections = useNodeConnections({id, handleType: 'target'});
    let hasInputConnection = $derived(inputConnections.current.length > 0);

    function autoResize(textarea: HTMLTextAreaElement) {
        textarea.style.width = 'auto';
        // textarea.style.width = Math.min(textarea.style.width, 400) + 'px';
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    // Update display value when
    let displayValue = $state('');
    $effect(() => {
        if (hasInputConnection) {
            const source = inputConnections.current[0].source;
            const sourceHandle = inputConnections.current[0].sourceHandle || 'input';
            const unsubscribeSocket = projectOutputDataCache.useSocketStore(
                source,
                sourceHandle
            ).subscribe((socketData) => {
                console.log('output socket data updated:', socketData, id)
                displayValue = socketData as string;
            });
            return unsubscribeSocket;
        }
    });

    let socketStyle = $state('');
    getSocketDataTypeByName('image/jimp').then((datatype) => {
        socketStyle = datatype?.style || 'background: red';
    });

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


</script>

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

    <Handle
            type="target"
            position={Position.Left}
            style="top:50%;{socketStyle}"
            id="inputText"
            class="socket-handle"
    />

    <!-- Output handle -->
    <Handle
            type="source"
            position={Position.Right}
            style="top:50%;{socketStyle}"
            id="outputText"
            class="socket-handle"
    />
</div>

<style>
    textarea::placeholder {
        color: #9ca3af;
        font-style: italic;
    }
</style>