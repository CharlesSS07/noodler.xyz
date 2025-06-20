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

    <div class="output-text-container">
        <span class="socket-label">{label}</span>
        {#if type}
        <span class="socket-type" >
            {type}
        </span>
        {/if}
    </div>

    {#await fetchSocketDataTypeByName(type)}
        Loading Target Socket {label} of type {type}
    {:then datatype}
        <Handle
                type="source"
                position={Position.Right}
                id={id}
                style={datatype?.style || ''}
                class="socket-handle"
        />
        <Tooltip placement="top">
            <b>{label}</b>--{documentation}<br>
            <b>Type ({datatype?.name}):</b> {datatype?.description}
        </Tooltip>
    {:catch error}
        Error; could not load input socket: {JSON.stringify(error, null, 2)}
    {/await}

</div>