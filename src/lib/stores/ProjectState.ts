import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { rtdb } from '../../firebase';
import {
    ref,
    onValue,
    off,
    set,
    update,
    type DatabaseReference,
} from 'firebase/database';
import type { Node, Edge } from '@xyflow/svelte';
import { ComputedDataCache } from '$lib/compositor/ComputedDataCache';

// Project state interface
export interface ProjectState {
    projectId: string | null;
    title: string;
    description: string;
    nodes: Node[];
    edges: Edge[];
    outputs: ComputedDataCache;
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
    outputs: new ComputedDataCache(),
    lastSyncTime: null,
    isDirty: false,
    isSyncing: false,
};

// Core project store
export const projectState: Writable<ProjectState> =
    writable(initialProjectState);

// Derived stores
export const projectNodes: Readable<Node[]> = derived(
    projectState,
    ($state) => $state.nodes
);
export const projectEdges: Readable<Edge[]> = derived(
    projectState,
    ($state) => $state.edges
);
export const projectComputedDataCache: ComputedDataCache =
    new ComputedDataCache();
// = derived(projectState, $state => $state.outputs);
export const projectTitle: Readable<string> = derived(
    projectState,
    ($state) => $state.title
);
export const isDirty: Readable<boolean> = derived(
    projectState,
    ($state) => $state.isDirty
);
export const isSyncing: Readable<boolean> = derived(
    projectState,
    ($state) => $state.isSyncing
);

// Project actions
export const projectActions = {
    setProject: (projectId: string): void => {
        projectState.update((state) => ({
            ...state,
            projectId,
            isDirty: false,
        }));
    },

    setNodes: (nodes: Node[]): void => {
        projectState.update((state) => {
            // Don't set dirty flag if we're setting the same data (prevents blocking Firebase loads)
            const isSameData =
                state.nodes.length === nodes.length &&
                JSON.stringify(state.nodes) === JSON.stringify(nodes);
            
            // Only mark dirty if initial load is complete AND data actually changed
            const shouldMarkDirty = !isSameData && 
                                  projectSync.isInitialLoadComplete() && 
                                  state.projectId !== null;
            
            return {
                ...state,
                nodes,
                isDirty: shouldMarkDirty,
            };
        });
    },

    setEdges: (edges: Edge[]): void => {
        projectState.update((state) => {
            // Don't set dirty flag if we're setting the same data (prevents blocking Firebase loads)
            const isSameData =
                state.edges.length === edges.length &&
                JSON.stringify(state.edges) === JSON.stringify(edges);
            
            // Only mark dirty if initial load is complete AND data actually changed
            const shouldMarkDirty = !isSameData && 
                                  projectSync.isInitialLoadComplete() && 
                                  state.projectId !== null;
            
            return {
                ...state,
                edges,
                isDirty: shouldMarkDirty,
            };
        });
    },

    updateNodeData: (nodeId: string, data: Record<string, unknown>): void => {
        projectState.update((state) => ({
            ...state,
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, ...data } }
                    : node
            ),
            isDirty: true,
        }));
    },

    setOutputs: (outputs: ComputedDataCache): void => {
        projectState.update((state) => ({
            ...state,
            outputs: outputs,
        }));
    },

    setTitle: (title: string): void => {
        projectState.update((state) => ({
            ...state,
            title,
            isDirty: true,
        }));
    },

    setDescription: (description: string): void => {
        projectState.update((state) => ({
            ...state,
            description,
            isDirty: true,
        }));
    },

    setSyncing: (isSyncing: boolean): void => {
        projectState.update((state) => ({ ...state, isSyncing }));
    },

    markClean: (): void => {
        projectState.update((state) => ({
            ...state,
            isDirty: false,
            lastSyncTime: new Date(),
        }));
    },

    resetProject: (): void => {
        projectState.set(initialProjectState);
    },
};

// Firebase RTDB project synchronization
class ProjectFirebaseSync {
    private projectListener: DatabaseReference | null = null;
    private currentProjectId: string | null = null;
    private isLocalUpdate: boolean = false; // Flag to prevent overwriting local changes
    private hasInitialLoad: boolean = false; // Flag to prevent saving during initial load

    // Helper method to convert Firebase objects to arrays
    private convertFirebaseDataToArray(data: any): any[] {
        if (!data) {
            return [];
        }

        if (Array.isArray(data)) {
            return data;
        }

        // If it's an object, convert to array of objects with id property
        if (typeof data === 'object') {
            const result = Object.entries(data)
                .map(([id, item]: [string, any]) => {
                    if (item && typeof item === 'object' && !item.id) {
                        return { id, ...item };
                    }
                    return item;
                })
                .filter(Boolean);

            return result;
        }

        return [];
    }

