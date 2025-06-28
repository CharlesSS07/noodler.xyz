<script module lang="ts">
    import type {Node} from '@xyflow/svelte';

    // Official NID for this node: node_official_raw_text_editor
    export type PlainTextNodeType = Node<
        {
            input: { inputText: string };
            nid?: string; // Should be set to 'node_official_raw_text_editor' when using official blueprint
        },
        'node-memory-monitor'
    >;
</script>

<script lang="ts">
    import NodeWrapper from "$lib/components/nodeComponents/NodeWrapper.svelte";
    import MemoryGraph from "../../../components/MemoryGraph.svelte";
    import type {NodeProps} from "@xyflow/svelte";

    let {id, selected}: NodeProps<PlainTextNodeType> = $props();

</script>

<NodeWrapper label="Browser Memory Monitor" isSelected={selected} executionTime={0}>
    <MemoryGraph></MemoryGraph>
</NodeWrapper>