<script lang="ts">
    import {Tooltip} from 'flowbite-svelte';
    import {Info} from 'lucide-svelte';
    import {Card} from 'flowbite-svelte';
    import type {ExecutionStatus} from "$lib/compositor/ComputedDataCache";
    import {untrack} from "svelte";
    import {NodeResizeControl} from "@xyflow/svelte";

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
        class:executing={executionStatus && executionStatus.startedAt && !executionStatus.stoppedAt}
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
                <NodeResizeControl
                        minWidth={100}
                        minHeight={50}
                        style="background: transparent; border: none;"
                >
                    <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                            stroke="rgb(128, 128, 128)"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            style="position: absolute; right: 5px; bottom: 5px;"
                    >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <polyline points="16 20 20 20 20 16"/>
                        <line x1="14" y1="14" x2="20" y2="20"/>
                        <polyline points="8 4 4 4 4 8"/>
                        <line x1="4" y1="4" x2="10" y2="10"/>
                    </svg>
                </NodeResizeControl>
            </div>
        </div>
    </Card>
</div>

<style>

    .error {
        text-color: #ff0000;
    }

    .node-container.executing {
        box-shadow: 0 0 15px 5px rgba(255, 165, 0, 0.7);
        animation: glow 1.5s infinite alternate;
    }

    @keyframes glow {
        from {
            box-shadow: 0 0 15px 5px rgba(255, 165, 0, 0.7);
        }
        to {
            box-shadow: 0 0 25px 10px rgba(255, 165, 0, 1);
        }
    }

</style>