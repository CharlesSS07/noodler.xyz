<script lang="ts">
    import FlowGraphProject from "$lib/components/FlowGraphProject.svelte";
    import {
        Panel
    } from '@xyflow/svelte';
    import project from "./project.js"
    import {ref, set} from "firebase/database";
    import {rtdb} from "../../../../firebase";
    import EmailSignup from "../../../../components/EmailSignup.svelte";

    const project_key: string = 'ai_image_editing';
    let projectInitialized = false;

    set(ref(rtdb, `fridge/${project_key}`), {
        title: project.metadata.title,
        description: "Examples of Image Processing with AI",
        nodes: project.nodes,
        edges: project.edges,
        last_updated_at: new Date(),
    }).then(() => {
        projectInitialized = true;
        // image_1750474392374_pzoc0h7re
    });

</script>

{#if projectInitialized}
    <FlowGraphProject {project_key} onProjectReadyCallback={async (context) => {
        console.log(context);
        setTimeout(() => {
            context.executeFromNode('image_1750474392374_pzoc0h7re');
        }, 500);
    }}>
            <div class="email-signup-wrapper">
                <EmailSignup 
                    title="Get Notified When it Drops!"
                    subtitle="Stay updated on the latest AI image editing features and tools."
                    buttonText="Get Updates"
                    successMessage="Thanks! We'll keep you updated on AI image editing features."
                />
            </div>
    </FlowGraphProject>
{/if}

<style>
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
</style>