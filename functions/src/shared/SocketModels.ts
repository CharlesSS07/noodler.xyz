/**
 * Base interface for socket models.
 */
interface SocketModel {
    /**
     * Sockets cannot be deleted (unless they have never been used).
     * Because if they have been used, this would displace links, and
     * restoring them would not replace the links.
     * Instead, we hide the socket. Now, if it is deleted and restored
     * the links still exist.
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
     * Instead of a disabled flag, we have the port-to socket id which
     * explains how to migrate libs that are already connected by swapping
     * connections over to replacement socket
     */
}

/**
 * Type representing data a socket points to.
 */
export type SocketData = unknown;

/**
 * Parameters for input sockets.
 */
export interface InputSocketParams {
    default_value: SocketData;
    // extend this with things like a min and/or max for a number confined
    // to an interval. increment... any display settings for the ui whose
    // job it is to help the user set this value
}

/**
 * Model for input sockets with typed parameters.
 */
export interface InputSocketModel<T extends InputSocketParams>
    extends SocketModel {
    params: T;
}

/**
 * Model for output sockets.
 */
export type OutputSocketModel = SocketModel;

/**
 * Type representing a socket ID.
 */
export type SocketID = string;
