<script lang="ts">
    import FlowGraphProject from "$lib/components/FlowGraphProject.svelte";
    import project from "./project.js"
    import {ref, set} from "firebase/database";
    import {rtdb} from "../../../../firebase";

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
    <FlowGraphProject {project_key} onProjectReady={(context) => {
        console.log(context);
        setTimeout(() => {
            context.executeFromNode('image_1750474392374_pzoc0h7re');
        }, 500);
    }}></FlowGraphProject>
{/if}
