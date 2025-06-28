<script lang="ts">

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
<div class="socket-container">

    {#if label}
        <div class="flex flex-col">
            <span class="socket-label">{label}</span>
            {#if datatype}
                <span class="socket-type">
                    Type: {datatype}
                </span>
            {/if}
        </div>
    {/if}

    {#await fetchSocketDataTypeByName(datatype)}
        Loading Target Socket {label} of type {datatype}
    {:then datatypeInfo}
        <Handle
                type="target"
                position={Position.Left}
                id={id}
                class="socket-handle"
                style={datatypeInfo?.style || ''}
        />
        <Tooltip placement="top">
            <b>{label}</b>--{documentation}<br>
            <b>Type ({datatypeInfo?.name}):</b> {datatypeInfo?.description}
        </Tooltip>
    {:catch error}
        Error; could not load input socket: {JSON.stringify(error, null, 2)}
    {/await}
</div>