import {
	arrayUnion,
	collection,
	doc,
	getDoc,
	increment,
	setDoc,
	updateDoc
} from 'firebase/firestore';
import { firestore } from '../../../firebase';
import type {
	NodeBluePrintControllerFactoryInterface,
	NodeBluePrintControllerInterface,
	NodeBluePrintModel
} from './NodeBluePrint.js';
import {
	type OutputSocketDataCollection,
	type UserFunction,
	userFunctionAllowedModules
} from './Execution.js';
import {v4 as uuidv4} from "uuid";
import type {InputSocketModel, InputSocketParams, OutputSocketModel, SocketID} from "./SocketModels";

const nodeBluePrintsRef = collection(firestore, 'nodes');

export class FirestoreNodeBluePrintControllerFactoryInterface
	implements NodeBluePrintControllerFactoryInterface
{
	constructor() {}

	async initOfficialNodeBluePrint(
		uniqueFunctionName: string
	): Promise<FirestoreNodeBluePrintController> {
		const nodeBluePrint = {
			nid: `official_node_${uniqueFunctionName}`,
			predecessor_node: 'root',
			author_uid: 'wedjat',
			title: `Untitled Operation`,
			version: 0,
			created_at: new Date(),
			last_updated_at: new Date(),

			documentation: '',

			input_sockets: {},
			input_socket_order: [],
			output_sockets: {},
			output_socket_order: [],

			user_defined_code_snippet: 'console.log("Hello World");',
			trust_level: 'Official'
		} as unknown as NodeBluePrintModel;

		const nodeBluePrintController = new FirestoreNodeBluePrintController(nodeBluePrint.nid);

		await setDoc(nodeBluePrintController.getNodeBluePrintRef(), nodeBluePrint);

		console.log(`STD lib node saved: ${uniqueFunctionName}`);

		return nodeBluePrintController;
	}

	async initNewNodeBluePrint(
		author_uid: string,
		hint?: string | undefined
	): Promise<FirestoreNodeBluePrintController> {
		const nid = `node_${hint}`+uuidv4();
		const nodeBluePrint = {
			nid: nid,
			predecessor_node: 'root',
			author_uid: author_uid,
			title: `Untitled Operation`,
			version: 0,
			created_at: new Date(),
			last_updated_at: new Date(),

			documentation: '',

			input_sockets: {},
			input_socket_order: [],
			output_sockets: {},
			output_socket_order: [],

			user_defined_code_snippet: 'console.log("Hello World");',
			trust_level: 'New'
		} as unknown as NodeBluePrintModel;

		const nodeBluePrintController = new FirestoreNodeBluePrintController(nodeBluePrint.nid);

		await setDoc(nodeBluePrintController.getNodeBluePrintRef(), nodeBluePrint);

		console.log(`Created new Op: ${nodeBluePrint.title}`);

		return nodeBluePrintController;
	}
}
export class FirestoreNodeBluePrintController implements NodeBluePrintControllerInterface {
	nid: string;

	constructor(nid: string) {
		this.nid = nid;
	}

	getNodeBluePrintRef() {
		return doc(nodeBluePrintsRef, this.nid as string);
	}

	async call(inputs: Map<SocketID, unknown>, outputs: OutputSocketDataCollection): Promise<void> {
		console.log(`Executing ${this.nid}`);
		//
		// // Instantiate function from code
		// const fn = new Function("inputs", "outputs", await this.getCode()) as (inputs: Record<SocketID, unknown>, outputs: OutputSocketValueCollection) => Promise<void>;
		//
		// // Execute the function and return the result
		// await fn(inputs, outputs);
		// return outputs;
		const userCode = await this.getCode(); // User’s function body (just the inside of the function)

		// Create an async function that takes inputs and utils
		const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
		const wrappedFn = new AsyncFunction('inputs', 'outputs', 'utils', userCode) as UserFunction;

		// const require = (name: string) => {
		//   if (!(name in userFunctionAllowedModules)) {
		//     throw new Error(`Module '${name}' not allowed.`);
		//   }
		//   return userFunctionAllowedModules[name];
		// };

		// Convert your Map to plain object for easier use
		const inputObj: Record<string, unknown> = Object.fromEntries(inputs);

		// Call the function and get structured result
		await wrappedFn(inputObj, outputs, userFunctionAllowedModules);
	}

