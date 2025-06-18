/**
 * Mapping table from data types to Svelte input components
 * This defines which UI component should be used for each socket data type
 */

import type {Component} from 'svelte';

// Import all input components
import NumberInput from './NumberInput.svelte';
import StringInput from './StringInput.svelte';
import BooleanInput from './BooleanInput.svelte';
import FileInput from './FileInput.svelte';
import JsonInput from './JsonInput.svelte';
import EnumInput from './EnumInput.svelte';
import ImageInput from './ImageInput.svelte';

export interface SocketInputMapping {
    dataType: string;
    component: Component;
    description: string;
}

export const SOCKET_INPUT_MAPPINGS: SocketInputMapping[] = [
    // Basic types
    {
        dataType: 'number',
        component: NumberInput,
        description: 'Numeric input with min/max/step support',
    },
    {
        dataType: 'string',
        component: StringInput,
        description: 'Text input with validation',
    },
    {
        dataType: 'text',
        component: StringInput,
        description: 'Text input (alias for string)',
    },
    {
        dataType: 'boolean',
        component: BooleanInput,
        description: 'Checkbox for true/false values',
    },

    // Complex types
    {
        dataType: 'json',
        component: JsonInput,
        description: 'JSON object editor',
    },
    {
        dataType: 'object',
        component: JsonInput,
        description: 'Object editor (uses JSON format)',
    },

    // File types
    {
        dataType: 'file',
        component: FileInput,
        description: 'File upload input',
    },
    {
        dataType: 'csv',
        component: FileInput,
        description: 'CSV file upload',
    },
    {
        dataType: 'tsv',
        component: FileInput,
        description: 'TSV file upload',
    },

    // Image types
    {
        dataType: 'image/base64',
        component: ImageInput,
        description: 'Image upload with base64 encoding',
    },
    {
        dataType: 'image/jimp',
        component: ImageInput,
        description: 'Image upload for JIMP processing',
    },

    // Special types
    {
        dataType: 'enum',
        component: EnumInput,
        description: 'Dropdown selector for predefined options',
    },

    {
        dataType: 'array',
        component: StringInput,
        description: 'Array type (not directly editable)',
    },
    {
        dataType: 'unknown',
        component: StringInput,
        description: 'Unknown type (not directly editable)',
    },
    {
        dataType: 'any',
        component: StringInput,
        description: 'Any type (not directly editable)',
    },
];

/**
 * Get the appropriate input component for a given data type
 */
export function getInputComponentForDataType(
    dataType: string
): SocketInputMapping | null {
    const mapping = SOCKET_INPUT_MAPPINGS.find(
        (m) => m.dataType.toLowerCase() === dataType.toLowerCase()
    );

    return mapping || null;
}
