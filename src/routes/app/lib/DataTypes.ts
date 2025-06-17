
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

export const DATATYPE_UNKNOWN = {
    name: 'unknown',
    style: baseSocketStyle('#FF00FF'), // magenta because that's like a missing asset in a video game
    description:
        'Represents an unknown object. This could be anything. Introspect to find out.',
    type: 'unknown',
};
export const DATATYPE_UNREGISTERED = {
    name: 'unregistered',
    style: baseSocketStyle('#ff0000'),
    description:
        'Represents an unknown object. This could be anything. Introspect to find out.',
    type: 'unknown',
};

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
}

const standardDataTypes: SocketDataType[] = [
    DATATYPE_UNREGISTERED,
    DATATYPE_UNKNOWN,
    {
        name: 'number',
        style: baseSocketStyle('#e74c3c'),
        description: 'Holds a standard JavaScript number.',
        type: 'number',
    },
    {
        name: 'string',
        style: baseSocketStyle('#3498db'),
        description: 'Holds a standard JavaScript string of text.',
        type: 'string',
    },
    {
        name: 'text',
        style: baseSocketStyle('#3498db'),
        description: 'Holds a standard JavaScript string of text.',
        type: 'string',
    },
    {
        name: 'boolean',
        style: baseSocketStyle('#9b59b6'),
        description: 'Holds a boolean value (true or false).',
        type: 'boolean',
    },
    {
        name: 'object',
        style: baseSocketStyle('#f39c12'),
        description: 'Holds a standard JavaScript object.',
        type: 'object',
    },
    {
        name: 'File',
        style: baseSocketStyle('#8e44ad'),
        description: 'Represents a file or file-like object.',
        type: 'File',
    },
    {
        name: 'image/jimp',
        style: baseSocketStyle('#00b900'),
        description:
            'Represents an image stored as a JIMP (JS image processing library) object.',
        type: 'JimpInstance',
    },
    {
        name: 'Tensor',
        style: baseSocketStyle('#00b900'),
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
