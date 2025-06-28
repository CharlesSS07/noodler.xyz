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

    import SourceSocket from "$lib/components/nodeComponents/sockets/SourceSocket.svelte";

</script>

<div class="socket-container">

    {#if label}
        <div class="output-text-container">
            <span class="socket-label">{label}</span>
            {#if datatype}
                <span class="socket-type" >
                    {datatype}
                </span>
            {/if}
        </div>
        {:else if datatype}
        <div class="output-text-container">
            <span class="socket-type" >
                Type: {datatype}
            </span>
        </div>
    {/if}

    <SourceSocket {id} {label} {datatype} {documentation}></SourceSocket>

</div>