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
                Design, connect, and execute complex workflows with the power of visual programming.
                From AI prompts to art.
            </p>
            <div class="flex flex-col sm:flex-row gap-6 justify-center animate-on-scroll">
                <button on:click={goto('/app')} class="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg rounded-lg transform hover:-translate-y-1 transition-all duration-200 shadow-lg hover:shadow-xl">
                    Start Building
                </button>
                <button class="px-8 py-4 bg-transparent border-2 border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-semibold text-lg rounded-lg transform hover:-translate-y-1 transition-all duration-200">
                    Watch Demo
                </button>
            </div>
        </section>

        <!-- Features Grid -->
        <section class="py-20">
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {#each [
                    {icon: '💬', title: 'Prompt Engineering', desc: 'Plug-n-play prompt structuring.'},
                    {icon: '🤖', title: 'AI Workflow Builder', desc: 'Create sophisticated general-AI pipelines'},
                    {icon: '🎨', title: 'Visual Logic Designer', desc: 'Drag, drop, and connect nodes without code'},
                    {icon: '🔨', title: 'API Orchestrator', desc: 'Connect multiple services and quickly automate workflows'},
                    {icon: '🔗', title: 'Node-Based Flow', desc: 'Visual programming made intuitive'},
                    {icon: '🧠', title: 'AI Integration', desc: 'Seamlessly integrate LLMs and AI services'},
                    {icon: '🚀', title: 'Real-time Execution', desc: 'See your logic flow in action'}
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