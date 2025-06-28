<script lang="ts">

    import TargetSocket from "$lib/components/nodeComponents/sockets/TargetSocket.svelte";

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
    {:else if datatype}
        <span class="socket-type">
            Type: {datatype}
        </span>
    {/if}

    <TargetSocket {id} {label} {datatype} {documentation}></TargetSocket>
</div>