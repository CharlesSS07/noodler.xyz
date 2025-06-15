import * as functions from "firebase-functions";
import {
  ImageClassificationRequest,
  ObjectDetectionRequest,
  AutomaticSpeechRecognitionRequest,
  TableQuestionAnsweringRequest,
  TextToImageRequest,
} from "./types";
import {
  authenticateRequest,
  getHFClient,
  wrapHFResponse,
  handleError,
  validateInput,
  getDefaultModel,
  getHFProviderTyped,
  setCorsHeaders,
} from "./utils";

export const imageClassification = functions.https.onRequest(
  async (req, res) => {
    setCorsHeaders(res);

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      await authenticateRequest(req);

      const {inputs, parameters}: ImageClassificationRequest = req.body;
      const model =
                req.body.model || getDefaultModel("image-classification");

      if (
        !validateInput(
          res,
          !!inputs,
          "Missing inputs field (base64 image or image URL)"
        )
      ) {
        return;
      }

      const client = getHFClient();
      // Convert base64 string to Blob if needed
      let data: any = inputs;
      if (typeof inputs === "string" && inputs.startsWith("data:")) {
        // Handle base64 data URLs
        const base64Data = inputs.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
        data = new Blob([buffer]);
      }

      const response = await wrapHFResponse(
        client.imageClassification({
          provider: getHFProviderTyped(),
          model,
          inputs: data,
          parameters,
        })
      );

      res.status(200).json(response.data);
    } catch (error: any) {
      handleError(res, error, "Image Classification");
    }
  }
);

export const objectDetection = functions.https.onRequest(async (req, res) => {
  try {
    await authenticateRequest(req);

    const {inputs, parameters}: ObjectDetectionRequest = req.body;
    const model = req.body.model || getDefaultModel("object-detection");

    if (
      !validateInput(
        res,
        !!inputs,
        "Missing inputs field (base64 image or image URL)"
      )
    ) {
      return;
    }

    const client = getHFClient();
    // Convert base64 string to Blob if needed
    let data: any = inputs;
    if (typeof inputs === "string" && inputs.startsWith("data:")) {
      const base64Data = inputs.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      data = new Blob([buffer]);
    }

    const response = await wrapHFResponse(
      client.objectDetection({
        provider: getHFProviderTyped(),
        model,
        inputs: data,
        parameters: {
          threshold: 0.5,
          ...parameters,
        },
      })
    );

    res.status(200).json(response.data);
  } catch (error: any) {
    handleError(res, error, "Object Detection");
  }
});

export const automaticSpeechRecognition = functions.https.onRequest(
  async (req, res) => {
    try {
      await authenticateRequest(req);

      const {inputs, parameters}: AutomaticSpeechRecognitionRequest =
                req.body;
      const model =
                req.body.model ||
                getDefaultModel("automatic-speech-recognition");

      if (
        !validateInput(
          res,
          !!inputs,
          "Missing inputs field (base64 audio data)"
        )
      ) {
        return;
      }

      const client = getHFClient();
      // Convert base64 string to Blob if needed
      let data: any = inputs;
      if (typeof inputs === "string" && inputs.startsWith("data:")) {
        const base64Data = inputs.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
        data = new Blob([buffer]);
      }

      const response = await wrapHFResponse(
        client.automaticSpeechRecognition({
          provider: getHFProviderTyped(),
          model,
          inputs: data,
          parameters,
        })
      );

      res.status(200).json(response.data);
    } catch (error: any) {
      handleError(res, error, "ASR");
    }
  }
);

export const tableQuestionAnswering = functions.https.onRequest(
  async (req, res) => {
    try {
      await authenticateRequest(req);

      const {inputs, parameters}: TableQuestionAnsweringRequest =
                req.body;
      const model =
                req.body.model || getDefaultModel("table-question-answering");

      if (
        !validateInput(
          res,
          !!(inputs && inputs.query && inputs.table),
          "Missing inputs.query or inputs.table"
        )
      ) {
        return;
      }

      const client = getHFClient();
      const response = await wrapHFResponse(
        client.tableQuestionAnswering({
          provider: getHFProviderTyped(),
          model,
          inputs: {
            question: inputs.query,
            table: inputs.table,
          },
          parameters,
        })
      );

      res.status(200).json(response.data);
    } catch (error: any) {
      handleError(res, error, "Table QA");
    }
  }
);

export const textToImage = functions.https.onRequest(async (req, res) => {
  try {
    await authenticateRequest(req);

    const {inputs, parameters}: TextToImageRequest = req.body;
    const model = req.body.model || "black-forest-labs/FLUX.1-dev";

    if (!validateInput(res, !!inputs, "Missing inputs field (text prompt)")) {
      return;
    }

    const client = getHFClient();
    const response = await wrapHFResponse(
      client.textToImage({
        provider: getHFProviderTyped(),
        model,
        inputs,
        parameters: {
          num_inference_steps: 5,
          ...parameters,
        },
      })
    );

    // Convert Blob to base64 string for JSON response
    const blob = response.data as Blob;
    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64Image = buffer.toString("base64");
    const mimeType = blob.type || "image/png";

    res.status(200).json({
      image: `data:${mimeType};base64,${base64Image}`,
      metadata: {
        model,
        prompt: inputs,
        parameters: {
          num_inference_steps: 5,
          ...parameters,
        },
      },
    });
  } catch (error: any) {
    handleError(res, error, "Text to Image");
  }
});
