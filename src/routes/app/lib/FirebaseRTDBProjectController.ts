import {
	child,
	get,
	onChildAdded,
	orderByChild,
	push,
	query,
	ref,
	remove,
	serverTimestamp
} from 'firebase/database';
import { auth, rtdb } from '../../../firebase';
import {
	NID,
	type NodeInstance,
	type NodeInstanceControllerInterface,
	type NodePosition
} from './NodeModels.js';
import type { ProjectInfo } from './ProjectModels.js';
import {
	FirebaseRTDBNodeInstanceController,
	FirebaseRTDBSocketSpecifier,
	type InputSocketInstanceParameters,
	type SocketValue
} from './FirebaseRTDBNodeInstance.js';
import { FirestoreNodeBluePrintController } from './FirestoreNodeBluePrint.js';
import {
	type ProjectCollectionInterface,
	type ProjectControllerInterface,
	ProjectNotFound
} from './ProjectInterfaces.js';
import { GenFlowError } from './Errors.js';
import type { LinkedSockets } from './SocketInterfaces.js';

const projectsRef = ref(rtdb, 'fridge');

export class FirebaseRTDBProjectCollection implements ProjectCollectionInterface {
	getProjectsRef() {
		return projectsRef;
	}

	getProjectRef(project_key: string) {
		return child(this.getProjectsRef(), project_key);
	}

	async deleteProject(project_id: string) {
		try {
			await remove(this.getProjectRef(project_id));
		} catch (error) {
			console.error('Error deleting project: ', error);
			throw error;
		}
	}

	async newProject(projectName: string, projectDescription: string) {
		if (!projectName.trim()) throw new Error('Project must be named and have a description');

		try {
			console.log(auth.currentUser);
			if (auth.currentUser && auth.currentUser.uid !== null) {
				// logged in
				const invitedUsers = { [auth.currentUser.uid]: true }; // Updated invited_users format
				const pid = (
					await push(this.getProjectsRef(), {
						invited_users: invitedUsers,
						created_at: serverTimestamp(),
						last_updated_at: serverTimestamp(),
						description: projectDescription,
						nodes: [],
						title: projectName,
						version: '0.0.0',
						show_tutorial: true // Default value for the new field
					})
				).key;
				if (pid) return this.getProject(pid);
				throw new ProjectNotFound('RTDB Could not create new project.');
			} else {
				throw new Error('User not logged in');
			}
		} catch (error) {
			console.error('Error creating project: ', error);
			throw error;
		}
	}

	async fetchProjects(projectInfoCallback: (info: ProjectInfo) => void): Promise<void> {
		try {
			const currentUser = auth.currentUser;
			if (!currentUser) {
				console.error('User not authenticated');
				throw new Error('User not authenticated');
			}

			const q = query(this.getProjectsRef(), orderByChild('last_updated_at'));

			onChildAdded(
				q,
				(snapshot) => {
					console.log(snapshot);
					const invitedUsers = snapshot.child('invited_users').val();
					const currentUserInvited = invitedUsers && invitedUsers[currentUser.uid];

					if (currentUserInvited) {
						projectInfoCallback({
							created_at: snapshot.child('created_at').val(),
							last_updated_at: snapshot.child('last_updated_at').val(),
							title: snapshot.child('title').val(),
							invited_users: invitedUsers,
							show_tutorial: snapshot.child('show_tutorial').val()
						});
					}
				},
				(error) => {
					throw error;
				}
			);
		} catch (error) {
			console.error('Error fetching fridge: ', error);
			throw error;
		}
	}

	getProject(project_key: string): Promise<ProjectControllerInterface> {
		return new Promise((resolve) => resolve(new FirebaseRTDBProjectController(project_key, this)));
	}
}

export class FirebaseRTDBProjectController implements ProjectControllerInterface {
	project_key: string;
	projectCollection: FirebaseRTDBProjectCollection;

	constructor(pid: string, projectCollection: FirebaseRTDBProjectCollection) {
		this.project_key = pid;
		this.projectCollection = projectCollection;
	}

	getProjectRef() {
		this.projectCollection.getProjectRef(this.project_key);
	}

	getNodesRef() {
		return child(this.projectCollection.getProjectRef(this.project_key), 'nodes');
	}

	getNodeRef(key: string) {
		return child(this.getNodesRef(), key);
	}

	getNode(key: string): Promise<NodeInstanceControllerInterface> {
		return new Promise((resolve) => {
			resolve(new FirebaseRTDBNodeInstanceController(this, key));
		});
	}

	async getNodes(): Promise<Set<NodeInstanceControllerInterface>> {
		return get(this.getNodesRef()).then(async (snapshot) => {
			const ret: Promise<NodeInstanceControllerInterface>[] = [];
			snapshot.forEach( (node) => {
				ret.push(this.getNode(node.key));
			});
			return await Promise.all(ret).then((vals) => {
				return new Set<NodeInstanceControllerInterface>(vals);
			});
		});
	}

	async addNodeToProject(nid: NID, position: NodePosition) {
		const node = await this.initializeNodeFromNID(nid, position);
		const ret = (await push(this.getNodesRef(), node)).key;
		if (ret) return ret;
		throw new GenFlowError(`Error in adding node to rtdb`);
	}

	async removeNode(node_key: string) {
		return remove(this.getNodeRef(node_key));
	}

	async addLink(link: LinkedSockets) {
		push(child(this.getNodeRef(link.toInput.node_key), 'input_sockets'), link);
	}

	removeLink(link: LinkedSockets) {
		return remove(child(this.getNodeRef(link.toInput.node_key), 'input_sockets/linkFromSocket'));
	}

	async deleteProject() {
		return this.projectCollection.deleteProject(this.project_key);
	}

	async initializeNodeFromNID(nid: NID, position: NodePosition): Promise<NodeInstance> {
		console.log('newOpInstanceParameters', nid);

		const input_sockets: { [key: string]: InputSocketInstanceParameters } = {};

		// const opConfig = await OpConfigController.getOpConfig(nid);
		const nodeBluePrint = new FirestoreNodeBluePrintController(nid);
		for (const socket_key of await nodeBluePrint.getInputSocketKeysInOrder()) {
			const socket = await nodeBluePrint.getInputSocketParam(socket_key);
			const value = socket.getSocketParam('default_value');

			const socketInstance = new (class implements InputSocketInstanceParameters {
				linkFromSocket: FirebaseRTDBSocketSpecifier | null = null;
				value: SocketValue = value;
			})();

			if (socketInstance.value === undefined) {
				console.error(`defaultValue not specified by NID: ${nid}`);
				socketInstance.value = null;
			}

			input_sockets[socket_key] = socketInstance;
		}

		console.log(input_sockets);

		return new (class implements NodeInstance {
			position: NodePosition = position;
			nid: NID = nid;
			input_sockets: { [key: string]: InputSocketInstanceParameters } = input_sockets;
		})();
	}
}
