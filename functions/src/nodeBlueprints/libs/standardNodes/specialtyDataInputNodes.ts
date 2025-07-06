import type {
  NodeBluePrintControllerFactoryInterface} from "../NodeBluePrint.js";
import {
  FirestoreNodeBluePrintControllerFactoryInterface,
} from "../FirestoreNodeBluePrint.js";
import {
  JIMPImageSocketParamsBuilder,
  StringSocketParamsBuilder} from "../SocketParamBuilders.js";
import {STANDARD_DATATYPES} from "$shared/SocketDataTypes";

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

/**
 * Creates and configures specialtyDataInputDataNodes nodes.
 * @return {Promise<void>} Promise that resolves when nodes are created
 */
export async function specialtyDataInputDataNodes() {
  const rawTextEditor =
        await nodeBluePrintController.initOfficialNodeBluePrint(
          "raw_text_editor"
        );
  rawTextEditor.title = "Raw Text Editor";
  rawTextEditor.documentation = "Displays or intakes text data.";
  rawTextEditor.tags = [
    "text",
    "editor",
    "input",
    "raw",
    "plain",
    "string",
    "basic",
    "simple",
    "content",
    "typing",
    "manual",
    "fundamental",
  ];
  rawTextEditor.categories = ["/text/input", "/data/input", "/ui/text-editor"];
  rawTextEditor.notSearchable();

  rawTextEditor.newInputSocket("inputText", {
    label: "Text",
    documentation: "",
    type: STANDARD_DATATYPES.STRING,
    params: new StringSocketParamsBuilder("").build()});

  rawTextEditor.newOutputSocket("outputText", {
    label: "Text",
    documentation: "",
    type: STANDARD_DATATYPES.STRING});

  rawTextEditor.code = "outputs.set(\"outputText\", inputs.inputText);";

  const mdTextEditor =
        await nodeBluePrintController.initOfficialNodeBluePrint(
          "md_text_editor"
        );
  mdTextEditor.title = "Markdown Text Editor";
  mdTextEditor.documentation =
        "Displays or intakes text data, rendered as markdown.";
  mdTextEditor.tags = [
    "text",
    "markdown",
    "editor",
    "md",
    "formatted",
    "rich-text",
    "documentation",
    "github",
    "readme",
    "styling",
    "headers",
    "links",
  ];
  mdTextEditor.categories = [
    "/text/markdown",
    "/text/input",
    "/ui/text-editor",
  ];
  mdTextEditor.notSearchable();

  mdTextEditor.newInputSocket("text", {
    label: "Text",
    documentation: "",
    type: STANDARD_DATATYPES.STRING,
    params: new StringSocketParamsBuilder("").build()});

  mdTextEditor.newOutputSocket("text", {
    label: "Text",
    documentation: "",
    type: STANDARD_DATATYPES.STRING});

  mdTextEditor.code = "outputs.set(\"text\", inputs.text);";

  const textTemplateFillin =
        await nodeBluePrintController.initOfficialNodeBluePrint("template");
  textTemplateFillin.title = "Template Text";
  textTemplateFillin.documentation =
        "Replaces @x with the value of x, a string value. Filled in " +
          "during computation.";
  textTemplateFillin.tags = [
    "text",
    "template",
    "substitution",
    "variables",
    "placeholder",
    "dynamic",
    "interpolation",
    "replacement",
    "fill-in",
    "generation",
    "incomplete",
    "parametric",
  ];
  textTemplateFillin.categories = [
    "/text/templating",
    "/text/generation",
    "/data/templating",
  ];
  textTemplateFillin.notSearchable();

  textTemplateFillin.newInputSocket("template", {
    label: "Text",
    documentation: "",
    type: STANDARD_DATATYPES.STRING,
    params: new StringSocketParamsBuilder("").build()});

  textTemplateFillin.input_spec_strict = false;
  // has dynamic sockets

  textTemplateFillin.newOutputSocket("text", {
    label: "Filled in Template",
    documentation: "",
    type: STANDARD_DATATYPES.STRING});

  // should iterate through the keys of inputs.fillins and replace the keys
  // in the text
  textTemplateFillin.code = `
let filledIn = inputs.template;
for (const key in inputs) {
    if (key !== 'template') {
        filledIn = filledIn.replaceAll('@'+key, inputs[key]);
    }
}
outputs.set("text", filledIn);
`;

  const imageLoader =
        await nodeBluePrintController.initOfficialNodeBluePrint("image_loader");
  imageLoader.title = "Image Loader";
  imageLoader.documentation = "Read in an image from a socket/file.";
  imageLoader.tags = [
    "image",
    "loader",
    "file",
    "jimp",
    "upload",
    "import",
    "base64",
    "buffer",
    "graphics",
    "input",
    "conversion",
    "reader",
  ];
  imageLoader.categories = ["/image/input", "/file/loading", "/data/input"];
  imageLoader.notSearchable();

  imageLoader.newInputSocket("imageOrFileOrString", {
    label: "Upload Image",
    documentation: "Image uploaded from file.",
    type: STANDARD_DATATYPES.FILE,
    params: new JIMPImageSocketParamsBuilder().build()});

  imageLoader.newOutputSocket("image", {
    label: "Image",
    documentation: "The image you viewed.",
    type: STANDARD_DATATYPES.IMAGE_JIMP});

  imageLoader.code = `
const imageOrFileOrString = inputs.imageOrFileOrString;

console.log(
    typeof imageOrFileOrString,
    typeof imageOrFileOrString === 'string',
    imageOrFileOrString instanceof ArrayBuffer,
    imageOrFileOrString instanceof Blob,
    imageOrFileOrString instanceof Response,
    imageOrFileOrString
);

if (typeof imageOrFileOrString === 'string' ||
    imageOrFileOrString instanceof ArrayBuffer
) {
    outputs.set('image', await utils.Jimp.read(imageOrFileOrString));
} else if (
    imageOrFileOrString instanceof Blob ||
    imageOrFileOrString instanceof Response
) {
    const arrayBuffer = await imageOrFileOrString.arrayBuffer();
    outputs.set('image', await utils.Jimp.read(arrayBuffer));
} else {
    // assume this is a jimp already
    outputs.set('image', imageOrFileOrString);
}
`;

  const htmlRenderer =
        await nodeBluePrintController.initOfficialNodeBluePrint(
          "html_renderer"
        );
  htmlRenderer.title = "HTML Renderer";
  htmlRenderer.documentation = "Display arbitrary html in iframe.";
  htmlRenderer.tags = [
    "html",
    "renderer",
    "iframe",
    "web",
    "display",
    "browser",
    "dom",
    "preview",
    "sandbox",
    "markup",
    "ui",
    "viewer",
  ];
  htmlRenderer.categories = ["/html/rendering", "/web/display", "/ui/viewer"];
  htmlRenderer.notSearchable();

  htmlRenderer.newInputSocket("html", {
    label: "HTML",
    documentation: "HTML to display in iframe.",
    type: STANDARD_DATATYPES.STRING,
    params: new StringSocketParamsBuilder("").build()});

  htmlRenderer.code = "console.log('html rendered', inputs.html)";

  const jsNode =
        await nodeBluePrintController.initOfficialNodeBluePrint("js");
  jsNode.title = "JS Node";
  jsNode.documentation = "Modify JS in a Node Environment";
  jsNode.tags = [
    "javascript",
    "js",
    "code",
    "node",
    "execution",
    "runtime",
    "scripting",
    "programming",
    "custom",
    "logic",
    "computation",
    "flexible",
  ];
  jsNode.categories = [
    "/code/javascript",
    "/computation/scripting",
    "/development/custom",
  ];
  jsNode.notSearchable();

  jsNode.newInputSocket("js_code", {
    label: "JS",
    documentation: "",
    type: STANDARD_DATATYPES.STRING,
    params: new StringSocketParamsBuilder("").build()});

  jsNode.newOutputSocket("outputText", {
    label: "Return",
    documentation: "",
    type: "unknown"});

  jsNode.code = "outputs.set(\"outputText\", inputs.inputText);";
}
