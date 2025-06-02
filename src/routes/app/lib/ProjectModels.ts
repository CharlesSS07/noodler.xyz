import type { NodeInstanceControllerInterface } from './NodeModels.js';

export interface ProjectInfo {
	created_at: Date;
	last_updated_at: Date;
	title: string;
	invited_users: { [user_id: string]: boolean }; // Updated field
	show_tutorial: boolean; // Added field
}

export interface ProjectInstanceData extends ProjectInfo {
	description: string;
	version: string;
	nodes: { [op_key: string]: NodeInstanceControllerInterface };
}
