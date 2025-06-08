<script lang="ts">
    import { onMount } from 'svelte';
    import Logo from "../components/Logo.svelte";
    import EmailSignup from "../components/EmailSignup.svelte";
    import {goto} from "$app/navigation";

    let heroTitle: HTMLElement | undefined = undefined;

    onMount(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });

        return () => observer.disconnect();
    });
</script>

<div class="min-h-screen bg-gray-950">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <header class="py-6">
            <nav class="bg-gray-900/30 backdrop-blur-lg border border-gray-800/50 rounded-xl p-4 flex justify-between items-center">
                <div class="flex items-center space-x-8">
                    <Logo />
                    <div class="hidden md:flex space-x-6">
                        <a href="/tutorials" class="text-gray-300 hover:text-blue-400 transition-colors duration-200">Tutorials</a>
                        <a href="/hub" class="text-gray-300 hover:text-orange-400 transition-colors duration-200">Hub</a>
                        <a href="/fridge" class="text-gray-300 hover:text-blue-400 transition-colors duration-200">Fridge</a>
                    </div>
                </div>
                <button on:click={goto('/login')} class="hidden md:flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105">
                    <svg class="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    Login
                </button>
            </nav>
        </header>

        <!-- Hero Section -->
        <section class="py-20 text-center">
            <h1 class="text-6xl md:text-8xl font-bold mb-8 animate-on-scroll bg-gradient-to-r from-blue-500 to-orange-500 bg-clip-text text-transparent">
                Flow Your Logic
            </h1>
            <p class="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 animate-on-scroll">
                The cloud-based visual programming platform that puts AI workflows at your fingertips.
                No GPUs, no setup, no hassle—just pure creative power.
            </p>
            <div class="flex flex-col sm:flex-row gap-6 justify-center animate-on-scroll">
                <button on:click={goto('/app')} class="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg rounded-lg transform hover:-translate-y-1 transition-all duration-200 shadow-lg hover:shadow-xl">
                    Start Building
                </button>
                <button on:click={goto('/app/demos')} class="px-8 py-4 bg-transparent border-2 border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-semibold text-lg rounded-lg transform hover:-translate-y-1 transition-all duration-200">
                    Explore Demos
                </button>
            </div>
        </section>

        <!-- Advantages Section -->
        <section class="py-20">
            <div class="text-center mb-16 animate-on-scroll">
                <h2 class="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                    Why Choose Noodler over ComfyUI?
                </h2>
                <p class="text-xl text-gray-400 max-w-3xl mx-auto">
                    Break free from hardware limitations and security concerns with our cloud-first approach
                </p>
            </div>

            <div class="grid lg:grid-cols-2 xl:grid-cols-4 gap-8 mb-16">
                <!-- 100% Cloud-Based AI -->
                <div class="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-lg border border-green-800/50 rounded-xl p-8 hover:border-green-500 transition-all duration-300 hover:-translate-y-2 animate-on-scroll">
                    <div class="text-5xl mb-6 text-green-400">☁️</div>
                    <h3 class="text-2xl font-bold mb-4 text-green-300">100% Cloud-Based AI</h3>
                    <p class="text-gray-300 mb-6 leading-relaxed">
                        Forget about expensive GPU rigs, driver installations, or downloading massive model files. 
                        Our cloud infrastructure handles all the heavy lifting, with models automatically updated and managed for you.
                    </p>
                    <div class="text-sm text-green-400 bg-green-900/30 rounded-lg p-3">
                        <strong>✓ No GPU required</strong><br>
                        <strong>✓ No driver headaches</strong><br>
                        <strong>✓ No model downloads</strong><br>
                        <strong>✓ Auto-updated models</strong><br>
                        <strong>✓ Access from any device</strong>
                    </div>
                </div>

                <!-- Zero Risk Security -->
                <div class="bg-gradient-to-br from-blue-900/30 to-indigo-900/30 backdrop-blur-lg border border-blue-800/50 rounded-xl p-8 hover:border-blue-500 transition-all duration-300 hover:-translate-y-2 animate-on-scroll">
                    <div class="text-5xl mb-6 text-blue-400">🔒</div>
                    <h3 class="text-2xl font-bold mb-4 text-blue-300">Zero Risk - No Trust Required</h3>
                    <p class="text-gray-300 mb-6 leading-relaxed">
                        Complete isolation means you never have to trust unknown code. Every node runs in a secure browser sandbox 
                        and isolated cloud environment with zero access to your local system.
                    </p>
                    <div class="text-sm text-blue-400 bg-blue-900/30 rounded-lg p-3">
                        <strong>✓ Zero local system risk</strong><br>
                        <strong>✓ Complete isolation</strong><br>
                        <strong>✓ No trust required</strong><br>
                        <strong>✓ Safe experimentation</strong>
                    </div>
                </div>

                <!-- Instant API Deployment -->
                <div class="bg-gradient-to-br from-purple-900/30 to-violet-900/30 backdrop-blur-lg border border-purple-800/50 rounded-xl p-8 hover:border-purple-500 transition-all duration-300 hover:-translate-y-2 animate-on-scroll">
                    <div class="text-5xl mb-6 text-purple-400">🚀</div>
                    <h3 class="text-2xl font-bold mb-4 text-purple-300">Deploy & Scale Instantly</h3>
                    <p class="text-gray-300 mb-6 leading-relaxed">
                        Turn any workflow into a production API with one click. Scale automatically based on demand 
                        without managing servers, containers, or infrastructure.
                    </p>
                    <div class="text-sm text-purple-400 bg-purple-900/30 rounded-lg p-3">
                        <strong>✓ One-click API deployment</strong><br>
                        <strong>✓ Auto-scaling infrastructure</strong><br>
                        <strong>✓ No server management</strong><br>
                        <strong>✓ Production-ready instantly</strong>
                    </div>
                </div>

                <!-- Unbreakable Workflows -->
                <div class="bg-gradient-to-br from-orange-900/30 to-red-900/30 backdrop-blur-lg border border-orange-800/50 rounded-xl p-8 hover:border-orange-500 transition-all duration-300 hover:-translate-y-2 animate-on-scroll">
                    <div class="text-5xl mb-6 text-orange-400">🔗</div>
                    <h3 class="text-2xl font-bold mb-4 text-orange-300">Unbreakable Workflows</h3>
                    <p class="text-gray-300 mb-6 leading-relaxed">
                        Schema-stable architecture ensures your workflows never break from updates. 
                        Focus on creativity, not debugging broken connections.
                    </p>
                    <div class="text-sm text-orange-400 bg-orange-900/30 rounded-lg p-3">
                        <strong>✓ Schema-stable nodes</strong><br>
                        <strong>✓ Backward compatibility</strong><br>
                        <strong>✓ No workflow breakage</strong><br>
                        <strong>✓ Reliable automation</strong>
                    </div>
                </div>
            </div>

            <!-- Comparison Table -->
            <div class="bg-gray-900/50 backdrop-blur-lg border border-gray-800/50 rounded-xl p-8 animate-on-scroll">
                <h3 class="text-2xl font-bold mb-6 text-center text-white">Quick Comparison</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-700">
                                <th class="text-left py-3 px-4 text-gray-300">Feature</th>
                                <th class="text-center py-3 px-4 text-green-400 font-bold">Noodler.xyz</th>
                                <th class="text-center py-3 px-4 text-gray-400">ComfyUI</th>
                            </tr>
                        </thead>
                        <tbody class="text-gray-300">
                            <tr class="border-b border-gray-800">
                                <td class="py-3 px-4">Hardware Requirements</td>
                                <td class="text-center py-3 px-4 text-green-400">✓ None - Cloud-based</td>
                                <td class="text-center py-3 px-4 text-red-400">✗ GPU, VRAM, Drivers</td>
                            </tr>
                            <tr class="border-b border-gray-800">
                                <td class="py-3 px-4">Model Management</td>
                                <td class="text-center py-3 px-4 text-green-400">✓ Auto-updated in Cloud</td>
                                <td class="text-center py-3 px-4 text-red-400">✗ Manual Downloads (GBs)</td>
                            </tr>
                            <tr class="border-b border-gray-800">
                                <td class="py-3 px-4">Security Risk</td>
                                <td class="text-center py-3 px-4 text-green-400">✓ Zero - No Trust Required</td>
                                <td class="text-center py-3 px-4 text-red-400">✗ Local System Access</td>
                            </tr>
                            <tr class="border-b border-gray-800">
                                <td class="py-3 px-4">Setup Time</td>
                                <td class="text-center py-3 px-4 text-green-400">✓ Instant - Open Browser</td>
                                <td class="text-center py-3 px-4 text-red-400">✗ Hours of Installation</td>
                            </tr>
                            <tr class="border-b border-gray-800">
                                <td class="py-3 px-4">API Deployment</td>
                                <td class="text-center py-3 px-4 text-green-400">✓ One-click + Auto-scale</td>
                                <td class="text-center py-3 px-4 text-red-400">✗ Manual Server Setup</td>
                            </tr>
                            <tr>
                                <td class="py-3 px-4">Device Compatibility</td>
                                <td class="text-center py-3 px-4 text-green-400">✓ Any Device</td>
                                <td class="text-center py-3 px-4 text-red-400">✗ Powerful Desktop Only</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <!-- Features Grid -->
        <section class="py-20">
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {#each [
                    {icon: '💬', title: 'Prompt Engineering', desc: 'Professional prompt structuring with visual templates'},
                    {icon: '☁️', title: 'Cloud-First AI', desc: 'Access powerful models without local hardware'},
                    {icon: '🎨', title: 'Visual Logic Designer', desc: 'Drag, drop, and connect nodes without code'},
                    {icon: '🔨', title: 'API Orchestrator', desc: 'Connect multiple services and automate workflows'},
                    {icon: '🛡️', title: 'Secure Execution', desc: 'Browser-sandboxed, cloud-isolated processing'},
                    {icon: '🧠', title: 'AI Integration', desc: 'Seamlessly integrate LLMs and AI services'},
                    {icon: '🚀', title: 'Instant Deployment', desc: 'Deploy workflows in seconds, not hours'}
                ] as feature}
                    <div class="bg-gray-900/30 backdrop-blur-lg border border-gray-800/50 rounded-xl p-6 hover:border-blue-500 transition-all duration-300 hover:-translate-y-2 animate-on-scroll group cursor-pointer">
                        <div class="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">{feature.icon}</div>
                        <h3 class="text-xl font-semibold mb-2 text-white group-hover:text-blue-400 transition-colors duration-200">{feature.title}</h3>
                        <p class="text-gray-400 group-hover:text-gray-300 transition-colors duration-200">{feature.desc}</p>
                    </div>
                {/each}
            </div>
        </section>

        <!-- Email Signup -->
        <section class="py-20">
            <div class="bg-gray-900/30 backdrop-blur-lg border border-gray-800/50 rounded-xl p-8 max-w-2xl mx-auto text-center animate-on-scroll">
                <EmailSignup
                        title="Join the Waitlist"
                        subtitle="Be the first to experience the future of visual programming"
                        buttonText="Get Early Access"
                        successMessage="You're in! 🎉"
                />
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-transparent border-t border-gray-800 mt-20">
            <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                        <h3 class="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Product</h3>
                        <ul class="space-y-3">
                            <li><a href="/fridge" class="text-gray-300 hover:text-blue-400 transition-colors duration-200">Noodle Fridge</a></li>
                            <li><a href="/app" class="text-gray-300 hover:text-blue-400 transition-colors duration-200">Noodle Board</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Support</h3>
                        <ul class="space-y-3">
                            <li><a href="/contact" class="text-gray-300 hover:text-orange-400 transition-colors duration-200">Help</a></li>
                            <li><a href="/contact" class="text-gray-300 hover:text-orange-400 transition-colors duration-200">Community</a></li>
                            <li><a href="/contact" class="text-gray-300 hover:text-orange-400 transition-colors duration-200">Report Bug</a></li>
                            <li><a href="/contact" class="text-gray-300 hover:text-orange-400 transition-colors duration-200">Contact</a></li>
                            <li><a href="/tutorials" class="text-gray-300 hover:text-orange-400 transition-colors duration-200">Tutorials</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Company</h3>
                        <ul class="space-y-3">
                            <li><a href="/about" class="text-gray-300 hover:text-blue-400 transition-colors duration-200">About</a></li>
                            <li><a href="/hub" class="text-gray-300 hover:text-blue-400 transition-colors duration-200">Hub</a></li>
                            <li><a href="/about-me" class="text-gray-300 hover:text-blue-400 transition-colors duration-200">The Creator</a></li>
                            <li><a href="/about-me/my-projects" class="text-gray-300 hover:text-blue-400 transition-colors duration-200">My Other Works</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Legal</h3>
                        <ul class="space-y-3">
                            <li><a href="/privacy" class="text-gray-300 hover:text-orange-400 transition-colors duration-200">Privacy</a></li>
                            <li><a href="/terms" class="text-gray-300 hover:text-orange-400 transition-colors duration-200">Terms</a></li>
                        </ul>
                    </div>
                </div>
                <div class="mt-12 border-t border-gray-800 pt-8">
                    <p class="text-center text-gray-400">
                        © 2025 Noodler Technologies LLC. Flow your imagination.
                    </p>
                </div>
            </div>
        </footer>
    </div>
</div>

<style>
    :global(body) {
        background: radial-gradient(circle at top right, rgba(254, 121, 93, 0.1), transparent),
        radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.1), transparent);
    }

    .animate-on-scroll {
        opacity: 1;
        transform: translateY(0px);
    }

    .fade-in-up {
        animation: fadeInUp 0.6s ease forwards;
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>