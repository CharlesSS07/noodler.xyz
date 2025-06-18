
export type SocketDataType = {
    name: string; // name is the unique identifier. there are no ids because then we could have overlapping names
    style: string;
    description: string;
    type: string;
    // childOfType?: string | undefined;
};

function baseSocketStyle(color: string): string {
    return `background-color: ${color}; border-color: ${color};`;
}

export const STANDARD_DATATYPES = {
    NUMBER: 'number',
    STRING: 'string',
    BOOLEAN: 'boolean',
    DATE: 'date',
    TEXT: 'string',
    OBJECT: 'object',
    FILE: 'File',
    IMAGE_JIMP: 'image/jimp',
    IMAGE_BASE64: 'image/base64',
    TENSOR: 'Tensor',

    UNKNOWN: 'unknown',
    UNREGISTER: 'unregistered',
};

export const DATATYPE_UNKNOWN = {
    name: STANDARD_DATATYPES.UNKNOWN,
    style: baseSocketStyle('#FF00FF'), // magenta because that's like a missing asset in a video game
    description:
        'Represents an unknown object. This could be anything. Introspect to find out.',
    type: 'unknown',
};
export const DATATYPE_UNREGISTERED = {
    name: STANDARD_DATATYPES.UNREGISTER,
    style: baseSocketStyle('#ff0000'),
    description:
        'Represents an unknown object. This could be anything. Introspect to find out.',
    type: 'unknown',
};

const standardDataTypes: SocketDataType[] = [
    DATATYPE_UNREGISTERED,
    DATATYPE_UNKNOWN,
    {
        name: STANDARD_DATATYPES.NUMBER,
        style: baseSocketStyle('#e74c3c'),
        description: 'Holds a standard JavaScript number.',
        type: 'number',
    },
    {
        name: STANDARD_DATATYPES.STRING,
        style: baseSocketStyle('#3498db'),
        description: 'Holds a standard JavaScript string of text.',
        type: 'string',
    },
    {
        name: STANDARD_DATATYPES.TEXT,
        style: baseSocketStyle('#3498db'),
        description: 'Holds a standard JavaScript string of text.',
        type: 'string',
    },
    {
        name: STANDARD_DATATYPES.BOOLEAN,
        style: baseSocketStyle('#9b59b6'),
        description: 'Holds a boolean value (true or false).',
        type: 'boolean',
    },
    {
        name: STANDARD_DATATYPES.OBJECT,
        style: baseSocketStyle('#f39c12'),
        description: 'Holds a standard JavaScript object.',
        type: 'object',
    },
    {
        name: STANDARD_DATATYPES.FILE,
        style: baseSocketStyle('#8e44ad'),
        description: 'Represents a file or file-like object.',
        type: 'File',
    },
    {
        name: STANDARD_DATATYPES.IMAGE_JIMP,
        style: baseSocketStyle('#00b900'),
        description:
            'Represents an image stored as a JIMP (JS image processing library) object.',
        type: 'JimpInstance',
    },
    {
        name: STANDARD_DATATYPES.IMAGE_BASE64,
        style: baseSocketStyle('#b0b900'),
        description:
            'Represents an image stored as a JIMP (JS image processing library) object.',
        type: 'JimpInstance',
    },
    {
        name: STANDARD_DATATYPES.TENSOR,
        style: baseSocketStyle('#00adb9'),
        description:
            'Represents an nd-array (tfjs).',
        type: 'tf.tensor',
    },
];

/**
 * Retrieves a SocketDataType by its name.
 * It first checks a local list and then would typically fall back to an API if not found.
 * @param name The name of the SocketDataType to retrieve.
 * @returns The SocketDataType object if found, otherwise undefined.
 */
export async function fetchSocketDataTypeByName(
    name: string
): Promise<SocketDataType | undefined> {
    // 1. Check the local list first
    name = name.toLowerCase();
    const foundType = standardDataTypes.find((type) => type.name === name);
    if (foundType) {
        return foundType;
    }

    // // 2. If not found locally, ideally, you would check a database via an API here.
    // // This is where your API call would go.
    // // Example (conceptual, not functional):
    // /*
    // try {
    //     const response = await fetch(`/api/datatypes?name=${name}`);
    //     if (response.ok) {
    //         const data: SocketDataType = await response.json();
    //         return data;
    //     } else {
    //         console.error(`Error fetching data type '${name}':`, response.statusText);
    //         return undefined;
    //     }
    // } catch (error) {
    //     console.error(`Network error fetching data type '${name}':`, error);
    //     return undefined;
    // }
    // */
    //
    // // For now, if not found locally, it returns undefined.
    console.error(`Datatype Not found: ${name}`);
    return fetchSocketDataTypeByName('unregistered');
}
