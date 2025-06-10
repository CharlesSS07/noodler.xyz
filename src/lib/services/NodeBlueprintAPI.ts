/**
 * Client-side API service for Node Blueprint Firebase Functions
 * Uses real Firebase authentication and calls the deployed functions
 */

import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';
import { getAuth, type User } from 'firebase/auth';
import { app } from '../../firebase';

// Types for API requests and responses
export interface CreateNodeBlueprintRequest {
  hint?: string;
}

export interface CreateNodeBlueprintResponse {
  nodeId: string;
}

export interface UpdateNodeBlueprintDocsRequest {
  nodeId: string;
  title?: string;
  docs?: string;
}

export interface UpdateNodeBlueprintSpecRequest {
  nodeId: string;
  newCode?: string;
  newSpec?: {
    input_sockets?: Record<string, any>;
    input_socket_order?: string[];
    output_sockets?: Record<string, any>;
    output_socket_order?: string[];
  };
}

export interface ForkNodeBlueprintRequest {
  nodeId: string;
}

export interface DeployNodeBlueprintRequest {
  nodeId: string;
}

export interface GetNodeBlueprintRequest {
  nodeId: string;
}

export interface SearchNodeBlueprintsRequest {
  substring: string;
  includeDeployed?: boolean;
}

export interface GetRecommendedVersionRequest {
  nodeKey: string;
}

export interface NodeBlueprintData {
  node_key: string;
  author_uid: string;
  created_at: Date;
  predecessor_nid?: string;
  title: string;
  documentation: string;
  user_defined_code_snippet: string;
  input_sockets: Record<string, any>;
  input_socket_order: string[];
  output_sockets: Record<string, any>;
  output_socket_order: string[];
  trust_level: string;
  official_note: string;
  last_updated_at: Date;
  is_deployed: boolean;
}

export interface SearchResult {
  nodeId: string;
  nodeKey: string;
  title: string;
  documentation: string;
  authorUid: string;
  createdAt: Date;
  isDeployed: boolean;
  trustLevel: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Node Blueprint API Service
 * Handles all communication with Firebase Functions for node blueprint operations
 */
export class NodeBlueprintAPI {
  private functions: Functions;
  private auth = getAuth(app);

  constructor() {
    this.functions = getFunctions(app);
    
    // Connect to emulator if in development
    if (import.meta.env.DEV && !import.meta.env.PROD) {
      // Only connect to emulator in development
      import('firebase/functions').then(({ connectFunctionsEmulator }) => {
        try {
          connectFunctionsEmulator(this.functions, 'localhost', 5001);
          console.log('Connected to Functions emulator');
        } catch (error) {
          // Emulator already connected or not available
          console.log('Functions emulator connection:', error);
        }
      });
    }
  }

  /**
   * Ensure user is authenticated before making API calls
   */
  private async requireAuth(): Promise<User> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to use Node Blueprint API');
    }
    return user;
  }

  /**
   * Helper to call Firebase Functions with error handling
   */
  private async callFunction<TRequest, TResponse>(
    functionName: string, 
    data: TRequest
  ): Promise<ApiResponse<TResponse>> {
    try {
      await this.requireAuth();
      
      const callable = httpsCallable<TRequest, TResponse>(this.functions, functionName);
      const result = await callable(data);
      
      return {
        success: true,
        data: result.data
      };
    } catch (error: any) {
      console.error(`${functionName} failed:`, error);
      
      return {
        success: false,
        error: error.message || `Failed to call ${functionName}`
      };
    }
  }

  /**
   * Create a new node blueprint
   */
  async createNodeBlueprint(request: CreateNodeBlueprintRequest): Promise<ApiResponse<CreateNodeBlueprintResponse>> {
    return this.callFunction('createNodeBlueprint', request);
  }

  /**
   * Get an existing node blueprint by ID
   */
  async getNodeBlueprint(request: GetNodeBlueprintRequest): Promise<ApiResponse<NodeBlueprintData | null>> {
    return this.callFunction('getNodeBlueprint', request);
  }

  /**
   * Fork an existing node blueprint
   */
  async forkNodeBlueprint(request: ForkNodeBlueprintRequest): Promise<ApiResponse<CreateNodeBlueprintResponse>> {
    return this.callFunction('forkNodeBlueprint', request);
  }

  /**
   * Update node blueprint documentation (title and docs)
   */
  async updateNodeBlueprintDocs(request: UpdateNodeBlueprintDocsRequest): Promise<ApiResponse<{ success: boolean }>> {
    return this.callFunction('updateNodeBlueprintDocs', request);
  }

  /**
   * Update node blueprint specification (sockets and code)
   */
  async updateNodeBlueprintSpec(request: UpdateNodeBlueprintSpecRequest): Promise<ApiResponse<{ success: boolean }>> {
    return this.callFunction('updateNodeBlueprintSpec', request);
  }

  /**
   * Deploy a node blueprint (makes it read-only)
   */
  async deployNodeBlueprint(request: DeployNodeBlueprintRequest): Promise<ApiResponse<{ success: boolean }>> {
    return this.callFunction('deployNodeBlueprint', request);
  }

  /**
   * Search for node blueprints by text
   */
  async searchNodeBlueprintsByText(request: SearchNodeBlueprintsRequest): Promise<ApiResponse<{ results: SearchResult[] }>> {
    return this.callFunction('searchNodeBlueprintsByText', request);
  }

  /**
   * Get recommended version for a node key
   */
  async getRecommendedVersion(request: GetRecommendedVersionRequest): Promise<ApiResponse<{ nodeId: string | null }>> {
    return this.callFunction('getRecommendedVersion', request);
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }
}

// Export singleton instance
export const nodeBlueprintAPI = new NodeBlueprintAPI();