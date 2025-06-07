import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { rtdb } from '../../firebase';
import { ref, onValue, off, set, update, type DatabaseReference } from 'firebase/database';
import type { Node, Edge } from '@xyflow/svelte';
import {OutputSocketDataCache} from "../../routes/app/lib/Interpreter";

// Project state interface
export interface ProjectState {
    projectId: string | null;
    title: string;
    description: string;
    nodes: Node[];
    edges: Edge[];
    outputs: OutputSocketDataCache;
    lastSyncTime: Date | null;
    isDirty: boolean; // Has unsaved changes
    isSyncing: boolean;
}

// Initial state
const initialProjectState: ProjectState = {
    projectId: null,
    title: '',
    description: '',
    nodes: [],
    edges: [],
    outputs: new OutputSocketDataCache(),
    lastSyncTime: null,
    isDirty: false,
    isSyncing: false
};

// Core project store
export const projectState: Writable<ProjectState> = writable(initialProjectState);

// Derived stores
export const projectNodes: Readable<Node[]> = derived(projectState, $state => $state.nodes);
export const projectEdges: Readable<Edge[]> = derived(projectState, $state => $state.edges);
export const projectOutput: Readable<OutputSocketDataCache> = derived(projectState, $state => $state.outputs);
export const projectTitle: Readable<string> = derived(projectState, $state => $state.title);
export const isDirty: Readable<boolean> = derived(projectState, $state => $state.isDirty);
export const isSyncing: Readable<boolean> = derived(projectState, $state => $state.isSyncing);

// Project actions
export const projectActions = {
    setProject: (projectId: string): void => {
        projectState.update(state => ({ 
            ...state, 
            projectId,
            isDirty: false 
        }));
    },

    setNodes: (nodes: Node[]): void => {
        projectState.update(state => ({ 
            ...state, 
            nodes, 
            isDirty: true 
        }));
    },

    setEdges: (edges: Edge[]): void => {
        projectState.update(state => ({ 
            ...state, 
            edges, 
            isDirty: true 
        }));
    },

    updateNodeData: (nodeId: string, data: Record<string, unknown>): void => {
        projectState.update(state => ({
            ...state,
            nodes: state.nodes.map(node => 
                node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
            ),
            isDirty: true
        }));
    },

    setOutputs: (outputs: OutputSocketDataCache): void => {
        projectState.update(state => ({
            ...state,
            outputs: outputs
        }));
    },

    setTitle: (title: string): void => {
        projectState.update(state => ({ 
            ...state, 
            title, 
            isDirty: true 
        }));
    },

    setDescription: (description: string): void => {
        projectState.update(state => ({ 
            ...state, 
            description, 
            isDirty: true 
        }));
    },

    setSyncing: (isSyncing: boolean): void => {
        projectState.update(state => ({ ...state, isSyncing }));
    },

    markClean: (): void => {
        projectState.update(state => ({ 
            ...state, 
            isDirty: false, 
            lastSyncTime: new Date() 
        }));
    },

    resetProject: (): void => {
        projectState.set(initialProjectState);
    }
};

// Firebase RTDB project synchronization
class ProjectFirebaseSync {
    private projectListener: DatabaseReference | null = null;
    private currentProjectId: string | null = null;

    // Start syncing a project
    syncProject(projectId: string): void {
        console.log('Starting sync for project:', projectId);
        
        // Clean up previous listener
        this.cleanup();

        this.currentProjectId = projectId;
        this.projectListener = ref(rtdb, `fridge/${projectId}`);

        onValue(this.projectListener, (snapshot) => {
            const projectData = snapshot.val();
            console.log('Firebase RTDB data received:', projectData);
            
            if (projectData) {
                console.log('Updating project state with Firebase data');
                projectState.update(state => ({
                    ...state,
                    projectId,
                    title: projectData.title || '',
                    description: projectData.description || '',
                    nodes: projectData.nodes || [],
                    edges: projectData.edges || [],
                    lastSyncTime: new Date(),
                    isDirty: false
                }));
            } else {
                console.log('No project data found - initializing empty project');
                projectState.update(state => ({
                    ...state,
                    projectId,
                    title: 'New Project',
                    description: '',
                    nodes: [],
                    edges: [],
                    lastSyncTime: new Date(),
                    isDirty: false
                }));
            }
        });

        projectActions.setProject(projectId);
    }

    // Save current state to Firebase
    async saveProject(): Promise<void> {
        let currentState: ProjectState;
        
        // Get current state synchronously
        const unsubscribe = projectState.subscribe(value => {
            currentState = value;
        });
        unsubscribe();

        if (!currentState!.projectId) {
            console.warn('Cannot save project - no project ID set');
            throw new Error('No project ID set');
        }

        console.log('Saving project to Firebase RTDB:', currentState!.projectId);
        projectActions.setSyncing(true);

        try {
            const projectRef = ref(rtdb, `fridge/${currentState!.projectId}`);
            const saveData = {
                title: currentState!.title,
                description: currentState!.description,
                nodes: currentState!.nodes,
                edges: currentState!.edges,
                last_updated_at: new Date().toISOString()
            };
            
            console.log('Saving data:', saveData);
            await update(projectRef, saveData);
            console.log('Project saved successfully');

            projectActions.markClean();
        } catch (error) {
            console.error('Error saving project:', error);
            throw error;
        } finally {
            projectActions.setSyncing(false);
        }
    }

    // Clean up listeners
    cleanup(): void {
        if (this.projectListener) {
            off(this.projectListener);
            this.projectListener = null;
        }
        this.currentProjectId = null;
    }
}

export const projectSync = new ProjectFirebaseSync();

// Auto-save functionality (debounced)
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

projectState.subscribe(state => {
    if (state.isDirty && state.projectId) {
        console.log('Project is dirty, scheduling auto-save...');
        
        // Clear existing timeout
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        
        // Set new timeout for auto-save (2 seconds after last change)
        saveTimeout = setTimeout(() => {
            console.log('Auto-saving project...');
            projectSync.saveProject().catch(console.error);
        }, 2000);
    }
});