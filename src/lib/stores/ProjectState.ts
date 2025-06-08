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
        projectState.update(state => {
            // Don't set dirty flag if we're setting the same data (prevents blocking Firebase loads)
            const isSameData = JSON.stringify(state.nodes) === JSON.stringify(nodes);
            return { 
                ...state, 
                nodes, 
                isDirty: !isSameData && projectSync.isInitialLoadComplete()
            };
        });
    },

    setEdges: (edges: Edge[]): void => {
        projectState.update(state => {
            // Don't set dirty flag if we're setting the same data (prevents blocking Firebase loads)
            const isSameData = JSON.stringify(state.edges) === JSON.stringify(edges);
            return { 
                ...state, 
                edges, 
                isDirty: !isSameData && projectSync.isInitialLoadComplete()
            };
        });
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
    private isLocalUpdate: boolean = false; // Flag to prevent overwriting local changes
    private hasInitialLoad: boolean = false; // Flag to prevent saving during initial load

    // Helper method to convert Firebase objects to arrays
    private convertFirebaseDataToArray(data: any): any[] {
        console.log('convertFirebaseDataToArray called with:', data);
        
        if (!data) {
            console.log('No data provided, returning empty array');
            return [];
        }
        
        if (Array.isArray(data)) {
            console.log('Data is already array, returning as-is');
            return data;
        }
        
        // If it's an object, convert to array of objects with id property
        if (typeof data === 'object') {
            const result = Object.entries(data).map(([id, item]: [string, any]) => {
                console.log('Processing entry:', { id, item });
                if (item && typeof item === 'object' && !item.id) {
                    return { id, ...item };
                }
                return item;
            }).filter(Boolean);
            
            console.log('Converting Firebase object to array:', { input: data, output: result });
            return result;
        }
        
        console.log('Data is not object or array, returning empty array');
        return [];
    }

    // Helper method to convert arrays to Firebase objects
    private convertArrayToFirebaseObject(array: any[]): Record<string, any> {
        if (!array || !Array.isArray(array)) {
            console.log('convertArrayToFirebaseObject: Invalid input', array);
            return {};
        }
        
        const result: Record<string, any> = {};
        array.forEach(item => {
            if (item && item.id) {
                const { id, ...itemWithoutId } = item;
                result[id] = itemWithoutId;
            }
        });
        
        console.log('Converting array to Firebase object:', { input: array, output: result });
        return result;
    }

    // Start syncing a project
    syncProject(projectId: string): void {
        console.log('Starting sync for project:', projectId);
        
        // Clean up previous listener
        this.cleanup();

        this.currentProjectId = projectId;
        this.hasInitialLoad = false; // Reset flag for new project
        this.projectListener = ref(rtdb, `fridge/${projectId}`);

        onValue(this.projectListener, (snapshot) => {
            const projectData = snapshot.val();
            console.log('Firebase RTDB data received:', projectData);
            
            // Skip updates if we're in the middle of a local update
            if (this.isLocalUpdate) {
                console.log('Skipping Firebase update - local update in progress');
                return;
            }
            
            // Check if we have pending local changes - if so, don't overwrite them
            let currentState: ProjectState;
            const unsubscribe = projectState.subscribe(value => {
                currentState = value;
            });
            unsubscribe();
            
            if (currentState!.isDirty) {
                console.log('Skipping Firebase update - local changes are pending save');
                return;
            }
            
            if (projectData) {
                console.log('Updating project state with Firebase data');
                
                // Convert Firebase objects to arrays if needed
                console.log('Raw Firebase data - nodes:', projectData.nodes, 'edges:', projectData.edges);
                const nodes = this.convertFirebaseDataToArray(projectData.nodes);
                const edges = this.convertFirebaseDataToArray(projectData.edges);
                console.log('Converted arrays - nodes:', nodes, 'edges:', edges);
                
                projectState.update(state => ({
                    ...state,
                    projectId,
                    title: projectData.title || '',
                    description: projectData.description || '',
                    nodes,
                    edges,
                    lastSyncTime: new Date(),
                    isDirty: false
                }));
                
                // Mark that we've completed the initial load
                if (!this.hasInitialLoad) {
                    this.hasInitialLoad = true;
                    console.log('Initial load completed');
                }
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
                
                // Mark that we've completed the initial load
                if (!this.hasInitialLoad) {
                    this.hasInitialLoad = true;
                    console.log('Initial load completed (new project)');
                }
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
        this.isLocalUpdate = true; // Set flag to prevent Firebase listener from overwriting
        projectActions.setSyncing(true);

        try {
            const projectRef = ref(rtdb, `fridge/${currentState!.projectId}`);
            
            // Convert arrays to objects for Firebase storage
            console.log('Current state before save - nodes:', currentState!.nodes, 'edges:', currentState!.edges);
            const nodesToSave = this.convertArrayToFirebaseObject(currentState!.nodes);
            const edgesToSave = this.convertArrayToFirebaseObject(currentState!.edges);
            console.log('Converted for save - nodes:', nodesToSave, 'edges:', edgesToSave);
            
            // Prevent accidental deletion of existing data when saving empty arrays
            if (Object.keys(nodesToSave).length === 0 && currentState!.nodes.length === 0) {
                console.warn('Attempted to save empty nodes array - this might delete existing data');
                // For extra safety, don't include nodes field in the save if it's empty
                // This prevents overwriting existing nodes with empty data
            }
            if (Object.keys(edgesToSave).length === 0 && currentState!.edges.length === 0) {
                console.warn('Attempted to save empty edges array - this might delete existing data');
                // For extra safety, don't include edges field in the save if it's empty
                // This prevents overwriting existing edges with empty data
            }
            
            const saveData: any = {
                title: currentState!.title,
                description: currentState!.description,
                last_updated_at: new Date().toISOString()
            };
            
            // Always include nodes/edges in save data
            // The earlier safeguards prevent saving during initial load
            saveData.nodes = nodesToSave;
            saveData.edges = edgesToSave;
            
            console.log('Saving data:', saveData);
            await update(projectRef, saveData);
            console.log('Project saved successfully');

            projectActions.markClean();
        } catch (error) {
            console.error('Error saving project:', error);
            throw error;
        } finally {
            this.isLocalUpdate = false; // Clear flag to allow Firebase updates again
            projectActions.setSyncing(false);
        }
    }

    // Check if initial load is complete
    isInitialLoadComplete(): boolean {
        return this.hasInitialLoad;
    }

    // Clean up listeners
    cleanup(): void {
        if (this.projectListener) {
            off(this.projectListener);
            this.projectListener = null;
        }
        this.currentProjectId = null;
        this.hasInitialLoad = false;
    }
}

export const projectSync = new ProjectFirebaseSync();

// Auto-save functionality (debounced)
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

projectState.subscribe(state => {
    if (state.isDirty && state.projectId) {
        // Don't auto-save empty arrays immediately after initial load
        // This prevents overwriting existing data with empty arrays during initialization
        if (!projectSync.isInitialLoadComplete()) {
            console.log('Skipping auto-save - initial load not complete yet');
            return;
        }

        console.log('Project is dirty, scheduling auto-save...', { 
            nodes: state.nodes.length, 
            edges: state.edges.length 
        });
        
        // Clear existing timeout
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }

        // Use shorter timeout for critical changes
        const debounceTime = 50;

        // Set new timeout for auto-save
        saveTimeout = setTimeout(() => {
            console.log('Auto-saving project...', {
                nodes: state.nodes.length,
                edges: state.edges.length
            });
            projectSync.saveProject().catch(console.error);
        }, debounceTime);
    }
});