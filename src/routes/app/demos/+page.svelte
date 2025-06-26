<script lang="ts">
    import Logo from '../../../components/Logo.svelte';
    import BugReportButton from '../../../components/BugReportButton.svelte';
    import { Play, Image, MessageSquare, Wand2, Sparkles, Globe } from 'lucide-svelte';

    interface Demo {
        id: string;
        title: string;
        description: string;
        icon: any;
        path: string;
        status: 'active' | 'coming-soon' | 'beta';
        features: string[];
    }

    const demos: Demo[] = [
        {
            id: 'aiImgEditing',
            title: 'AI Image Editing',
            description: 'Procedurally composite images with AI',
            icon: Image,
            path: '/app/demos/aiImgEditing',
            status: 'active',
            features: [
                'Multi-stage image transformation',
                'AI Image Editing Node',
                'Real-time preview'
            ]
        },
        {
            id: 'promptdesign',
            title: 'Prompt Design Studio',
            description: 'Advanced visual prompt engineering with template composition, variable replacement, and LLM text transformation nodes.',
            icon: MessageSquare,
            path: '/app/demos/promptdesign',
            status: 'active',
            features: [
                'Visual prompt templating',
                'Dynamic variable injection',
                'Multi-stage text transformation',
                'LLM chain composition',
                'Real-time preview'
            ]
        },
        {
            id: 'imagegen',
            title: 'AI Image Generation Lab',
            description: 'Create stunning composite images by combining prompt engineering, image loading, and advanced diffusion-based modifications.',
            icon: Image,
            path: '/app/demos/imagegen',
            status: 'coming-soon',
            features: [
                'Multi-modal prompt composition',
                'Image-to-image transformations',
                'Style transfer & modifications',
                'Inpainting & outpainting',
                'Batch processing workflows'
            ]
        },
        {
            id: 'webdev',
            title: 'AI Website Builder',
            description: 'Complete webpage composition with AI-generated content, HTML components, and professional layouts.',
            icon: Globe,
            path: '/app/demos/webdev',
            status: 'coming-soon',
            features: [
                'AI content generation',
                'Modular HTML components',
                'Dynamic navbar creation',
                'Complete page assembly',
                'Professional website structure'
            ]
        },
        {
            id: 'deepfakedesign',
            title: 'Deepfake Design Pipeline',
            description: 'Experimental workflow for ethical deepfake creation and media synthesis research.',
            icon: Wand2,
            path: '/app/demos/deepfakedesign',
            status: 'coming-soon',
            features: [
                'Face swapping workflows',
                'Voice synthesis integration',
                'Ethical guidelines enforcement',
                'Quality validation steps',
                'Research-focused tools'
            ]
        }
    ];

    function getStatusColor(status: string): string {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'beta': return 'bg-yellow-100 text-yellow-800';
            case 'coming-soon': return 'bg-gray-100 text-gray-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    }

    function navigateToDemo(path: string, status: string) {
        if (status === 'coming-soon') {
            alert('This demo is coming soon! Stay tuned for updates.');
            return;
        }
        window.location.href = path;
    }
</script>

<div class="demos-container">
    <header class="demos-header">
        <div class="header-content">
            <div class="header-main">
                <Logo size={4} />
                <div class="header-text">
                    <h1>Demo Gallery</h1>
                    <p class="subtitle">
                        Explore interactive demonstrations of noodler.xyz's visual programming capabilities.
                        Each demo showcases different aspects of node-based AI workflows.
                    </p>
                </div>
            </div>
            <div class="header-actions">
                <BugReportButton size="md" />
            </div>
        </div>
    </header>

    <main class="demos-grid">
        {#each demos as demo}
            <div class="demo-card" class:disabled={demo.status === 'coming-soon'}>
                <div class="card-header">
                    <div class="icon-container">
                        <svelte:component this={demo.icon} class="demo-icon" />
                    </div>
                    <div class="title-section">
                        <h2>{demo.title}</h2>
                        <span class="status-badge {getStatusColor(demo.status)}">
                            {demo.status === 'coming-soon' ? 'Coming Soon' : 
                             demo.status === 'beta' ? 'Beta' : 'Live'}
                        </span>
                    </div>
                </div>

                <p class="description">{demo.description}</p>

                <div class="features">
                    <h3>Key Features:</h3>
                    <ul>
                        {#each demo.features as feature}
                            <li>{feature}</li>
                        {/each}
                    </ul>
                </div>

                <button 
                    class="launch-button" 
                    class:disabled={demo.status === 'coming-soon'}
                    onclick={() => navigateToDemo(demo.path, demo.status)}
                >
                    {#if demo.status === 'coming-soon'}
                        <Sparkles class="button-icon" />
                        Coming Soon
                    {:else}
                        <Play class="button-icon" />
                        Launch Demo
                    {/if}
                </button>
            </div>
        {/each}
    </main>

    <footer class="demos-footer">
        <div class="footer-content">
            <p>
                <strong>About these demos:</strong> Each demonstration is built using noodler.xyz's 
                visual node-based programming interface. You can recreate these workflows in the 
                main application by connecting nodes to build your own AI pipelines.
            </p>
            <div class="links">
                <a href="/app" class="footer-link">← Back to Main App</a>
                <a href="/about" class="footer-link">Learn More</a>
                <a href="/tutorials" class="footer-link">View Tutorials</a>
            </div>
        </div>
    </footer>
</div>

<style>
    .demos-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .demos-header {
        padding: 3rem 2rem 2rem;
        text-align: center;
        background: rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 2rem;
        flex-wrap: wrap;
    }

    .header-main {
        display: flex;
        align-items: center;
        gap: 2rem;
        flex: 1;
    }

    .header-text {
        flex: 1;
    }

    .header-text h1 {
        font-size: 3rem;
        font-weight: 700;
        margin: 1rem 0;
        background: linear-gradient(135deg, #fff, #e0e7ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .header-actions {
        display: flex;
        align-items: center;
    }

    .subtitle {
        font-size: 1.2rem;
        opacity: 0.9;
        max-width: 600px;
        margin: 0 auto;
        line-height: 1.6;
    }

    .demos-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 2rem;
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
    }

    .demo-card {
        background: rgba(255, 255, 255, 0.95);
        color: #1a202c;
        border-radius: 1rem;
        padding: 2rem;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .demo-card:hover:not(.disabled) {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }

    .demo-card.disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .card-header {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .icon-container {
        background: linear-gradient(135deg, #667eea, #764ba2);
        padding: 0.75rem;
        border-radius: 0.5rem;
        flex-shrink: 0;
    }

    :global(.demo-icon) {
        width: 1.5rem;
        height: 1.5rem;
        color: white;
    }

    .title-section {
        flex: 1;
    }

    .title-section h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 0 0 0.5rem 0;
        color: #2d3748;
    }

    .status-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .description {
        font-size: 1rem;
        line-height: 1.6;
        color: #4a5568;
        margin-bottom: 1.5rem;
    }

    .features {
        margin-bottom: 2rem;
    }

    .features h3 {
        font-size: 0.875rem;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .features ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .features li {
        padding: 0.25rem 0;
        font-size: 0.875rem;
        color: #718096;
        position: relative;
        padding-left: 1rem;
    }

    .features li::before {
        content: '•';
        color: #667eea;
        position: absolute;
        left: 0;
        font-weight: bold;
    }

    .launch-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.75rem 1rem;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        border-radius: 0.5rem;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .launch-button:hover:not(.disabled) {
        background: linear-gradient(135deg, #5a67d8, #6b46c1);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .launch-button.disabled {
        background: #a0aec0;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }

    :global(.button-icon) {
        width: 1rem;
        height: 1rem;
    }

    .demos-footer {
        padding: 3rem 2rem;
        background: rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        margin-top: 2rem;
    }

    .footer-content {
        max-width: 800px;
        margin: 0 auto;
        text-align: center;
    }

    .footer-content p {
        font-size: 1rem;
        line-height: 1.6;
        opacity: 0.9;
        margin-bottom: 1.5rem;
    }

    .links {
        display: flex;
        justify-content: center;
        gap: 2rem;
        flex-wrap: wrap;
    }

    .footer-link {
        color: white;
        text-decoration: none;
        font-weight: 500;
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        transition: background-color 0.3s ease;
    }

    .footer-link:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    @media (max-width: 768px) {
        .demos-grid {
            grid-template-columns: 1fr;
            padding: 1rem;
        }

        .header-content h1 {
            font-size: 2rem;
        }

        .subtitle {
            font-size: 1rem;
        }

        .demo-card {
            padding: 1.5rem;
        }

        .links {
            flex-direction: column;
            gap: 0.5rem;
        }
    }
</style>