<script lang="ts">

    import type {InputSocketParams} from "$lib/compositor/SocketModels.js";

    interface Props {
        id: string;
        label?: string;
        datatype: string;
        documentation: string;
    }

    let {
        id,
        label,
        datatype = 'unknown',
        documentation = 'Missing Documentation!'
    }: Props = $props();

    import {Handle, Position} from "@xyflow/svelte";

    import {fetchSocketDataTypeByName} from "$lib/compositor/DataTypes";
    import {Tooltip} from "flowbite-svelte";

</script>

{#await fetchSocketDataTypeByName(datatype)}
    Loading Target Socket {label} of type {datatype}
{:then datatypeInfo}
    <Handle
            type="target"
            position={Position.Left}
            id={id}
            class="socket-handle"
            style='top:20px;{datatypeInfo?.style || ""}'
    />
    <Tooltip placement="top">
        <b>{label}</b>--{documentation}<br><br>
        <b>Type ({datatypeInfo?.name}):</b> {datatypeInfo?.description}
    </Tooltip>
{:catch error}
    Error; could not load input socket: {JSON.stringify(error, null, 2)}
{/await}