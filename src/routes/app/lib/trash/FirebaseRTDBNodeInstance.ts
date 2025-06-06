import { child, get, set } from 'firebase/database';
import type { SocketID } from './SocketModels.js';
import { type NID, type NodeInstanceControllerInterface, type NodePosition } from './NodeModels.js';
import { FirestoreNodeBluePrintController } from './FirestoreNodeBluePrint.js';
import { OutputSocketDataCollection } from './Execution.js';
import { SocketElementCache, SocketDataCache } from './SocketCaches.js';
import type { FirebaseRTDBProjectController } from './FirebaseRTDBProjectController.js';
import type {
	InputSocketInstanceControllerInterface,
	SocketSpecifierInstanceInterface
} from './SocketInterfaces.js';

export class FirebaseRTDBSocketSpecifier implements SocketSpecifierInstanceInterface {
	socket_key: SocketID;
	node_key: string;
	isInput: boolean;

	constructor(node_key: string, socket_key: SocketID, isInput: boolean) {
		this.node_key = node_key;
		this.socket_key = socket_key;
		this.isInput = isInput;
	}

	getSocketPath() {
		if (this.isInput) return `${this.node_key}/input_sockets/${this.socket_key}`;

		return `${this.node_key}/output_sockets/${this.socket_key}`;
	}

	getUniqueIdentifier() {
		// return the same value for all equivalent socket specifiers so they can be looked up
		// essentially an immutable reference to the socket
		return this.getSocketPath();
	}

	toString() {
		return `Socket ${this.socket_key} on node ${this.node_key}`;
	}
}

export type SocketValue = unknown;

export interface InputSocketInstanceParameters {
	value: SocketValue;
	linkFromSocket: FirebaseRTDBSocketSpecifier | null;
}

export class DoNotUploadToCloud {
	static LOCALY_CACHED = 'LOCALY_CACHED';
	value: unknown;
	constructor(value: unknown) {
		this.value = value;
	}
}

export class InputSocketInstanceController implements InputSocketInstanceControllerInterface {
	node: FirebaseRTDBNodeInstanceController;
	socket_key: SocketID;

	constructor(node: FirebaseRTDBNodeInstanceController, socket_key: SocketID) {
		this.node = node;
		this.socket_key = socket_key;
	}

	getNode(): NodeInstanceControllerInterface {
		return this.node;
	}

	getSocketRef() {
		return child(child(this.node.getNodeRef(), 'input_sockets'), this.socket_key.toString());
	}

	getValueRef() {
		return child(this.getSocketRef(), 'value');
	}

	async setValue(value: unknown) {
		if (value instanceof DoNotUploadToCloud) {
			SocketDataCache.setSocketData(this.getSocketInstanceSpecifier(), value.value);
			await set(this.getValueRef(), DoNotUploadToCloud.LOCALY_CACHED);
		} else {
			await set(this.getValueRef(), value);
		}
	}

	getLinkRef() {
		return child(this.getSocketRef(), 'linkFromSocket');
	}

	async getLink(): Promise<FirebaseRTDBSocketSpecifier | null> {
		return await get(this.getSocketRef()).then((snapshot) => {
			if (snapshot.exists()) return snapshot.child('linkFromSocket').val();
			return null;
		});
	}

	async setLink(link: FirebaseRTDBSocketSpecifier | null) {
		await set(this.getLinkRef(), link);
	}

	getSocketInstanceSpecifier() {
		return new FirebaseRTDBSocketSpecifier(this.node.node_key, this.socket_key, true);
	}
}

export class FirebaseRTDBNodeInstanceController implements NodeInstanceControllerInterface {
	project: FirebaseRTDBProjectController;
	readonly node_key: string;
	private inputSocketInstanceControllers: Map<SocketID, InputSocketInstanceController> = new Map<
		SocketID,
		InputSocketInstanceController
	>();
	private cached = false;

	constructor(project: FirebaseRTDBProjectController, node_key: string) {
		this.project = project;
		this.node_key = node_key;
	}

	getProject(): FirebaseRTDBProjectController {
		return this.project;
	}

	getNodeKey(): string {
		return this.node_key;
	}

	getNodeRef() {
		return child(this.getProject().getProjectRef(), `nodes/${this.node_key}`);
	}

	async getNid(): Promise<NID> {
		return (await get(child(this.getNodeRef(), 'nid'))).val() as NID;
	}

