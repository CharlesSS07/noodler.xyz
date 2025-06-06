<script lang="ts">
    import { onMount } from 'svelte';

    let textareaElement: HTMLTextAreaElement; // This will hold a reference to the textarea DOM element
    export let textContent: string = ''; // The bound value of the textarea

    // Function to adjust the height of the textarea
    function adjustHeight(): void {
        if (textareaElement) {
            textareaElement.style.height = 'auto'; // Reset height to recalculate
            textareaElement.style.height = textareaElement.scrollHeight + 'px';
        }
    }

    // Adjust height whenever textContent changes
    $: {
        if (textContent) { // Only adjust if there's content to avoid initial flicker
            adjustHeight();
        }
    }

    // Adjust height on initial mount (in case of pre-filled content)
    onMount(() => {
        adjustHeight();
    });
</script>

<style>
    textarea {
        resize: none; /* Prevent manual resizing by the user */
        overflow-y: hidden; /* Hide the scrollbar */
        min-height: 50px; /* Optional: Set a minimum height */
        width: 100%; /* Or whatever width you need */
        box-sizing: border-box; /* Include padding and border in the element's total width and height */
    }
</style>

<textarea
        bind:this={textareaElement}
        bind:value={textContent}
        on:input={adjustHeight}
        placeholder="Start typing..."
></textarea>

<p>Current content: {textContent}</p>