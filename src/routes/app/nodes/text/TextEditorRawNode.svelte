<script module lang="ts">
    import type {Node} from '@xyflow/svelte';

    // Official NID for this node: node_official_raw_text_editor
    export type PlainTextNodeType = Node<
        {
            input: { inputText: string };
            nid?: string; // Should be set to 'node_official_raw_text_editor' when using official blueprint
        },
        'node-plain-text'
    >;
</script>

<script lang="ts">
    import {Handle, Position, type NodeProps, useSvelteFlow, useNodeConnections} from '@xyflow/svelte';

    const {updateNodeData} = useSvelteFlow();
    import {getSocketDataTypeByName} from "../../lib/DataTypes";
    import {createNodeBluePrintStore, NodeBluePrint} from "../../lib/NodeBluePrint";
    import {
        FirestoreNodeBluePrintControllerFactoryInterface,
    } from "../../lib/FirestoreNodeBluePrint";
    import type {Unsubscriber, Writable} from "svelte/store";
    import {projectOutputDataCache} from "$lib/stores/ProjectState";
    import {untrack} from "svelte";

    let {id, data}: NodeProps<PlainTextNodeType> = $props();

    let inputText = $state(data.input.inputText || '');
    $effect(() => {
        console.log('inputText', inputText);
        updateNodeData(untrack(() => id), {input: {inputText: inputText}});
    });

    // const factory = new FirestoreNodeBluePrintControllerFactoryInterface();
    // let blueprint: Writable<NodeBluePrint> | undefined = undefined;
    // factory.getNodeBluePrintFromNID(data.nid).then((bp) => {
    //     blueprint = createNodeBluePrintStore(bp);
    // });

    const inputConnections = useNodeConnections({id, handleType: 'target'});
    let hasInputConnection = $derived(inputConnections.current.length > 0);

    let displayValue = $state('');
    let unsubscribeSocket: Unsubscriber | undefined = undefined;
    $effect(() => {
        untrack(() => {
            if (unsubscribeSocket) {
                unsubscribeSocket()
            }
        });
        if (hasInputConnection) {
            const source = inputConnections.current[0].source;
            const sourceHandle = inputConnections.current[0].sourceHandle || 'input';
            unsubscribeSocket = projectOutputDataCache.getSocketStore(
                source,
                sourceHandle
            ).subscribe((socketData) => {
                console.log('output socket data updated:', socketData, id)
                displayValue = socketData as string;
            });
        }
    });

    let socketStyle = $state('');
    getSocketDataTypeByName('image/jimp').then((datatype) => {
        socketStyle = datatype?.style || 'background: red';
    });


</script>

<div class="w-full h-fit relative">
    <!-- Main textarea -->
    <div class="w-full border-2 border-gray-300 rounded-lg bg-white overflow-hidden">
        {id}
        {#if hasInputConnection}
            <textarea
                    value={displayValue}
                    class="w-full p-3 border-0 outline-none resize-none font-mono text-sm bg-white}"
                    placeholder='No data supplied by link.'
                    disabled
            ></textarea>
        {:else }
            <textarea
                    value={inputText}
                    class="w-full p-3 border-0 outline-none resize-none font-mono text-sm bg-white}"
                    placeholder='Enter plain text...'
                    oninput={(e) => {
                        const value = e.target.value;
                        inputText = value;
                    }}
            ></textarea>
            {inputText}
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
    .socket-handle {
        width: 8px;
        height: 8px;
    }

    textarea::placeholder {
        color: #9ca3af;
        font-style: italic;
    }
</style>