    // Helper method to convert arrays to Firebase objects
    private convertArrayToFirebaseObject(array: any[]): Record<string, any> {
        if (!array || !Array.isArray(array)) {
            return {};
        }

        const result: Record<string, any> = {};
        array.forEach((item) => {
            if (item && item.id) {
                const { id, ...itemWithoutId } = item;
                result[id] = itemWithoutId;
            }
        });

        return result;
    }

    // Start syncing a project
    syncProject(projectId: string, onProjectSyncedCallback?: () => void): void {
        // Clean up previous listener
        this.cleanup();

        this.currentProjectId = projectId;
        this.hasInitialLoad = false; // Reset flag for new project
        this.projectListener = ref(rtdb, `fridge/${projectId}`);

        onValue(this.projectListener, (snapshot) => {
            const projectData = snapshot.val();

            // Skip updates if we're in the middle of a local update
            if (this.isLocalUpdate) {
                return;
            }

            // Check if we have pending local changes - if so, don't overwrite them
            let currentState: ProjectState;
            const unsubscribe = projectState.subscribe((value) => {
                currentState = value;
            });
            unsubscribe();

            if (currentState!.isDirty) {
                return;
            }

            if (projectData) {
                // Convert Firebase objects to arrays if needed
                const nodes = this.convertFirebaseDataToArray(
                    projectData.nodes
                );
                const edges = this.convertFirebaseDataToArray(
                    projectData.edges
                );

                projectState.update((state) => ({
                    ...state,
                    projectId,
                    title: projectData.title || '',
                    description: projectData.description || '',
                    nodes,
                    edges,
                    lastSyncTime: new Date(),
                    isDirty: false,
                }));

                // Mark that we've completed the initial load
                if (!this.hasInitialLoad) {
                    this.hasInitialLoad = true;
                    if (onProjectSyncedCallback) onProjectSyncedCallback();
                }
            } else {
                projectState.update((state) => ({
                    ...state,
                    projectId,
                    title: 'New Project',
                    description: '',
                    nodes: [],
                    edges: [],
                    lastSyncTime: new Date(),
                    isDirty: false,
                }));

                // Mark that we've completed the initial load
                if (!this.hasInitialLoad) {
                    this.hasInitialLoad = true;
                    if (onProjectSyncedCallback) onProjectSyncedCallback();
                }
            }
        });

        projectActions.setProject(projectId);
    }

    // Save current state to Firebase
    async saveProject(): Promise<void> {
        let currentState: ProjectState;

        // Get current state synchronously
        const unsubscribe = projectState.subscribe((value) => {
            currentState = value;
        });
        unsubscribe();

        if (!currentState!.projectId) {
            console.warn('Cannot save project - no project ID set');
            throw new Error('No project ID set');
        }

        this.isLocalUpdate = true; // Set flag to prevent Firebase listener from overwriting
        projectActions.setSyncing(true);

        try {
            const projectRef = ref(rtdb, `fridge/${currentState!.projectId}`);

            // Convert arrays to objects for Firebase storage
            const nodesToSave = this.convertArrayToFirebaseObject(
                currentState!.nodes
            );
            const edgesToSave = this.convertArrayToFirebaseObject(
                currentState!.edges
            );

            // Prevent accidental deletion of existing data when saving empty arrays
            if (
                Object.keys(nodesToSave).length === 0 &&
                currentState!.nodes.length === 0
            ) {
                // For extra safety, don't include libs field in the save if it's empty
                // This prevents overwriting existing libs with empty data
            }
            if (
                Object.keys(edgesToSave).length === 0 &&
                currentState!.edges.length === 0
            ) {
                // For extra safety, don't include edges field in the save if it's empty
                // This prevents overwriting existing edges with empty data
            }

            const saveData: any = {
                title: currentState!.title,
                description: currentState!.description,
                last_updated_at: new Date().toISOString(),
            };

            // Always include libs/edges in save data
            // The earlier safeguards prevent saving during initial load
            saveData.nodes = nodesToSave;
            saveData.edges = edgesToSave;

            await update(projectRef, saveData);

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

projectState.subscribe((state) => {
    if (state.isDirty && state.projectId) {
        // Don't auto-save empty arrays immediately after initial load
        // This prevents overwriting existing data with empty arrays during initialization
        if (!projectSync.isInitialLoadComplete()) {
            return;
        }

        // Clear existing timeout
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }

        // Use longer timeout to prevent conflicts with reactive effects
        const debounceTime = 1000;

        // Set new timeout for auto-save
        saveTimeout = setTimeout(() => {
            projectSync.saveProject().catch(console.error);
        }, debounceTime);
    }
});
