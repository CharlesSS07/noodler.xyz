<script module lang="ts">
	import { type Node } from '@xyflow/svelte';

	// Note: This is a custom note/sticky note component
	// No official NID - remains as custom node for annotations
	export type NoteNodeType = Node<
			{
				markdown: string;
				nid?: string; // Optional - this node typically doesn't use official blueprints
			},
			'node-dna'
	>;
</script>

<script lang="ts">
	import { marked } from 'marked';
	import {type NodeProps, useSvelteFlow} from "@xyflow/svelte";
	import { untrack } from 'svelte';
	import TallTextArea from "$lib/components/TallTextArea.svelte";


	let { id, data }: NodeProps<NoteNodeType> = $props();
	const { updateNodeData } = useSvelteFlow();

	let isEditing = $state(false);

	// Configure marked for better styling
	marked.setOptions({
		breaks: true,
		gfm: true
	});

	function parseMarkdown(text: string): string {
		// updateNodeData(id, {
		// 	markdown: text
		// });
		return marked(text, {async: false});
	}

	function handleClick() {
		isEditing = true;
	}

	function handleBlur() {
		isEditing = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isEditing = false;
			(event.target as HTMLElement).blur();
		}
	}
</script>

<div class="sticky-note" on:click={handleClick} on:keydown={handleKeydown}>
	{#if isEditing}
		<TallTextArea
			bind:textContent={data.markdown}
			on:blur={handleBlur}
		></TallTextArea>
	{:else}
		<div class="markdown-preview">
			{@html parseMarkdown(data.markdown)}
		</div>
	{/if}
</div>

<style>
	.sticky-note {
		width: 250px;
		min-height: 200px;
		height: fit-content;
		background: linear-gradient(135deg, #fff59d 0%, #fff176 100%);
		border: 1px solid #f9a825;
		border-radius: 4px;
		padding: 8px;
		box-shadow:
			0 4px 8px rgba(249, 168, 37, 0.2),
			0 2px 4px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		transition: all 0.2s ease;
		position: relative;
		font-family: 'Comic Sans MS', cursive, sans-serif;
		color: #333;
	}

	.sticky-note:hover {
		transform: translateY(-2px);
		box-shadow:
			0 6px 12px rgba(249, 168, 37, 0.3),
			0 4px 8px rgba(0, 0, 0, 0.15);
	}

	/*.sticky-note::before {*/
	/*    content: '';*/
	/*    position: absolute;*/
	/*    top: -5px;*/
	/*    left: 20px;*/
	/*    width: 20px;*/
	/*    height: 20px;*/
	/*    background: radial-gradient(circle, #ff5722 30%, transparent 30%);*/
	/*    border-radius: 50%;*/
	/*    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);*/
	/*}*/

	.markdown-editor {
		width: 100%;
		min-height: 168px;
		height: fit-content;
		background: transparent;
		border: none;
		outline: none;
		resize: none;
		font-family: inherit;
		font-size: 14px;
		line-height: 1.5;
		color: #333;
		overflow: auto; /* Optional: Add scrollbars if content exceeds max-height */
		white-space: pre-wrap; /* Preserve line breaks and wrap text */
		word-wrap: break-word; /* Break long words to fit within the container */
	}

	.markdown-preview {
		min-height: 168px;
		font-size: 14px;
		line-height: 1.5;
		overflow-wrap: break-word;
	}

	.markdown-preview :global(h1),
	.markdown-preview :global(h2),
	.markdown-preview :global(h3),
	.markdown-preview :global(h4) {
		color: #2c5aa0;
	}

	.markdown-preview :global(h1) {
		font-size: 20px;
		font-weight: bold;
	}

	.markdown-preview :global(h2) {
		font-size: 18px;
		font-weight: bold;
	}

	.markdown-preview :global(h3) {
		font-size: 16px;
		font-weight: 600;
	}

	.markdown-preview :global(h4) {
		font-size: 14px;
		font-weight: 600;
	}

	.markdown-preview :global(p) {
		margin-bottom: 8px;
	}

	.markdown-preview :global(ul),
	.markdown-preview :global(ol) {
		margin-left: 16px;
		margin-bottom: 8px;
	}

	.markdown-preview :global(li) {
		margin-bottom: 4px;
	}

	.markdown-preview :global(blockquote) {
		border-left: 3px solid #2c5aa0;
		padding-left: 12px;
		margin: 8px 0;
		font-style: italic;
		color: #555;
	}

	.markdown-preview :global(code) {
		background: rgba(0, 0, 0, 0.1);
		padding: 2px 4px;
		border-radius: 3px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
	}

	.markdown-preview :global(pre) {
		background: rgba(0, 0, 0, 0.1);
		padding: 8px;
		border-radius: 4px;
		overflow-x: auto;
		margin: 8px 0;
	}

	.markdown-preview :global(pre code) {
		background: none;
		padding: 0;
	}

	.markdown-preview :global(strong) {
		font-weight: bold;
	}

	.markdown-preview :global(em) {
		font-style: italic;
	}
</style>
