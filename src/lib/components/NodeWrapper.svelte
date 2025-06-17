<script lang="ts">
    import {Tooltip} from 'flowbite-svelte';
    import {Info, CheckCircle, AlertCircle, Clock} from 'lucide-svelte';
    import {Card} from 'flowbite-svelte';

    interface NodeWrapperProps {
        label: string;
        documentation?: string;
        nodeState?: 'idle' | 'running' | 'success' | 'error';
        executionTime?: number;
        errorMessage?: string;
        isSelected?: boolean;
    }

    let {
        label,
        documentation,
        nodeState = 'idle',
        executionTime = 0,
        errorMessage = '',
        isSelected = false
    }: NodeWrapperProps = $props();

    // Get node status color
    function getStatusColor(state: typeof nodeState): string {
        switch (state) {
            case 'running':
                return 'blue';
            case 'success':
                return 'green';
            case 'error':
                return 'red';
            default:
                return 'gray';
        }
    }
</script>

<div
        class="node-container"
        class:selected={isSelected}
        class:executing={nodeState === 'running'}
        class:success={nodeState === 'success'}
        class:error={nodeState === 'error'}
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
                    <span class="execution-time">{executionTime}ms</span>
                </div>
            {:else}
                <div class="execution-info">
                    <span class="execution-time">idle</span>
                </div>
            {/if}
        </div>

    </div>

    <Card class="node-card">
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

</style>