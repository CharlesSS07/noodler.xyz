<script lang="ts">
    import { onMount } from 'svelte';
    import { currentUser } from '$lib/stores/AppState.js';
    import { functions } from '../../firebase/index.js';
    import { httpsCallable } from 'firebase/functions';

    interface HealthCheckResult {
        name: string;
        status: 'loading' | 'success' | 'error';
        explanation: string;
        response?: any;
    }

    let healthChecks = $state<HealthCheckResult[]>([
        {
            name: 'Public Health Check',
            status: 'loading',
            explanation: 'Testing public endpoint accessible to all users'
        },
        {
            name: 'Authenticated Health Check',
            status: 'loading',
            explanation: 'Testing endpoint that requires user authentication'
        },
        {
            name: 'Verified Email Health Check',
            status: 'loading',
            explanation: 'Testing endpoint that requires verified email address'
        }
    ]);

    async function runPublicHealthCheck(): Promise<void> {
        try {
            const callable = httpsCallable(functions, 'publicHealthCheck');
            const result = await callable({});
            console.log(result);
            const data = result.data as any;

            healthChecks[0] = {
                ...healthChecks[0],
                status: 'success',
                explanation: `✅ Public endpoint working: ${data.message}`,
                response: data
            };
        } catch (error: any) {
            healthChecks[0] = {
                ...healthChecks[0],
                status: 'error',
                explanation: `❌ Public endpoint error: ${error.message || 'Unknown error'}`
            };
        }
    }

    async function runAuthenticatedHealthCheck(): Promise<void> {
        try {
            const user = $currentUser;
            if (!user) {
                healthChecks[1] = {
                    ...healthChecks[1],
                    status: 'error',
                    explanation: '❌ User not authenticated - please log in first'
                };
                return;
            }

            const callable = httpsCallable(functions, 'authenticatedHealthCheck');
            const result = await callable({});
            const data = result.data as any;

            healthChecks[1] = {
                ...healthChecks[1],
                status: 'success',
                explanation: `✅ Authenticated endpoint working: ${data.message}`,
                response: data
            };
        } catch (error: any) {
            healthChecks[1] = {
                ...healthChecks[1],
                status: 'error',
                explanation: `❌ Authenticated endpoint error: ${error.message || 'Unknown error'}`
            };
        }
    }

    async function runVerifiedEmailHealthCheck(): Promise<void> {
        try {
            const user = $currentUser;
            if (!user) {
                healthChecks[2] = {
                    ...healthChecks[2],
                    status: 'error',
                    explanation: '❌ User not authenticated - please log in first'
                };
                return;
            }

            if (!user.emailVerified) {
                healthChecks[2] = {
                    ...healthChecks[2],
                    status: 'error',
                    explanation: '❌ Email not verified - please verify your email address first'
                };
                return;
            }

            const callable = httpsCallable(functions, 'verifiedEmailHealthCheck');
            const result = await callable({});
            const data = result.data as any;

            healthChecks[2] = {
                ...healthChecks[2],
                status: 'success',
                explanation: `✅ Verified email endpoint working: ${data.message}`,
                response: data
            };
        } catch (error: any) {
            healthChecks[2] = {
                ...healthChecks[2],
                status: 'error',
                explanation: `❌ Verified email endpoint error: ${error.message || 'Unknown error'}`
            };
        }
    }

    async function runAllHealthChecks(): Promise<void> {
        // Reset all to loading state
        healthChecks = healthChecks.map(check => ({
            ...check,
            status: 'loading' as const,
            explanation: check.name.includes('Public') ? 'Testing public endpoint accessible to all users' :
                        check.name.includes('Authenticated') ? 'Testing endpoint that requires user authentication' :
                        'Testing endpoint that requires verified email address'
        }));

        // Run all checks in parallel
        await Promise.all([
            runPublicHealthCheck(),
            runAuthenticatedHealthCheck(),
            runVerifiedEmailHealthCheck()
        ]);
    }

    function getStatusColor(status: string): string {
        switch (status) {
            case 'success': return 'text-green-600';
            case 'error': return 'text-red-600';
            case 'loading': return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    }

    function getStatusIcon(status: string): string {
        switch (status) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'loading': return '⏳';
            default: return '❓';
        }
    }

    onMount(() => {
        // Wait a bit for auth state to initialize, then run health checks
        setTimeout(() => {
            runAllHealthChecks();
        }, 500);
    });
</script>

<div class="container mx-auto p-6">
    <div class="mb-6">
        <h1 class="text-3xl font-bold mb-2">Health Checks</h1>
        <p class="text-gray-600 mb-4">Test Firebase Cloud Function endpoints with different authentication levels</p>
        
        <button 
            onclick={runAllHealthChecks}
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
            Run All Checks
        </button>
    </div>

    <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <table class="min-w-full">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Explanation
                    </th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                {#each healthChecks as check, index}
                    <tr class={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {check.name}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm {getStatusColor(check.status)}">
                            <span class="inline-flex items-center">
                                <span class="mr-2">{getStatusIcon(check.status)}</span>
                                <span class="capitalize">{check.status}</span>
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-900">
                            <div class="max-w-xs lg:max-w-md">
                                {check.explanation}
                            </div>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>

    {#if $currentUser}
        <div class="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 class="text-lg font-medium mb-2">Current User Info</h3>
            <p><strong>UID:</strong> {$currentUser.uid}</p>
            <p><strong>Email:</strong> {$currentUser.email || 'No email'}</p>
            <p><strong>Email Verified:</strong> {$currentUser.emailVerified ? '✅ Yes' : '❌ No'}</p>
        </div>
    {:else}
        <div class="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 class="text-lg font-medium mb-2">⚠️ Not Authenticated</h3>
            <p>You are not logged in. Only the public health check will work.</p>
        </div>
    {/if}
</div>

<style>
    .container {
        max-width: 1200px;
    }
</style>