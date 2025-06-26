<script module lang="ts">
	import { type Node } from '@xyflow/svelte';

	// Note: This is a custom note/sticky note component
	// No official NID - remains as custom node for annotations
	export type NoteNodeType = Node<
			{
				markdown: string;
				nid?: string; // Optional - this node typically doesn't use official blueprints
			},
			'node-note'
	>;
</script>

<script lang="ts">
	import { marked } from 'marked';
	import {type NodeProps, useSvelteFlow} from "@xyflow/svelte";
	import { untrack } from 'svelte';

	let { id, data }: NodeProps<NoteNodeType> = $props();
	const { updateNodeData } = useSvelteFlow();

	let inputText = $state(data.markdown || '');
	let textarea: HTMLTextAreaElement;
	let isEditing = $state(false);

	// Configure marked for better styling
	marked.setOptions({
		breaks: true,
		gfm: true
	});

	// Update node data when inputText changes
	$effect(() => {
		updateNodeData(untrack(() => id), { markdown: inputText });
	});

	// Sync with external data changes
	$effect(() => {
		if (data.markdown && textarea) {
			inputText = data.markdown;
			autoResize(textarea);
		}
	});

	// Auto-resize effect for textarea
	$effect(() => {
		if (textarea) {
			autoResize(textarea);
		}
	});

	function autoResize(textarea: HTMLTextAreaElement) {
		textarea.style.width = 'auto';
		textarea.style.height = 'auto';
		textarea.style.height = textarea.scrollHeight + 'px';
	}

	function startEditing() {
		isEditing = true;
	}

	function stopEditing() {
		isEditing = false;
	}
</script>

<div class="sticky-note">
	{#if isEditing}
		<!-- Editing mode - show textarea -->
		<textarea
			bind:this={textarea}
			value={inputText}
			class="note-textarea"
			placeholder="Click to enter markdown..."
			oninput={(e) => {
				const value = e.target.value;
				inputText = value;
				autoResize(e.target);
			}}
			onblur={stopEditing}
			onfocusout={stopEditing}
		></textarea>
	{:else}
		<!-- Display mode - show rendered markdown -->
		<div 
			class="markdown-preview"
			onclick={startEditing}
			onkeypress={startEditing}
		>
			{@html marked.parse(inputText || 'Click to enter markdown...')}
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
		border-radius: 0px;
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

	.note-textarea {
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
		overflow: hidden;
		white-space: pre-wrap;
		word-wrap: break-word;
	}

	.note-textarea::placeholder {
		color: #9ca3af;
		font-style: italic;
	}

	.markdown-preview {
		min-height: 168px;
		font-size: 14px;
		line-height: 1.5;
		overflow-wrap: break-word;
		cursor: pointer;
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
		border-radius: 0px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
	}

	.markdown-preview :global(pre) {
		background: rgba(0, 0, 0, 0.1);
		padding: 8px;
		border-radius: 0px;
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
