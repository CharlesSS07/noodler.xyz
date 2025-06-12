import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { auth, rtdb } from '../../firebase/index.js';
import { ref, onValue, off, type DatabaseReference } from 'firebase/database';
import type { User } from 'firebase/auth';

// Core application state interface
export interface AppState {
    user: User | null;
    currentProject: string | null;
    isLoading: boolean;
    error: string | null;
    connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

// Initial state
const initialState: AppState = {
    user: null,
    currentProject: null,
    isLoading: false,
    error: null,
    connectionStatus: 'disconnected'
};

// Core writable store
export const appState: Writable<AppState> = writable(initialState);

// Derived stores for easier access to specific parts of state
export const currentUser: Readable<User | null> = derived(appState, $appState => $appState.user);
export const currentProject: Readable<string | null> = derived(appState, $appState => $appState.currentProject);
export const isLoading: Readable<boolean> = derived(appState, $appState => $appState.isLoading);
export const error: Readable<string | null> = derived(appState, $appState => $appState.error);
export const connectionStatus: Readable<string> = derived(appState, $appState => $appState.connectionStatus);

// Actions to update state
export const appActions = {
    setUser: (user: User | null): void => {
        appState.update(state => ({ ...state, user }));
    },

    setCurrentProject: (projectId: string | null): void => {
        appState.update(state => ({ ...state, currentProject: projectId }));
    },

    setLoading: (isLoading: boolean): void => {
        appState.update(state => ({ ...state, isLoading }));
    },

    setError: (error: string | null): void => {
        appState.update(state => ({ ...state, error }));
    },

    setConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting'): void => {
        appState.update(state => ({ ...state, connectionStatus: status }));
    },

    clearError: (): void => {
        appState.update(state => ({ ...state, error: null }));
    },

    reset: (): void => {
        appState.set(initialState);
    }
};

// Firebase RTDB synchronization
class FirebaseStateSync {
    private listeners: Map<string, DatabaseReference> = new Map();

    // Sync user projects list
    syncUserProjects(userId: string): void {
        const projectsRef = ref(rtdb, `users/${userId}/projects`);
        
        const unsubscribe = onValue(projectsRef, (snapshot) => {
            // This could be extended to store projects list in state
        });

        this.listeners.set(`userProjects_${userId}`, projectsRef);
    }

    // Sync specific project data
    syncProject(projectId: string): void {
        const projectRef = ref(rtdb, `fridge/${projectId}`);
        
        const unsubscribe = onValue(projectRef, (snapshot) => {
            // This could be extended to store project data in state
        });

        this.listeners.set(`project_${projectId}`, projectRef);
    }

    // Clean up listeners
    cleanup(): void {
        this.listeners.forEach((dbRef) => {
            off(dbRef);
        });
        this.listeners.clear();
    }

    // Clean up specific listener
    cleanupListener(key: string): void {
        const dbRef = this.listeners.get(key);
        if (dbRef) {
            off(dbRef);
            this.listeners.delete(key);
        }
    }
}

export const firebaseSync = new FirebaseStateSync();

// Auth state synchronization
auth.onAuthStateChanged((user) => {
    appActions.setUser(user);
    
    if (user) {
        appActions.setConnectionStatus('connected');
        firebaseSync.syncUserProjects(user.uid);
    } else {
        appActions.setConnectionStatus('disconnected');
        firebaseSync.cleanup();
        appActions.setCurrentProject(null);
    }
});