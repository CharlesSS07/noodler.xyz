/**
 * Mapping table from data types to Svelte input components
 * This defines which UI component should be used for each socket data type
 */

import type {Component} from 'svelte';
import { STANDARD_DATATYPES } from '$lib/compositor/DataTypes';

// Import all input components
import NumberInput from './NumberInput.svelte';
import StringInput from './StringInput.svelte';
import BooleanInput from './BooleanInput.svelte';
import FileInput from './FileInput.svelte';
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
        dataType: STANDARD_DATATYPES.NUMBER,
        component: NumberInput,
        description: 'Numeric input with min/max/step support',
    },
    {
        dataType: STANDARD_DATATYPES.STRING,
        component: StringInput,
        description: 'Text input with validation',
    },
    {
        dataType: STANDARD_DATATYPES.TEXT,
        component: StringInput,
        description: 'Text input (alias for string)',
    },
    {
        dataType: STANDARD_DATATYPES.BOOLEAN,
        component: BooleanInput,
        description: 'Checkbox for true/false values',
    },

    // File types  
    {
        dataType: STANDARD_DATATYPES.FILE,
        component: FileInput,
        description: 'File upload input',
    },

    // Image types
    {
        dataType: STANDARD_DATATYPES.IMAGE_BASE64,
        component: ImageInput,
        description: 'Image upload with base64 encoding',
    },
    {
        dataType: STANDARD_DATATYPES.IMAGE_JIMP,
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
        dataType: STANDARD_DATATYPES.UNKNOWN,
        component: StringInput,
        description: 'Unknown type (not directly editable)',
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
