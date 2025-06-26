import { describe, it, expect } from 'vitest';
import {
    InputSocketParamBuilder,
    GenericSocketParamsBuilder,
    NumberSocketParamsBuilder,
    StringSocketParamsBuilder,
    JIMPImageSocketParamsBuilder,
    ENUMSocketParamBuilder,
    CSVSocketParamsBuilder,
    TSVSocketParamsBuilder,
    CropParamSocketParamsBuilder,
    type NumberSocketParams,
    type StringSocketParams,
    type JIMPSocketParams,
    type ENUMSocketParams,
} from './SocketParamBuilders.js';

describe('InputSocketParamBuilder', () => {
    it('should create builder with default value', () => {
        const builder = new InputSocketParamBuilder('test');
        expect(builder.getDefaultValue()).toBe('test');
    });

    it('should set and get default value', () => {
        const builder = new InputSocketParamBuilder('initial');
        builder.setDefaultValue('updated');
        expect(builder.getDefaultValue()).toBe('updated');
    });

    it('should check value without throwing', () => {
        const builder = new InputSocketParamBuilder('test');
        expect(() => builder.check('any value')).not.toThrow();
    });

    it('should build params with default value', () => {
        const builder = new InputSocketParamBuilder(42);
        const params = builder.build();
        expect(params).toEqual({ default_value: 42 });
    });
});

describe('GenericSocketParamsBuilder', () => {
    it('should create builder with default value', () => {
        const builder = new GenericSocketParamsBuilder('test');
        expect(builder.getDefaultValue()).toBe('test');
    });

    it('should check valid value without throwing', () => {
        const builder = new GenericSocketParamsBuilder('test');
        expect(() => builder.check('valid')).not.toThrow();
    });

    it('should throw error for undefined value', () => {
        const builder = new GenericSocketParamsBuilder('test');
        expect(() => builder.check(undefined)).toThrow(
            'value is undefined/null!'
        );
    });

    it('should throw error for null value', () => {
        const builder = new GenericSocketParamsBuilder('test');
        expect(() => builder.check(null)).toThrow('value is undefined/null!');
    });

    it('should build params', () => {
        const builder = new GenericSocketParamsBuilder('test');
        const params = builder.build();
        expect(params).toEqual({ default_value: 'test' });
    });
});

describe('NumberSocketParamsBuilder', () => {
    it('should create builder with default value', () => {
        const builder = new NumberSocketParamsBuilder(0);
        expect(builder.getDefaultValue()).toBe(0);
    });

    it('should set min value', () => {
        const builder = new NumberSocketParamsBuilder(0);
        builder.setMin(5);
        expect(builder.params.min).toBe(5);
    });

    it('should set max value', () => {
        const builder = new NumberSocketParamsBuilder(0);
        builder.setMax(100);
        expect(builder.params.max).toBe(100);
    });

    it('should set step value', () => {
        const builder = new NumberSocketParamsBuilder(0);
        builder.setStep(0.1);
        expect(builder.params.step).toBe(0.1);
    });

    it('should clear min value', () => {
        const builder = new NumberSocketParamsBuilder(0);
        builder.setMin(5).noMin();
        expect(builder.params.min).toBe(null);
    });

    it('should clear max value', () => {
        const builder = new NumberSocketParamsBuilder(0);
        builder.setMax(100).noMax();
        expect(builder.params.max).toBe(null);
    });

    it('should clear step value', () => {
        const builder = new NumberSocketParamsBuilder(0);
        builder.setStep(0.1).noStep();
        expect(builder.params.step).toBe(null);
    });

    it('should check valid number without throwing', () => {
        const builder = new NumberSocketParamsBuilder(0);
        expect(() => builder.check(5)).not.toThrow();
    });

    it('should throw error for value greater than max', () => {
        const builder = new NumberSocketParamsBuilder(0);
        builder.setMax(10);
        expect(() => builder.check(15)).toThrow(
            'value should not be greater than max: 10'
        );
    });

    it('should throw error for value less than min', () => {
        const builder = new NumberSocketParamsBuilder(0);
        builder.setMin(5);
        expect(() => builder.check(3)).toThrow(
            'value should not be less than min: 5'
        );
    });

    it('should throw error for value not matching step', () => {
        const builder = new NumberSocketParamsBuilder(0);
        builder.setStep(2);
        expect(() => builder.check(3)).toThrow('value must be increment of 2');
    });

    it('should build complete params with all values', () => {
        const params = new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(100)
            .setStep(0.1)
            .build();

        expect(params).toEqual({
            default_value: 0,
            min: 0,
            max: 100,
            step: 0.1,
        });
    });

    it('should build params with partial values', () => {
        const params = new NumberSocketParamsBuilder(5).setMin(1).build();

        expect(params).toEqual({
            default_value: 5,
            min: 1,
            max: null,
            step: null,
        });
    });
});

