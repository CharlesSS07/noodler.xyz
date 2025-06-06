import type { InputSocketParams, SocketData } from './SocketModels.js';

export interface InputSocketParamBuilderInterface<T extends InputSocketParams> {
    setDefaultValue(default_value: SocketData): void;

    getDefaultValue(): SocketData;

    /**
     * This should throw a descriptive error if a value does not satisfy the config.
     */
    check(value: SocketData): void;

    build(): T;
}

export class InputSocketParamBuilder<T extends InputSocketParams>
    implements InputSocketParamBuilderInterface<T>
{
    default_value: SocketData;

    constructor(default_value: SocketData) {
        this.default_value = default_value;
    }

    setDefaultValue(default_value: SocketData) {
        this.default_value = default_value;
    }

    getDefaultValue() {
        return this.default_value;
    }

    check(value: SocketData): void {
        return;
    }

    build(): T {
        return {
            default_value: this.default_value,
        } as T;
    }
}