	async call(): Promise<void> {
		// version is not taken into account here!
		const inputs = new Map<SocketID, unknown>();

		// eslint-disable-next-line no-useless-catch
		try {
			(await this.getInputs()).forEach(
				(socketInstanceParameters: InputSocketInstanceParameters, socket_key) => {
					if (socketInstanceParameters.linkFromSocket) {
						// link
						const fromSocketValue = SocketDataCache.getSocketData(
							new FirebaseRTDBSocketSpecifier(
								socketInstanceParameters.linkFromSocket.node_key,
								socketInstanceParameters.linkFromSocket.socket_key,
								false
							)
						);
						inputs.set(socket_key, fromSocketValue);
					} else {
						// no link, just grab value attribute
						if (socketInstanceParameters.value === DoNotUploadToCloud.LOCALY_CACHED) {
							// value is not in db, get it from the local cache
							inputs.set(
								socket_key,
								SocketDataCache.getSocketData(
									new FirebaseRTDBSocketSpecifier(this.node_key, socket_key, true)
								)
							);
						} else {
							inputs.set(socket_key, socketInstanceParameters.value);
						}
					}
				}
			);

			const opConfigController = new FirestoreNodeBluePrintController(await this.getNid());

			opConfigController.getOutputSocketKeysInOrder().then((outputSocketKeys: string[]) => {
				outputSocketKeys.forEach((socketKey: string) => {
					// socket.setBusy();
					SocketElementCache.get(
						new FirebaseRTDBSocketSpecifier(this.node_key, socketKey, false)
					).setBusy();
				});
			});

			const outputValueCollection = new OutputSocketDataCollection(
				new Set<SocketID>(await opConfigController.getOutputSocketKeysInOrder())
			);
			(await opConfigController.getOutputSocketKeysInOrder()).forEach((socketKey: SocketID) => {
				outputValueCollection.on(socketKey, async (value: unknown) => {
					SocketDataCache.setSocketData(
						new FirebaseRTDBSocketSpecifier(this.node_key, socketKey, false),
						value
					);
					// socket.setNotBusy()
					SocketElementCache.get(
						new FirebaseRTDBSocketSpecifier(this.node_key, socketKey, false)
					).setNotBusy();
				});
			});
			try {
				await opConfigController.call(inputs, outputValueCollection);
				await outputValueCollection.waitForAllSocketsSet(); // remove this to make things faster (you will also have to implement input socket collection...
				this.cached = true;
			} catch (error) {
				// set all sockets not busy
				(await opConfigController.getOutputSocketKeysInOrder()).forEach((socketKey: SocketID) => {
					SocketElementCache.get(
						new FirebaseRTDBSocketSpecifier(this.node_key, socketKey, false)
					).setNotBusy();
				});
				throw error;
			}
		} catch (error) {
			throw error;
		}
	}

	async dumpCaches(): Promise<void> {
		(
			await new FirestoreNodeBluePrintController(await this.getNid()).getOutputSocketKeysInOrder()
		).forEach((value: unknown, socket_key: SocketID) => {
			console.log(
				`dumping cache ${new FirebaseRTDBSocketSpecifier(this.node_key, socket_key, false)}`
			);
			SocketDataCache.deleteSocketData(
				new FirebaseRTDBSocketSpecifier(this.node_key, socket_key, false)
			); // set sockets in cache
		});
		this.cached = false;
	}

	getInputSocketsRef() {
		return child(this.getNodeRef(), 'input_sockets');
	}

	getInputSocketController(socket_key: SocketID): InputSocketInstanceController {
		let inputSocketInstanceController = this.inputSocketInstanceControllers.get(socket_key);
		if (inputSocketInstanceController) {
			return inputSocketInstanceController;
		}

		inputSocketInstanceController = new InputSocketInstanceController(this, socket_key);
		this.inputSocketInstanceControllers.set(socket_key, inputSocketInstanceController);
		return inputSocketInstanceController;
	}

	async getInputs(): Promise<Map<SocketID, InputSocketInstanceParameters>> {
		return await get(this.getInputSocketsRef()).then((snapshot) => {
			const input_sockets = snapshot.val() as {
				[socket_key: SocketID]: InputSocketInstanceParameters;
			};
			return new Map<SocketID, InputSocketInstanceParameters>(
				Object.entries(input_sockets).map((value: [SocketID, InputSocketInstanceParameters]) => {
					return [value[0], value[1]];
				})
			);
		});
	}

	async setInputValue(socket_key: SocketID, value: SocketValue) {
		const nodeBluePrint = await new FirestoreNodeBluePrintController(await this.getNid());
		if ((await nodeBluePrint.getInputSocketKeysInOrder()).indexOf(socket_key) != -1)
			await this.getInputSocketController(socket_key).setValue(value);
		else
			throw new Error(
				`Node ${await nodeBluePrint.getTitle()} has no input socket named ${socket_key}`
			);
	}

	async linkInputSocket(socket_key: SocketID, to: FirebaseRTDBSocketSpecifier) {
		const config = await new FirestoreNodeBluePrintController(await this.getNid());
		if ((await config.getInputSocketKeysInOrder()).indexOf(socket_key) != -1)
			await this.getInputSocketController(socket_key).setLink(to);
		else throw new Error(`Node ${await config.getTitle()} has no input socket named ${socket_key}`);
	}

	async unlinkInputSocket(socket_key: SocketID) {
		const nodeBluePrint = await new FirestoreNodeBluePrintController(await this.getNid());
		if ((await nodeBluePrint.getInputSocketKeysInOrder()).indexOf(socket_key) != -1)
			await this.getInputSocketController(socket_key).setLink(null);
		else
			throw new Error(
				`Node ${await nodeBluePrint.getTitle()} has no input socket named ${socket_key}`
			);
	}

	getOutput(socket_key: SocketID): unknown {
		// const config = await (new OpConfigController(await this.getNid()));
		// if ((await config.getOutputSocketKeysInOrder()).indexOf(socket_key)==-1)
		//   throw new Error(`Node ${await config.getTitle()} has no input socket named ${socket_key}`);
		return SocketDataCache.getSocketData(
			new FirebaseRTDBSocketSpecifier(this.node_key, socket_key, false)
		);
	}

	getPositionRef() {
		return child(this.getNodeRef(), 'position');
	}

	async getPosition() {
		return (await get(this.getPositionRef())).val() as NodePosition;
	}

	setPosition(position: NodePosition): void {
		set(this.getPositionRef(), position);
	}

	async getUid() {
		return (await get(child(this.getNodeRef(), 'uid'))).val();
	}

	isCached() {
		// (await new OpConfigController(await this.getNid()).getOutputSocketKeysInOrder()).map((value: unknown, socket_key: SocketID) => {
		//   OutputSocketDataCache.hasSocketValue(new SocketSpecifier(this.node_key, socket_key, false)); // set sockets in cache
		// });
		return this.cached;
	}
}
