<script lang="ts">
    import FlowGraphProject from "$lib/components/FlowGraphProject.svelte";
    import project from "./project.js"
    import {ref, set} from "firebase/database";
    import {rtdb} from "../../../../firebase";

    const project_key: string = 'prompt_design';
    let projectInitialized = false;



    set(ref(rtdb, `fridge/${project_key}`), {
        title: project.metadata.title,
        description: "Examples of Doing Prompt Design",
        nodes: project.nodes.map((node) => {
            return {
                ...node,
                position: {
                    x: node.position.x,
                    y: node.position.y-1000
                }
            }
        }),
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
            context.executeFromNode('html_1750884527543_hza4x1vdo');
        }, 500);
    }}></FlowGraphProject>
{/if}