describe('StringSocketParamsBuilder', () => {
    it('should create builder with default value', () => {
        const builder = new StringSocketParamsBuilder('');
        expect(builder.getDefaultValue()).toBe('');
    });

    it('should configure as word', () => {
        const builder = new StringSocketParamsBuilder('test');
        builder.asWord();
        expect(builder.getDefaultValue()).toBe('');
        expect(builder.params.minCharacters).toBe(1);
    });

    it('should configure as sentence', () => {
        const builder = new StringSocketParamsBuilder('test');
        builder.asSentence();
        expect(builder.getDefaultValue()).toBe('');
        expect(builder.params.minCharacters).toBe(20);
    });

    it('should configure as paragraph', () => {
        const builder = new StringSocketParamsBuilder('test');
        builder.asParagraph();
        expect(builder.getDefaultValue()).toBe('');
        expect(builder.params.minCharacters).toBe(60);
    });

    it('should configure as password', () => {
        const builder = new StringSocketParamsBuilder('test');
        builder.asPassword();
        expect(builder.getDefaultValue()).toBe('');
        expect(builder.params.isSensitive).toBe(true);
        expect(builder.params.minCharacters).toBe(8);
    });

    it('should set min characters', () => {
        const builder = new StringSocketParamsBuilder('');
        builder.setMinCharacters(5);
        expect(builder.params.minCharacters).toBe(5);
    });

    it('should set max characters', () => {
        const builder = new StringSocketParamsBuilder('');
        builder.setMaxCharacters(100);
        expect(builder.params.maxCharacters).toBe(100);
    });

    it('should check valid string without throwing', () => {
        const builder = new StringSocketParamsBuilder('');
        expect(() => builder.check('valid string')).not.toThrow();
    });

    it('should throw error for string shorter than min characters', () => {
        const builder = new StringSocketParamsBuilder('');
        builder.setMinCharacters(10);
        expect(() => builder.check('short')).toThrow(
            'fewer characters than minCharacters: 5 < 10'
        );
    });

    it('should build params', () => {
        const params = new StringSocketParamsBuilder('default')
            .setMinCharacters(5)
            .setMaxCharacters(100)
            .build();

        expect(params).toEqual({
            default_value: 'default',
            isSensitive: false,
            minCharacters: 5,
            maxCharacters: 100,
            numRows: null,
        });
    });
});

