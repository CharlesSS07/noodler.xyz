<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    export type LlmContentGeneratorType = Node<
        {
            input: {
                topic?: string;
                contentType?: string;
                tone?: string;
                length?: string;
            };
            output: {
                generatedContent?: string;
                metadata?: Record<string, any>;
            };
        },
        'llm-content-generator'
    >;
</script>

<script lang="ts">
    import { type NodeProps } from '@xyflow/svelte';
    import NodeWrapper from "$lib/components/NodeWrapper.svelte";
    import { Handle } from '@xyflow/svelte';
    
    let { id, data }: NodeProps<LlmContentGeneratorType> = $props();

    // Node settings
    let contentType = $state('news-article');
    let tone = $state('professional');
    let length = $state('medium');
    let includeImages = $state(true);
    let includeSources = $state(true);
    
    // Processing state
    let generatedContent = $state('');
    let processingStatus = $state('ready');
    let generationProgress = $state(0);

    // Content type options
    const contentTypes = [
        { value: 'news-article', label: 'News Article' },
        { value: 'blog-post', label: 'Blog Post' },
        { value: 'product-description', label: 'Product Description' },
        { value: 'landing-page', label: 'Landing Page' },
        { value: 'press-release', label: 'Press Release' },
        { value: 'social-media', label: 'Social Media Post' }
    ];

    const tones = [
        { value: 'professional', label: 'Professional' },
        { value: 'casual', label: 'Casual' },
        { value: 'formal', label: 'Formal' },
        { value: 'friendly', label: 'Friendly' },
        { value: 'urgent', label: 'Urgent' },
        { value: 'humorous', label: 'Humorous' }
    ];

    const lengths = [
        { value: 'short', label: 'Short (100-200 words)' },
        { value: 'medium', label: 'Medium (300-500 words)' },
        { value: 'long', label: 'Long (700-1000 words)' },
        { value: 'extended', label: 'Extended (1200+ words)' }
    ];

    // Initialize data structure
    $effect(() => {
        if (!data.input) data.input = {};
        if (!data.output) data.output = {};
        if (!data.nid) data.nid = 'demo_llm_content_generator';
    });

    // Access input values
    let topic = $derived(data.input?.topic || '');
    let inputContentType = $derived(data.input?.contentType || '');
    let inputTone = $derived(data.input?.tone || '');
    let inputLength = $derived(data.input?.length || '');

    // Generate content when inputs change
    $effect(() => {
        if (topic && topic.trim()) {
            generateContent();
        } else {
            processingStatus = 'ready';
            generatedContent = '';
            generationProgress = 0;
        }
    });

    // Update output
    $effect(() => {
        data.output.generatedContent = generatedContent;
        data.output.metadata = {
            topic,
            contentType: inputContentType || contentType,
            tone: inputTone || tone,
            length: inputLength || length,
            wordCount: generatedContent.split(' ').length,
            timestamp: new Date().toISOString()
        };
    });

    async function generateContent() {
        processingStatus = 'processing';
        generationProgress = 0;

        // Simulate AI generation process
        const steps = [
            'Analyzing topic...',
            'Researching content...',
            'Generating outline...',
            'Writing content...',
            'Reviewing and polishing...'
        ];

        for (let i = 0; i < steps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 800));
            generationProgress = ((i + 1) / steps.length) * 100;
        }

        generatedContent = generateMockContent(topic, inputContentType || contentType, inputTone || tone, inputLength || length);
        processingStatus = 'complete';
    }

    function generateMockContent(topic: string, type: string, toneValue: string, lengthValue: string): string {
        const topicLower = topic.toLowerCase();
        
        // Generate content based on type
        let content = '';
        
        if (type === 'news-article') {
            content = generateNewsArticle(topic, toneValue, lengthValue);
        } else if (type === 'blog-post') {
            content = generateBlogPost(topic, toneValue, lengthValue);
        } else if (type === 'landing-page') {
            content = generateLandingPage(topic, toneValue, lengthValue);
        } else {
            content = generateGenericContent(topic, type, toneValue, lengthValue);
        }
        
        return content;
    }

    function generateNewsArticle(topic: string, tone: string, length: string): string {
        const headlines = [
            `Breaking: Major Developments in ${topic}`,
            `${topic} Industry Sees Unprecedented Growth`,
            `Latest Updates on ${topic} Shake the Market`,
            `Experts Weigh In on Recent ${topic} Trends`
        ];
        
        const headline = headlines[Math.floor(Math.random() * headlines.length)];
        
        let article = `<h1>${headline}</h1>\n\n`;
        article += `<p class="byline">By AI Reporter | ${new Date().toLocaleDateString()}</p>\n\n`;
        
        if (length === 'short') {
            article += `<p>In a significant development, ${topic} has captured widespread attention today. Industry experts are closely monitoring the situation as new information continues to emerge.</p>\n\n`;
            article += `<p>The implications of these changes in ${topic} are expected to have far-reaching effects across multiple sectors. Stakeholders are advised to stay informed as the situation develops.</p>`;
        } else {
            article += `<p>In a groundbreaking development that has sent ripples through the industry, ${topic} has emerged as a focal point of intense scrutiny and analysis. The latest developments have caught the attention of experts, analysts, and stakeholders worldwide.</p>\n\n`;
            article += `<p>According to leading industry analysts, the current trends in ${topic} represent a paradigm shift that could reshape the landscape for years to come. "This is exactly the kind of innovation we've been anticipating," says Dr. Sarah Mitchell, a renowned expert in the field.</p>\n\n`;
            article += `<p>The implications extend far beyond immediate market reactions, with potential long-term consequences for policy makers, consumers, and industry leaders alike. As the situation continues to evolve, all eyes remain focused on how ${topic} will influence future developments.</p>\n\n`;
            
            if (length === 'long' || length === 'extended') {
                article += `<h2>Key Developments</h2>\n`;
                article += `<ul>\n<li>Significant advancement in ${topic} technology</li>\n<li>Increased investment from major industry players</li>\n<li>Regulatory framework adaptations in progress</li>\n<li>Consumer adoption rates exceeding expectations</li>\n</ul>\n\n`;
                article += `<p>Market analysts predict that these developments in ${topic} will continue to accelerate, with potential breakthrough announcements expected in the coming months. The competitive landscape is rapidly evolving as companies race to capitalize on emerging opportunities.</p>`;
            }
        }
        
        if (includeSources) {
            article += `\n\n<p><em>Sources: Industry Reports, Expert Interviews, Market Analysis</em></p>`;
        }
        
        return article;
    }

    function generateBlogPost(topic: string, tone: string, length: string): string {
        let post = `<h1>Everything You Need to Know About ${topic}</h1>\n\n`;
        
        const intro = tone === 'casual' 
            ? `<p>Hey there! Let's dive into the fascinating world of ${topic}. Trust me, this is way more interesting than it might sound at first!</p>`
            : `<p>Understanding ${topic} is crucial in today's rapidly evolving landscape. This comprehensive guide will walk you through the essential concepts and practical applications.</p>`;
            
        post += intro + '\n\n';
        
        if (length !== 'short') {
            post += `<h2>Why ${topic} Matters</h2>\n`;
            post += `<p>The significance of ${topic} cannot be overstated. From transforming traditional practices to opening new possibilities, the impact is both immediate and far-reaching.</p>\n\n`;
            
            post += `<h2>Key Benefits</h2>\n`;
            post += `<ul>\n<li>Enhanced efficiency and productivity</li>\n<li>Cost-effective solutions</li>\n<li>Improved user experience</li>\n<li>Scalable implementations</li>\n</ul>\n\n`;
        }
        
        post += `<h2>Getting Started</h2>\n`;
        post += `<p>Ready to explore ${topic}? Here are some practical steps to begin your journey and make the most of available opportunities.</p>`;
        
        return post;
    }

    function generateLandingPage(topic: string, tone: string, length: string): string {
        let page = `<div class="hero-section">\n`;
        page += `<h1>Transform Your Business with ${topic}</h1>\n`;
        page += `<p class="hero-subtitle">Discover the power of ${topic} and unlock unprecedented growth opportunities</p>\n`;
        page += `<button class="cta-button">Get Started Today</button>\n`;
        page += `</div>\n\n`;
        
        page += `<div class="features-section">\n`;
        page += `<h2>Why Choose Our ${topic} Solution?</h2>\n`;
        page += `<div class="features-grid">\n`;
        page += `<div class="feature">\n<h3>🚀 Fast Implementation</h3>\n<p>Get up and running in minutes, not days</p>\n</div>\n`;
        page += `<div class="feature">\n<h3>💰 Cost Effective</h3>\n<p>Save up to 60% compared to traditional solutions</p>\n</div>\n`;
        page += `<div class="feature">\n<h3>📈 Proven Results</h3>\n<p>Join thousands of satisfied customers</p>\n</div>\n`;
        page += `</div>\n</div>`;
        
        return page;
    }

    function generateGenericContent(topic: string, type: string, tone: string, length: string): string {
        return `<h1>${topic} Overview</h1>\n\n<p>This ${type} provides comprehensive coverage of ${topic}, tailored with a ${tone} tone to meet your specific needs.</p>\n\n<p>The content has been optimized for ${length} format, ensuring the right balance of depth and accessibility for your target audience.</p>`;
    }

    const nodeTitle = "LLM Content Generator";
    const nodeDescription = "Generates various types of content using AI language models";
