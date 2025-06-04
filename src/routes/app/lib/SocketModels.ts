interface SocketModel {
	/**
	 * Sockets cannot be deleted (unless they have never been used).
	 * Because if they have been used, this would displace links, and restoring them would not replace the links.
	 * Instead, we hide the socket. Now, if it is deleted and restored the links still exist.
	 * Disabled sockets should not be computed or used in computation.
	 */
	disabled?: boolean | undefined;
	required?: boolean | undefined;

	label: string;
	documentation: string;
	type: string;

	/**
	 * Ideas
	 *
	 * Instead of a disabled flag, we have the port-to socket id which explains how to migrate
	 * nodes that are already connected by swapping connections over to replacement socket
	 */
}

export type SocketData = unknown;
// data a socket points to

export interface InputSocketParams {
	default_value: SocketData;
	// extend this with things like a min and/or max for a number confined to an interval
	// increment... any display settings for the ui whose job it is to help the user set this value
}

export interface InputSocketModel<T extends InputSocketParams> extends SocketModel {
	params: T;
}

export type OutputSocketModel = SocketModel;

export type SocketID = string;
