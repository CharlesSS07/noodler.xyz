import { v4 as uuidv4 } from 'uuid';
import {
	FirebaseRTDBSocketSpecifier,
	InputSocketInstanceController,
	type InputSocketInstanceParameters,
	type SocketValue
} from './FirebaseRTDBNodeInstance.js';
import type { SocketID } from './SocketModels.js';
import type { ProjectControllerInterface } from './ProjectInterfaces.js';

export class NID extends String {
	/**
	 * ID for the blueprint of a node (not it's instance).
	 * @param typeHint
	 */
	static newNID(typeHint?: string | undefined) {
		if (typeHint) {
			return new NID(`node_${typeHint}_` + uuidv4());
		}
		return new NID(`node_` + uuidv4());
	}
}

export type NodePosition = { x: number; y: number };

export interface NodeInstance {
	readonly nid: NID;
	position: NodePosition;
	input_sockets: { [socket_key: string]: InputSocketInstanceParameters };
}

export interface NodeInstanceControllerInterface {
	getProject(): ProjectControllerInterface;

	getNodeKey(): string;

	getNid(): Promise<NID>;

	call(): Promise<void>;

	dumpCaches(): Promise<void>;

	getInputSocketController(socket_key: SocketID): InputSocketInstanceController;

	getInputs(): Promise<Map<SocketID, InputSocketInstanceParameters>>;

	setInputValue(socket_key: SocketID, value: SocketValue): Promise<void>;

	linkInputSocket(socket_key: SocketID, to: FirebaseRTDBSocketSpecifier): Promise<void>;

	unlinkInputSocket(socket_key: SocketID): Promise<void>;

	getOutput(socket_key: SocketID): unknown;

	getPosition(): Promise<NodePosition>;

	setPosition(position: NodePosition): void;

	getUid(): Promise<string>;

	isCached(): boolean;
}
