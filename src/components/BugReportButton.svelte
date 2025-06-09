<script lang="ts">
    let { size = 'md', class: className = '' } = $props<{
        size?: 'sm' | 'md' | 'lg';
        class?: string;
    }>();

    function openBugReport() {
        const subject = encodeURIComponent('Bug Report - Noodler.xyz');
        const body = encodeURIComponent(`
Hello,

I found a bug in Noodler.xyz:

**Page/Location:** ${window.location.href}

**What happened:**
[Describe what you were doing when the bug occurred]

**Expected behavior:**
[Describe what you expected to happen]

**Actual behavior:**
[Describe what actually happened]

**Browser:** ${navigator.userAgent}

**Additional details:**
[Any other relevant information]

Thank you!
        `.trim());
        
        window.location.href = `mailto:c-shelby-07@proton.me?subject=${subject}&body=${body}`;
    }

    const sizeClasses = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg'
    };
</script>

<button
    onclick={openBugReport}
    class="inline-flex items-center justify-center font-medium rounded-full bg-green-500 hover:bg-green-600 text-white transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1 {sizeClasses[size]} {className}"
    title="Report a bug or issue"
>
    (🐛 BETA) REPORT BUG
</button>

<style>
    button:active {
        transform: scale(0.95);
    }
</style>