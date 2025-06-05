<script>
    import NodeWrapper from "../../NodeWrapper.svelte";
    import {Handle, Position} from "@xyflow/svelte";
    import {getSocketDataTypeByName} from "../../lib/DataTypes.ts";

    let inputSocketStyle = $state('');
    let outputSocketStyle = $state('');
    getSocketDataTypeByName('string').then((datatype) => {
        inputSocketStyle = datatype?.style || '';
    });
    getSocketDataTypeByName('string').then((datatype) => {
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