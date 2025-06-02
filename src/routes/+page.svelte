<script lang="ts">
    import { onMount } from 'svelte';
    import Logo from "../components/Logo.svelte";
    import { Card, Button, Footer, FooterLinkGroup, FooterLink, Toolbar, ToolbarButton, ToolbarGroup } from 'flowbite-svelte';
    import { HomeOutline, EnvelopeOutline, ImageOutline, CogOutline, UserOutline } from "flowbite-svelte-icons"; // Added UserOutline for Login button

    let heroTitle: HTMLElement | undefined = undefined;
    let gradientPosition = 0;

    onMount(() => {
        // Add entrance animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    (entry.target as HTMLElement).style.opacity = '1';
                    (entry.target as HTMLElement).style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.cta-card, .feature-item').forEach((el: Element) => {
            (el as HTMLElement).style.opacity = '0';
            (el as HTMLElement).style.transform = 'translateY(30px)';
            (el as HTMLElement).style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });

        // Add dynamic gradient animation to hero title
        const gradientInterval = setInterval(() => {
            gradientPosition = (gradientPosition + 1) % 360;
            if (heroTitle) {
                heroTitle.style.background = `linear-gradient(${gradientPosition}deg, #a855f7, #3b82f6, #06b6d4)`; /* Adjusted gradient colors */
                heroTitle.style.webkitBackgroundClip = 'text';
                heroTitle.style.webkitTextFillColor = 'transparent';
                heroTitle.style.backgroundClip = 'text';
            }
        }, 100);

        return () => {
            clearInterval(gradientInterval);
            observer.disconnect();
        };
    });

    function handleCardClick(url: string) {
        window.location.href = url;
    }
</script>

<div class="floating-orbs">
    <div class="orb"></div>
    <div class="orb"></div>
    <div class="orb"></div>
    <div class="orb"></div>
</div>

