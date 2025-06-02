<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { Plus, Calendar, Users, Clock, Search, Filter, Grid, List, Home } from 'lucide-svelte';
    import { auth, rtdb } from '../../firebase'; // Assuming firebase.js exports initialized auth and rtdb
    import type { ProjectInfo } from '../app/lib/ProjectModels.js';
    import { goto } from '$app/navigation';
    import { ref, onValue, off, get } from 'firebase/database';
    import { onAuthStateChanged, type User } from 'firebase/auth';
    import '../../app.css';

    import {
        FirebaseRTDBProjectCollection,
        FirebaseRTDBProjectController
    } from '../app/lib/FirebaseRTDBProjectController.js';
    import type { ProjectCollectionInterface } from '../app/lib/ProjectInterfaces.js';
    import Logo from "../../components/Logo.svelte";
    export const ACTIVE_PROJECT_COLLECTION: ProjectCollectionInterface =
        new FirebaseRTDBProjectCollection();

    // Component state
    let searchTerm = '';
    let sortBy: 'last_updated_at' | 'created_at' | 'title' = 'last_updated_at';
    let viewMode: 'grid' | 'list' = 'grid';
    let showFilters = false;

    // Firebase data
    let currentUser: User | null = null;
    let allProjects: { [key: string]: ProjectInfo } | null = null;
    let projectsListener: (() => void) | null = null; // To store the unsubscribe function

    $: {
        console.log('allProjects', allProjects);
    }

    // Derived data
    $: userProjects = allProjects
        ? Object.entries(allProjects)
            .filter(([projectId, project]: [string, ProjectInfo]) => {
                // If there's no current user, no projects are accessible
                if (!currentUser) return false;

                console.log(project)

                // Check if user is invited to this project or is the creator
                const hasAccess =
                    project.invited_users &&
                    (currentUser.uid in project.invited_users); // Assuming 'created_by' field exists

                return hasAccess;
            })
            .map(([projectId, project]) => ({ ...project, nodeKey: projectId })) // Use nodeKey for project ID
        : [];

    $: filteredProjects = userProjects
        .filter((project: ProjectInfo & { nodeKey: string }) =>
            project.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            switch (sortBy) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'created_at':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'last_updated_at':
                default:
                    return new Date(b.last_updated_at).getTime() - new Date(a.last_updated_at).getTime();
            }
        });

    // --- Lifecycle Hooks ---
    onMount(() => {
        // Auth listener
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            currentUser = user;
            const projectsRef = ref(rtdb, 'fridge');

            if (user) {
                // Subscribe to RTDB projects only when a user is logged in
                projectsListener = onValue(projectsRef, (snapshot) => {
                    allProjects = snapshot.val();
                });
            } else {
                // If user logs out, clear projects and unsubscribe from RTDB
                allProjects = null;
                if (projectsListener) {
                    off(projectsRef, 'value', projectsListener);
                    projectsListener = null;
                }
            }
        });

        // Cleanup function for onMount
        return () => {
            unsubscribeAuth();
            if (projectsListener) {
                off(ref(rtdb, 'app-my-projects'), 'value', projectsListener);
            }
        };
    });

    // --- Helper functions ---
    function formatDate(dateInput: Date | string): string {
        if (!dateInput) return 'Unknown';
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    function getTimeAgo(dateInput: Date | string): string {
        if (!dateInput) return 'Unknown';
        const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    }

    function getInvitedUsersCount(invited_users: { [user_id: string]: boolean } | undefined): number {
        if (!invited_users) return 0;
        return Object.keys(invited_users).length;
    }

    function getInvitedUsersList(
        invited_users: { [user_id: string]: boolean } | undefined
    ): string[] {
        if (!invited_users) return [];
        return Object.keys(invited_users);
    }

    async function createNewProject() {
        if (!currentUser) {
            alert('Please log in to create a project.');
            return;
        }

        try {
            const projectName = prompt('Enter project name:', 'Untitled Noodle');
            if (!projectName) return;

            const projectDescription = prompt('Enter project description (optional):') || '';

            const controller = await ACTIVE_PROJECT_COLLECTION.newProject(
                projectName,
                projectDescription
            );

            // Navigate to the new project
            console.log('New project created:', controller);
            goto(`/app?pid=${(controller as unknown as FirebaseRTDBProjectController).project_key}`); // Assuming controller has nodeKey
        } catch (error) {
            console.error('Failed to create project:', error);
            alert('Failed to create project. Please try again.');
        }
    }

    async function openProject(projectId: string) {
        try {
            goto(`/app?pid=${projectId}`);
        } catch (error) {
            console.error('Failed to open project:', error);
            alert('Failed to open project. Please try again.');
        }
    }

    async function deleteProject(projectId: string, projectTitle: string) {
        if (
            !confirm(`Are you sure you want to delete "${projectTitle}"? This action cannot be undone.`)
        ) {
            return;
        }

        try {
            await ACTIVE_PROJECT_COLLECTION.deleteProject(projectId);
        } catch (error) {
            console.error('Failed to delete project:', error);
            alert('Failed to delete project. Please try again.');
        }
    }

    function goToHome() {
        goto('/');
    }
</script>

<div class="projects-page">
    <Logo></Logo>

    <header class="page-header">
        <div class="header-content">
            <div class="header-left">
                <h1>My Noodles</h1>
                <p class="subtitle">Manage and organize your Noodle projects</p>
            </div>
            <button class="create-btn" on:click={createNewProject}>
                <Plus size={20} />
                New Project
            </button>
        </div>
    </header>

    <div class="controls-bar">
        <div class="search-section">
            <div class="search-input-wrapper">
                <Search size={18} />
                <input
                        type="text"
                        placeholder="Search noodles..."
                        bind:value={searchTerm}
                        class="search-input"
                />
            </div>
        </div>

        <div class="controls-right">
            <button
                    class="filter-btn"
                    class:active={showFilters}
                    on:click={() => (showFilters = !showFilters)}
            >
                <Filter size={18} />
                Filters
            </button>

            <div class="view-toggle">
                <button
                        class="view-btn"
                        class:active={viewMode === 'grid'}
                        on:click={() => (viewMode = 'grid')}
                >
                    <Grid size={18} />
                </button>
                <button
                        class="view-btn"
                        class:active={viewMode === 'list'}
                        on:click={() => (viewMode = 'list')}
                >
                    <List size={18} />
                </button>
            </div>

            <select bind:value={sortBy} class="sort-select">
                <option value="last_updated_at">Last Modified</option>
                <option value="created_at">Date Created</option>
                <option value="title">Title</option>
            </select>
        </div>
    </div>

    {#if showFilters}
        <div class="filters-panel">
            <div class="filter-group">
                <label>Created:</label>
                <select>
                    <option>Any time</option>
                    <option>Last week</option>
                    <option>Last month</option>
                    <option>Last year</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Shared:</label>
                <select>
                    <option>All noodles</option>
                    <option>Only shared</option>
                    <option>Only private</option>
                </select>
            </div>
        </div>
    {/if}

    <main class="projects-container">
        {#if allProjects === null && currentUser}
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading your noodles...</p>
            </div>
        {:else if !currentUser}
            <div class="empty-state">
                <h3>Please log in to view your noodles.</h3>
                <p>Log in to access and manage your projects.</p>
            </div>
        {:else if filteredProjects.length === 0}
            <div class="empty-state">
                {#if searchTerm}
                    <p>No noodles found matching "{searchTerm}"</p>
                {:else}
                    <div class="empty-illustration">
                        <Plus size={48} />
                    </div>
                    <h3>No noodles yet</h3>
                    <p>Create your first GenNoodle project to get started!</p>
                    <button class="create-btn" on:click={createNewProject}>
                        <Plus size={20} />
                        Create Project
                    </button>
                {/if}
            </div>
        {:else}
            <div class="projects-grid" class:list-view={viewMode === 'list'}>
                {#each filteredProjects as project (project.nodeKey)}
                    <div class="project-card" on:click={() => openProject(project.nodeKey)}>
                        <div class="project-header">
                            <h3 class="project-title">{project.title}</h3>
                            <div class="project-menu">
                                <button
                                        class="delete-btn"
                                        on:click|stopPropagation={() => deleteProject(project.nodeKey, project.title)}
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div class="project-meta">
                            <div class="meta-item">
                                <Calendar size={14} />
                                <span>Created {formatDate(project.created_at)}</span>
                            </div>

                            <div class="meta-item">
                                <Clock size={14} />
                                <span>Modified {getTimeAgo(project.last_updated_at)}</span>
                            </div>

                            {#if getInvitedUsersCount(project.invited_users) > 0}
                                <div class="meta-item">
                                    <Users size={14} />
                                    <span>{getInvitedUsersCount(project.invited_users)} invited</span>
                                </div>
                            {/if}

                            {#if project.show_tutorial}
                                <div class="meta-item tutorial-badge">
                                    <span>Tutorial Mode</span>
                                </div>
                            {/if}
                        </div>

                        {#if project.invited_users && getInvitedUsersCount(project.invited_users) > 0}
                            <div class="collaborators">
                                <span class="collaborators-label">Invited users:</span>
                                <div class="collaborators-list">
                                    {#each getInvitedUsersList(project.invited_users).slice(0, 3) as userId}
                                        <div class="collaborator-avatar" title={userId}>
                                            {userId.charAt(0).toUpperCase()}
                                        </div>
                                    {/each}
                                    {#if getInvitedUsersCount(project.invited_users) > 3}
                                        <div class="collaborator-avatar more">
                                            +{getInvitedUsersCount(project.invited_users) - 3}
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    </main>
</div>

<style>
    .projects-page {
        font-family: 'Monaco';
        min-height: 100vh;
        background: linear-gradient(135deg, #020617 0%, #17072b 50%, #1e0b3a 100%); /* Even darker background */
        padding: 20px;
        position: relative; /* For positioning the home button */
    }

    .noodler-home-btn {
        position: absolute;
        top: 20px;
        left: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.9);
        border: none;
        padding: 10px 15px;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        color: #2d3748;
        z-index: 10;
    }

    .noodler-home-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }

    .page-header {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .header-left h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #2d3748;
        margin: 0 0 8px 0;
    }

    .subtitle {
        color: #4a5568;
        margin: 0;
    }

    .create-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .create-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.6);
    }

    .controls-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 16px 20px;
        margin-bottom: 20px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .search-input-wrapper {
        display: flex;
        align-items: center;
        background: #f7fafc;
        border-radius: 8px;
        padding: 8px 12px;
        gap: 8px;
        min-width: 300px;
    }

    .search-input {
        border: none;
        background: none;
        outline: none;
        flex: 1;
        font-size: 14px;
    }

    .controls-right {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .filter-btn,
    .view-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        background: none;
        border: 1px solid #e2e8f0;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .filter-btn:hover,
    .view-btn:hover {
        background: #f7fafc;
    }

    .filter-btn.active,
    .view-btn.active {
        background: #667eea;
        color: white;
        border-color: #667eea;
    }

    .view-toggle {
        display: flex;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overnoodle: hidden;
    }

    .view-toggle .view-btn {
        border: none;
        border-radius: 0;
    }

    .sort-select {
        padding: 8px 12px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: white;
        cursor: pointer;
    }

    .filters-panel {
        display: flex;
        gap: 20px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 16px 20px;
        margin-bottom: 20px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .filter-group {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .filter-group label {
        font-weight: 500;
        color: #4a5568;
    }

    .filter-group select {
        padding: 6px 10px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: white;
    }

    .projects-container {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .loading-state,
    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        text-align: center;
    }

    .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
    }

    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .empty-illustration {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        margin-bottom: 20px;
    }

    .projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 20px;
    }

    .projects-grid.list-view {
        grid-template-columns: 1fr;
    }

    .project-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid #e2e8f0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .project-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        border-color: #667eea;
    }

    .project-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
    }

    .project-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #2d3748;
        margin: 0;
    }

    .delete-btn {
        background: none;
        border: none;
        color: #a0aec0;
        font-size: 20px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: color 0.2s ease;
    }

    .delete-btn:hover {
        color: #e53e3e;
    }

    .project-description {
        color: #4a5568;
        margin-bottom: 16px;
        line-height: 1.5;
    }

    .project-meta {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
    }

    .meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #718096;
    }

    .collaborators {
        margin-bottom: 16px;
    }

    .collaborators-label {
        font-size: 12px;
        color: #718096;
        display: block;
        margin-bottom: 8px;
    }

    .collaborators-list {
        display: flex;
        gap: 4px;
    }

    .collaborator-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 600;
    }

    .collaborator-avatar.more {
        background: #e2e8f0;
        color: #4a5568;
    }

    .project-stats {
        display: flex;
        gap: 16px;
        padding-top: 16px;
        border-top: 1px solid #e2e8f0;
        font-size: 12px;
        color: #718096;
    }
</style>