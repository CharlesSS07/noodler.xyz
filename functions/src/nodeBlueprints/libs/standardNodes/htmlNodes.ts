import type {
  NodeBluePrintControllerFactoryInterface} from "../NodeBluePrint.js";
import {
  FirestoreNodeBluePrintControllerFactoryInterface,
} from "../FirestoreNodeBluePrint.js";
import {
  StringSocketParamsBuilder,
  GenericSocketParamsBuilder,
} from "../SocketParamBuilders.js";
import {STANDARD_DATATYPES} from "$shared/DataTypes";

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

/**
 * Creates and configures htmlNodes nodes.
 * @return {Promise<void>} Promise that resolves when nodes are created
 */
export async function htmlNodes() {
  const htmlViewer =
        await nodeBluePrintController.initOfficialNodeBluePrint("html_viewer");
  htmlViewer.title = "Render HTML";
  htmlViewer.documentation = "Display HTML from text.";
  htmlViewer.tags = [
    "html",
    "web",
    "render",
    "display",
    "viewer",
    "markup",
    "dom",
    "frontend",
    "browser",
    "ui",
    "presentation",
    "visual",
  ];

  await htmlViewer.newInputSocket("html", {
    label: "HTML",
    documentation: "HTML string",
    type: "HTML",
    params: new StringSocketParamsBuilder("").asParagraph().build()});

  htmlViewer.code = "console.log('Rendered HTML');";

  const htmlElement =
        await nodeBluePrintController.initOfficialNodeBluePrint(
          "html_elementify"
        );
  htmlElement.title = "HTML Elementify";
  htmlElement.documentation =
        "Wrap text in html element tags and unpack args into html tags.";
  htmlElement.tags = [
    "html",
    "web",
    "element",
    "tag",
    "wrapper",
    "markup",
    "dom",
    "generator",
    "builder",
    "templating",
    "structure",
    "attributes",
  ];

  await htmlElement.newInputSocket("tag", {
    label: "Tag",
    documentation: "Object to stringify into JSON.",
    // type: "ENUM",
    // params: new ENUMSocketConfig(Array.from(new Set(Array.from(
    //   document.querySelectorAll("*"), el => el.tagName.toLowerCase()))))
    type: STANDARD_DATATYPES.STRING,
    params: new StringSocketParamsBuilder("").asSentence().build()});

  await htmlElement.newInputSocket("innerHTML", {
    label: "Inner HTML",
    documentation: "Inner html of this element.",
    type: STANDARD_DATATYPES.STRING,
    params: new StringSocketParamsBuilder("").asParagraph().build()});

  await htmlElement.newInputSocket("attributes", {
    label: "Attributes",
    documentation: "Object to specify attributes.",
    type: "unknown",
    params: new GenericSocketParamsBuilder("{}").build()});

  await htmlElement.newOutputSocket("html", {
    label: "HTML",
    documentation: "The html.",
    type: STANDARD_DATATYPES.STRING});

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
        await nodeBluePrintController.initOfficialNodeBluePrint("fetch_url");
  fetchURL.title = "Fetch URL";
  fetchURL.documentation =
        "Fetches content from a given URL and returns it as plain text.";
  fetchURL.tags = [
    "web",
    "http",
    "fetch",
    "url",
    "remote",
    "network",
    "api",
    "request",
    "download",
    "scraping",
    "content",
    "internet",
    "external",
  ];

  await fetchURL.newInputSocket("url", {
    label: "URL",
    documentation: "The URL to fetch data from.",
    type: STANDARD_DATATYPES.STRING,
    params: new StringSocketParamsBuilder("").asWord().build()});

  await fetchURL.newOutputSocket("response", {
    label: "Fetched Content",
    documentation:
      "Plain text fetched from the URL. A blob in base64 format.",
    type: STANDARD_DATATYPES.STRING});

  fetchURL.code = `
const url = inputs.url;
if (!url) {
  throw new Error('URL is required');
}

const res = await utils.proxyFetch(url);

if (res.status !== 200) {
   throw new Error('Response error: '+res.statusText);
}

outputs.set('response', res);
`;
}
