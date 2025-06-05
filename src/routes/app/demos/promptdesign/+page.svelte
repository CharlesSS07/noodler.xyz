<script lang="ts">
    import {
        Background,
        BackgroundVariant,
        type ColorMode,
        Controls,
        type Edge,
        MiniMap,
        type Node, Position,
        SvelteFlow,
        useSvelteFlow
    } from "@xyflow/svelte";
    import '@xyflow/svelte/dist/style.css';
    import NoteNode from "../../nodes/NoteNode.svelte";
    import StemNode from "../../StemNode.svelte";
    import ImageNode from "../../nodes/images/ImageNode.svelte";
    import HTMLRendererNode from "../../nodes/html/HTMLRendererNode.svelte";
    import TextTemplateFillinNode from "../../nodes/text/TextTemplateFillinNode.svelte";
    import TextEditorNode from "../../nodes/text/TextEditorNode.svelte";
    import RawTextEditor from "../../nodes/text/RawTextEditor.svelte";
    import MagicTextTransformLLM from "../dummynodes/TextFormatterLLM.svelte";
    import "../../nodes.css";
    import ELK from 'elkjs/lib/elk.bundled.js';
    import { onMount } from "svelte";
    import {edgesVersion2, nodesVersion0, nodesVersion2} from "./projectVersions";
    import Logo from "../../../../components/Logo.svelte";
    import EmailSignup from "../../../../components/EmailSignup.svelte";

    let nodes = $state.raw<Node[]>(nodesVersion2);

    let edges = $state.raw<Edge[]>([]);

    const nodeTypes = {
        note: NoteNode,
        node: StemNode, // a node which takes on the properties stored by the server
        image: ImageNode,
        html: HTMLRendererNode,
        textTemplate: TextTemplateFillinNode,
        textEditor: TextEditorNode,
        textEditorRaw: RawTextEditor,
        textTransformLLM: MagicTextTransformLLM
    };

    let colorMode: ColorMode = $state('light');

    const elk = new ELK();

    const elkOptions = {
        'elk.algorithm': 'layered',
        'elk.direction': 'RIGHT',
        'elk.layered.spacing.nodeNodeBetweenLayers': '100',
        'elk.spacing.componentComponent': '100',
        'elk.spacing.nodeNode': '70',
        'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX', // Changed for better crossing minimization
        'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
        'elk.layered.cycleBreaking.strategy': 'DEPTH_FIRST',
        'elk.edgeRouting': 'ORTHOGONAL',
        'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
        'elk.layered.compaction.strategy': 'CHANNEL_DECOMPOSITION', // Added compaction strategy
        'elk.portConstraints': 'FIXED_POS', // Crucial for explicit port usage
    };

    function getLayoutedElements(nodes: Node[], edges: Edge[], options = {}) {
        const isHorizontal = options?.['elk.direction'] === 'RIGHT';
        const graph = {
            id: 'root',
            layoutOptions: options,
            children: nodes.map((node) => ({
                ...node,
                width: node.width,
                height: node.height,
                // These are now more important due to 'elk.portConstraints': 'FIXED_POS'
                targetPosition: isHorizontal ? Position.Left : Position.Top,
                sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            })),
            edges: edges.map((edge) => ({
                ...edge,
                // Ensure ELK knows about the source and target positions for better routing
                // These should generally align with the node's source/targetPosition
                source: edge.source,
                target: edge.target,
                sourcePort: edge.sourceHandle || 'default', // Add a default if not specified
                targetPort: edge.targetHandle || 'default', // Add a default if not specified
            })),
        };

        return elk
            .layout(graph)
            .then((layoutedGraph) => {
                return {
                    nodes: layoutedGraph.children.map((node) => ({
                        ...node,
                        position: { x: node.x, y: node.y },
                    })),
                    edges: layoutedGraph.edges,
                };
            })
            .catch(console.error);
    }

    function onLayout(direction: string) {
        const opts = { 'elk.direction': direction, ...elkOptions };

        // Before laying out, ensure nodes have their final rendered dimensions.
        // This is a common challenge with ELK and SvelteFlow.
        // A more robust solution might involve observing node dimensions after SvelteFlow renders.
        // For this example, we've hardcoded dimensions, but in a dynamic app, you'd get them from the DOM.

        getLayoutedElements(nodes, edges, opts).then(
            ({ nodes: layoutedNodes, edges: layoutedEdges }) => {
                nodes = layoutedNodes;
                edges = layoutedEdges;
            },
        );
    }

    let svelteFlowInstance; // Bind this to the SvelteFlow component

    onMount(() => {
        // We need to wait for SvelteFlow to render the nodes so their dimensions are available.
        // For a more dynamic solution, you might consider using onNodesChange or a mutation observer
        // to detect when nodes have finished rendering and then trigger the layout.
        // However, for a fixed set of nodes, a simple setTimeout after SvelteFlow initializes
        // is often sufficient to let the initial render pass.
        // The on:init event is a good place to start, but the actual dimensions might not be set immediately.
        // Let's rely on a slightly delayed layout after init.
        setTimeout(() => {
            handleFlowInit();
        }, 200);
    });


    function handleFlowInit() {
        console.log('SvelteFlow has initialized!');
        // After SvelteFlow initializes, we can attempt to get node dimensions.
        // However, for this to work correctly, your custom Svelte nodes (`NoteNode`, `StemNode`, etc.)
        // would need to expose their rendered `width` and `height` properties in a way that SvelteFlow
        // can capture or that you can query from the DOM.
        // Since we've hardcoded dimensions in the `nodes` array for this example,
        // we can directly proceed with the layout.
        edges = edgesVersion2;
        // onLayout('RIGHT');
    }

</script>
<div style="height: 100vh;">
<!--    <button on:click={() => {console.log(nodes, edges);}}>Print Node State</button>-->
    <SvelteFlow bind:nodes bind:edges {nodeTypes} {colorMode} fitView bind:this={svelteFlowInstance}>
        <Logo></Logo>
        <Controls/>
        <Background variant={BackgroundVariant.Dots}/>
        <MiniMap/>
    </SvelteFlow>
    <div style="position: fixed;top: 0;left: 0;scale: 0.5">
        <EmailSignup></EmailSignup>
    </div>
</div>