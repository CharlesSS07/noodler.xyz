<script lang="ts">
    import EmailSignup from "../../../../components/EmailSignup.svelte";
</script>

<div class="demo-container">
    <div class="demo-header">
        <h1>DeepFake Design Studio</h1>
        <p>Coming Soon - Advanced AI-powered content creation tools</p>
    </div>
    
    <div class="demo-content">
        <div class="feature-grid">
            <div class="feature-card">
                <h3>AI Content Generation</h3>
                <p>Create realistic digital content with advanced AI models</p>
            </div>
            <div class="feature-card">
                <h3>Professional Tools</h3>
                <p>Industry-standard editing and refinement capabilities</p>
            </div>
            <div class="feature-card">
                <h3>Ethical Framework</h3>
                <p>Built-in safeguards for responsible content creation</p>
            </div>
        </div>
        
        <div class="coming-soon">
            <h2>Coming Soon</h2>
            <p>This powerful demo is currently in development. Sign up to get notified when it launches!</p>
        </div>
    </div>

    <div class="email-signup-wrapper">
        <EmailSignup 
            title="Get Early Access!"
            subtitle="Be the first to try our advanced AI content creation tools when they launch."
            buttonText="Join Waitlist"
            successMessage="Thanks! We'll notify you when DeepFake Design Studio is ready."
        />
    </div>
</div>

<style>
    .demo-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
    }

    .demo-header {
        text-align: center;
        margin-bottom: 3rem;
        color: white;
    }

    .demo-header h1 {
        font-size: 3rem;
        margin: 0 0 1rem 0;
        font-weight: 700;
    }

    .demo-header p {
        font-size: 1.25rem;
        margin: 0;
        opacity: 0.9;
    }

    .demo-content {
        max-width: 1200px;
        width: 100%;
    }

    .feature-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
        margin-bottom: 3rem;
    }

    .feature-card {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 1rem;
        padding: 2rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        text-align: center;
    }

    .feature-card h3 {
        font-size: 1.5rem;
        margin: 0 0 1rem 0;
        font-weight: 600;
    }

    .feature-card p {
        margin: 0;
        opacity: 0.9;
        line-height: 1.6;
    }

    .coming-soon {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 1rem;
        padding: 3rem;
        text-align: center;
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .coming-soon h2 {
        font-size: 2rem;
        margin: 0 0 1rem 0;
        font-weight: 700;
    }

    .coming-soon p {
        font-size: 1.1rem;
        margin: 0;
        opacity: 0.9;
        line-height: 1.6;
    }

    .email-signup-wrapper {
        position: fixed;
        bottom: 20px;
        left: 0px;
        width: 30vh;
        height: 30vh;
        transform: scale(0.7);
        transform-origin: top right;
        z-index: 1000;
        pointer-events: auto;
    }

    .email-signup-wrapper :global(.signup-container) {
        width: 100%;
        height: 100%;
        min-height: auto;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 1rem;
    }

    .email-signup-wrapper :global(h2) {
        font-size: 1.2rem;
        margin-bottom: 0.5rem;
    }

    .email-signup-wrapper :global(p) {
        font-size: 0.8rem;
        margin-bottom: 1rem;
    }

    .email-signup-wrapper :global(.form-group) {
        margin-bottom: 0.8rem;
    }

    .email-signup-wrapper :global(input[type="email"]) {
        padding: 0.6rem 0.8rem;
        font-size: 0.9rem;
    }

    .email-signup-wrapper :global(button) {
        padding: 0.6rem 1rem;
        font-size: 0.9rem;
        min-height: 2.5rem;
    }

    .email-signup-wrapper :global(.checkbox-group label) {
        font-size: 0.75rem;
    }

    @media (max-width: 768px) {
        .demo-container {
            padding: 1rem;
        }

        .demo-header h1 {
            font-size: 2rem;
        }

        .demo-header p {
            font-size: 1rem;
        }

        .feature-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .feature-card {
            padding: 1.5rem;
        }

        .coming-soon {
            padding: 2rem;
        }

        .email-signup-wrapper {
            width: 25vh;
            height: 25vh;
            transform: scale(0.6);
        }
    }
</style>