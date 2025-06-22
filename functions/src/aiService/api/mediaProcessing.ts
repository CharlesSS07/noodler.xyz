import * as functions from "firebase-functions";
import Together from "together-ai";
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
  setCorsHeaders,
} from "./utils";

export const imageClassification = functions.https.onRequest(
  async (req, res) => {
    setCorsHeaders(res, req);

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
          "Missing inputs field (base64 image or image URL)",
          req
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
          model,
          inputs: data,
          parameters,
        })
      );

      res.status(200).json(response.data);
    } catch (error: any) {
      handleError(res, error, "Image Classification", req);
    }
  }
);

export const objectDetection = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(res, req);

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    await authenticateRequest(req);

    const {inputs, parameters}: ObjectDetectionRequest = req.body;
    const model = req.body.model || getDefaultModel("object-detection");

    if (
      !validateInput(
        res,
        !!inputs,
        "Missing inputs field (base64 image or image URL)",
        req
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
    handleError(res, error, "Object Detection", req);
  }
});

export const automaticSpeechRecognition = functions.https.onRequest(
  async (req, res) => {
    setCorsHeaders(res, req);

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

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
          "Missing inputs field (base64 audio data)",
          req
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
          model,
          inputs: data,
          parameters,
        })
      );

      res.status(200).json(response.data);
    } catch (error: any) {
      handleError(res, error, "ASR", req);
    }
  }
);

export const tableQuestionAnswering = functions.https.onRequest(
  async (req, res) => {
    setCorsHeaders(res, req);

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

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
          "Missing inputs.query or inputs.table",
          req
        )
      ) {
        return;
      }

      const client = getHFClient();
      const response = await wrapHFResponse(
        client.tableQuestionAnswering({
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
      handleError(res, error, "Table QA", req);
    }
  }
);

export const textToImage = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(res, req);

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    await authenticateRequest(req);

    const {inputs, parameters}: TextToImageRequest = req.body;
    const model = req.body.model || "black-forest-labs/FLUX.1-kontext-pro";

    if (!validateInput(res, !!inputs,
      "Missing inputs field (text prompt)", req)) {
      return;
    }

    const together = new Together();

    const response = await together.images.create({
      model,
      prompt: inputs,
      steps: parameters?.num_inference_steps || 10,
      n: parameters?.n || 1,
      ...(parameters?.width && {width: parameters.width}),
      ...(parameters?.height && {height: parameters.height}),
    });

    res.status(200).json({
      image: `data:image/png;base64,${response.data[0].b64_json}`,
      metadata: {
        model,
        prompt: inputs,
        parameters: {
          steps: parameters?.num_inference_steps || 10,
          n: parameters?.n || 1,
          ...parameters,
        },
      },
    });
  } catch (error: any) {
    handleError(res, error, "Text to Image", req);
  }
});
