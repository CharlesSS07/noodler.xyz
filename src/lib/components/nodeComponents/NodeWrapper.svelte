<script lang="ts">
    import {Tooltip} from 'flowbite-svelte';
    import {Info} from 'lucide-svelte';
    import {Card} from 'flowbite-svelte';

    interface NodeWrapperProps {
        label: string;
        documentation?: string;
        executionTime?: number;
        errorEncountered?: boolean;
        isSelected?: boolean;
    }

    let {
        label,
        documentation,
        executionTime = 0,
        errorEncountered = false,
        isSelected = false
    }: NodeWrapperProps = $props();
</script>

<div
        class="node-container"
        class:selected={isSelected}
>
    <!-- Node Header -->
    <div class="node-header" role="button" tabindex="0">
        <div class="header-content">
            <div class="title-section">
                <h3 class="node-title">{label}</h3>
            </div>

            <div class="header-actions">

                <!-- Info tooltip -->
                {#if documentation}
                    <div class="info-icon">
                        <Info size={16}/>
                        <Tooltip placement="top">{documentation}</Tooltip>
                    </div>
                {/if}
            </div>

            <!-- Execution info -->
            {#if executionTime > 0}
                <div class="execution-info">
                    <span class="execution-time" class:errorEncountered={'error'} >{executionTime}ms</span>
                </div>
            {:else}
                <div class="execution-info">
                    <span class="execution-time" class:errorEncountered={'error'} >idle</span>
                </div>
            {/if}
        </div>

    </div>

    <Card class="node-card node-card-with-background">
        
        <!-- Node Body -->
        <div class="node-body">
            <div class="node-content">
                <!-- Slot for node-specific content -->
                <slot/>
            </div>
        </div>
    </Card>
</div>

<style>

    .error {
        text-color: #ff0000;
    }

</style>