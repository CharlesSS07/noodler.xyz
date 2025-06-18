<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteFlow, Controls, MiniMap, Background, type Node, type Edge, Position } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import { type ElkNode } from 'elkjs/lib/elk.bundled.js';
	import ELK from 'elkjs/lib/elk.bundled.js';

	// Import custom nodes
	import HtmlTagNode from '$lib/components/dummynodes/HtmlTagNode.svelte';
	import HtmlBoilerplateNode from '$lib/components/dummynodes/HtmlBoilerplateNode.svelte';
	import WebNavbarNode from '$lib/components/dummynodes/WebNavbarNode.svelte';
	import LlmContentGenerator from '$lib/components/dummynodes/LlmContentGenerator.svelte';
	import EmailSignup from "../../../../components/EmailSignup.svelte";
	import BugReportButton from "../../../../components/BugReportButton.svelte";

	const nodeTypes = {
		'stem-node': StemNode,
		'html-tag': HtmlTagNode,
		'html-boilerplate': HtmlBoilerplateNode,
		'web-navbar': WebNavbarNode,
		'llm-content-generator': LlmContentGenerator
	};

	let nodes = $state<Node[]>([
		// Topic Input
		{
			id: 'topic-input',
			type: 'stem-node',
			position: { x: 0, y: 0 },
			data: {
				nid: 'text_editor',
				input: { text: '' },
				currentText: 'Breaking Tech News',
				output: { text: 'Breaking Tech News' }
			}
		},
		
		// LLM Content Generator
		{
			id: 'llm-generator',
			type: 'llm-content-generator',
			position: { x: 300, y: 0 },
			data: {
				input: {
					topic: '',
					contentType: 'news-article',
					tone: 'professional',
					length: 'medium'
				},
				output: {
					generatedContent: '',
					metadata: {}
				}
			}
		},
		
		// Navbar Component
		{
			id: 'navbar-node',
			type: 'web-navbar',
			position: { x: 0, y: 200 },
			data: {
				input: {
					brandName: 'TechNews Daily',
					logoUrl: ''
				},
				output: {
					navbarHtml: ''
				}
			}
		},
		
		// Main Content Tag (Article)
		{
			id: 'article-tag',
			type: 'html-tag',
			position: { x: 600, y: 100 },
			data: {
				input: {
					innerHTML: ''
				},
				output: {
					htmlOutput: ''
				}
			}
		},
		
		// Footer Tag
		{
			id: 'footer-tag',
			type: 'html-tag',
			position: { x: 0, y: 400 },
			data: {
				input: {
					innerHTML: '<p>&copy; 2024 TechNews Daily. All rights reserved.</p>'
				},
				output: {
					htmlOutput: ''
				}
			}
		},
		
		// HTML Boilerplate
		{
			id: 'html-boilerplate',
			type: 'html-boilerplate',
			position: { x: 900, y: 200 },
			data: {
				input: {
					title: 'TechNews Daily - Breaking Tech News',
					bodyContent: '',
					headContent: '',
					footerContent: ''
				},
				output: {
					fullHtml: ''
				}
			}
		},
		
		// HTML Renderer (Final Output)
		{
			id: 'html-renderer',
			type: 'stem-node',
			position: { x: 1200, y: 200 },
			data: {
				nid: 'html_renderer',
				input: { html: '' },
				output: {}
			}
		}
	]);

	// Start with empty edges - they'll be added with delay for dynamic sockets
	let edges = $state.raw<Edge[]>([]);
	
	const targetEdges: Edge[] = [
		// Topic to LLM
		{
			id: 'topic-to-llm',
			source: 'topic-input',
			sourceHandle: 'output',
			target: 'llm-generator',
			targetHandle: 'topic'
		},
		
		// LLM content to article tag
		{
			id: 'llm-to-article',
			source: 'llm-generator',
			sourceHandle: 'generatedContent',
			target: 'article-tag',
			targetHandle: 'innerHTML'
		},
		
		// Navbar to boilerplate
		{
			id: 'navbar-to-boilerplate',
			source: 'navbar-node',
			sourceHandle: 'navbarHtml',
			target: 'html-boilerplate',
			targetHandle: 'headContent'
		},
		
		// Article to boilerplate
		{
			id: 'article-to-boilerplate',
			source: 'article-tag',
			sourceHandle: 'htmlOutput',
			target: 'html-boilerplate',
			targetHandle: 'bodyContent'
		},
		
		// Footer to boilerplate
		{
			id: 'footer-to-boilerplate',
			source: 'footer-tag',
			sourceHandle: 'htmlOutput',
			target: 'html-boilerplate',
			targetHandle: 'footerContent'
		},
		
		// Boilerplate to renderer
		{
			id: 'boilerplate-to-renderer',
			source: 'html-boilerplate',
			sourceHandle: 'fullHtml',
			target: 'html-renderer',
			targetHandle: 'html'
		}
	];

	let showInfoPanel = $state(false);

	// ELK.js auto-layout
	const elk = new ELK();
	
	const elkOptions = {
		'elk.algorithm': 'layered',
		'elk.layered.spacing.nodeNodeBetweenLayers': '100',
		'elk.spacing.nodeNode': '80',
		'elk.direction': 'RIGHT',
	};

	async function getLayoutedElements(nodes: Node[], edges: Edge[]) {
		const isHorizontal = elkOptions?.['elk.direction'] === 'RIGHT';
		const graph: ElkNode = {
			id: 'root',
			layoutOptions: elkOptions,
			children: nodes.map((node) => ({
				...node,
				// Adjust the target and source handle positions based on the layout
				// direction.
				targetPosition: isHorizontal ? Position.Left : Position.Top,
				sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
				width: 300,
				height: 200,
			})),
			edges: edges,
		};

		const layouted = await elk.layout(graph);

		return {
			nodes: layouted.children?.map((node_1) => ({
				...node_1,
				position: { x: node_1.x, y: node_1.y },
			})) || [],
			edges,
		};
	}

	async function onLayout() {
		const layouted = await getLayoutedElements(nodes, edges);
		nodes = layouted.nodes as Node[];
	}

	onMount(() => {
		// Initialize with auto-layout
		onLayout();
		
		// Delayed edge loading for dynamic sockets
		setTimeout(() => {
			edges = targetEdges;
		}, 1000);
	});

	function runWorkflow() {
		console.log('Running webdev workflow...');
		// Trigger the workflow by updating topic
		const topicNode = nodes.find(n => n.id === 'topic-input');
		if (topicNode) {
			topicNode.data.currentText = 'AI Revolution in Web Development';
			topicNode.data.output.text = 'AI Revolution in Web Development';
		}
	}

	function resetDemo() {
		const topicNode = nodes.find(n => n.id === 'topic-input');
		if (topicNode) {
			topicNode.data.currentText = 'Breaking Tech News';
			topicNode.data.output.text = 'Breaking Tech News';
		}
	}

	function exportWebsite() {
		const boilerplateNode = nodes.find(n => n.id === 'html-boilerplate');
		if (boilerplateNode?.data.output.fullHtml) {
			const blob = new Blob([boilerplateNode.data.output.fullHtml], { type: 'text/html' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'generated-website.html';
			a.click();
			URL.revokeObjectURL(url);
		}
	}
</script>

<svelte:head>
	<title>WebDev Demo - AI Website Builder | Noodler</title>
	<meta name="description" content="Build complete websites with AI-generated content using visual programming" />
</svelte:head>

<div class="demo-container">
	<!-- Header -->
	<div class="demo-header">
		<div class="header-content">
			<div class="demo-title">
				<h1>🌐 WebDev Demo</h1>
				<p>AI-Powered Website Builder</p>
			</div>
			<div class="demo-actions">
				<button onclick={() => showInfoPanel = !showInfoPanel} class="info-btn">
					{showInfoPanel ? '✕' : 'ℹ️'} Info
				</button>
				<a href="/app/demos" class="back-btn">← Back to Demos</a>
			</div>
		</div>
	</div>

	<!-- Controls Panel -->
	<div class="controls-panel">
		<BugReportButton size="md" />
		<button onclick={runWorkflow} class="control-btn run">▶️ Generate Website</button>
		<button onclick={resetDemo} class="control-btn reset">🔄 Reset</button>
		<button onclick={onLayout} class="control-btn layout">📐 Auto Layout</button>
		<button onclick={exportWebsite} class="control-btn export">💾 Export HTML</button>
	</div>

	<!-- Info Panel -->
	{#if showInfoPanel}
		<div class="info-panel">
			<div class="info-content">
				<h3>🚀 Quick Start Guide</h3>
				<ol>
					<li><strong>Enter Topic:</strong> Edit the topic in the text editor node</li>
					<li><strong>Generate Content:</strong> Click "Generate Website" to create AI content</li>
					<li><strong>Watch the Flow:</strong> See how content flows through HTML components</li>
					<li><strong>View Result:</strong> Final website appears in the HTML renderer</li>
					<li><strong>Export:</strong> Download the complete HTML file</li>
				</ol>
				
				<h4>✨ What This Demo Shows:</h4>
				<ul>
					<li>AI content generation for websites</li>
					<li>Modular HTML component composition</li>
					<li>Dynamic navbar and layout generation</li>
					<li>Complete webpage assembly pipeline</li>
					<li>Professional website structure creation</li>
				</ul>
				
				<div class="demo-tip">
					<strong>💡 Pro Tip:</strong> Try different topics like "Sustainable Energy", "Space Exploration", or "Food Technology" to see varied AI-generated content!
				</div>
			</div>
		</div>
	{/if}

	<!-- Flow Graph -->
	<div class="flow-container">
		<SvelteFlow 
			{nodes} 
			{edges} 
			{nodeTypes}
			fitView
			attributionPosition="bottom-left"
		>
			<Background />
			<MiniMap pannable zoomable />
			<Controls />
		</SvelteFlow>
	</div>

	<!-- Email Signup -->
	<div class="email-signup-container">
		<EmailSignup
				title="Get Early Access"
				subtitle="Be the first to access our prompt design tools"
				buttonText="Join Waitlist"
		/>
	</div>
</div>

<style>
	.demo-container {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		position: relative;
	}

	.demo-header {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		padding: 1rem 2rem;
		z-index: 10;
	}

	.email-signup-container {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 1000;
		transform: scale(0.8);
		transform-origin: bottom right;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		max-width: 1400px;
		margin: 0 auto;
	}

	.demo-title h1 {
		margin: 0;
		font-size: 1.75rem;
		font-weight: 700;
		color: white;
	}

	.demo-title p {
		margin: 0.25rem 0 0 0;
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.875rem;
	}

	.demo-actions {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.info-btn, .back-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		text-decoration: none;
		font-weight: 500;
		font-size: 0.875rem;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
	}

	.info-btn {
		background: rgba(255, 255, 255, 0.2);
		color: white;
	}

	.info-btn:hover {
		background: rgba(255, 255, 255, 0.3);
	}

	.back-btn {
		background: rgba(0, 0, 0, 0.2);
		color: white;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.back-btn:hover {
		background: rgba(0, 0, 0, 0.3);
	}

	.controls-panel {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		padding: 0.75rem 2rem;
		display: flex;
		gap: 1rem;
		z-index: 10;
	}

	.control-btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
	}

	.control-btn.run {
		background: #10b981;
		color: white;
	}

	.control-btn.run:hover {
		background: #059669;
	}

	.control-btn.reset {
		background: #f59e0b;
		color: white;
	}

	.control-btn.reset:hover {
		background: #d97706;
	}

	.control-btn.layout {
		background: #6366f1;
		color: white;
	}

	.control-btn.layout:hover {
		background: #4f46e5;
	}

	.control-btn.export {
		background: #8b5cf6;
		color: white;
	}

	.control-btn.export:hover {
		background: #7c3aed;
	}

	.info-panel {
		position: absolute;
		top: 140px;
		right: 2rem;
		width: 400px;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border-radius: 1rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		z-index: 20;
		max-height: calc(100vh - 200px);
		overflow-y: auto;
	}

	.info-content {
		padding: 1.5rem;
	}

	.info-content h3 {
		margin: 0 0 1rem 0;
		color: #1f2937;
		font-size: 1.25rem;
	}

	.info-content h4 {
		margin: 1.5rem 0 0.75rem 0;
		color: #374151;
		font-size: 1rem;
	}

	.info-content ol, .info-content ul {
		padding-left: 1.25rem;
		color: #4b5563;
		line-height: 1.6;
	}

	.info-content li {
		margin-bottom: 0.5rem;
	}

	.demo-tip {
		background: linear-gradient(135deg, #fef3c7, #fde68a);
		padding: 1rem;
		border-radius: 0.5rem;
		margin-top: 1rem;
		border-left: 4px solid #f59e0b;
		color: #92400e;
		line-height: 1.5;
	}

	.flow-container {
		flex: 1;
		position: relative;
	}

	.signup-section {
		position: absolute;
		bottom: 2rem;
		left: 2rem;
		z-index: 10;
	}

	@media (max-width: 768px) {
		.demo-header {
			padding: 1rem;
		}

		.header-content {
			flex-direction: column;
			gap: 1rem;
			align-items: flex-start;
		}

		.demo-actions {
			width: 100%;
			justify-content: space-between;
		}

		.controls-panel {
			padding: 0.75rem 1rem;
			flex-wrap: wrap;
		}

		.info-panel {
			right: 1rem;
			width: calc(100vw - 2rem);
			max-width: 400px;
		}

		.signup-section {
			bottom: 1rem;
			left: 1rem;
			right: 1rem;
		}
	}
</style>