import type {JimpInstance} from "jimp";
import {InputSocketParams, SocketData} from "../../shared/SocketModels";

/**
 * Builder for input socket parameters.
 */
export class InputSocketParamBuilder<T extends InputSocketParams> {
  // Keep as default_value to match interface
  // eslint-disable-next-line camelcase
  default_value: unknown;

  /**
   * Creates a new InputSocketParamBuilder.
   * @param {SocketData} defaultValue - The default value
   */
  constructor(defaultValue: SocketData) {
    this.default_value = defaultValue;
  }

  /**
   * Sets the default value.
   * @param {SocketData} defaultValue - The default value
   */
  setDefaultValue(defaultValue: SocketData) {
    this.default_value = defaultValue;
  }

  /**
   * Gets the default value.
   * @return {unknown} The default value
   */
  getDefaultValue() {
    return this.default_value;
  }

  /**
   * Checks if the value is valid.
   * @param {unknown} value - The value to check (unused in base class)
   */
  check(value: unknown): void {
    // No-op for base class - suppress unused var warning
    void value;
  }

  /**
   * Builds the socket parameters.
   * @return {T} The built parameters
   */
  build(): T {
    return {
      default_value: this.default_value,
    } as T;
  }
}

/**
 * Generic builder for socket parameters with type checking.
 */
export class GenericSocketParamsBuilder<
    T,
    C extends InputSocketParams,
> extends InputSocketParamBuilder<C> {
  /**
   * Checks if the value is valid.
   * @param {T} value - The value to check
   */
  check(value: T): void {
    if (value !== undefined && value !== null) {
      return;
    }
    throw new Error("value is undefined/null!");
  }
}

/**
 * Parameters for number sockets.
 */
export interface NumberSocketParams extends InputSocketParams {
    min: number | null;
    max: number | null;
    step: number | null;
}

/**
 * Builder for number socket parameters.
 */
export class NumberSocketParamsBuilder extends GenericSocketParamsBuilder<
    number,
    NumberSocketParams
