<script lang="ts">
    import {Tooltip} from 'flowbite-svelte';
    import {Info} from 'lucide-svelte';
    import {Card} from 'flowbite-svelte';
    import type {ExecutionStatus} from "$lib/compositor/ComputedDataCache";
    import {untrack} from "svelte";

    interface NodeWrapperProps {
        label: string;
        documentation?: string;
        executionStatus?: ExecutionStatus;
        isSelected?: boolean;
    }

    let {
        label,
        documentation,
        executionStatus,
        isSelected = false
    }: NodeWrapperProps = $props();

    let executionIndicator: number | string = $state('idle');

    let drawIndicatorLoop: NodeJS.Timeout | null = null;

    $effect(() => {

        untrack(() => {
            if (drawIndicatorLoop) {
                clearInterval(drawIndicatorLoop);
                drawIndicatorLoop = null;
            }
        });

        if (executionStatus) {
            untrack(() => {
                if (executionStatus.startedAt && executionStatus.stoppedAt) {
                    executionIndicator = executionStatus.stoppedAt.getTime() - executionStatus.startedAt.getTime();
                } else if (executionStatus.startedAt) {
                    drawIndicatorLoop = setInterval(() => {
                        executionIndicator = Date.now() - executionStatus.startedAt.getTime();
                    });
                } else {
                    executionIndicator = 'idle';
                }
            });
        } else {
            executionIndicator = 'idle';
        }
    })
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
            {#if typeof executionIndicator === "number"}
                <div class="execution-info">
                    <span class="execution-time" class:errorEncountered={'error'} >{executionIndicator}ms</span>
                </div>
            {:else if typeof executionIndicator === "string"}
                <div class="execution-info">
                    <span class="execution-time" class:errorEncountered={'error'} >{executionIndicator}</span>
                </div>
            {:else }
                <div class="execution-info">
                    <span class="execution-time" class:errorEncountered={'error'} >{executionIndicator}</span>
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