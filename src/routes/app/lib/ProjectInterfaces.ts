import type {
	NID,
	NodeInstance,
	NodeInstanceControllerInterface,
	NodePosition
} from './NodeModels.js';
import type { ProjectInfo } from './ProjectModels.js';
import { GenFlowError } from './Errors.js';
import type { LinkedSockets } from './SocketInterfaces.js';

export class ProjectNotFound extends GenFlowError {}

export interface ProjectControllerInterface {
	getNode(key: string): Promise<NodeInstanceControllerInterface>;
	getNodes(): Promise<Set<NodeInstanceControllerInterface>>;

	addNodeToProject(wid: NID, position: NodePosition): Promise<string>;

	removeNode(op_key: string): Promise<void>;

	addLink(link: LinkedSockets): Promise<void>;

	removeLink(link: LinkedSockets): Promise<void>;

	deleteProject(): Promise<void>;

	initializeNodeFromNID(nid: NID, position: NodePosition): Promise<NodeInstance>;
}

export interface ProjectCollectionInterface {
	deleteProject(project_id: string): Promise<void>;

	newProject(projectName: string, projectDescription: string): Promise<ProjectControllerInterface>;

	fetchProjects(projectInfoCallback: (info: ProjectInfo) => void): Promise<void>;

	getProject(project_key: string): Promise<ProjectControllerInterface>;
}
