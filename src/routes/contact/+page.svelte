<script>
    import DiscordJoin from "../../components/DiscordJoin.svelte";
    import Logo from "../../components/Logo.svelte";
    import EmailSignup from "../../components/EmailSignup.svelte";
    import BugReportButton from "../../components/BugReportButton.svelte";

    const email = "c-shelby-07@proton.me";
    const instagram = "https://www.instagram.com/_._shelbs__/";
    const linkedin = "https://www.linkedin.com/in/charles-strauss";
</script>

<style>
    :global(body) {
        background-color: #000;
        color: #fff;
    }

    .container {
        min-height: 100vh;
        background: linear-gradient(135deg, #000 0%, #1a1a1a 50%, #000 100%);
        padding: 2rem 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3rem;
    }

    .hero-section {
        text-align: center;
        max-width: 800px;
        margin: 0 auto;
    }

    .main-title {
        font-size: 3.5rem;
        font-weight: 800;
        background: linear-gradient(135deg, #fff 0%, #888 100%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 1rem;
        line-height: 1.1;
    }

    .subtitle {
        font-size: 1.5rem;
        color: #ccc;
        margin-bottom: 2rem;
        font-weight: 300;
        line-height: 1.4;
    }

    .contact-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3rem;
        max-width: 1200px;
        width: 100%;
        margin: 0 auto;
    }

    .contact-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 2.5rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        width: 50%;
    }

    .contact-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .card-title {
        font-size: 2rem;
        font-weight: 700;
        color: #fff;
        margin-bottom: 1rem;
        text-align: center;
    }

    .card-description {
        color: #bbb;
        margin-bottom: 2rem;
        line-height: 1.6;
        text-align: center;
        font-size: 1.1rem;
    }

    .links {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .link-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.5rem;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        text-decoration: none;
        color: #fff;
        font-weight: 500;
        transition: all 0.3s ease;
    }

    .link-item:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
        transform: translateX(5px);
    }

    .link-icon {
        font-size: 1.5rem;
        width: 40px;
        text-align: center;
    }

    .link-text {
        flex: 1;
    }

    .link-label {
        font-size: 0.9rem;
        color: #888;
        display: block;
    }

    .link-value {
        font-size: 1.1rem;
        color: #fff;
    }


    .logo-wrapper {
        display: flex;
        justify-content: center;
        margin: 2rem 0;
    }

    /* Custom EmailSignup dark theme overrides */
    :global(.signup-container) {
        background: rgba(255, 255, 255, 0.05) !important;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
    }

    :global(.signup-container h2) {
        color: #fff !important;
    }

    :global(.signup-container p) {
        color: #bbb !important;
    }

    :global(.signup-container input[type="email"]) {
        background-color: rgba(255, 255, 255, 0.08) !important;
        border-color: rgba(255, 255, 255, 0.2) !important;
        color: #fff !important;
    }

    :global(.signup-container input[type="email"]::placeholder) {
        color: #888 !important;
    }

    :global(.signup-container input[type="email"]:focus) {
        background-color: rgba(255, 255, 255, 0.12) !important;
        border-color: #3563E9 !important;
    }

    :global(.signup-container .checkbox-group label) {
        color: #bbb !important;
    }

    :global(.signup-container input[type="checkbox"]) {
        background-color: rgba(255, 255, 255, 0.08) !important;
        border-color: rgba(255, 255, 255, 0.2) !important;
    }

    :global(.signup-container a) {
        color: #66a3ff !important;
    }

    @media (max-width: 768px) {
        .main-title {
            font-size: 2.5rem;
        }

        .subtitle {
            font-size: 1.2rem;
        }

        .contact-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
        }

        .contact-card {
            padding: 2rem;
        }

        .container {
            padding: 1rem;
            gap: 2rem;
        }
    }
</style>

<div class="container">
    <div class="logo-wrapper">
        <Logo/>
    </div>

    <div class="hero-section">
        <h1 class="main-title">Let's Build The Future</h1>
        <p class="subtitle">
            I'm Charles S., creator of <strong>noodler.xyz</strong> — reimagining how AI programming should be done. 
            Got ideas? Found bugs? Need support? Let's connect!
        </p>
    </div>

    <BugReportButton></BugReportButton>


    <div class="contact-card">
            <h2 class="card-title">Contact</h2>
            <p class="card-description">
                Ready to collaborate or have questions? Reach out through any of these channels.
            </p>
            
            <div class="links">
                <DiscordJoin variant="styled" size="24px"/>

                <a href="mailto:{email}" class="link-item">
                    <span class="link-icon">📧</span>
                    <div class="link-text">
                        <span class="link-label">Email</span>
                        <span class="link-value">{email}</span>
                    </div>
                </a>

                <a href={linkedin} target="_blank" class="link-item">
                    <span class="link-icon">🔗</span>
                    <div class="link-text">
                        <span class="link-label">LinkedIn</span>
                    </div>
                </a>

                <a href={instagram} target="_blank" class="link-item">
                    <span class="link-icon">📷</span>
                    <div class="link-text">
                        <span class="link-label">Instagram</span>
                        <span class="link-value">@_._shelbs__</span>
                    </div>
                </a>

            </div>
        </div>

        <div class="contact-card">
            <EmailSignup 
                title="Stay Updated" 
                subtitle="Get notified about new features, AI programming insights, and exclusive access to beta releases."
                buttonText="Join The Journey"
                successMessage="Welcome aboard! 🚀"
            />
        </div>

    <div class="logo-wrapper">
        <Logo/>
    </div>
</div>
