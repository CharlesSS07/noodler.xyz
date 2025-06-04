import type { SocketData, SocketID } from './SocketModels.js';
import type { NodeInstanceControllerInterface } from './NodeModels.js';

export interface SocketBluePrintControllerInterface {
	getLabel(): Promise<string>;
	setLabel(label: string): void;
	getDocumentation(): Promise<string>;
	setDocumentation(documentation: string): void;
	getType(): Promise<string>;
	setType(type: string): void;
	hide(): void;
	unhide(): void;
	isHidden(): Promise<boolean>;
	required(): void;
	notRequired(): void;
}

export abstract class InputSocketBluePrintControllerInterface {
	// getParams(): Promise<object>;
	// setParams(params: object): Promise<void>;
	abstract getSocketParam(paramName: string): Promise<unknown>;
	abstract setSocketParam(paramName: string, value: unknown): Promise<void>;
	// getDefaultValue(): Promise<T> {
	// 	return this.getSocketParam('default_value').then((value) => value as T);
	// }
	// setDefaultValue(default_value: T): Promise<void> {
	// 	return this.setSocketParam('default_value', default_value);
	// }
	// abstract check(value: T): void;
}

export interface InputSocketInstanceControllerInterface {
	getNode(): NodeInstanceControllerInterface;
	setValue(value: unknown): Promise<void>;
	getLink(): Promise<SocketSpecifierInstanceInterface | null>;
	setLink(link: SocketSpecifierInstanceInterface | null): Promise<void>;
	getSocketInstanceSpecifier(): SocketSpecifierInstanceInterface;
}

export interface SocketSpecifierInstanceInterface {
	socket_key: SocketID;
	node_key: string;
	isInput: boolean;

	getSocketPath(): string;
	getUniqueIdentifier(): string;
	toString(): string;
}

export class LinkedSockets {
	fromOutput: SocketSpecifierInstanceInterface;
	toInput: SocketSpecifierInstanceInterface;

	constructor(
		fromOutput: SocketSpecifierInstanceInterface,
		toInput: SocketSpecifierInstanceInterface
	) {
		if (!fromOutput || !toInput) throw new Error('At least one socket was null/undefined.');
		if (fromOutput.isInput === toInput.isInput) {
			throw new Error(
				'Both sockets specified are either inputs/outputs. One must be input while other is output.'
			);
		}
		if (toInput.isInput) {
			this.fromOutput = fromOutput;
			this.toInput = toInput;
		} else {
			this.fromOutput = toInput;
			this.toInput = fromOutput;
		}
	}

	getUniqueIdentifier() {
		return `${this.fromOutput.getSocketPath()} --> ${this.toInput.getSocketPath()}`;
	}

	toString() {
		return `From: ${this.fromOutput} --> To: ${this.toInput}`;
	}
}
