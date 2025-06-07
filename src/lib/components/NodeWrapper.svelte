<script lang="ts">
    import { Tooltip } from 'flowbite-svelte';
    import { Info, CheckCircle, AlertCircle, Clock } from 'lucide-svelte';
    import { Card } from 'flowbite-svelte';

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
    <Card class="node-card">
        <!-- Node Header -->
        <div class="node-header" role="button" tabindex="0">
            <div class="header-content">
                <div class="title-section">
                    <h3 class="node-title">{label}</h3>
                </div>

                <div class="header-actions">
                    <!-- Status indicator -->
                    <div class="status-indicator">
                        {#if nodeState === 'running'}
<!--                            <Spinner size="4" />-->
                            <div>spinner!</div>
                        {:else if nodeState === 'success'}
                            <CheckCircle size={16} class="text-green-600" />
                        {:else if nodeState === 'error'}
                            <AlertCircle size={16} class="text-red-600" />
                        {:else}
                            <Clock size={16} class="text-gray-500" />
                        {/if}
                    </div>

                    <!-- Info tooltip -->
                    {#if documentation}
                        <div class="info-icon">
                            <Info size={16} />
                            <Tooltip placement="top">{documentation}</Tooltip>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Execution info -->
            {#if executionTime > 0}
                <div class="execution-info">
          <span class="execution-time">
            {executionTime}ms
          </span>
                    {#if nodeState === 'error' && errorMessage}
            <span class="error-message" title={errorMessage}>
              {errorMessage.length > 30 ? errorMessage.substring(0, 30) + '...' : errorMessage}
            </span>
                    {/if}
                </div>
            {/if}
        </div>

        <!-- Node Body -->
        <div class="node-body">
            <div class="node-content">
                <!-- Slot for node-specific content -->
                <slot />
            </div>
        </div>
    </Card>
</div>

<style>

</style>