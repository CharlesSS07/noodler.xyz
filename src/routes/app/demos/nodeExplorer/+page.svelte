<script lang="ts">
    import FlowGraphProject from "$lib/components/FlowGraphProject.svelte";
    import {ref, set} from "firebase/database";
    import {rtdb} from "../../../../firebase";
    import EmailSignup from "../../../../components/EmailSignup.svelte";

    const project_key: string = 'node_explorer';
    let projectInitialized = false;

    set(ref(rtdb, `fridge/${project_key}`), {
        title: "Node Explorer",
        description: "All nodes, laid out for exhibition",
        nodes: [],
        edges: [],
        last_updated_at: new Date(),
    }).then(() => {
        projectInitialized = true;
    });

</script>

{#if projectInitialized}
    <FlowGraphProject {project_key} onProjectReadyCallback={async (context) => {
        // Import Firestore functions to fetch all nodes directly
        const { collection, getDocs, query, where } = await import('firebase/firestore');
        const { firestore } = await import('../../../../firebase');
        
        try {
            // Get all nodes directly from Firestore
            const nodesCollection = collection(firestore, 'nodes');
            const searchableQuery = query(nodesCollection, where('searchable', '==', true));
            const snapshot = await getDocs(searchableQuery);
            
            const allNodes: any[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                allNodes.push({
                    id: doc.id,
                    title: data.title || 'Untitled Node',
                    documentation: data.documentation || '',
                    owner: data.owner || '',
                    trust_level: data.trust_level || '',
                    tags: data.tags || [],
                    categories: data.categories || []
                });
            });
            
            console.log(`Found ${allNodes.length} nodes to display`);
            
            // Grid layout configuration
            const nodesPerRow = 20;
            const nodeWidth = 300;
            const nodeHeight = 200;
            const horizontalSpacing = 400;
            const verticalSpacing = 800;
            const startX = 100;
            const startY = 100;
            
            // Add each node to the flow in a grid layout
            allNodes.forEach((nodeResult, index) => {
                const row = Math.floor(index / nodesPerRow);
                const col = index % nodesPerRow;
                
                const x = startX + (col * horizontalSpacing);
                const y = startY + (row * verticalSpacing);
                
                // Add node using the context's addNode function
                if (context.addNode) {
                    context.addNode({
                        type: 'node',
                        position: { x, y },
                        data: {
                            nid: nodeResult.id,
                            input: {},
                            title: nodeResult.title || 'Untitled Node',
                            errorMessage: ''
                        }
                    }, `explorer-node-${nodeResult.id}`);
                }
            });
            
        } catch (error) {
            console.error('Error fetching nodes for explorer:', error);
        }
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