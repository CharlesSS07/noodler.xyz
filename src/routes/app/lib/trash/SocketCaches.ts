import PubSub from 'pubsub-js';
import type { SocketSpecifierInstanceInterface } from './SocketInterfaces.js';

export class SocketDataCache {
    private static CACHE = new Map<string, unknown>();

    static hasSocketData(socket: SocketSpecifierInstanceInterface) {
        return this.CACHE.has(socket.getUniqueIdentifier());
    }

    static getSocketData(socket: SocketSpecifierInstanceInterface) {
        // if (socket.isInput)
        //   throw new Error("Why do you want an input socket?");
        const val = this.CACHE.get(socket.getUniqueIdentifier());
        if (val !== undefined) return val;
        throw new Error(
            `${socket.getUniqueIdentifier()} is not cached, no value found`
        );
    }

    static setSocketData(
        socket: SocketSpecifierInstanceInterface,
        value: unknown
    ) {
        console.log(
            `set socket ${socket.getUniqueIdentifier()} to ${typeof value}`
        );
        this.CACHE.set(socket.getUniqueIdentifier(), value);
        PubSub.publish(socket.getUniqueIdentifier(), value);
    }

    static deleteSocketData(socket: SocketSpecifierInstanceInterface) {
        this.CACHE.delete(socket.getUniqueIdentifier());
        PubSub.publish(socket.getUniqueIdentifier(), undefined);
    }

    static subscribeToSocketUpdate(
        socket: SocketSpecifierInstanceInterface,
        onUpdate: (msg: string, data: unknown) => void
    ) {
        return PubSub.subscribe(socket.getUniqueIdentifier(), onUpdate);
    }
}

export class SocketElementCache {
    private static socketElementLookup = new Map<string, never>();

    static get(socket: SocketSpecifierInstanceInterface) {
        const socketElement = this.socketElementLookup.get(
            socket.getUniqueIdentifier()
        );
        if (socketElement) return socketElement;
        throw new Error(
            `${socket.getUniqueIdentifier()} is has no registered socket element`
        );
    }

    static set(socket: SocketSpecifierInstanceInterface, element: never) {
        this.socketElementLookup.set(socket.getUniqueIdentifier(), element);
    }
}
