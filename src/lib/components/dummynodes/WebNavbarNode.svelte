<script module lang="ts">
    import { type Node } from '@xyflow/svelte';

    export type WebNavbarNodeType = Node<
        {
            input: {
                brandName?: string;
                logoUrl?: string;
            };
            output: {
                navbarHtml?: string;
            };
        },
        'web-navbar-node'
    >;
</script>

<script lang="ts">
    import { Handle, type NodeProps } from '@xyflow/svelte';
    import NodeWrapper from "$lib/components/nodeComponents/NodeWrapper.svelte";
    
    let { id, data }: NodeProps<WebNavbarNodeType> = $props();

    // Node settings
    let navItems = $state([
        { text: 'Home', href: '#home' },
        { text: 'About', href: '#about' },
        { text: 'Services', href: '#services' },
        { text: 'Contact', href: '#contact' }
    ]);
    let navStyle = $state('horizontal');
    let includeSearch = $state(true);
    let includeCTA = $state(true);
    let ctaText = $state('Get Started');

    // Initialize data structure
    $effect(() => {
        if (!data.input) data.input = {};
        if (!data.output) data.output = {};
        if (!data.nid) data.nid = 'demo_web_navbar_generator';
    });

    // Access input values
    let brandName = $derived(data.input?.brandName || 'Brand');
    let logoUrl = $derived(data.input?.logoUrl || '');

    // Generate navbar HTML
    $effect(() => {
        let html = '<nav class="navbar">';
        
        // Brand section
        html += '<div class="navbar-brand">';
        if (logoUrl) {
            html += `<img src="${logoUrl}" alt="${brandName}" class="navbar-logo" />`;
        }
        html += `<span class="brand-text">${brandName}</span>`;
        html += '</div>';
        
        // Navigation items
        html += `<ul class="navbar-nav ${navStyle}">`;
        navItems.forEach(item => {
            html += `<li class="nav-item"><a href="${item.href}" class="nav-link">${item.text}</a></li>`;
        });
        html += '</ul>';
        
        // Right section
        html += '<div class="navbar-actions">';
        
        if (includeSearch) {
            html += '<div class="search-box">';
            html += '<input type="text" placeholder="Search..." class="search-input" />';
            html += '<button class="search-btn">🔍</button>';
            html += '</div>';
        }
        
        if (includeCTA) {
            html += `<button class="cta-button">${ctaText}</button>`;
        }
        
        html += '</div>';
        html += '</nav>';
        
        // Add CSS
        html += `<style>
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: #ffffff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border-bottom: 1px solid #e5e7eb;
}
.navbar-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 700;
    font-size: 1.25rem;
    color: #1f2937;
}
.navbar-logo {
    height: 2rem;
    width: auto;
}
.navbar-nav {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 2rem;
}
.navbar-nav.vertical {
    flex-direction: column;
    gap: 1rem;
}
.nav-link {
    text-decoration: none;
    color: #6b7280;
    font-weight: 500;
    transition: color 0.2s;
}
.nav-link:hover {
    color: #3b82f6;
}
.navbar-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}
.search-box {
    display: flex;
    align-items: center;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    overflow: hidden;
}
.search-input {
    padding: 0.5rem;
    border: none;
    outline: none;
    font-size: 0.875rem;
}
.search-btn {
    padding: 0.5rem;
    border: none;
    background: #f3f4f6;
    cursor: pointer;
}
.cta-button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
}
.cta-button:hover {
    background: #2563eb;
}
</style>`;
        
        data.output.navbarHtml = html;
    });

    function addNavItem() {
        navItems = [...navItems, { text: 'New Item', href: '#new' }];
    }

    function removeNavItem(index: number) {
        navItems = navItems.filter((_, i) => i !== index);
    }

    function updateNavItem(index: number, field: 'text' | 'href', value: string) {
        navItems = navItems.map((item, i) => 
            i === index ? { ...item, [field]: value } : item
        );
    }

    const nodeTitle = "Web Navbar";
    const nodeDescription = "Generates responsive navigation bar with customizable items and styling";
</script>

<NodeWrapper title={nodeTitle} description={nodeDescription} label="Web Navbar">
    <!-- Input Sockets -->
    <Handle 
        type="target"
        socketType="string"
        label="Brand Name"
        socket_id="brandName"
        tooltip="Company or site name"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Brand Name</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>
    
    <Handle 
        type="target"
        socketType="string"
        label="Logo URL"
        socket_id="logoUrl"
        tooltip="Logo image URL"
    >
        <div class="socket-content input-content">
            <span class="socket-label">Logo URL</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>

    <!-- Node Content -->
    <div class="navbar-content">
        <!-- Navigation Items -->
        <div class="nav-items-section">
            <div class="section-header">
                <h4>Navigation Items</h4>
                <button onclick={addNavItem} class="add-btn">+ Add</button>
            </div>
            
            {#each navItems as item, index}
                <div class="nav-item-row">
                    <input 
                        type="text" 
                        value={item.text}
                        oninput={(e) => updateNavItem(index, 'text', e.target.value)}
                        placeholder="Text"
                        class="nav-input"
                    />
                    <input 
                        type="text" 
                        value={item.href}
                        oninput={(e) => updateNavItem(index, 'href', e.target.value)}
                        placeholder="Link"
                        class="nav-input"
                    />
                    <button onclick={() => removeNavItem(index)} class="remove-btn">×</button>
                </div>
            {/each}
        </div>

        <!-- Settings -->
        <div class="settings-section">
            <h4>Settings</h4>
            
            <div class="setting">
                <label for="nav-style">Style:</label>
                <select bind:value={navStyle} id="nav-style" class="setting-select">
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                </select>
            </div>
            
            <div class="checkbox-setting">
                <label>
                    <input type="checkbox" bind:checked={includeSearch} />
                    Include search box
                </label>
            </div>
            
            <div class="checkbox-setting">
                <label>
                    <input type="checkbox" bind:checked={includeCTA} />
                    Include CTA button
                </label>
            </div>
            
            {#if includeCTA}
                <div class="setting">
                    <label for="cta-text">CTA Text:</label>
                    <input 
                        type="text" 
                        id="cta-text"
                        bind:value={ctaText} 
                        class="setting-input"
                    />
                </div>
            {/if}
        </div>
    </div>

    <!-- Output Socket -->
    <Handle 
        type="source"
        socketType="string"
        label="Navbar HTML"
        socket_id="navbarHtml"
        tooltip="Generated navbar HTML with CSS"
    >
        <div class="socket-content output-content">
            <span class="socket-label">Navbar HTML</span>
            <span class="socket-type">string</span>
        </div>
    </Handle>
</NodeWrapper>

<style>
    .navbar-content {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-width: 320px;
    }

    .nav-items-section, .settings-section {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.75rem;
        background: #f9fafb;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
    }

    .section-header h4, .settings-section h4 {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
    }

    .add-btn {
        background: #10b981;
        color: white;
        border: none;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        cursor: pointer;
        font-weight: 500;
    }

    .nav-item-row {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        align-items: center;
    }

    .nav-input {
        flex: 1;
        padding: 0.25rem 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 0.25rem;
        font-size: 0.75rem;
    }

    .remove-btn {
        background: #ef4444;
        color: white;
        border: none;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
        cursor: pointer;
        font-weight: bold;
        width: 1.5rem;
        height: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
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

    .setting-input, .setting-select {
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
</style>