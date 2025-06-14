/**
 * Mapping table from data types to Svelte input components
 * This defines which UI component should be used for each socket data type
 */

import type { ComponentType } from 'svelte';

// Import all input components
import NumberInput from './NumberInput.svelte';
import StringInput from './StringInput.svelte';
import BooleanInput from './BooleanInput.svelte';
import FileInput from './FileInput.svelte';
import JsonInput from './JsonInput.svelte';
import EnumInput from './EnumInput.svelte';
import ImageInput from './ImageInput.svelte';
import CropInput from './CropInput.svelte';

export interface SocketInputMapping {
    dataType: string;
    component: ComponentType;
    canHaveInput: boolean; // Whether this type supports user input
    description: string;
}

export const SOCKET_INPUT_MAPPINGS: SocketInputMapping[] = [
    // Basic types
    {
        dataType: 'number',
        component: NumberInput,
        canHaveInput: true,
        description: 'Numeric input with min/max/step support',
    },
    {
        dataType: 'string',
        component: StringInput,
        canHaveInput: true,
        description: 'Text input with validation',
    },
    {
        dataType: 'text',
        component: StringInput,
        canHaveInput: true,
        description: 'Text input (alias for string)',
    },
    {
        dataType: 'boolean',
        component: BooleanInput,
        canHaveInput: true,
        description: 'Checkbox for true/false values',
    },

    // Complex types
    {
        dataType: 'json',
        component: JsonInput,
        canHaveInput: true,
        description: 'JSON object editor',
    },
    {
        dataType: 'object',
        component: JsonInput,
        canHaveInput: true,
        description: 'Object editor (uses JSON format)',
    },

    // File types
    {
        dataType: 'file',
        component: FileInput,
        canHaveInput: true,
        description: 'File upload input',
    },
    {
        dataType: 'csv',
        component: FileInput,
        canHaveInput: true,
        description: 'CSV file upload',
    },
    {
        dataType: 'tsv',
        component: FileInput,
        canHaveInput: true,
        description: 'TSV file upload',
    },

    // Image types
    {
        dataType: 'image/base64',
        component: ImageInput,
        canHaveInput: true,
        description: 'Image upload with base64 encoding',
    },
    {
        dataType: 'image/jimp',
        component: ImageInput,
        canHaveInput: true,
        description: 'Image upload for JIMP processing',
    },

    // Special types
    {
        dataType: 'crop',
        component: CropInput,
        canHaveInput: true,
        description: 'Crop area selector',
    },
    {
        dataType: 'enum',
        component: EnumInput,
        canHaveInput: true,
        description: 'Dropdown selector for predefined options',
    },

    // Non-input types (these don't support user input)
    {
        dataType: 'array',
        component: StringInput, // Fallback to string representation
        canHaveInput: false,
        description: 'Array type (not directly editable)',
    },
    {
        dataType: 'unknown',
        component: StringInput, // Fallback to string representation
        canHaveInput: false,
        description: 'Unknown type (not directly editable)',
    },
    {
        dataType: 'any',
        component: StringInput, // Fallback to string representation
        canHaveInput: false,
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

/**
 * Check if a data type supports user input
 */
export function canDataTypeHaveInput(dataType: string): boolean {
    const mapping = getInputComponentForDataType(dataType);
    return mapping?.canHaveInput || false;
}

/**
 * Get all data types that support input
 */
export function getInputSupportedDataTypes(): string[] {
    return SOCKET_INPUT_MAPPINGS.filter((m) => m.canHaveInput).map(
        (m) => m.dataType
    );
}
