<script lang="ts">
    import { goto } from "$app/navigation";

    import {type Tier, tiers} from "$shared/pricing";

    function formatPrice(price?: number): string {
        if (price === undefined) return 'Contact Sales';
        return price === 0 ? 'Free' : `$${price}`;
    }
</script>

<div class="min-h-screen bg-gray-950">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <!-- Header -->
        <div class="text-center mb-16">
            <h1 class="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Simple, Transparent Pricing
            </h1>
            <p class="text-xl text-gray-400 max-w-3xl mx-auto">
                Choose the plan that fits your creative needs. All plans include access to our cloud-based AI platform.
            </p>
        </div>

        <!-- Pricing Cards -->
        <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {#each Object.entries(tiers) as [key, tier]}
                <div class="bg-gray-900/50 backdrop-blur-lg border border-gray-800/50 rounded-xl p-8 hover:border-blue-500 transition-all duration-300 hover:-translate-y-2 {key === 'paid' ? 'border-blue-500 scale-105' : ''}">
                    {#if key === 'paid'}
                        <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-full text-center mb-6">
                            Most Popular
                        </div>
                    {/if}
                    
                    <div class="text-center mb-8">
                        <h3 class="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                        <div class="text-4xl font-bold text-white mb-2">
                            {formatPrice(tier.monthly_price)}
                            {#if tier.monthly_price !== undefined && tier.monthly_price > 0}
                                <span class="text-lg text-gray-400">/month</span>
                            {/if}
                        </div>
                        {#if tier.daily_token_budget !== undefined}
                            <div class="text-gray-400 mt-2">
                                {tier.daily_token_budget.toLocaleString()} tokens/day
                            </div>
                        {:else}
                            <div class="text-gray-400 mt-2">
                                Unlimited tokens
                            </div>
                        {/if}
                    </div>

                    <ul class="space-y-4 mb-8">
                        {#each tier.features as feature}
                            <li class="flex items-start">
                                <svg class="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                                </svg>
                                <span class="text-gray-300">{feature}</span>
                            </li>
                        {/each}
                    </ul>

                    <button 
                        on:click={() => goto('/app')}
                        class="w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 {key === 'paid' ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'}"
                    >
                        {tier.monthly_price === undefined ? 'Contact Sales' : tier.monthly_price === 0 ? 'Get Started Free' : 'Start Free Trial'}
                    </button>
                </div>
            {/each}
        </div>

        <!-- FAQ Section -->
        <div class="mt-20 max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold text-center text-white mb-12">Frequently Asked Questions</h2>
            <div class="space-y-8">
                <div class="bg-gray-900/30 backdrop-blur-lg border border-gray-800/50 rounded-xl p-6">
                    <h3 class="text-xl font-semibold text-white mb-3">What are tokens?</h3>
                    <p class="text-gray-400">
                        Tokens are units of computational resources used by our AI models. Different operations consume different amounts of tokens - simple text operations use fewer tokens, while complex image or video generation uses more.
                    </p>
                </div>
                
                <div class="bg-gray-900/30 backdrop-blur-lg border border-gray-800/50 rounded-xl p-6">
                    <h3 class="text-xl font-semibold text-white mb-3">Can I upgrade or downgrade anytime?</h3>
                    <p class="text-gray-400">
                        Yes! You can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at the end of your current billing period.
                    </p>
                </div>
                
                <div class="bg-gray-900/30 backdrop-blur-lg border border-gray-800/50 rounded-xl p-6">
                    <h3 class="text-xl font-semibold text-white mb-3">Do unused tokens roll over?</h3>
                    <p class="text-gray-400">
                        Tokens reset daily and do not roll over. This ensures fair usage and optimal performance for all users.
                    </p>
                </div>
                
                <div class="bg-gray-900/30 backdrop-blur-lg border border-gray-800/50 rounded-xl p-6">
                    <h3 class="text-xl font-semibold text-white mb-3">Is there a free trial?</h3>
                    <p class="text-gray-400">
                        Yes! All paid plans come with a free trial period. Start with our Content Creator tier for free, or try any paid plan risk-free.
                    </p>
                </div>
            </div>
        </div>

        <!-- Call to Action -->
        <div class="mt-20 text-center">
            <div class="bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-lg border border-blue-800/50 rounded-xl p-8 max-w-2xl mx-auto">
                <h3 class="text-2xl font-bold text-white mb-4">Ready to Get Started?</h3>
                <p class="text-gray-400 mb-6">
                    Join thousands of creators who are already building amazing AI workflows with Noodler.
                </p>
                <button 
                    on:click={() => goto('/app')}
                    class="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:-translate-y-1"
                >
                    Start Building Now
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    :global(body) {
        background: radial-gradient(circle at top right, rgba(254, 121, 93, 0.1), transparent),
        radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.1), transparent);
    }
</style>