<div class="container">
    <header class="py-4">
        <Toolbar class="bg-gray-950 bg-opacity-70 backdrop-blur-md rounded-xl p-4 border border-gray-700 flex justify-between items-center w-full max-w-full">
            <ToolbarGroup class="flex items-center space-x-4">
                <a href="/">
                    <Logo />
                </a>
                <a href="/tutorials" class="toolbar-link text-cyan-400 hover:text-cyan-300">Tutorials</a>
                <a href="/hub" class="toolbar-link text-fuchsia-400 hover:text-fuchsia-300">Noodle Hub</a>
                <a href="/fridge" class="toolbar-link text-teal-400 hover:text-teal-300">My Noodles (fridge)</a>
            </ToolbarGroup>
            <ToolbarGroup>
                <a href="/login" class="login-btn">
                    <ToolbarButton class="login-button-bg text-white hover:brightness-110">
                        <UserOutline class="h-5 w-5 mr-1" /> Login
                    </ToolbarButton>
                </a>
            </ToolbarGroup>
        </Toolbar>
    </header>

    <section class="hero">
        <h1 bind:this={heroTitle}>Flow Your Logic</h1>
        <p class="text-indigo-300">Design, connect, and execute complex workflows with the power of visual programming. From AI prompts to API orchestration.</p>
    </section>

    <section class="cta-container">
        <Card class="cta-card bg-gray-900 bg-opacity-5 backdrop-blur-md border border-gray-700 hover:border-purple-500" on:click={() => handleCardClick('/app')}>
            <div class="cta-icon text-pink-400">🤖</div>
            <h3 class="text-white">AI Workflow Builder</h3>
            <p class="text-purple-300">Create sophisticated AI pipelines with prompt engineering, model chaining, and intelligent decision trees.</p>
            <Button href="/app" class="cta-btn">Build AI Flows</Button>
        </Card>

        <Card class="cta-card bg-gray-900 bg-opacity-5 backdrop-blur-md border border-gray-700 hover:border-purple-500" on:click={() => handleCardClick('/app')}>
            <div class="cta-icon text-lime-400">🎨</div>
            <h3 class="text-white">Visual Logic Designer</h3>
            <p class="text-green-300">Drag, drop, and connect nodes to build complex logic without writing a single line of code.</p>
            <Button href="/app" class="cta-btn">Start Designing</Button>
        </Card>

        <Card class="cta-card bg-gray-900 bg-opacity-5 backdrop-blur-md border border-gray-700 hover:border-purple-500" on:click={() => handleCardClick('/app')}>
            <div class="cta-icon text-yellow-400">⚡</div>
            <h3 class="text-white">API Orchestrator</h3>
            <p class="text-orange-300">Connect multiple services, transform data, and automate workflows with powerful API integration tools.</p>
            <Button href="/app" class="cta-btn">Orchestrate APIs</Button>
        </Card>

        <Card class="cta-card bg-gray-900 bg-opacity-5 backdrop-blur-md border border-gray-700 hover:border-purple-500" on:click={() => handleCardClick('/app')}>
            <div class="cta-icon text-sky-400">🖼️</div>
            <h3 class="text-white">Image Processing Studio</h3>
            <p class="text-blue-300">Build custom image editing pipelines with filters, transformations, and AI-powered enhancements.</p>
            <Button href="/app" class="cta-btn">Process Images</Button>
        </Card>
    </section>

    <section class="features">
        <h2 class="text-center text-white text-4xl font-extrabold mb-8">Unlimited Possibilities</h2>
        <div class="features-grid">
            <div class="feature-item bg-gray-900 bg-opacity-5 rounded-2xl p-6 text-center border border-gray-800 hover:bg-opacity-10">
                <div class="feature-icon text-red-400">🔗</div>
                <h3 class="text-white text-xl font-semibold mb-2">Node-Based Flow</h3>
                <p class="text-red-300">Visual programming made intuitive with drag-and-drop node connections</p>
            </div>
            <div class="feature-item bg-gray-900 bg-opacity-5 rounded-2xl p-6 text-center border border-gray-800 hover:bg-opacity-10">
                <div class="feature-icon text-green-400">🧠</div>
                <h3 class="text-white text-xl font-semibold mb-2">AI Integration</h3>
                <p class="text-green-300">Seamlessly integrate LLMs, prompt templates, and AI services</p>
            </div>
            <div class="feature-item bg-gray-900 bg-opacity-5 rounded-2xl p-6 text-center border border-gray-800 hover:bg-opacity-10">
                <div class="feature-icon text-yellow-400">🚀</div>
                <h3 class="text-white text-xl font-semibold mb-2">Real-time Execution</h3>
                <p class="text-yellow-300">See your logic flow in action with live preview and debugging</p>
            </div>
            <div class="feature-item bg-gray-900 bg-opacity-5 rounded-2xl p-6 text-center border border-gray-800 hover:bg-opacity-10">
                <div class="feature-icon text-purple-400">📦</div>
                <h3 class="text-white text-xl font-semibold mb-2">Extensible</h3>
                <p class="text-purple-300">Add custom nodes, integrations, and expand functionality</p>
            </div>
            <div class="feature-item bg-gray-900 bg-opacity-5 rounded-2xl p-6 text-center border border-gray-800 hover:bg-opacity-10">
                <div class="feature-icon text-blue-400">🎯</div>
                <h3 class="text-white text-xl font-semibold mb-2">Precision Control</h3>
                <p class="text-blue-300">Fine-tune every aspect of your workflow with advanced settings</p>
            </div>
            <div class="feature-item bg-gray-900 bg-opacity-5 rounded-2xl p-6 text-center border border-gray-800 hover:bg-opacity-10">
                <div class="feature-icon text-orange-400">💾</div>
                <h3 class="text-white text-xl font-semibold mb-2">Project Management</h3>
                <p class="text-orange-300">Organize and version your flows in the Noodle Manager (fridge)</p>
            </div>
        </div>
    </section>

    <Footer footerType="sitemap" class="bg-transparent border-t border-gray-800 mt-16 py-8">
        <div class="footer-links flex justify-center flex-wrap gap-x-8 gap-y-4 mb-8">
            <FooterLinkGroup ulClass="flex flex-wrap justify-center gap-x-8 gap-y-4">
                <FooterLink href="/about" class="text-gray-400 hover:text-cyan-500 transition-colors">About Noodler</FooterLink>
                <FooterLink href="/fridge" class="text-gray-400 hover:text-fuchsia-500 transition-colors">Project Manager</FooterLink>
                <FooterLink href="/login" class="text-gray-400 hover:text-teal-500 transition-colors">Get Started</FooterLink>
                <FooterLink href="/about-me" class="text-gray-400 hover:text-red-500 transition-colors">About the Author</FooterLink>
                <FooterLink href="/about-me/my-projects" class="text-gray-400 hover:text-green-500 transition-colors">My Projects</FooterLink>
            </FooterLinkGroup>
        </div>
        <p class="text-center text-gray-500">
            © 2025 Noodler Technologies LLC. Flow your imagination.
        </p>
    </Footer>
</div>

