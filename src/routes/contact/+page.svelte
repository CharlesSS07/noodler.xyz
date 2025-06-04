<script>
    import DiscordJoin from "../../components/DiscordJoin.svelte";

    const email = "c-shelby-07@proton.me";
    const instagram = "https://www.instagram.com/_._shelbs__/";
    const linkedin = "https://www.linkedin.com/in/charles-strauss";
</script>

<style>
    .card {
        max-width: 500px;
        margin: auto;
        padding: 2rem;
        border-radius: 1rem;
        background: #fefefe;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        font-family: system-ui, sans-serif;
    }

    h1 {
        font-size: 1.75rem;
        margin-bottom: 0.5rem;
        color: #111;
    }

    p {
        margin: 1rem 0;
        color: #333;
        line-height: 1.5;
    }

    .links {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 1rem;
    }

    a {
        color: #1a73e8;
        text-decoration: none;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    a:hover {
        text-decoration: underline;
    }
</style>

<div class="card">
    <h1>Let's Make Something Amazing</h1>
    <p>
        I'm Charles S., and I run <strong>noodler.xyz</strong>, a vision I have for how AI programming should be done. Please let me know if you have ideas, find bugs, or need support!
    </p>

    <div class="links">
        <a href="mailto:{email}">📧 {email}</a>
        <a href={instagram} target="_blank">📷 Instagram</a>
        <a href={linkedin} target="_blank">🔗 LinkedIn</a>
        <DiscordJoin size="60px"></DiscordJoin>
    </div>
</div>