describe('JIMPImageSocketParamsBuilder', () => {
    it('should create builder with empty image default', () => {
        const builder = new JIMPImageSocketParamsBuilder();
        expect(builder.getDefaultValue()).toBe(
            JIMPImageSocketParamsBuilder.EMPTY_IMAGE
        );
    });

    it('should hide image display', () => {
        const builder = new JIMPImageSocketParamsBuilder();
        builder.hide();
        expect(builder.params.displayImage).toBe(false);
    });

    it('should show image display', () => {
        const builder = new JIMPImageSocketParamsBuilder();
        builder.hide().show();
        expect(builder.params.displayImage).toBe(true);
    });

    it('should check valid image without throwing', () => {
        const builder = new JIMPImageSocketParamsBuilder();
        const mockJimp = {} as any; // Mock JIMP instance
        expect(() => builder.check(mockJimp)).not.toThrow();
    });

    it('should throw error for empty image', () => {
        const builder = new JIMPImageSocketParamsBuilder();
        expect(() =>
            builder.check(JIMPImageSocketParamsBuilder.EMPTY_IMAGE)
        ).toThrow('value is the empty image');
    });

    it('should build params', () => {
        const params = new JIMPImageSocketParamsBuilder().hide().build();

        expect(params).toEqual({
            default_value: JIMPImageSocketParamsBuilder.EMPTY_IMAGE,
            displayImage: false,
        });
    });
});

describe('ENUMSocketParamBuilder', () => {
    it('should create builder with options', () => {
        const options = ['option1', 'option2', 'option3'];
        const builder = new ENUMSocketParamBuilder(options);
        expect(builder.getOptions()).toEqual(options);
        expect(builder.getDefaultValue()).toBe('option1');
    });

    it('should throw error for empty options', () => {
        expect(() => new ENUMSocketParamBuilder([])).toThrow(
            'options must not be empty'
        );
    });

    it('should throw error for single option', () => {
        expect(() => new ENUMSocketParamBuilder(['only one'])).toThrow(
            'options must not be empty'
        );
    });

    it('should remove duplicate options', () => {
        const builder = new ENUMSocketParamBuilder(['a', 'b', 'a', 'c', 'b']);
        expect(builder.getOptions()).toEqual(['a', 'b', 'c']);
    });

    it('should check valid option without throwing', () => {
        const builder = new ENUMSocketParamBuilder(['option1', 'option2']);
        expect(() => builder.check('option1')).not.toThrow();
    });

    it('should throw error for invalid option', () => {
        const builder = new ENUMSocketParamBuilder(['option1', 'option2']);
        expect(() => builder.check('invalid')).toThrow(
            'value should be in enum options; illegal value'
        );
    });

    it('should build params', () => {
        const options = ['red', 'green', 'blue'];
        const params = new ENUMSocketParamBuilder(options).build();

        expect(params).toEqual({
            default_value: 'red',
            options: ['red', 'green', 'blue'],
        });
    });
});

describe('CSVSocketParamsBuilder', () => {
    it('should create builder with empty file default', () => {
        const builder = new CSVSocketParamsBuilder();
        expect(builder.getDefaultValue()).toBe(
            CSVSocketParamsBuilder.EMPTY_FILE
        );
    });

    it('should check valid file without throwing', () => {
        const builder = new CSVSocketParamsBuilder();
        const mockFile = new File(['data'], 'test.csv', { type: 'text/csv' });
        expect(() => builder.check(mockFile)).not.toThrow();
    });

    it('should throw error for empty file placeholder', () => {
        const builder = new CSVSocketParamsBuilder();
        expect(() => builder.check(CSVSocketParamsBuilder.EMPTY_FILE)).toThrow(
            'Value is the empty CSV placeholder.'
        );
    });

    it('should throw error for non-CSV file', () => {
        const builder = new CSVSocketParamsBuilder();
        const mockFile = new File(['data'], 'test.txt', { type: 'text/plain' });
        expect(() => builder.check(mockFile)).toThrow(
            'Expected a .csv file, got "test.txt"'
        );
    });

    it('should throw error for empty file size', () => {
        const builder = new CSVSocketParamsBuilder();
        const mockFile = new File([], 'test.csv', { type: 'text/csv' });
        expect(() => builder.check(mockFile)).toThrow('CSV file is empty.');
    });

    it('should throw error for invalid type', () => {
        const builder = new CSVSocketParamsBuilder();
        expect(() => builder.check(123 as any)).toThrow(
            'Expected a File object or placeholder.'
        );
    });

    it('should build params', () => {
        const params = new CSVSocketParamsBuilder().build();
        expect(params).toEqual({
            default_value: CSVSocketParamsBuilder.EMPTY_FILE,
        });
    });
});

