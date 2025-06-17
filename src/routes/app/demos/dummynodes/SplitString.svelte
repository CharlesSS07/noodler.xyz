<script lang="ts">
    import NodeWrapper from "$lib/components/NodeWrapper.svelte";
    import {Handle, Position, type NodeProps} from "@xyflow/svelte";
    import {fetchSocketDataTypeByName} from "../../lib/DataTypes.ts";
    import { type Node } from '@xyflow/svelte';

    export type SplitStringNodeType = Node<
        {
            input: {text?: string; sep?: string};
            output: {result?: string[]};
        },
        'node-split-string'
    >;

    let { id, data }: NodeProps<SplitStringNodeType> = $props();

    // Initialize data structure if needed
    $effect(() => {
        if (!data.input) data.input = {};
        if (!data.output) data.output = {};
        if (!data.nid) data.nid = 'demo_split_string';
    });

    let inputSocketStyle = $state('');
    let outputSocketStyle = $state('');
    fetchSocketDataTypeByName('string').then((datatype) => {
        inputSocketStyle = datatype?.style || '';
    });
    fetchSocketDataTypeByName('string').then((datatype) => {
        outputSocketStyle = datatype?.style || '';
    });
</script>

<NodeWrapper label="SplitString" documentation="Splits input string by separator (sep), returns list of strings." >
    <Handle
            type="target"
            position={Position.Left}
            style="top:33%;{inputSocketStyle}"
            id='text'
            class="socket-handle"
    />
    <Handle
            type="target"
            position={Position.Left}
            style="top:33%;{inputSocketStyle}"
            id='sep'
            class="socket-handle"
    />
    <Handle
            type="source"
            position={Position.Left}
            style="top:50%;{inputSocketStyle}"
            id='sep'
            class="socket-handle"
    />
</NodeWrapper>