> {
  params: NumberSocketParams = new (class implements NumberSocketParams {
    default_value = 0;
    max: number | null = null;
    min: number | null = null;
    step: number | null = null;
  })();

  /**
   * Creates a new NumberSocketParamsBuilder.
   * @param {number} defaultValue - The default value
   */
  constructor(defaultValue: number) {
    super(defaultValue);
    this.params.default_value = defaultValue;
  }

  /**
   * Sets the minimum value for the number input.
   * @param {number} min - The minimum value
   * @return {NumberSocketParamsBuilder} This builder instance
   */
  setMin(min: number) {
    this.params.min = min;
    return this;
  }

  /**
   * Removes the minimum value constraint.
   * @return {NumberSocketParamsBuilder} This builder instance
   */
  noMin() {
    this.params.min = null;
    return this;
  }

  /**
   * Sets the maximum value for the number input.
   * @param {number} max - The maximum value
   * @return {NumberSocketParamsBuilder} This builder instance
   */
  setMax(max: number) {
    this.params.max = max;
    return this;
  }

  /**
   * Removes the maximum value constraint.
   * @return {NumberSocketParamsBuilder} This builder instance
   */
  noMax() {
    this.params.max = null;
    return this;
  }

  /**
   * Sets the interval (step) for the number input.
   * @param {number} step - The step value
   * @return {NumberSocketParamsBuilder} This builder instance
   */
  setStep(step: number) {
    this.params.step = step;
    return this;
  }

  /**
   * Removes the step constraint.
   * @return {NumberSocketParamsBuilder} This builder instance
   */
  noStep() {
    this.params.step = null;
    return this;
  }

  /**
   * Checks if the value is valid.
   * @param {number} value - The value to check
   */
  check(value: number): void {
    super.check(value);
    const val = value as number;
    if (this.params.max && val > this.params.max) {
      throw new Error(
        `value should not be greater than max: ${this.params.max}`
      );
    }
    if (this.params.min && val < this.params.min) {
      throw new Error(
        `value should not be less than min: ${this.params.min}`
      );
    }

    if (this.params.step && val % this.params.step !== 0) {
      throw new Error(`value must be increment of ${this.params.step}`);
    }
  }

  /**
   * Builds the number socket parameters.
   * @return {NumberSocketParams} The built parameters
   */
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

/**
 * Builder for string socket parameters.
 */
export class StringSocketParamsBuilder extends GenericSocketParamsBuilder<
    string,
    StringSocketParams
> {
  params: StringSocketParams = new (class implements StringSocketParams {
    default_value = "";
    isSensitive = false;
    maxCharacters: number | null = null;
    minCharacters: number | null = null;
    numRows: number | null = null;
  })();

  /**
   * Creates a new StringSocketParamsBuilder.
   * @param {string} defaultValue - The default value
   */
  constructor(defaultValue: string) {
    super(defaultValue);
    this.params.default_value = defaultValue;
  }

  /**
   * Configures as a word input.
   * @return {StringSocketParamsBuilder} This builder instance
   */
  asWord() {
    this.setDefaultValue("");
    this.setMinCharacters(1);
    return this;
  }

  /**
   * Configures as a sentence input.
   * @return {StringSocketParamsBuilder} This builder instance
   */
  asSentence() {
    this.setDefaultValue("");
    this.setMinCharacters(20);
    return this;
  }

  /**
   * Configures as a paragraph input.
   * @return {StringSocketParamsBuilder} This builder instance
   */
  asParagraph() {
    this.setDefaultValue("");
    this.setMinCharacters(60);
    return this;
  }

  /**
   * Configures as a password input.
   * @return {StringSocketParamsBuilder} This builder instance
   */
  asPassword() {
    this.setDefaultValue("");
    this.params.isSensitive = true;
    this.setMinCharacters(8);
    return this;
  }

  /**
   * Sets the minimum number of characters.
   * @param {number} minCharacters - The minimum characters
   * @return {StringSocketParamsBuilder} This builder instance
   */
  setMinCharacters(minCharacters: number) {
    this.params.minCharacters = minCharacters;
    return this;
  }

  /**
   * Sets the maximum number of characters.
   * @param {number} maxCharacters - The maximum characters
   * @return {StringSocketParamsBuilder} This builder instance
   */
  setMaxCharacters(maxCharacters: number) {
    this.params.maxCharacters = maxCharacters;
    return this;
  }

  /**
   * Checks if the value is valid.
   * @param {string} value - The value to check
   */
  check(value: string): void {
    super.check(value);
    const val = value as string;

    if (this.params.minCharacters &&
        val.length < this.params.minCharacters) {
      throw new Error(
        `fewer characters than minCharacters: ${val.length} < ${
          this.params.minCharacters}`
      );
    }

    if (this.params.maxCharacters &&
        val.length < this.params.maxCharacters) {
      throw new Error(
        `more characters than maxCharacters: ${val.length} > ${
          this.params.maxCharacters}`
      );
    }
  }

  /**
   * Builds the string socket parameters.
   * @return {StringSocketParams} The built parameters
   */
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

/**
 * Builder for JIMP image socket parameters.
 */
export class JIMPImageSocketParamsBuilder extends GenericSocketParamsBuilder<
    JimpInstance | string,
    JIMPSocketParams
> {
  static EMPTY_IMAGE = "empty_jimp_image";

  /**
   * Creates a new JIMPImageSocketParamsBuilder.
   */
  constructor() {
    super(JIMPImageSocketParamsBuilder.EMPTY_IMAGE);
  }

  params: JIMPSocketParams = new (class implements JIMPSocketParams {
    default_value: SocketData = JIMPImageSocketParamsBuilder.EMPTY_IMAGE;
    displayImage = true;
  })();

  /**
   * Hides the image display.
   * @return {JIMPImageSocketParamsBuilder} This builder instance
   */
  hide() {
    this.params.displayImage = false;
    return this;
  }

  /**
   * Shows the image display.
   * @return {JIMPImageSocketParamsBuilder} This builder instance
   */
  show() {
    this.params.displayImage = true;
    return this;
  }

  /**
   * Checks if the value is valid.
   * @param {JimpInstance | string} value - The value to check
   */
  check(value: JimpInstance | string) {
    super.check(value);
    if (value == JIMPImageSocketParamsBuilder.EMPTY_IMAGE) {
      throw new Error("value is the empty image");
    }
  }

  /**
   * Builds the JIMP socket parameters.
   * @return {JIMPSocketParams} The built parameters
   */
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

/**
 * Builder for enum socket parameters.
 */
export class ENUMSocketParamBuilder extends GenericSocketParamsBuilder<
    string,
    ENUMSocketParams
> {
  params = new (class implements ENUMSocketParams {
    default_value: SocketData = "Option 1";
    options: string[] = ["Option 1", "Option 2", "Option 3"];
  })();

  /**
   * Creates a new ENUMSocketParamBuilder.
   * @param {string[]} options - The available options
   */
  constructor(options: string[]) {
    const optionsUnique = Array.from(new Set<string>(options));
    if (optionsUnique.length <= 1) {
      throw new Error("options must not be empty");
    }
    super(optionsUnique[0]);
    // this.setDefaultValue(); // set default value
    this.params.options = optionsUnique;
    this.params.default_value = optionsUnique[0];
  }

  /**
   * Gets the available options.
   * @return {string[]} The options
   */
  getOptions() {
    return this.params.options;
  }

  /**
   * Checks if the value is valid.
   * @param {string} value - The value to check
   */
  check(value: string): void {
    super.check(value);
    const val = value as string;
    if (!this.params.options.includes(val)) {
      throw new Error("value should be in enum options; illegal value");
    }
  }

  /**
   * Builds the enum socket parameters.
   * @return {ENUMSocketParams} The built parameters
   */
  build(): ENUMSocketParams {
    return {
      default_value: this.params.default_value,
      options: this.params.options,
    };
  }
}

/**
 * FileSocketParamsBuilder handles validation logic for generic file inputs
 * with BigData support. Files are stored locally using BigData references
 * instead of in RTDB. It uses null as the default value to indicate no file
 * is selected.
 */
export interface FileSocketParams extends InputSocketParams {
    acceptedFileTypes: string[];
}

/**
 * Builder for file socket parameters.
 */
export class FileSocketParamsBuilder extends GenericSocketParamsBuilder<
    File | string | null,
    FileSocketParams
> {
  static EMPTY_FILE = "empty_file";

  /**
   * Creates a new FileSocketParamsBuilder.
   * @param {string[]} acceptedTypes - The accepted file types
   */
  constructor(acceptedTypes?: string[]) {
    super(null);
    this.params.acceptedFileTypes = acceptedTypes || [];
  }

  params: FileSocketParams = new (class implements FileSocketParams {
    default_value = null;
    acceptedFileTypes: string[] = [];
  })();

  /**
   * Sets the accepted file types.
   * @param {string[]} types - The accepted types
   * @return {FileSocketParamsBuilder} This builder instance
   */
  setAcceptedTypes(types: string[]) {
    this.params.acceptedFileTypes = types;
    return this;
  }

  /**
   * Validates the given value as a valid File input.
   *
   * @param {File | string | null} value - The value to check (File, BigData
   * ref, or null).
   * @throws {Error} If the value is invalid.
   */
  check(value: File | string | null) {
    // Allow null values (no file selected)
    if (value === null || value === undefined) {
      return;
    }

    if (value === FileSocketParamsBuilder.EMPTY_FILE) {
      throw new Error("Value is the empty file placeholder");
    }

    if (typeof value !== "string" && !(value instanceof File)) {
      throw new Error(
        "Value must be a File object, BigData reference string, or null"
      );
    }

    if (value instanceof File && this.params.acceptedFileTypes.length > 0) {
      const fileExt = "." + value.name.split(".").pop()?.toLowerCase();
      if (!this.params.acceptedFileTypes.includes(fileExt)) {
        throw new Error(
          `File type ${fileExt} not accepted. Expected: ${
            this.params.acceptedFileTypes.join(", ")}`
        );
      }
    }
  }

  /**
   * Builds the file socket parameters.
   * @return {FileSocketParams} The built parameters
   */
  build(): FileSocketParams {
    return {
      default_value: this.params.default_value,
      acceptedFileTypes: this.params.acceptedFileTypes || [],
    };
  }
}

/**
 * CSVSocketConfig handles validation logic for CSV file inputs.
 * It supports both actual File objects and placeholder strings.
 */

/**
 * Builder for CSV socket parameters.
 */
export class CSVSocketParamsBuilder extends GenericSocketParamsBuilder<
    File | string,
    InputSocketParams
> {
  // Constant to represent a placeholder (empty) CSV value
  static EMPTY_FILE = "empty_csv";

  /**
   * Creates a new CSVSocketParamsBuilder.
   */
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
      throw new Error("Value is the empty CSV placeholder.");
    }

    if (typeof value !== "string" && !(value instanceof File)) {
      throw new Error("Expected a File object or placeholder.");
    }

    if (value instanceof File) {
      if (!value.name.toLowerCase().endsWith(".csv")) {
        throw new Error(`Expected a .csv file, got "${value.name}"`);
      }

      if (value.size === 0) {
        throw new Error("CSV file is empty.");
      }
    }
  }
}

/**
 * TSVSocketConfig handles validation for TSV (Tab-Separated Values) files.
 * Supports real File objects and an "empty" placeholder.
 */
/**
 * Builder for TSV socket parameters.
 */
export class TSVSocketParamsBuilder extends GenericSocketParamsBuilder<
    File | string,
    InputSocketParams
> {
  static EMPTY_FILE = "empty_tsv";

  /**
   * Creates a new TSVSocketParamsBuilder.
   */
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
      throw new Error("Value is the empty TSV placeholder.");
    }

    if (typeof value !== "string" && !(value instanceof File)) {
      throw new Error("Expected a File object or placeholder.");
    }

    if (value instanceof File) {
      if (!value.name.toLowerCase().endsWith(".tsv")) {
        throw new Error(`Expected a .tsv file, got "${value.name}"`);
      }

      if (value.size === 0) {
        throw new Error("TSV file is empty.");
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
/**
 * Builder for crop parameter socket parameters.
 */
export class CropParamSocketParamsBuilder extends GenericSocketParamsBuilder<
    CropParams,
    InputSocketParams
> {
  /**
   * Creates a new CropParamSocketParamsBuilder.
   */
  constructor() {
    super({x: 0, y: 0, width: 100, height: 100});
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
      throw new Error("Crop object must have positive width, height");
    }
  }
}
