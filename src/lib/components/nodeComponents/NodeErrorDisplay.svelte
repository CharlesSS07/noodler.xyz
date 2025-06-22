

<script lang="ts">
    import {Button, Alert} from 'flowbite-svelte';
    import {Copy, Check, MessageCircleQuestion} from 'lucide-svelte';

    interface Props {
        id: string;
        errorMessage: string;
    }

    let {
        id,
        errorMessage = $bindable('')
    }: Props = $props();

    import {projectOutputDataCache} from "$lib/stores/ProjectState";
    import {untrack} from "svelte";

    let copySuccess = $state(false);

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

    function getChatGPTUrl(): string {
        const prompt = encodeURIComponent(`I'm getting this error in my code: "${errorMessage as string}". Can you help me understand what's causing this error and how to fix it?`);
        return `https://chat.openai.com/?q=${prompt}`;
    }

    // $effect(() => {
    //
    // });

    const unsubscribeSocket = projectOutputDataCache.useSocketStore(
        id,
        '__error__'
    ).subscribe((socketData) => {
        untrack(() => {
            console.log(socketData)
            if (socketData !== undefined && socketData !== null) {
                console.log('displaying error', "error:"+socketData as string, JSON.stringify(socketData, null, 2), typeof socketData, socketData instanceof Error);
                errorMessage = ''+socketData as string;
            }
        });
    });
    // return unsubscribeSocket;
</script>

{#if errorMessage}
    <Alert color="red" class="space-y-3">
        <div class="error-message font-mono text-sm break-words" style="text-align: left;">
            {errorMessage}
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
                title="Ask ChatGPT about this error"
            >
                <MessageCircleQuestion size={12} class="mr-1" />
                Ask ChatGPT
            </Button>
        </div>
    </Alert>
{/if}