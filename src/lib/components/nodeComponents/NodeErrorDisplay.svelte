

<script lang="ts">
    import {Button, Alert, Spinner} from 'flowbite-svelte';
    import {Copy, Check, MessageCircleQuestion, Brain, ChevronDown, ChevronUp} from 'lucide-svelte';
    import { aiServiceInstance } from '$lib/services/AIInferenceService';
    import type {FirestoreNodeBluePrintModel} from "$shared/NodeBluePrintModel";
    import { marked } from 'marked';

    interface Props {
        errorMessage: string;
        nodeBlueprint?: FirestoreNodeBluePrintModel;
        nodeInputData?: Record<string, any>;
    }

    let {
        errorMessage,
        nodeBlueprint,
        nodeInputData
    }: Props = $props();

    let copySuccess = $state(false);
    let aiExplanation = $state<string>('');
    let isLoadingExplanation = $state(false);
    let explanationError = $state<string>('');
    let showFullError = $state(false);

    // Configure marked for better styling
    marked.setOptions({
        breaks: true,
        gfm: true
    });

    // Auto-generate explanation when errorMessage changes
    $effect(() => {
        if (errorMessage && !aiExplanation && !isLoadingExplanation) {
            generateAIExplanation();
        }
    });

    async function copyToClipboard(): Promise<void> {
        try {
            await navigator.clipboard.writeText(errorMessage as string);
            copySuccess = true;
            setTimeout(() => {
                copySuccess = false;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    function generateErrorPrompt(forAI: boolean = false): string {
        // Create a comprehensive prompt about the node and error
        let prompt = `I'm working with a visual node-based editor and one of my nodes is throwing an error. Please help me understand what's causing this error and how to fix it.${forAI ? '' : ' Be brief, so the user does not have to read much.'}

`;
        
        // Add node information if available
        if (nodeBlueprint) {
            prompt += `**Node Information:**
`;
            prompt += `- Node Title: ${nodeBlueprint.title}
`;
            prompt += `- Node Description: ${nodeBlueprint.documentation}
`;
            
            // Add input socket information
            if (nodeBlueprint.input_sockets && Object.keys(nodeBlueprint.input_sockets).length > 0) {
                prompt += `\n**Input Sockets:**
`;
                for (const [socketId, socket] of Object.entries(nodeBlueprint.input_sockets)) {
                    prompt += `- ${socket.label} (${socketId}): ${socket.documentation} [Type: ${socket.type}]
`;
                }
            }
            
            // Add output socket information
            if (nodeBlueprint.output_sockets && Object.keys(nodeBlueprint.output_sockets).length > 0) {
                prompt += `\n**Output Sockets:**
`;
                for (const [socketId, socket] of Object.entries(nodeBlueprint.output_sockets)) {
                    prompt += `- ${socket.label} (${socketId}): ${socket.documentation} [Type: ${socket.type}]
`;
                }
            }
        }
        
        // Add input data information if available
        if (nodeInputData && Object.keys(nodeInputData).length > 0) {
            prompt += `\n**Current Input Values:**
`;
            for (const [key, value] of Object.entries(nodeInputData)) {
                prompt += `- ${key}: ${summarizeInputValue(value)}
`;
            }
        }
        
        // Add the error message
        prompt += `\n**Error Message:**
\`\`\`
${errorMessage}
\`\`\`

`;
        
        if (forAI) {
            prompt += `Please provide a clear, concise explanation of:
1. What this error means
2. What might be causing it
3. How to fix it

Keep your response under 300 words and focus on practical solutions.`;
        }
        
        return prompt;
    }

    function getChatGPTUrl(): string {
        const prompt = encodeURIComponent(generateErrorPrompt(false));
        return `https://chat.openai.com/?q=${prompt}`;
    }

    function summarizeInputValue(value: any): string {
        if (value === null || value === undefined) {
            return 'null/undefined';
        }
        
        if (typeof value === 'string') {
            return value.length > 100 ? `string(${value.length} chars): "${value.substring(0, 100)}..."` : `string: "${value}"`;
        }
        
        if (typeof value === 'number' || typeof value === 'boolean') {
            return `${typeof value}: ${value}`;
        }
        
        if (Array.isArray(value)) {
            return `array(${value.length} items): [${value.slice(0, 3).map(v => typeof v).join(', ')}${value.length > 3 ? '...' : ''}]`;
        }
        
        if (typeof value === 'object') {
            const keys = Object.keys(value);
            const keyCount = keys.length;
            return `object(${keyCount} keys): {${keys.slice(0, 3).join(', ')}${keyCount > 3 ? '...' : ''}}`;
        }
        
        return `${typeof value}: ${String(value).substring(0, 50)}`;
    }

    async function generateAIExplanation(): Promise<void> {
        if (isLoadingExplanation || aiExplanation) return;
        
        try {
            isLoadingExplanation = true;
            explanationError = '';
            
            const prompt = generateErrorPrompt(true);
            
            const response = await aiServiceInstance.callLLM({
                prompt,
                maxTokens: 400,
                temperature: 0.3
            });
            
            aiExplanation = response.response;
        } catch (error) {
            console.error('Failed to generate AI explanation:', error);
            explanationError = 'Failed to generate AI explanation. Please try again.';
        } finally {
            isLoadingExplanation = false;
        }
    }

</script>

{#if errorMessage}
    <Alert color="red" class="space-y-3">
        <!-- AI Explanation Section -->
        {#if aiExplanation}
            <div class="ai-explanation bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                <div class="flex items-center gap-2 mb-2">
                    <Brain size={16} class="text-blue-600" />
                    <h4 class="text-sm font-semibold text-blue-800">AI Error Explanation</h4>
                </div>
                <div class="text-sm text-blue-700 markdown-explanation">
                    {@html marked.parse(aiExplanation)}
                </div>
            </div>
        {/if}
        
        {#if explanationError}
            <div class="explanation-error bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                <div class="text-sm text-yellow-700">
                    {explanationError}
                </div>
            </div>
        {/if}
        
        <!-- Error Message Section -->
        <div class="error-message-container">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-red-800">Error Details:</span>
                <Button
                    size="xs"
                    color="red"
                    outline
                    onclick={() => showFullError = !showFullError}
                    title="Toggle error details"
                >
                    {#if showFullError}
                        <ChevronUp size={12} class="mr-1" />
                        Hide
                    {:else}
                        <ChevronDown size={12} class="mr-1" />
                        Show
                    {/if}
                </Button>
            </div>
            
            {#if showFullError}
                <div class="error-message font-mono text-sm break-words bg-red-50 border border-red-200 rounded p-2 max-h-32 overflow-y-auto" style="text-align: left;">
                    {errorMessage}
                </div>
            {:else}
                <div class="error-message font-mono text-sm break-words bg-red-50 border border-red-200 rounded p-2" style="text-align: left; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                    {errorMessage}
                </div>
            {/if}
        </div>
        
        <div class="error-actions flex gap-2 flex-wrap">
            
            <Button
                size="xs"
                color="red"
                outline
                onclick={copyToClipboard}
                title="Copy error to clipboard"
            >
                {#if copySuccess}
                    <Check size={12} class="mr-1" />
                    Copied!
                {:else}
                    <Copy size={12} class="mr-1" />
                    Copy
                {/if}
            </Button>
            
            <Button
                size="xs"
                color="green"
                outline
                href={getChatGPTUrl()}
                target="_blank"
                rel="noopener noreferrer"
                title="Conversate with ChatGPT about this error"
            >
                <MessageCircleQuestion size={12} class="mr-1" />
                Converse with ChatGPT
            </Button>
        </div>
    </Alert>
{/if}

<style>
    .markdown-explanation :global(h1),
    .markdown-explanation :global(h2),
    .markdown-explanation :global(h3),
    .markdown-explanation :global(h4) {
        color: #dc2626;
        margin-top: 8px;
        margin-bottom: 4px;
        font-weight: 600;
    }

    .markdown-explanation :global(h1) {
        font-size: 16px;
        border-bottom: 1px solid #fca5a5;
        padding-bottom: 2px;
    }

    .markdown-explanation :global(h2) {
        font-size: 15px;
    }

    .markdown-explanation :global(h3) {
        font-size: 14px;
    }

    .markdown-explanation :global(h4) {
        font-size: 13px;
    }

    .markdown-explanation :global(p) {
        margin-bottom: 8px;
        line-height: 1.5;
    }

    .markdown-explanation :global(ul),
    .markdown-explanation :global(ol) {
        margin-left: 16px;
        margin-bottom: 8px;
        padding-left: 4px;
    }

    .markdown-explanation :global(li) {
        margin-bottom: 4px;
        line-height: 1.4;
    }

    .markdown-explanation :global(blockquote) {
        border-left: 3px solid #f87171;
        background: #fef2f2;
        padding: 8px 12px;
        margin: 8px 0;
        border-radius: 4px;
        font-style: italic;
        color: #991b1b;
    }

    .markdown-explanation :global(code) {
        background: #fee2e2;
        color: #991b1b;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 11px;
        border: 1px solid #fca5a5;
    }

    .markdown-explanation :global(pre) {
        background: #fef2f2;
        border: 1px solid #fca5a5;
        padding: 12px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 8px 0;
    }

    .markdown-explanation :global(pre code) {
        background: none;
        border: none;
        padding: 0;
        color: #7f1d1d;
    }

    .markdown-explanation :global(strong) {
        font-weight: 700;
        color: #dc2626;
    }

    .markdown-explanation :global(em) {
        font-style: italic;
        color: #b91c1c;
    }

    .markdown-explanation :global(a) {
        color: #dc2626;
        text-decoration: underline;
    }

    .markdown-explanation :global(a:hover) {
        color: #991b1b;
    }
</style>