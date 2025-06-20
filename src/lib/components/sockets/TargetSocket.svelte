<script lang="ts">

    import type {InputSocketParams} from "$lib/compositor/SocketModels.js";

    interface Props {
        id: string;
        label: string;
        type: string;
        documentation: string;
    }

    let {
        id,
        label = 'Untitled Socket',
        type = 'text',
        documentation = 'Missing Documentation!'
    }: Props = $props();

    import {Handle, Position} from "@xyflow/svelte";

    import {fetchSocketDataTypeByName} from "$lib/compositor/DataTypes";
    import {Tooltip} from "flowbite-svelte";

</script>
<div class="socket-container">

    <div class="flex flex-col">
        <span class="socket-label">{label}</span>
        {#if type}
        <span class="socket-type">
            Type: {type}
        </span>
        {/if}
    </div>

    {#await fetchSocketDataTypeByName(type)}
        Loading Target Socket {label} of type {type}
    {:then datatype}
        <Handle
                type="target"
                position={Position.Left}
                id={id}
                class="socket-handle"
                style={datatype?.style || ''}
        />
        <Tooltip placement="top">
            <b>{label}</b>--{documentation}<br>
            <b>Type ({datatype?.name}):</b> {datatype?.description}
        </Tooltip>
    {:catch error}
        Error; could not load input socket: {JSON.stringify(error, null, 2)}
    {/await}
</div>