</script>

<NodeWrapper title={nodeTitle} description={nodeDescription} label="LLM Content Generator">
    <!-- Input Sockets -->
    <Handle 
        type="target"
        socketType="string"
        label="Topic"
        socket_id="topic"
        tooltip="Main topic or subject for content generation"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Topic</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>
    
    <Handle 
        type="target"
        socketType="string"
        label="Content Type"
        socket_id="contentType"
        tooltip="Type of content to generate"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Content Type</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>
    
    <Handle 
        type="target"
        socketType="string"
        label="Tone"
        socket_id="tone"
        tooltip="Writing tone and style"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Tone</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>
    
    <Handle 
        type="target"
        socketType="string"
        label="Length"
        socket_id="length"
        tooltip="Content length specification"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Length</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>

    <!-- Node Content -->
    <div class="generator-content">
        <!-- Settings -->
        <div class="settings-section">
            <h4>Generation Settings</h4>
            
            <div class="setting">
                <label for="content-type">Content Type:</label>
                <select id="content-type" bind:value={contentType} class="setting-select">
                    {#each contentTypes as type}
                        <option value={type.value}>{type.label}</option>
                    {/each}
                </select>
            </div>
            
            <div class="setting">
                <label for="tone-select">Tone:</label>
                <select id="tone-select" bind:value={tone} class="setting-select">
                    {#each tones as toneOption}
                        <option value={toneOption.value}>{toneOption.label}</option>
                    {/each}
                </select>
            </div>
            
            <div class="setting">
                <label for="length-select">Length:</label>
                <select id="length-select" bind:value={length} class="setting-select">
                    {#each lengths as lengthOption}
                        <option value={lengthOption.value}>{lengthOption.label}</option>
                    {/each}
                </select>
            </div>
            
            <div class="checkbox-setting">
                <label>
                    <input type="checkbox" bind:checked={includeImages} />
                    Include image suggestions
                </label>
            </div>
            
            <div class="checkbox-setting">
                <label>
                    <input type="checkbox" bind:checked={includeSources} />
                    Include source citations
                </label>
            </div>
        </div>

        <!-- Generation Status -->
        <div class="generation-status">
            <div class="status-indicator {processingStatus}">
                {#if processingStatus === 'ready'}
                    🤖 Ready to Generate
                {:else if processingStatus === 'processing'}
                    ⚙️ Generating Content...
                {:else}
                    ✅ Content Generated
                {/if}
            </div>
            
            {#if processingStatus === 'processing'}
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {generationProgress}%"></div>
                </div>
                <div class="progress-text">{Math.round(generationProgress)}%</div>
            {/if}
        </div>

        <!-- Preview -->
        {#if generatedContent}
            <div class="content-preview">
                <h4>Generated Content Preview:</h4>
                <div class="content-display">
                    {@html generatedContent.substring(0, 300)}
                    {#if generatedContent.length > 300}
                        <div class="preview-truncated">... (content truncated)</div>
                    {/if}
                </div>
                <div class="content-stats">
                    Words: {generatedContent.split(' ').length} | 
                    Characters: {generatedContent.length}
                </div>
            </div>
        {/if}
    </div>

    <!-- Output Sockets -->
    <Handle 
        type="source"
        socketType="string"
        label="Generated Content"
        socket_id="generatedContent"
        tooltip="AI-generated content with HTML formatting"
    >
        <div class="socket-content output-content">
            <span class="socket-label">Generated Content</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>
    
    <Handle 
        type="source"
        socketType="object"
        label="Metadata"
        socket_id="metadata"
        tooltip="Generation metadata and statistics"
    >
        <div class="socket-content output-content">
            <span class="socket-label">Metadata</span>
            <span class="socket-type">object</span>
        </div>
    </Handle>
</NodeWrapper>

<style>
    .generator-content {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-width: 320px;
    }

    .settings-section {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.75rem;
        background: #f9fafb;
    }

    .settings-section h4 {
        margin: 0 0 0.75rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
    }

    .setting {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-bottom: 0.75rem;
    }

    .setting:last-child {
        margin-bottom: 0;
    }

    .setting label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #374151;
    }

    .setting-select {
        padding: 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        font-size: 0.875rem;
    }

    .checkbox-setting {
        margin-bottom: 0.5rem;
    }

    .checkbox-setting label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        cursor: pointer;
    }

    .generation-status {
        text-align: center;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .status-indicator {
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        font-weight: 500;
    }

    .status-indicator.ready {
        background: #e5e7eb;
        color: #4b5563;
    }

    .status-indicator.processing {
        background: #fef3c7;
        color: #92400e;
        animation: pulse 2s infinite;
    }

    .status-indicator.complete {
        background: #d1fae5;
        color: #065f46;
    }

    .progress-bar {
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        transition: width 0.3s ease;
        border-radius: 4px;
    }

    .progress-text {
        font-size: 0.75rem;
        color: #6b7280;
        font-weight: 500;
    }

    .content-preview {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.75rem;
        background: #f9fafb;
    }

    .content-preview h4 {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
    }

    .content-display {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 0.25rem;
        padding: 0.75rem;
        font-size: 0.75rem;
        line-height: 1.5;
        max-height: 200px;
        overflow-y: auto;
    }

    .preview-truncated {
        color: #9ca3af;
        font-style: italic;
        margin-top: 0.5rem;
    }

    .content-stats {
        margin-top: 0.5rem;
        font-size: 0.75rem;
        color: #6b7280;
        text-align: right;
    }

    .socket-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .input-content {
        align-items: flex-start;
        text-align: left;
    }

    .output-content {
        align-items: flex-end;
        text-align: right;
    }

    .socket-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #374151;
    }

    .socket-type {
        font-size: 0.625rem;
        font-weight: 400;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.8;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
    }
</style>