describe('TSVSocketParamsBuilder', () => {
    it('should create builder with empty file default', () => {
        const builder = new TSVSocketParamsBuilder();
        expect(builder.getDefaultValue()).toBe(
            TSVSocketParamsBuilder.EMPTY_FILE
        );
    });

    it('should check valid file without throwing', () => {
        const builder = new TSVSocketParamsBuilder();
        const mockFile = new File(['data'], 'test.tsv', {
            type: 'text/tab-separated-values',
        });
        expect(() => builder.check(mockFile)).not.toThrow();
    });

    it('should throw error for empty file placeholder', () => {
        const builder = new TSVSocketParamsBuilder();
        expect(() => builder.check(TSVSocketParamsBuilder.EMPTY_FILE)).toThrow(
            'Value is the empty TSV placeholder.'
        );
    });

    it('should throw error for non-TSV file', () => {
        const builder = new TSVSocketParamsBuilder();
        const mockFile = new File(['data'], 'test.txt', { type: 'text/plain' });
        expect(() => builder.check(mockFile)).toThrow(
            'Expected a .tsv file, got "test.txt"'
        );
    });

    it('should throw error for empty file size', () => {
        const builder = new TSVSocketParamsBuilder();
        const mockFile = new File([], 'test.tsv', {
            type: 'text/tab-separated-values',
        });
        expect(() => builder.check(mockFile)).toThrow('TSV file is empty.');
    });

    it('should throw error for invalid type', () => {
        const builder = new TSVSocketParamsBuilder();
        expect(() => builder.check(123 as any)).toThrow(
            'Expected a File object or placeholder.'
        );
    });

    it('should build params', () => {
        const params = new TSVSocketParamsBuilder().build();
        expect(params).toEqual({
            default_value: TSVSocketParamsBuilder.EMPTY_FILE,
        });
    });
});

describe('CropParamSocketParamsBuilder', () => {
    it('should create builder with default crop params', () => {
        const builder = new CropParamSocketParamsBuilder();
        expect(builder.getDefaultValue()).toEqual({
            x: 0,
            y: 0,
            width: 100,
            height: 100,
        });
    });

    it('should check valid crop params without throwing', () => {
        const builder = new CropParamSocketParamsBuilder();
        const validCrop = { x: 10, y: 20, width: 50, height: 75 };
        expect(() => builder.check(validCrop)).not.toThrow();
    });

    it('should throw error for zero width', () => {
        const builder = new CropParamSocketParamsBuilder();
        const invalidCrop = { x: 0, y: 0, width: 0, height: 100 };
        expect(() => builder.check(invalidCrop)).toThrow(
            'Crop object must have positive width, height'
        );
    });

    it('should throw error for zero height', () => {
        const builder = new CropParamSocketParamsBuilder();
        const invalidCrop = { x: 0, y: 0, width: 100, height: 0 };
        expect(() => builder.check(invalidCrop)).toThrow(
            'Crop object must have positive width, height'
        );
    });

    it('should throw error for negative width', () => {
        const builder = new CropParamSocketParamsBuilder();
        const invalidCrop = { x: 0, y: 0, width: -10, height: 100 };
        expect(() => builder.check(invalidCrop)).toThrow(
            'Crop object must have positive width, height'
        );
    });

    it('should throw error for negative height', () => {
        const builder = new CropParamSocketParamsBuilder();
        const invalidCrop = { x: 0, y: 0, width: 100, height: -10 };
        expect(() => builder.check(invalidCrop)).toThrow(
            'Crop object must have positive width, height'
        );
    });

    it('should build params', () => {
        const params = new CropParamSocketParamsBuilder().build();
        expect(params).toEqual({
            default_value: { x: 0, y: 0, width: 100, height: 100 },
        });
    });
});
