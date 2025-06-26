import type { JimpInstance } from 'jimp';
import type { InputSocketParams, SocketData } from './SocketModels.js';

export class InputSocketParamBuilder<T extends InputSocketParams> {
    default_value: unknown;

    constructor(default_value: SocketData) {
        this.default_value = default_value;
    }

    setDefaultValue(default_value: SocketData) {
        this.default_value = default_value;
    }

    getDefaultValue() {
        return this.default_value;
    }

    check(value: unknown): void {
        return;
    }

    build(): T {
        return {
            default_value: this.default_value,
        } as T;
    }
}

export class GenericSocketParamsBuilder<
    T,
    C extends InputSocketParams,
> extends InputSocketParamBuilder<C> {
    check(value: T): void {
        if (value !== undefined && value !== null) {
            return;
        }
        throw new Error('value is undefined/null!');
    }
}

export interface NumberSocketParams extends InputSocketParams {
    min: number | null;
    max: number | null;
    step: number | null;
}

export class NumberSocketParamsBuilder extends GenericSocketParamsBuilder<
    number,
    NumberSocketParams
> {
    params: NumberSocketParams = new (class implements NumberSocketParams {
        default_value: number = 0;
        max: number | null = null;
        min: number | null = null;
        step: number | null = null;
    })();

    constructor(default_value: number) {
        super(default_value);
        this.params.default_value = default_value;
    }

    /**
     * Sets the minimum value for the number input.
     *
     * @param min The minimum value.
     */
    setMin(min: number) {
        this.params.min = min;
        return this;
    }

    noMin() {
        this.params.min = null;
        return this;
    }

    /**
     * Sets the maximum value for the number input.
     *
     * @param max The maximum value.
     */
    setMax(max: number) {
        this.params.max = max;
        return this;
    }

    noMax() {
        this.params.max = null;
        return this;
    }

    /**
     * Sets the interval (step) for the number input.
     *
     * @param step The step value.
     */
    setStep(step: number) {
        this.params.step = step;
        return this;
    }

    noStep() {
        this.params.step = null;
        return this;
    }

    check(value: number): void {
        super.check(value);
        const val = value as number;
        if (this.params.max && val > this.params.max)
            throw new Error(
                `value should not be greater than max: ${this.params.max}`
            );
        if (this.params.min && val < this.params.min)
            throw new Error(
                `value should not be less than min: ${this.params.min}`
            );

        if (this.params.step && val % this.params.step !== 0)
            throw new Error(`value must be increment of ${this.params.step}`);
    }

    build(): NumberSocketParams {
        return {
            default_value: this.params.default_value,
            min: this.params.min,
            max: this.params.max,
            step: this.params.step,
        };
    }
}

export interface StringSocketParams extends InputSocketParams {
    isSensitive: boolean;
    minCharacters: number | null;
    maxCharacters: number | null;
    // minWords: number | null = null;
    // maxWords: number | null = null;
    // minSentences: number | null = null;
    // maxSentences: number | null = null;
    // minParagraphs: number | null = null;
    // maxParagraphs: number | null = null;
    numRows: number | null;
    // language, charset
}

export class StringSocketParamsBuilder extends GenericSocketParamsBuilder<
    string,
    StringSocketParams
> {
    params: StringSocketParams = new (class implements StringSocketParams {
        default_value: string = '';
        isSensitive: boolean = false;
        maxCharacters: number | null = null;
        minCharacters: number | null = null;
        numRows: number | null = null;
    })();

    constructor(default_value: string) {
        super(default_value);
        this.params.default_value = default_value;
    }

    asWord() {
        this.setDefaultValue('');
        this.setMinCharacters(1);
        return this;
    }

    asSentence() {
        this.setDefaultValue('');
        this.setMinCharacters(20);
        return this;
    }

    asParagraph() {
        this.setDefaultValue('');
        this.setMinCharacters(60);
        return this;
    }

    asPassword() {
        this.setDefaultValue('');
        this.params.isSensitive = true;
        this.setMinCharacters(8);
        return this;
    }

    setMinCharacters(minCharacters: number) {
        this.params.minCharacters = minCharacters;
        return this;
    }

    setMaxCharacters(maxCharacters: number) {
        this.params.maxCharacters = maxCharacters;
        return this;
    }

    check(value: string): void {
        super.check(value);
        const val = value as string;

        if (this.params.minCharacters && val.length < this.params.minCharacters)
            throw new Error(
                `fewer characters than minCharacters: ${val.length} < ${this.params.minCharacters}`
            );

        if (this.params.maxCharacters && val.length < this.params.maxCharacters)
            throw new Error(
                `more characters than maxCharacters: ${val.length} > ${this.params.maxCharacters}`
            );
    }

    build(): StringSocketParams {
        return {
            default_value: this.params.default_value,
            isSensitive: this.params.isSensitive,
            minCharacters: this.params.minCharacters,
            maxCharacters: this.params.maxCharacters,
            numRows: this.params.numRows,
        };
    }
}

export interface JIMPSocketParams extends InputSocketParams {
    displayImage: boolean;
}

export class JIMPImageSocketParamsBuilder extends GenericSocketParamsBuilder<
    JimpInstance | string,
    JIMPSocketParams