<style>
    /* Global styles and orb animations remain as they are custom */
    :global(*) {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: 'Monaco', 'Cascadia Code', 'Fira Code', monospace; /* Monaco and fallback monospace fonts */
    }

    :global(body) {
        font-family: 'Monaco', 'Cascadia Code', 'Fira Code', monospace; /* Ensure body also uses Monaco */
        background: linear-gradient(135deg, #020617 0%, #17072b 50%, #1e0b3a 100%); /* Even darker background */
        color: #e0e0e0; /* Off-white for general text */
        overflow-x: hidden;
        line-height: 1.6;
    }

    .floating-orbs {
        position: fixed;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
    }

    .orb {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, rgba(168, 85, 247, 0.4), rgba(59, 130, 246, 0.2));
        filter: blur(1px);
        animation: float 20s infinite linear;
    }

    .orb:nth-child(1) {
        width: 120px;
        height: 120px;
        top: 20%;
        left: 10%;
        animation-delay: 0s;
    }

    .orb:nth-child(2) {
        width: 80px;
        height: 80px;
        top: 60%;
        right: 15%;
        animation-delay: -5s;
    }

    .orb:nth-child(3) {
        width: 100px;
        height: 100px;
        bottom: 30%;
        left: 20%;
        animation-delay: -10s;
    }

    .orb:nth-child(4) {
        width: 60px;
        height: 60px;
        top: 40%;
        left: 60%;
        animation-delay: -15s;
    }

    @keyframes float {
        0%, 100% {
            transform: translateY(0px) rotate(0deg);
        }
        33% {
            transform: translateY(-30px) rotate(120deg);
        }
        66% {
            transform: translateY(15px) rotate(240deg);
        }
    }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 2rem;
        position: relative;
        z-index: 2;
    }

    header {
        padding: 2rem 0;
        position: relative;
    }

    /* Styles for Toolbar navigation links */
    .toolbar-link {
        font-weight: 600;
        transition: all 0.3s ease;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        text-decoration: none;
    }

    /* Custom styles for elements that don't directly map to Flowbite or need specific overrides */
    .login-btn {
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;
        border: none;
        cursor: pointer;
    }

    .login-button-bg {
        background: linear-gradient(135deg, #a855f7, #3b82f6);
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 25px;
        font-weight: 600;
        display: inline-flex; /* Use flex to align icon and text */
        align-items: center; /* Center items vertically */
    }

    .login-button-bg:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4);
    }

    .hero {
        text-align: center;
        padding: 6rem 0;
        position: relative;
    }

    .hero h1 {
        font-size: clamp(3rem, 8vw, 6rem);
        font-weight: 900;
        margin-bottom: 1.5rem;
        animation: glow 3s ease-in-out infinite alternate;
    }

    @keyframes glow {
        from {
            filter: drop-shadow(0 0 20px rgba(168, 85, 247, 0.3));
        }
        to {
            filter: drop-shadow(0 0 40px rgba(59, 130, 246, 0.5));
        }
    }

    .hero p {
        font-size: 1.5rem;
        margin-bottom: 3rem;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
    }

    .cta-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
        margin: 4rem 0;
    }

    /* Retain custom hover effect for cta-card since Flowbite cards don't have this exact animation */
    .cta-card {
        transition: all 0.4s ease;
        cursor: pointer;
        position: relative;
        overflow: hidden;
    }

    .cta-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transition: left 0.6s ease;
    }

    .cta-card:hover::before {
        left: 100%;
    }

    .cta-card:hover {
        transform: translateY(-10px);
        box-shadow: 0 20px 40px rgba(168, 85, 247, 0.2);
    }

    .cta-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        background-clip: text; /* Ensures text-fill-color works */
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    /* Apply gradient to CTA icon backgrounds for better contrast */
    .cta-icon.text-pink-400 { background-image: linear-gradient(45deg, #f472b6, #ec4899); }
    .cta-icon.text-lime-400 { background-image: linear-gradient(45deg, #a3e635, #65a30d); }
    .cta-icon.text-yellow-400 { background-image: linear-gradient(45deg, #facc15, #eab308); }
    .cta-icon.text-sky-400 { background-image: linear-gradient(45deg, #38bdf8, #0ea5e9); }


    .cta-btn {
        background: linear-gradient(135deg, #a855f7, #3b82f6);
        color: white;
        padding: 0.75rem 2rem;
        border-radius: 25px;
        text-decoration: none;
        font-weight: 600;
        display: inline-block;
        transition: all 0.3s ease;
    }

    .cta-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(168, 85, 247, 0.4);
    }

    .features {
        padding: 6rem 0;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 40px;
        margin: 4rem 0;
        backdrop-filter: blur(5px);
    }

    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
    }

    .feature-item {
        transition: all 0.3s ease;
    }

    .feature-item:hover {
        transform: translateY(-5px);
    }

    .feature-icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        background-clip: text; /* Ensures text-fill-color works */
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    /* Apply gradient to Feature icon backgrounds for better contrast */
    .feature-icon.text-red-400 { background-image: linear-gradient(45deg, #f87171, #ef4444); }
    .feature-icon.text-green-400 { background-image: linear-gradient(45deg, #4ade80, #22c55e); }
    .feature-icon.text-yellow-400 { background-image: linear-gradient(45deg, #facc15, #eab308); }
    .feature-icon.text-purple-400 { background-image: linear-gradient(45deg, #c084fc, #a855f7); }
    .feature-icon.text-blue-400 { background-image: linear-gradient(45deg, #60a5fa, #3b82f6); }
    .feature-icon.text-orange-400 { background-image: linear-gradient(45deg, #fb923c, #f97316); }


    /* Media queries for responsiveness */
    @media (max-width: 768px) {
        .hero h1 {
            font-size: 3rem;
        }

        .hero p {
            font-size: 1.2rem;
        }

        .cta-container {
            grid-template-columns: 1fr;
        }

        .features-grid {
            grid-template-columns: 1fr;
        }

        /* Adjust toolbar for smaller screens */
        .toolbar {
            flex-direction: column;
            align-items: flex-start;
        }
        .toolbar-group {
            margin-bottom: 1rem;
        }
        .toolbar-group:last-child {
            margin-bottom: 0;
        }
        .toolbar-link {
            width: 100%;
            text-align: center;
        }
        .login-btn {
            width: 100%;
        }
    }
</style>