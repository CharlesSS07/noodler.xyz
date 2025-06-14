import type { NodeBluePrintControllerFactoryInterface } from './NodeBluePrint.js';
import { FirestoreNodeBluePrintControllerFactoryInterface } from './FirestoreNodeBluePrint.js';
import {
    // ENUMSocketParamBuilder,
    JIMPImageSocketParamsBuilder,
    NumberSocketParamsBuilder,
    GenericSocketParamsBuilder,
    CropParamSocketParamsBuilder,
    StringSocketParamsBuilder,
    TSVSocketParamsBuilder,
    CSVSocketParamsBuilder,
} from './SocketParamBuilders.js';

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

async function specialtyDataInputDataNodes() {
    const rawTextEditor =
        await nodeBluePrintController.initOfficialNodeBluePrint('raw_text_editor');
    rawTextEditor.title = 'Raw Text Editor';
    rawTextEditor.documentation = 'Displays or intakes text data.';

    rawTextEditor.newInputSocket('inputText', {
        label: 'Text',
        documentation: '',
        type: 'string',
        params: new StringSocketParamsBuilder("").build(),
    });

    rawTextEditor.newOutputSocket('outputText', {
        label: 'Text',
        documentation: '',
        type: 'string',
    });

    rawTextEditor.code = `outputs.set("outputText", inputs.inputText);`;

    const completeTextHuggingfaceLLM =
        await nodeBluePrintController.initOfficialNodeBluePrint('huggingface_complete_text');
    completeTextHuggingfaceLLM.title = 'Raw Text Editor';
    completeTextHuggingfaceLLM.documentation = 'Displays or intakes text data.';

    completeTextHuggingfaceLLM.newInputSocket('text', {
        label: 'Text',
        documentation: 'Text to complete.',
        type: 'string',
        params: new StringSocketParamsBuilder("").build(),
    });

    completeTextHuggingfaceLLM.newInputSocket('modelId', {
        label: 'Model ID',
        documentation: 'Hugginface Model ID',
        type: 'string',
        params: new StringSocketParamsBuilder("").build(),
    });

    completeTextHuggingfaceLLM.newInputSocket('maxTokens', {
        label: 'Max Tokens',
        documentation: 'Largest number of tokens to allocate.',
        type: 'number',
        params: new NumberSocketParamsBuilder(1000).build(),
    });

    completeTextHuggingfaceLLM.newOutputSocket('completed_text', {
        label: 'Completed Text',
        documentation: 'The prediced next tokens.',
        type: 'string',
    });

    completeTextHuggingfaceLLM.code = `console.error("completeTextHuggingfaceLLM node not implemented")`;

    const mdTextEditor =
        await nodeBluePrintController.initOfficialNodeBluePrint('md_text_editor');
    mdTextEditor.title = 'Markdown Text Editor';
    mdTextEditor.documentation = 'Displays or intakes text data, rendered as markdown.';

    mdTextEditor.newInputSocket('text', {
        label: 'Text',
        documentation: '',
        type: 'string',
        params: new StringSocketParamsBuilder("").build(),
    });

    mdTextEditor.newOutputSocket('text', {
        label: 'Text',
        documentation: '',
        type: 'string',
    });

    mdTextEditor.code = `outputs.set("text", inputs.text);`;

    const textTemplateFillin =
        await nodeBluePrintController.initOfficialNodeBluePrint('template');
    textTemplateFillin.title = 'Template Text';
    textTemplateFillin.documentation = 'Replaces @x with the value of x, a string value. Filled in during computation.';

    textTemplateFillin.newInputSocket('text', {
        label: 'Text',
        documentation: '',
        type: 'unknown',
        params: new StringSocketParamsBuilder("").build(),
    });

    textTemplateFillin.newOutputSocket('text', {
        label: 'Filled in Template',
        documentation: '',
        type: 'string',
    });

    textTemplateFillin.code = `outputs.set("text", inputs.text);`;

    const imageLoader =
        await nodeBluePrintController.initOfficialNodeBluePrint('image_loader');
    imageLoader.title = 'Image Loader';
    imageLoader.documentation= 'Read in an image from a socket/file.';

    imageLoader.newInputSocket('imageOrFileOrString', {
        label: 'Upload Image',
        documentation: 'Image uploaded from file.',
        type: 'file',
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    imageLoader.newOutputSocket('image', {
        label: 'Image',
        documentation: 'The image you viewed.',
        type: 'image/jimp',
    });

    imageLoader.code = `
const imageOrFileOrString = inputs.imageOrFileOrString;

if (typeof imageOrFileOrString === 'string') {
    // assume this is a base64 string
    const buffer = Buffer.from(imageOrFileOrString, 'base64');
    outputs.set('image', await utils.Jimp.read(arrayBuffer));
} else if (imageOrFileOrString instanceof File) {
    const arrayBuffer = await imageOrFileOrString.arrayBuffer();
    outputs.set('image', await utils.Jimp.read(arrayBuffer));
} else {
    // assume this is a jimp already
    outputs.set('image', imageOrFileOrString);
}
`;

    const htmlRenderer =
        await nodeBluePrintController.initOfficialNodeBluePrint('html_renderer');
    htmlRenderer.title = 'HTML Renderer';
    htmlRenderer.documentation= 'Display arbitrary html in iframe.';

    htmlRenderer.newInputSocket('html', {
        label: 'HTML',
        documentation: 'HTML to display in iframe.',
        type: 'string',
        params: new StringSocketParamsBuilder("").build(),
    });

    htmlRenderer.code = `
console.log(inputs);
const file = inputs.image;
console.log("[image_loader] received file:", typeof file);

const arrayBuffer = await file.arrayBuffer();

// read image using Jimp
const img = await utils.Jimp.read(arrayBuffer);

outputs.set('image', img);
`;
}

async function simpleImageModificationNodes() {

    const imageViewer =
        await nodeBluePrintController.initOfficialNodeBluePrint('image_viewer');
    imageViewer.title = 'Image Viewer';
    imageViewer.documentation = 'Display an image from a socket.';

    imageViewer.newInputSocket('img', {
        label: 'Image',
        documentation: 'Image to view.',
        type: 'image/jimp',
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    imageViewer.newOutputSocket('img', {
        label: 'Image',
        documentation: 'The image you viewed.',
        type: 'image/jimp',
    });

    imageViewer.code = `
    outputs.set('img', inputs.img);
  `;

    // Use it to convert the base64 to jimp for supporting subsequent operations
    // const base64ToJimp = await nodeBluePrintController.initOfficialNodeBluePrint("base64_to_jimp");
    // await base64ToJimp.setTitle("Base64 to JIMP");
    // await base64ToJimp.setDocumentation("Convert a base64-encoded image string into a JIMP object for further image processing.");

    // await base64ToJimp.newInputSocket("img", {
    //   label: "Base64 Image",
    //   documentation: "Base64 encoded image string",
    //   type: "UploadImage",
    //   config: {
    //     defaultValue: null
    //   }
    // });

    // await base64ToJimp.newOutputSocket("img", {
    //   label: "JIMP Image",
    //   type: "JIMP",
    //   documentation: "Image as a JIMP object"
    // });

    // await base64ToJimp.setCode(`
    //   const Jimp = require('jimp');
    //   const input = inputs.get('img');

    //   if (typeof input === 'string' && input.startsWith('data:image')) {
    //     const base64 = input.split(',')[1];
    //     const img = await Jimp.read(Buffer.from(base64, 'base64'));
    //     outputs.set('img', img);
    //   } else {
    //     throw new Error("Input is not a valid base64 image.");
    //   }
    // ` );

    const grayscale =
        await nodeBluePrintController.initOfficialNodeBluePrint('greyscale');
    grayscale.title = 'Greyscale';
    grayscale.documentation = 'Greyscales an image.';

    await grayscale.newInputSocket('img', {
        label: 'Color Image',
        documentation: 'Color image to greyscale.',
        type: 'image/jimp',
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    await grayscale.newOutputSocket('img', {
        label: 'Greyscale Image',
        documentation: 'Greyscale version of input image.',
        type: 'image/jimp',
    });

    grayscale.code = `
const img = inputs.img.clone();
img.greyscale();
outputs.set('img', img);
`;

    const hsv = await nodeBluePrintController.initOfficialNodeBluePrint('hsv');
    hsv.title = 'HSV Shift Change';
    hsv.documentation = 'Shift hue, saturation, or value of the input image.';

    await hsv.newInputSocket('img', {
        label: 'Input Image',
        documentation: 'Any image.',
        type: 'image/jimp',
        params: new JIMPImageSocketParamsBuilder().build(),
    });
    await hsv.newInputSocket('hue', {
        label: 'Hue Shift',
        documentation: 'Amount to shift hue by.',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(360)
            .setStep(0.1)
            .build(),
    });
    await hsv.newInputSocket('saturation', {
        label: 'Saturation Shift',
        documentation: 'Amount to shift saturation by.',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(100)
            .setStep(0.1)
            .build(),
    });
    await hsv.newInputSocket('value', {
        label: 'Value Shift',
        documentation: 'Amount to shift brightness/darkness by.',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(100)
            .setStep(0.1)
            .build(),
    });

    await hsv.newOutputSocket('img', {
        label: 'Output Image',
        documentation: 'Shifted image.',
        type: 'image/jimp',
    });

    hsv.code = 
        'const img = inputs.img.clone();\n' +
            'const hue = inputs.hue;\n' +
            'const saturation = inputs.saturation;\n' +
            'const value = inputs.value;\n' +
            '// Adjust hue (in degrees, -360 to 360)\n' +
            'if (hue) img.color([{ apply: "hue", params: [hue.valueOf()] }]);\n' +
            '\n' +
            '// Adjust saturation (0 to 100)\n' +
            'if (saturation) img.color([{ apply: "saturate", params: [saturation.valueOf()] }]);\n' +
            '\n' +
            '// Adjust value (0 to 100)\n' +
            'if (value) img.color([{ apply: "brighten", params: [value.valueOf()] }]);\n' +
            '\n' +
            "outputs.set('img', img);\n";
}

async function fileLoadingNodes() {
    const loadExcel =
        await nodeBluePrintController.initOfficialNodeBluePrint('load_excel');
    loadExcel.title = 'Load Excel Spreadsheet';
    loadExcel.documentation = 'Display Excel Spreadsheet';

    await loadExcel.newInputSocket('xlsx_file', {
        label: '.xlsx',
        documentation: 'Excel File',
        type: 'file',
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    await loadExcel.newOutputSocket('json', {
        label: 'JSON dict',
        documentation: 'Json dictionary of spreadsheet',
        type: 'json',
    });

    loadExcel.code = "console.error('Not Implemented');";
}

async function dropboxNodes() {
    const saveDropbox =
        await nodeBluePrintController.initOfficialNodeBluePrint('save_dropbox');
    saveDropbox.title = 'Save to Dropbox';
    saveDropbox.documentation = 'Saves the image to Dropbox';

    await saveDropbox.newInputSocket('image_file', {
        label: 'Image',
        documentation: 'Image File',
        type: 'image/jimp',
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    saveDropbox.code = "console.error('Not Implemented');";

    const loadDropbox =
        await nodeBluePrintController.initOfficialNodeBluePrint('load_dropbox');
    loadDropbox.title = 'Load from Dropbox';
    loadDropbox.documentation = 'Loads the Image from Dropbox';

    await loadDropbox.newOutputSocket('image_file', {
        label: 'Image',
        documentation: 'Image File',
        type: 'image/jimp',
    });

    loadDropbox.code = "console.error('Not Implemented');";
}

async function timeRelatedNodes() {
    const dateTimeParser =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'datetime_parser'
        );
    dateTimeParser.title = 'Date & Time Constructor';
    dateTimeParser.documentation = 'Parses a datetime object.';

    await dateTimeParser.newInputSocket('date_time', {
        label: 'Date & Time',
        documentation: 'Datetime to parse.',
        type: 'string',
        params: new StringSocketParamsBuilder(
            'Wednesday, September 7, 1998 02:45 PM'
        ).build(),
    });
    await dateTimeParser.newInputSocket('locale', {
        label: 'Locale (Time Zone)',
        documentation: 'Time Zone (MST=Mountain Standard Time, etc.)',
        type: 'string',
        params: new StringSocketParamsBuilder('MST').build(),
    });
    await dateTimeParser.newInputSocket('lang', {
        label: 'Language',
        documentation: 'Language to use.',
        type: 'string',
        params: new StringSocketParamsBuilder('en-US').build(),
    });
    await dateTimeParser.newOutputSocket('hour_am_pm', {
        label: 'Hour (AM/PM)',
        documentation: 'Hour.',
        type: 'number',
        // config: { defaultValue: 0, min: 0, max: 12, step: 1 }
    });
    await dateTimeParser.newOutputSocket('hour_24', {
        label: 'Hour (24)',
        documentation: 'Hour.',
        type: 'number',
        // params: { defaultValue: 0, min: 0, max: 24, step: 1 }
    });
    await dateTimeParser.newOutputSocket('minute', {
        label: 'Minute',
        documentation: 'Minute.',
        type: 'number',
        // params: { defaultValue: 0, min: 0, max: 60, step: 1 }
    });
    await dateTimeParser.newOutputSocket('second', {
        label: 'Second',
        documentation: 'Second.',
        type: 'number',
        // params: { defaultValue: 0, min: 0, max: 60, step: 1 }
    });
    await dateTimeParser.newOutputSocket('day_of_week_name', {
        label: 'Day of Week (name)',
        documentation: 'Day of Week (named).',
        type: 'string',
        // params: { defaultValue: "May-day!" }
    });
    await dateTimeParser.newOutputSocket('day_of_month', {
        label: 'Day of Month',
        documentation: 'Day of Month.',
        type: 'number',
        // params: { defaultValue: 0, min: 0, max: 31, step: 1 }
    });
    await dateTimeParser.newOutputSocket('day_of_year', {
        label: 'Day of Year',
        documentation: 'Day of Year.',
        type: 'number',
        // params: { defaultValue: 0, min: 0, max: 365, step: 1 }
    });
    await dateTimeParser.newOutputSocket('month', {
        label: 'Month (0-12)',
        documentation: 'Month index.',
        type: 'number',
        // params: { defaultValue: 0, min: 0, max: 12, step: 1 }
    });
    await dateTimeParser.newOutputSocket('month_name', {
        label: 'Month (January-December)',
        documentation: 'Month by name.',
        type: 'string',
        // params: { defaultValue: 'Movember' }
    });
    await dateTimeParser.newOutputSocket('year', {
        label: 'Year (AD)',
        documentation: 'Year after death.',
        type: 'number',
        // params: { defaultValue: 0, min: 0, max: null, step: 1 }
    });
    await dateTimeParser.newOutputSocket('second_in_epoch', {
        label: 'Second in Epoch',
        documentation: 'Seconds since start of epoch (1970).',
        type: 'number',
        // params: { defaultValue: 0, min: 0, max: null, step: 1 }
    });

    dateTimeParser.code = `
const dateStr = inputs.date_time;
const lang = inputs.lang || 'en-US';
const locale = inputs.locale || 'en-US';

// Try to parse the date using Date constructor
let date = new Date();
if (date=='now') {
  date = new Date();
} else {
  date = new Date(dateStr);
}
if (isNaN(date)) throw new Error("Invalid date format");

const options = { timeZone: locale };
const formatter = new Intl.DateTimeFormat(lang, options);
const parts = formatter.formatToParts(date);
const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));

// Extract date components
const hour24 = date.getHours();
const hourAMPM = hour24 % 12 || 12;
const minute = date.getMinutes();
const second = date.getSeconds();
const dayOfWeek = date.toLocaleString(lang, { weekday: 'long', timeZone: locale });
const dayOfMonth = date.getDate();
const startOfYear = new Date(date.getFullYear(), 0, 0);
const dayOfYear = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
const monthIndex = date.getMonth() + 1; // January is 0
const monthName = date.toLocaleString(lang, { month: 'long', timeZone: locale });
const year = date.getFullYear();
const epochSeconds = Math.floor(date.getTime() / 1000);

// Set outputs
outputs.set('hour_am_pm', hourAMPM);
outputs.set('hour_24', hour24);
outputs.set('minute', minute);
outputs.set('second', second);
outputs.set('day_of_week_name', dayOfWeek);
outputs.set('day_of_month', dayOfMonth);
outputs.set('day_of_year', dayOfYear);
outputs.set('month', monthIndex);
outputs.set('month_name', monthName);
outputs.set('year', year);
outputs.set('second_in_epoch', epochSeconds);
`;

    const dateTimeConstructor =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'datetime_constructor'
        );
    dateTimeConstructor.title = 'Date & Time Parser';
    dateTimeConstructor.documentation = 'Parses a datetime object.';

    await dateTimeConstructor.newOutputSocket('date_time', {
        label: 'Date & Time',
        documentation: 'Datetime to parse.',
        type: 'string',
    });

    await dateTimeConstructor.newInputSocket('locale', {
        label: 'Locale',
        documentation: 'Time Zone/Time Zone',
        type: 'string',
        params: new StringSocketParamsBuilder('en/us').build(),
    });
    await dateTimeConstructor.newInputSocket('lang', {
        label: 'Language',
        documentation: 'Language to use.',
        type: 'string',
        params: new StringSocketParamsBuilder('en-US').build(),
    });
    await dateTimeConstructor.newInputSocket('hour_am_pm', {
        label: 'Hour (AM/PM)',
        documentation: 'Hour.',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(12)
            .setStep(1)
            .build(),
    });
    await dateTimeConstructor.newInputSocket('hour_24', {
        label: 'Hour (24)',
        documentation: 'Hour.',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(24)
            .setStep(1)
            .build(),
    });
    await dateTimeConstructor.newInputSocket('minute', {
        label: 'Minute',
        documentation: 'Minute.',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(60)
            .setStep(1)
            .build(),
    });
    await dateTimeConstructor.newInputSocket('second', {
        label: 'Second',
        documentation: 'Second.',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(60)
            .setStep(1)
            .build(),
    });
    await dateTimeConstructor.newInputSocket('day_of_week_name', {
        label: 'Day of Week (name)',
        documentation: 'Day of Week (named).',
        type: 'string',
        params: new StringSocketParamsBuilder('May-day').build(),
    });
    await dateTimeConstructor.newInputSocket('day_of_month_name', {
        label: 'Day of Month',
        documentation: 'Day of Month.',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(31)
            .setStep(1)
            .build(),
    });
    await dateTimeConstructor.newInputSocket('day_of_year', {
        label: 'Day of Year',
        documentation: 'Day of Year.',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(365)
            .setStep(1)
            .build(),
    });
    await dateTimeConstructor.newInputSocket('month', {
        label: 'Month (0-12)',
        documentation: 'Month index.',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(12)
            .setStep(1)
            .build(),
    });
    await dateTimeConstructor.newInputSocket('month_name', {
        label: 'Month (January-December)',
        documentation: 'Month by name.',
        type: 'string',
        params: new StringSocketParamsBuilder('Movember').build(),
    });
    await dateTimeConstructor.newInputSocket('year', {
        label: 'Year (AD)',
        documentation: 'Year after death.',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .noMax()
            .setStep(1)
            .build(),
    });
    await dateTimeConstructor.newInputSocket('second_in_epoch', {
        label: 'Second in Epoch',
        documentation: 'Seconds since start of epoch (1970).',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .noMax()
            .setStep(1)
            .build(),
    });

    dateTimeConstructor.code = `
const lang = inputs.lang || 'en-US';
const locale = inputs.locale || 'en-US';

const year = inputs.year ?? 2000;
const month = (inputs.month ?? 1) - 1; // JavaScript months are 0-based
const day = inputs.day_of_month_name ?? 1;
const hour = inputs.hour_24 ?? ((inputs.hour_am_pm % 12) + (inputs.hour_am_pm >= 12 ? 12 : 0)) || 0;
const minute = inputs.minute ?? 0;
const second = inputs.second ?? 0;

// Construct Date object
const date = new Date(Date.UTC(year, month, day, hour, minute, second));

// Format as readable string with locale
const dateStr = date.toLocaleString(lang, { timeZone: locale, hour12: false });

outputs.set('date_time', dateStr);
`;
}

async function worldStateDataNodes() {
    const weather =
        await nodeBluePrintController.initOfficialNodeBluePrint('weather');
    weather.title = 'Weather at GPS Coordinate (Approximate)';
    weather.documentation = 'Returns the weather at a given GPS Coordinate';

    await weather.newInputSocket('lat', {
        label: 'GPS Latitude',
        documentation: 'Latitude',
        type: 'number',
        params: new NumberSocketParamsBuilder(40.758701)
            .setMin(-90)
            .setMax(90)
            .setStep(0.000001)
            .build(), // millcreek
    });
    await weather.newInputSocket('long', {
        label: 'GPS Longitude',
        documentation: 'Longitude',
        type: 'number',
        params: new NumberSocketParamsBuilder(-111.876183)
            .setMin(-180)
            .setMax(180)
            .setStep(0.000001)
            .build(), // millcreek
    });

    await weather.newOutputSocket('precipitation', {
        label: 'Precipitation',
        documentation: 'How much it rains',
        type: 'number',
    });

    await weather.newOutputSocket('predipication_variance', {
        label: 'Precipitation Uncertainty',
        documentation: 'How much it rains when this says it will rain.',
        type: 'number',
    });

    await weather.newOutputSocket('temp_f', {
        label: 'Temperature (F)',
        documentation: 'In farenheight',
        type: 'number',
    });

    await weather.newOutputSocket('temp_c', {
        label: 'Temperature (C)',
        documentation: 'In celcius',
        type: 'number',
    });

    await weather.newOutputSocket('wind_speed_mph', {
        label: 'Wind Speed (mph)',
        documentation: 'Wind speed in miles per hour',
        type: 'number',
    });

    await weather.newOutputSocket('wind_speed_kmph', {
        label: 'Wind Speed (km/h)',
        documentation: 'Wind speed in kilometers per hour',
        type: 'number',
    });

    await weather.newOutputSocket('anomolous_rating', {
        label: 'Anomolous rating',
        documentation:
            'How anomalous is the weather in this location on this day given known history? ' +
            'Is today significatnly different?',
        type: 'number',
    });

    weather.code = `
  throw new Error("Weather Node is a Work In Progress. Please Check Back Later or Implement your Own.");
`;
}

async function huggingfaceNodes() {
    /**
     * TODO: chat op, diffusion op, text2img op, ...
     */

    const llm =
        await nodeBluePrintController.initOfficialNodeBluePrint('promptdesign');
    llm.title = 'Large Language Model (Huggingface)';
    llm.documentation = 'Return output of LLM.';

    await llm.newInputSocket('hf_token', {
        label: 'Huggingface Login',
        documentation: 'Huggingface Account to Charge',
        type: 'HuggingfaceLogin',
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await llm.newInputSocket('model_id', {
        label: 'Model ID',
        documentation: 'Initial prompt (used to instruct model on task).',
        type: 'string',
        params: new StringSocketParamsBuilder(
            'HuggingFaceH4/zephyr-7b-alpha'
        ).build(),
    });

    await llm.newInputSocket('prompt', {
        label: 'Prompt',
        documentation:
            'Initial prompt (used to instruct model on task). This is the text to complete.',
        type: 'string',
        params: new StringSocketParamsBuilder(
            'The quick brown fox jumped over the la'
        ).build(),
    });
    await llm.newInputSocket('temp', {
        label: 'Temperature',
        documentation: 'Creativity level of the mode.',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(1)
            .setStep(0.01)
            .build(),
    });
    // missing many

    await llm.newOutputSocket('output_text', {
        label: 'Completed Text',
        documentation: 'LLM output with prompt',
        type: 'number',
    });

    await llm.newOutputSocket('output_text_no_prompt', {
        label: 'Completed Text without Prompt',
        documentation: 'LLM output without prompt',
        type: 'number',
    });

    llm.code = `
const hf_token = inputs.hf_token;
const inference = await utils.APIConnectionManager.getConnector("huggingface-inference").getAPI();
const output = await inference.textGeneration({
  model: inputs.model_id,
  inputs: inputs.prompt,
});

outputs.set('output_text', output.generated_text);
outputs.set('output_text_no_prompt', output.generated_text);
`;

    // 	await promptdesign.setUnitTest(`
    // const inputs = new Map();
    // const outputs = new Map();
    //
    // inputs.set(
    //   'hf_token',
    //   'hf_oauth_eyJhbGciOiJFZERTQSJ9.eyJzY29wZSI6WyJvcGVuaWQiLCJlbWFpbCIsInByb2ZpbGUiLCJpbmZlcmVuY2UtYXBpIl0sImF1ZCI6Imh0dHBzOi8vaHVnZ2luZ2ZhY2UuY28iLCJvYXV0aEFwcCI6IjIxNjRkZjlkLWJjM2YtNDk1Zi1iZGQ3LWNjOTc3ZTVkMDZjNSIsInNlc3Npb25JZCI6IjY3YzhlYmVmODYwZWFmYjYyODBmNTdkOCIsImlhdCI6MTc0Mzg5MTY3Miwic3ViIjoiNjc3ZGIzYzNkNzFiNWYxMDhkZDU4MjIyIiwiZXhwIjoxNzQ2NDgzNjcyLCJpc3MiOiJodHRwczovL2h1Z2dpbmdmYWNlLmNvIn0.S3moSoEFjH4jTnvgNgxGaRsScZT9C68VTt2cpBIJhsJs01VAhcCb2HrZKTYIIp3FzhHptWTtg-Fa9AfT69XaAQ'
    // );
    // inputs.set('model_id', 'HuggingFaceH4/zephyr-7b-alpha');
    // inputs.set('temp', 0.5);
    // inputs.set('prompt', 'The quick brown fox jumped over the la');
    //
    // call(inputs, outputs);
    //
    // console.log(outputs);
    // `
    // 	);

    const text_to_image =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'text_to_image'
        );
    text_to_image.title = 'Text to Image (Huggingface)';
    text_to_image.documentation = 'Generates Image Given Text';

    await text_to_image.newInputSocket('hf_token', {
        label: 'Huggingface Login',
        documentation: 'Huggingface Account to Charge',
        type: 'HuggingfaceLogin',
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await text_to_image.newInputSocket('model_id', {
        label: 'Model ID',
        documentation:
            'Model to generate from (serch text-to-image models category on huggingface.com).',
        type: 'string',
        params: new StringSocketParamsBuilder(
            'black-forest-labs/FLUX.1-dev'
        ).build(),
    });

    await text_to_image.newInputSocket('prompt', {
        label: 'Text Prompt',
        documentation:
            'Initial prompt (used to instruct model on task). This is the text to complete.',
        type: 'string',
        params: new StringSocketParamsBuilder(
            'shrek riding a motor cycle over an exploding galaxy, being chased by a dragon (the wedjat eye is the eye of horus from egyptian mythology) make the galaxy look like the wedjat eye. there should be no ground, just space with the exploding galaxy in the background'
        ).build(),
    });
    await text_to_image.newInputSocket('temp', {
        label: 'Temperature',
        documentation: 'Creativity level of the model.',
        type: 'number',
        params: new NumberSocketParamsBuilder(0)
            .setMin(0)
            .setMax(1)
            .setStep(0.01)
            .build(),
    });
    // missing many

    await text_to_image.newOutputSocket('image', {
        label: 'Generated Image',
        documentation: 'Image generated from the input specifications.',
        type: 'image/jimp',
    });

    text_to_image.code = `
// inputs, outputs, utils
const hf_token = inputs.hf_token;
const inference = await utils.APIConnectionManager.getConnector("huggingface-inference").getAPI();
const blob = await inference.textToImage({
    inputs: inputs.prompt,
    model: inputs.model_id,
});

const buffer = await new Response(blob).arrayBuffer();
const image = await utils.Jimp.read(buffer);

outputs.set('image', image);
`;
}

async function aiDemoNodes() {
    const colorize =
        await nodeBluePrintController.initOfficialNodeBluePrint('colorize');
    colorize.title = 'Colorize';
    colorize.documentation = 'Colorize a grayscale image.';

    await colorize.newInputSocket('img', {
        label: 'Greyscale Image',
        documentation: 'Greyscale image to colorize.',
        type: 'image/jimp',
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    await colorize.newOutputSocket('img', {
        label: 'Color Image',
        documentation: 'Color version of input image.',
        type: 'image/jimp',
    });

    colorize.code = `
  throw new Error("Colorizer Node is a Work In Progress. Please Check Back Later or Implement your Own.");
`;

    const superResolution =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'super_resolution'
        );
    superResolution.title = 'Super Resolution / "Enhance"';
    superResolution.documentation = 'Increase the resolution image.';

    await superResolution.newInputSocket('img', {
        label: 'Low-res Image',
        documentation: 'Image to enhance.',
        type: 'image/jimp',
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    await superResolution.newOutputSocket('super_res_img', {
        label: 'High-res Image',
        documentation: 'Enhanced image.',
        type: 'image/jimp',
    });

    superResolution.code = `
throw new Error("Super resolution Node is a Work In Progress. Please Check Back Later or Implement your Own.");
const upscaler = await pipeline('image-to-image', 'Xenova/swin2SR-classical-sr-x2-64');
const url = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/butterfly.jpg';
const output = await upscaler(url);
// RawImage {
//   data: Uint8Array(786432) [ 41, 31, 24,  43, ... ],
//   width: 512,
//   height: 512,
//   channels: 3
// }
`;

    const objectBackgroundSeperation =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'object_background_seperation'
        );
    objectBackgroundSeperation.title = 'Separate Background & Foreground Object';
    objectBackgroundSeperation.documentation = 'Separate a foreground object and infill the background, storing them in seperate images.';

    await objectBackgroundSeperation.newInputSocket('img', {
        label: 'Image',
        documentation: 'Image to enhance.',
        type: 'image/jimp',
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    await objectBackgroundSeperation.newOutputSocket('foreground_img', {
        label: 'Foreground Image',
        documentation: 'Alpha-ed out background.',
        type: 'image/jimp',
    });

    await objectBackgroundSeperation.newOutputSocket('background_img', {
        label: 'Background Infilled Image',
        documentation: 'Infilled image with no foreground.',
        type: 'image/jimp',
    });

    await objectBackgroundSeperation.newOutputSocket('mask', {
        label: 'Mask',
        documentation: 'Black for background, white for foreground.',
        type: 'image/jimp',
    });

    objectBackgroundSeperation.code = `
inputs.img.greyscale();
outputs.set('img', inputs.img);
`;
}

async function promptDesignNodes() {
    const joinText =
        await nodeBluePrintController.initOfficialNodeBluePrint('join_text');
    joinText.title = 'Join Text (4)';
    joinText.documentation = "Join text. 'A'+'B'='AB'";

    await joinText.newInputSocket('text1', {
        label: 'Text',
        documentation: 'String of text.',
        type: 'string',
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });
    await joinText.newInputSocket('text2', {
        label: 'Text',
        documentation: 'String of text.',
        type: 'string',
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });
    await joinText.newInputSocket('text3', {
        label: 'Text',
        documentation: 'String of text.',
        type: 'string',
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });
    await joinText.newInputSocket('text4', {
        label: 'Text',
        documentation: 'String of text.',
        type: 'string',
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await joinText.newOutputSocket('text', {
        label: 'Joined Text',
        documentation: 'Text. Joined.',
        type: 'string',
    });

    joinText.code = "outputs.set('text', inputs.text1+inputs.text2+inputs.text3+inputs.text4);";

    const splitText =
        await nodeBluePrintController.initOfficialNodeBluePrint('split_text');
    splitText.title = 'Split Text';
    splitText.documentation = 'Splits text by seperator (sep).';

    await splitText.newInputSocket('text', {
        label: 'Text',
        documentation: 'String of text.',
        type: 'string',
        params: new StringSocketParamsBuilder('').build(),
    });
    await splitText.newInputSocket('sep', {
        label: 'Seperator',
        documentation: 'String of text.',
        type: 'string',
        params: new StringSocketParamsBuilder(',').build(),
    });

    await splitText.newOutputSocket('splitText', {
        label: 'Split Text',
        documentation: 'Text. Split.',
        type: 'unknown[]',
    });

    splitText.code = "outputs.set('splitText', inputs.text.split(inputs.sep));";

}

async function googleDriveNodes() {
    const googleDrive = await nodeBluePrintController.initOfficialNodeBluePrint(
        'get_file_from_google_drive'
    );
    googleDrive.title = 'Google Drive';
    googleDrive.documentation = 'Retrieves a file from a google drive. Requires access to the google drive.';

    await googleDrive.newInputSocket('account', {
        label: 'Google Account',
        documentation: 'Google account to get the file from.',
        type: 'string',
        params: new StringSocketParamsBuilder('').asPassword().build(),
    });

    await googleDrive.newInputSocket('file_selector', {
        label: 'File Selector',
        documentation: 'File to retrieve.',
        type: 'string',
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await googleDrive.newOutputSocket('file', {
        label: 'File',
        documentation: 'The retrieved file.',
        type: 'string',
    });

    googleDrive.code = `
inputs.img.greyscale();
outputs.set('img', inputs.img);
`;

    const sendEmail =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'send_email_google'
        );
    sendEmail.title = 'Send Email';
    sendEmail.documentation = 'Retrieves a file from a google drive. Requires access to the google drive.';

    await sendEmail.newInputSocket('account', {
        label: 'From Google Account',
        documentation: 'Google account to get the file from.',
        type: 'string',
        params: new StringSocketParamsBuilder('').asPassword().build(),
    });

    await sendEmail.newInputSocket('to', {
        label: 'To',
        documentation: 'Google account to get the file from.',
        type: 'string',
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await sendEmail.newInputSocket('cc', {
        label: 'CC',
        documentation: 'Google account to get the file from.',
        type: 'string',
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await sendEmail.newInputSocket('bcc', {
        label: 'BCC',
        documentation: 'Google account to get the file from.',
        type: 'string',
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await sendEmail.newInputSocket('subject', {
        label: 'Subject',
        documentation: 'Google account to get the file from.',
        type: 'string',
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await sendEmail.newInputSocket('body', {
        label: 'Email Body',
        documentation: 'File to retrieve.',
        type: 'string',
        params: new StringSocketParamsBuilder('').asParagraph().build(),
    });

    sendEmail.code = `
inputs.img.greyscale();
outputs.set('img', inputs.img);
`;
}

async function jimpNodes() {
    const newBlankImage =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'jimp_new_blank_image'
        );
    newBlankImage.title = 'New Image';
    newBlankImage.documentation = 'Generates a new image from parameters.';

    await newBlankImage.newInputSocket('color', {
        label: 'Color',
        documentation: 'Color of solid image background.',
        type: 'Color',
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await newBlankImage.newInputSocket('height', {
        label: 'Height',
        documentation: 'Height of the image.',
        type: 'number',
        params: new NumberSocketParamsBuilder(1024).setMin(0).build(),
    });

    await newBlankImage.newInputSocket('width', {
        label: 'Width',
        documentation: 'Width of the image.',
        type: 'number',
        params: new NumberSocketParamsBuilder(1024).setMin(0).build(),
    });

    await newBlankImage.newOutputSocket('image', {
        label: 'Image (JIMP)',
        documentation: 'The new images.',
        type: 'image/jimp',
    });

    newBlankImage.code = "outputs.set('image', new Jimp({ width: inputs.width, height: inputs.height, color: inputs.color }));";

    const resize =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'jimp_resize_image'
        );
    resize.title = 'Resize Image';
    resize.documentation = 'Resizes a Jimp Image';

    await resize.newInputSocket('image', {
        label: 'Image (JIMP)',
        documentation: 'The high-res images.',
        type: 'image/jimp',
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    await resize.newInputSocket('width', {
        label: 'Width',
        documentation: 'Width of the image.',
        type: 'number',
        params: new NumberSocketParamsBuilder(1024)
            .setMin(0)
            .setStep(1)
            .build(),
    });

    await resize.newInputSocket('height', {
        label: 'Height',
        documentation: 'Height of the image.',
        type: 'number',
        params: new NumberSocketParamsBuilder(1024)
            .setMin(0)
            .setStep(1)
            .build(),
    });

    await resize.newOutputSocket('image', {
        label: 'Image (JIMP)',
        documentation: 'The resized images.',
        type: 'image/jimp',
    });

    resize.code = 
        'const img2 = inputs.image.clone();' +
            'img2.resize({\n' +
            '  w: Math.floor(inputs.width,\n' +
            '  h: Math.floor(inputs.height\n' +
            '});\n' +
            "outputs.set('image', img2);";
}

async function jsonNodes() {
    const jsonEditorAndViewer =
        await nodeBluePrintController.initOfficialNodeBluePrint('json_editor');
    jsonEditorAndViewer.title = 'JSON';
    jsonEditorAndViewer.documentation = 'Create, or view a single instance of a JSON object.';

    await jsonEditorAndViewer.newInputSocket('jsonObject', {
        label: 'JSON',
        documentation: 'JSON text to parse.',
        type: 'unknown',
        params: new GenericSocketParamsBuilder('{}').build(),
    });

    await jsonEditorAndViewer.newOutputSocket('jsonObject', {
        label: 'Object',
        documentation: 'The parsed JSON object.',
        type: 'unknown',
    });

    jsonEditorAndViewer.code = `
    const jsonObject = JSON.parse(inputs.jsonObject);
    outputs.set('jsonObject', jsonObject);
    console.log('jsonObject', jsonObject, typeof jsonObject);
    `;

    const jsonToString =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'json_to_string'
        );
    jsonToString.title = 'JSON to Text';
    jsonToString.documentation = 'Stringify a JSON object.';

    await jsonToString.newInputSocket('jsonObject', {
        label: 'Object',
        documentation: 'Object to stringify into JSON.',
        type: 'unknown',
        params: new GenericSocketParamsBuilder('{}').build(),
    });

    await jsonToString.newOutputSocket('jsonString', {
        label: 'Text',
        documentation: 'The string JSON.',
        type: 'string',
    });

    jsonToString.code = "outputs.set('jsonString', JSON.stringify(inputs.jsonObject));";
}

async function htmlNodes() {
    const htmlViewer =
        await nodeBluePrintController.initOfficialNodeBluePrint('html_viewer');
    htmlViewer.title = 'Render HTML';
    htmlViewer.documentation = 'Display HTML from text.';

    await htmlViewer.newInputSocket('html', {
        label: 'HTML',
        documentation: 'HTML string',
        type: 'HTML',
        params: new StringSocketParamsBuilder('').asParagraph().build(),
    });

    htmlViewer.code = "console.log('Rendered HTML');";

    const htmlElement =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'html_elementify'
        );
    htmlElement.title = 'HTML Elementify';
    htmlElement.documentation = 'Wrap text in html element tags and unpack args into html tags.';

    await htmlElement.newInputSocket('tag', {
        label: 'Tag',
        documentation: 'Object to stringify into JSON.',
        // type: "ENUM",
        // params: new ENUMSocketConfig(Array.from(new Set(Array.from(document.querySelectorAll("*"), el => el.tagName.toLowerCase()))))
        type: 'string',
        params: new StringSocketParamsBuilder('').asSentence().build(),
    });

    await htmlElement.newInputSocket('innerHTML', {
        label: 'Inner HTML',
        documentation: 'Inner html of this element.',
        type: 'string',
        params: new StringSocketParamsBuilder('').asParagraph().build(),
    });

    await htmlElement.newInputSocket('attributes', {
        label: 'Attributes',
        documentation: 'Object to specify attributes.',
        type: 'unknown',
        params: new GenericSocketParamsBuilder('{}').build(),
    });

    await htmlElement.newOutputSocket('html', {
        label: 'HTML',
        documentation: 'The html.',
        type: 'string',
    });

    htmlElement.code = 
        // TODO: implement attributes, hope and pray this parses valid html
        `
let d = '<'+inputs.tag;
if (inputs.attributes) {
  const attributes =  inputs.attributes;//JSON.parse(inputs.attributes);
  // console.log(attributes);
  Object.entries(attributes).forEach(([key, value]) => {
    console.log(key, value);
    if (key && value) {
      d += ' ';
      d += key;
      d += '=';
      d += value;
    }
  });
}
d += '>'+inputs.innerHTML+'</'+inputs.tag+'>'
outputs.set('html', d);
`;

    const fetchURL =
        await nodeBluePrintController.initOfficialNodeBluePrint('fetch_url');
    fetchURL.title = 'Fetch URL';
    fetchURL.documentation = 'Fetches content from a given URL and returns it as plain text.';

    await fetchURL.newInputSocket('url', {
        label: 'URL',
        documentation: 'The URL to fetch data from.',
        type: 'string',
        params: new StringSocketParamsBuilder('').asWord().build(),
    });

    await fetchURL.newOutputSocket('text', {
        label: 'Fetched Content',
        documentation: 'The plain text fetched from the URL.',
        type: 'string',
    });

    fetchURL.code = `
  outputs.set('text', inputs.url);
`;
}

async function fileNodes() {
    const loadCSV =
        await nodeBluePrintController.initOfficialNodeBluePrint('load_csv');

    loadCSV.title = 'CSV Loader';
    loadCSV.documentation = 'Reads a CSV file and returns its raw content as plain text.';

    await loadCSV.newInputSocket('file', {
        label: 'CSV File',
        documentation: 'Upload a .csv file.',
        type: 'CSV',
        params: new CSVSocketParamsBuilder().build(),
    });

    await loadCSV.newOutputSocket('text', {
        label: 'CSV Content',
        documentation: 'Raw text content from the CSV file.',
        type: 'string',
    });

    loadCSV.code = `
    outputs.set('text', inputs.file.text);
  `;

    const loadTSV =
        await nodeBluePrintController.initOfficialNodeBluePrint('load_tsv');

    loadTSV.title = 'TSV Loader';
    loadTSV.documentation = 'Reads a TSV (Tab-Separated Values) file and returns its raw content as plain text.';

    await loadTSV.newInputSocket('file', {
        label: 'TSV File',
        documentation: 'Upload a .tsv file.',
        type: 'TSV',
        params: new TSVSocketParamsBuilder().build(),
    });

    await loadTSV.newOutputSocket('text', {
        label: 'TSV Content',
        documentation: 'Raw text content from the TSV file.',
        type: 'string',
    });

    loadTSV.code = `
    outputs.set('text', inputs.file.text);
  `;
}

async function rank3Nodes() {
    const imageCropper =
        await nodeBluePrintController.initOfficialNodeBluePrint(
            'image_cropper'
        );

    imageCropper.title = 'Image Cropper';
    imageCropper.documentation = 'Crop a region from an uploaded image.';

    await imageCropper.newInputSocket('img', {
        label: 'Image',
        documentation: 'Image uploaded from file.',
        type: 'Crop',
        params: new JIMPImageSocketParamsBuilder().build(),
    });

    await imageCropper.newInputSocket('crop', {
        label: 'Crop Area',
        type: 'unknown',
        documentation: 'Object with {x, y, width, height}',
        params: new CropParamSocketParamsBuilder().build(),
    });

    await imageCropper.newOutputSocket('img', {
        label: 'Cropped Image',
        documentation: 'Image after cropping.',
        type: 'image/jimp',
    });

    imageCropper.code = `
  const { x, y, width, height } = inputs.crop;

  console.log("[image_cropper] Received crop params:", inputs.crop);

  const image = inputs.img;

  console.log("[image_cropper] Original image size:", image.bitmap.width, "x", image.bitmap.height);

  const cropped = image.clone().crop(x, y, width, height);

  console.log("[image_cropper] Cropping successful. Output size:", cropped.bitmap.width, "x", cropped.bitmap.height);

  const base64 = await cropped.getBase64Async(utils.Jimp.MIME_PNG);
  console.log("[image_cropper] Cropped preview (base64):", base64.substring(0, 100) + "...");

  outputs.set("img", cropped);
`;
}

async function basicMathNodes() {
    // Add node
    const addNode = await nodeBluePrintController.initOfficialNodeBluePrint('add');
    addNode.title = 'Add Numbers';
    addNode.documentation = 'Adds two numbers together';
    
    await addNode.newInputSocket('a', {
        label: 'Number A',
        documentation: 'First number to add',
        type: 'number',
        params: new NumberSocketParamsBuilder(0).build(),
    });
    
    await addNode.newInputSocket('b', {
        label: 'Number B', 
        documentation: 'Second number to add',
        type: 'number',
        params: new NumberSocketParamsBuilder(0).build(),
    });
    
    await addNode.newOutputSocket('result', {
        label: 'Sum',
        documentation: 'The sum of A + B',
        type: 'number',
    });
    
    addNode.code = `
        const a = inputs.a || 0;
        const b = inputs.b || 0;
        const result = a + b;
        outputs.set('result', result);
    `;

    // Subtract node
    const subtractNode = await nodeBluePrintController.initOfficialNodeBluePrint('subtract');
    subtractNode.title = 'Subtract Numbers';
    subtractNode.documentation = 'Subtracts second number from first number';
    
    await subtractNode.newInputSocket('a', {
        label: 'Number A',
        documentation: 'Number to subtract from',
        type: 'number',
        params: new NumberSocketParamsBuilder(0).build(),
    });
    
    await subtractNode.newInputSocket('b', {
        label: 'Number B',
        documentation: 'Number to subtract',
        type: 'number', 
        params: new NumberSocketParamsBuilder(0).build(),
    });
    
    await subtractNode.newOutputSocket('result', {
        label: 'Difference',
        documentation: 'The result of A - B',
        type: 'number',
    });
    
    subtractNode.code = `
        const a = inputs.a || 0;
        const b = inputs.b || 0;
        const result = a - b;
        outputs.set('result', result);
    `;

    // Multiply node
    const multiplyNode = await nodeBluePrintController.initOfficialNodeBluePrint('multiply');
    multiplyNode.title = 'Multiply Numbers';
    multiplyNode.documentation = 'Multiplies two numbers together';
    
    await multiplyNode.newInputSocket('a', {
        label: 'Number A',
        documentation: 'First number to multiply',
        type: 'number',
        params: new NumberSocketParamsBuilder(1).build(),
    });
    
    await multiplyNode.newInputSocket('b', {
        label: 'Number B',
        documentation: 'Second number to multiply', 
        type: 'number',
        params: new NumberSocketParamsBuilder(1).build(),
    });
    
    await multiplyNode.newOutputSocket('result', {
        label: 'Product',
        documentation: 'The product of A * B',
        type: 'number',
    });
    
    multiplyNode.code = `
        const a = inputs.a || 1;
        const b = inputs.b || 1;
        const result = a * b;
        outputs.set('result', result);
    `;

    // Divide node  
    const divideNode = await nodeBluePrintController.initOfficialNodeBluePrint('divide');
    divideNode.title = 'Divide Numbers';
    divideNode.documentation = 'Divides first number by second number';
    
    await divideNode.newInputSocket('a', {
        label: 'Dividend',
        documentation: 'Number to be divided',
        type: 'number',
        params: new NumberSocketParamsBuilder(1).build(),
    });
    
    await divideNode.newInputSocket('b', {
        label: 'Divisor',
        documentation: 'Number to divide by',
        type: 'number',
        params: new NumberSocketParamsBuilder(1).build(),
    });
    
    await divideNode.newOutputSocket('result', {
        label: 'Quotient',
        documentation: 'The result of A / B',
        type: 'number',
    });
    
    divideNode.code = `
        const a = inputs.a || 1;
        const b = inputs.b || 1;
        if (b === 0) {
            throw new Error('Division by zero is not allowed');
        }
        const result = a / b;
        outputs.set('result', result);
    `;
}

export async function generateStandardNodeSuite() {
    const opBuilders = [
        specialtyDataInputDataNodes(),
        simpleImageModificationNodes(),
        // timeRelatedNodes(),
        // worldStateDataNodes(),
        // huggingfaceNodes(),
        // aiDemoNodes(),
        promptDesignNodes(),
        googleDriveNodes(),
        fileLoadingNodes(),
        // dropboxNodes(),
        jimpNodes(),
        jsonNodes(),
        htmlNodes(),
        basicMathNodes(),
        // fileNodes(),
        // rank3Nodes()
        // buildAllChatGPTNodes()
    ];
    await Promise.all(opBuilders);

    console.log('All STD lib nodes added.');
}