	async spinOffNode(newAuthor: string): Promise<FirestoreNodeBluePrintController> {
		const newNid = 'spinnoff_node'+uuidv4();
		const nodeBluePrint = (await getDoc(this.getNodeBluePrintRef())).data() as NodeBluePrintModel;
		let trust_level = nodeBluePrint.trust_level;
		if (trust_level === 'Official' || trust_level === 'Trusted') {
			// reduce trust level to new
			// if it's lower than new, reduced it further
			trust_level = 'New';
		}
		const spinnoffNodeBluePrint = {
			nid: newNid,
			predecessor_node: this.nid,
			author_uid: newAuthor,
			title: `Spinnoff of ${nodeBluePrint.title}`,
			version: 0,
			created_at: new Date(),
			last_updated_at: new Date(),

			documentation: nodeBluePrint.documentation,

			input_sockets: nodeBluePrint.input_sockets,
			input_socket_order: nodeBluePrint.input_socket_order,
			output_sockets: nodeBluePrint.output_sockets,
			output_socket_order: nodeBluePrint.output_socket_order,

			user_defined_code_snippet: nodeBluePrint.user_defined_code_snippet,
			trust_level: 'Official'
		} as unknown as NodeBluePrintModel;

		const nodeBluePrintController = new FirestoreNodeBluePrintController(spinnoffNodeBluePrint.nid);

		await setDoc(nodeBluePrintController.getNodeBluePrintRef(), spinnoffNodeBluePrint);

		return nodeBluePrintController;
	}

	async newInputSocket(socket_key: SocketID, socket: InputSocketModel<InputSocketParams>) {
		await updateDoc(this.getNodeBluePrintRef(), `input_sockets.${socket_key}`, socket);
		await updateDoc(this.getNodeBluePrintRef(), 'input_socket_order', arrayUnion(socket_key));
		await this.updated();
	}

	getInputSocketKeysInOrder(): Promise<Array<SocketID>> {
		return getDoc(this.getNodeBluePrintRef()).then(async (snapshot) => {
			return await snapshot.get('input_socket_order');
		});
	}

	async newOutputSocket(socket_key: SocketID, socket: OutputSocketModel) {
		await updateDoc(this.getNodeBluePrintRef(), `output_sockets.${socket_key}`, socket);
		await updateDoc(this.getNodeBluePrintRef(), 'output_socket_order', arrayUnion(socket_key));
		await this.updated();
	}

	getOutputSocketKeysInOrder() {
		return getDoc(this.getNodeBluePrintRef()).then(async (snapshot) => {
			return snapshot.get('output_socket_order');
		});
	}

	async setDocumentation(documentation: string) {
		await updateDoc(this.getNodeBluePrintRef(), 'documentation', documentation);
		// this.updated(); // this will not change the functionality or flow
	}

	async getDocumentation() {
		return await getDoc(this.getNodeBluePrintRef()).then(async (snapshot) => {
			return await snapshot.get('documentation');
		});
	}

	async setTitle(title: string) {
		await updateDoc(this.getNodeBluePrintRef(), 'title', title);
		await this.updated(); // this will not change the functionality or flow
	}

	async getTitle() {
		return await getDoc(this.getNodeBluePrintRef()).then(async (snapshot) => {
			return await snapshot.get('title');
		});
	}

	async setCode(user_defined_code_snippet: string) {
		await updateDoc(
			this.getNodeBluePrintRef(),
			'user_defined_code_snippet',
			user_defined_code_snippet
		);
		await this.updated();
	}

	async getCode() {
		return await getDoc(this.getNodeBluePrintRef()).then(async (snapshot) => {
			return await snapshot.get('user_defined_code_snippet');
		});
	}

	async markAsUpdated() {
		await updateDoc(this.getNodeBluePrintRef(), 'last_updated_at', new Date());
	}

	async getLastUpdatedTimestamp() {
		return await getDoc(this.getNodeBluePrintRef()).then(async (snapshot) => {
			return await snapshot.get('last_updated_at');
		});
	}

	async bumpVersion() {
		await updateDoc(this.getNodeBluePrintRef(), 'version', increment(1));
	}

	async getVersion() {
		return await getDoc(this.getNodeBluePrintRef()).then(async (snapshot) => {
			return await snapshot.get('version');
		});
	}

	async updated() {
		this.markAsUpdated();
		this.bumpVersion();
	}
}