> {
    static EMPTY_IMAGE = 'empty_jimp_image';

    constructor() {
        super(JIMPImageSocketParamsBuilder.EMPTY_IMAGE);
    }

    params: JIMPSocketParams = new (class implements JIMPSocketParams {
        default_value: SocketData = JIMPImageSocketParamsBuilder.EMPTY_IMAGE;
        displayImage: boolean = true;
    })();

    hide() {
        this.params.displayImage = false;
        return this;
    }

    show() {
        this.params.displayImage = true;
        return this;
    }

    check(value: JimpInstance | string) {
        super.check(value);
        if (value == JIMPImageSocketParamsBuilder.EMPTY_IMAGE)
            throw new Error(`value is the empty image`);
    }

    build(): JIMPSocketParams {
        return {
            default_value: this.params.default_value,
            displayImage: this.params.displayImage,
        };
    }
}

export interface ENUMSocketParams extends InputSocketParams {
    options: string[];
}

export class ENUMSocketParamBuilder extends GenericSocketParamsBuilder<
    string,
    ENUMSocketParams
> {
    params = new (class implements ENUMSocketParams {
        default_value: SocketData = 'Option 1';
        options: string[] = ['Option 1', 'Option 2', 'Option 3'];
    })();

    constructor(options: string[]) {
        const optionsUnique = Array.from(new Set<string>(options));
        if (optionsUnique.length <= 1)
            throw new Error(`options must not be empty`);
        super(optionsUnique[0]);
        // this.setDefaultValue(); // set default value
        this.params.options = optionsUnique;
        this.params.default_value = optionsUnique[0];
    }

    getOptions() {
        return this.params.options;
    }

    check(value: string): void {
        super.check(value);
        const val = value as string;
        if (!this.params.options.includes(val))
            throw new Error(`value should be in enum options; illegal value`);
    }

    build(): ENUMSocketParams {
        return {
            default_value: this.params.default_value,
            options: this.params.options,
        };
    }
}

/**
 * CSVSocketConfig handles validation logic for CSV file inputs.
 * It supports both actual File objects and placeholder strings.
 */

export class CSVSocketParamsBuilder extends GenericSocketParamsBuilder<
    File | string,
    InputSocketParams
> {
    // Constant to represent a placeholder (empty) CSV value
    static EMPTY_FILE = 'empty_csv';

    constructor() {
        super(CSVSocketParamsBuilder.EMPTY_FILE);
    }

    /**
     * Validates the given value as a valid CSV input.
     *
     * @param {File | string} value - The value to check (File or placeholder).
     * @throws {Error} If the value is invalid.
     */
    check(value: File | string) {
        super.check(value);

        if (value === CSVSocketParamsBuilder.EMPTY_FILE) {
            throw new Error('Value is the empty CSV placeholder.');
        }

        if (typeof value !== 'string' && !(value instanceof File)) {
            throw new Error('Expected a File object or placeholder.');
        }

        if (value instanceof File) {
            if (!value.name.toLowerCase().endsWith('.csv')) {
                throw new Error(`Expected a .csv file, got "${value.name}"`);
            }

            if (value.size === 0) {
                throw new Error('CSV file is empty.');
            }
        }
    }
}

/**
 * TSVSocketConfig handles validation for TSV (Tab-Separated Values) files.
 * Supports real File objects and an "empty" placeholder.
 */
export class TSVSocketParamsBuilder extends GenericSocketParamsBuilder<
    File | string,
    InputSocketParams
> {
    static EMPTY_FILE = 'empty_tsv';

    constructor() {
        super(TSVSocketParamsBuilder.EMPTY_FILE);
    }

    /**
     * Validates the provided value for TSV-specific rules.
     *
     * @param {File | string} value - The input value to check.
     * @throws {Error} If value is not valid TSV input.
     */
    check(value: File | string) {
        super.check(value);

        if (value === TSVSocketParamsBuilder.EMPTY_FILE) {
            throw new Error('Value is the empty TSV placeholder.');
        }

        if (typeof value !== 'string' && !(value instanceof File)) {
            throw new Error('Expected a File object or placeholder.');
        }

        if (value instanceof File) {
            if (!value.name.toLowerCase().endsWith('.tsv')) {
                throw new Error(`Expected a .tsv file, got "${value.name}"`);
            }

            if (value.size === 0) {
                throw new Error('TSV file is empty.');
            }
        }
    }
}

/**
 * CropParamSocketConfig validates cropping parameter objects.
 * Expects an object with numeric x, y, width, and height values.
 */
interface CropParams {
    x: number;
    y: number;
    width: number;
    height: number;
}
export class CropParamSocketParamsBuilder extends GenericSocketParamsBuilder<
    CropParams,
    InputSocketParams
> {
    constructor() {
        super({ x: 0, y: 0, width: 100, height: 100 });
    }

    /**
     * Checks that all cropping parameters are present and numeric.
     *
     * @param {any} value - The crop parameter object to validate.
     * @throws {Error} If values are missing or not numbers.
     */
    check(value: CropParams) {
        super.check(value);
        if (value.height <= 0 || value.width <= 0) {
            throw new Error('Crop object must have positive width, height');
        }
    }
}
