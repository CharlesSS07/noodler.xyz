import type {
  NodeBluePrintControllerFactoryInterface} from "../NodeBluePrint.js";
import {
  FirestoreNodeBluePrintControllerFactoryInterface,
} from "../FirestoreNodeBluePrint.js";
import {
  FileSocketParamsBuilder,
} from "../SocketParamBuilders.js";
import {STANDARD_DATATYPES} from "$shared/SocketDataTypes";

const nodeBluePrintController: NodeBluePrintControllerFactoryInterface =
    new FirestoreNodeBluePrintControllerFactoryInterface();

/**
 * Creates and configures fileLoadingNodes nodes.
 * @return {Promise<void>} Promise that resolves when nodes are created
 */
export async function fileLoadingNodes() {
  const loadExcel =
        await nodeBluePrintController.initOfficialNodeBluePrint("load_excel");
  loadExcel.title = "Load Excel Spreadsheet";
  loadExcel.documentation = "Display Excel Spreadsheet";
  loadExcel.tags = [
    "file",
    "excel",
    "xlsx",
    "spreadsheet",
    "data",
    "loader",
    "import",
    "office",
    "microsoft",
    "tabular",
    "cells",
    "business",
    "not-implemented",
  ];
  loadExcel.categories = ["/file/loading", "/data/spreadsheet", "/data/excel"];

  loadExcel.newInputSocket("xlsx_file", {
    label: ".xlsx",
    documentation: "Excel File",
    type: STANDARD_DATATYPES.FILE,
    params: new FileSocketParamsBuilder().build()});

  loadExcel.newOutputSocket("json", {
    label: "JSON dict",
    documentation: "Json dictionary of spreadsheet",
    type: "json"});

  loadExcel.code = "console.error('Not Implemented');";

  const loadPDF =
        await nodeBluePrintController.initOfficialNodeBluePrint("load_pdf");
  loadPDF.title = "Load PDF Document";
  loadPDF.documentation = "Extract text and metadata from PDF files";
  loadPDF.tags = [
    "file",
    "pdf",
    "document",
    "text",
    "loader",
    "import",
    "adobe",
    "extraction",
    "content",
    "portable",
  ];
  loadPDF.categories = ["/file/loading", "/data/document", "/text/extraction"];

  loadPDF.newInputSocket("pdf_file", {
    label: ".pdf",
    documentation: "PDF File",
    type: STANDARD_DATATYPES.FILE,
    params: new FileSocketParamsBuilder([".pdf"]).build()});

  loadPDF.newOutputSocket("text", {
    label: "Text Content",
    documentation: "Extracted text from PDF",
    type: STANDARD_DATATYPES.STRING});

  loadPDF.newOutputSocket("metadata", {
    label: "Metadata",
    documentation: "PDF metadata (title, author, etc.)",
    type: STANDARD_DATATYPES.OBJECT});

  loadPDF.newOutputSocket("pdf", {
    label: ".pdf",
    documentation: "Identical to input PDF file",
    type: STANDARD_DATATYPES.FILE});

  loadPDF.code = `
outputs.set('pdf', inputs.pdf_file);
const pdfData = new Uint8Array(await inputs.pdf_file.arrayBuffer());
const pdf = await utils.unpdf.getDocumentProxy(pdfData);

// Extract text from the PDF
const { totalPages, text } = await utils.unpdf.extractText(
  pdf,
  { mergePages: true }
);

// Get PDF metadata
const metadata = await pdf.getMetadata();
const info = metadata?.info || {};

const pdfMetadata = {
    title: info.Title || '',
    author: info.Author || '',
    subject: info.Subject || '',
    creator: info.Creator || '',
    producer: info.Producer || '',
    creationDate: info.CreationDate || '',
    modDate: info.ModDate || '',
    numPages: totalPages
};

outputs.set("text", text);
outputs.set("metadata", pdfMetadata);
`;
}
