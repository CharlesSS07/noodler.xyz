import * as functions from "firebase-functions";
import {
  TextGenerationRequest,
  TextClassificationRequest,
  TokenClassificationRequest,
  QuestionAnsweringRequest,
  FillMaskRequest,
  SummarizationRequest,
  TranslationRequest,
  SentenceSimilarityRequest,
  ConversationalRequest,
  FeatureExtractionRequest,
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

export const textGeneration = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    await authenticateRequest(req);

    const {inputs, parameters}: TextGenerationRequest = req.body;
    const model = req.body.model || getDefaultModel("text-generation");

    if (!validateInput(res, !!inputs, "Missing inputs field")) return;

    const client = getHFClient();
    const response = await wrapHFResponse(
      client.textGeneration({
        model,
        inputs,
        parameters: {
          max_length: 50,
          temperature: 0.7,
          ...parameters,
        },
      })
    );

    res.status(200).json(response.data);
  } catch (error: any) {
    handleError(res, error, "Text Generation");
  }
});

export const textClassification = functions.https.onRequest(
  async (req, res) => {
    try {
      await authenticateRequest(req);

      const {inputs, parameters}: TextClassificationRequest = req.body;
      const model =
                req.body.model || getDefaultModel("text-classification");

      if (!validateInput(res, !!inputs, "Missing inputs field")) return;

      const client = getHFClient();
      const response = await wrapHFResponse(
        client.textClassification({
          model,
          inputs,
          parameters,
        })
      );

      res.status(200).json(response.data);
    } catch (error: any) {
      handleError(res, error, "Text Classification");
    }
  }
);

export const tokenClassification = functions.https.onRequest(
  async (req, res) => {
    try {
      await authenticateRequest(req);

      const {inputs, parameters}: TokenClassificationRequest = req.body;
      const model =
                req.body.model || getDefaultModel("token-classification");

      if (!validateInput(res, !!inputs, "Missing inputs field")) return;

      const client = getHFClient();
      const response = await wrapHFResponse(
        client.tokenClassification({
          model,
          inputs,
          parameters: {
            aggregation_strategy: "simple",
            ...parameters,
          },
        })
      );

      res.status(200).json(response.data);
    } catch (error: any) {
      handleError(res, error, "Token Classification");
    }
  }
);

export const questionAnswering = functions.https.onRequest(async (req, res) => {
  try {
    await authenticateRequest(req);

    const {inputs, parameters}: QuestionAnsweringRequest = req.body;
    const model = req.body.model || getDefaultModel("question-answering");

    if (
      !validateInput(
        res,
        !!(inputs && inputs.question && inputs.context),
        "Missing inputs.question or inputs.context"
      )
    ) {
      return;
    }

    const client = getHFClient();
    const response = await wrapHFResponse(
      client.questionAnswering({
        model,
        inputs,
        parameters,
      })
    );

    res.status(200).json(response.data);
  } catch (error: any) {
    handleError(res, error, "Question Answering");
  }
});

export const fillMask = functions.https.onRequest(async (req, res) => {
  try {
    await authenticateRequest(req);

    const {inputs, parameters}: FillMaskRequest = req.body;
    const model = req.body.model || getDefaultModel("fill-mask");

    if (
      !validateInput(
        res,
        !!(inputs && inputs.includes("[MASK]")),
        "Missing inputs or [MASK] token not found"
      )
    ) {
      return;
    }

    const client = getHFClient();
    const response = await wrapHFResponse(
      client.fillMask({
        model,
        inputs,
        parameters: {
          top_k: 5,
          ...parameters,
        },
      })
    );

    res.status(200).json(response.data);
  } catch (error: any) {
    handleError(res, error, "Fill Mask");
  }
});

export const summarization = functions.https.onRequest(async (req, res) => {
  try {
    await authenticateRequest(req);

    const {inputs, parameters}: SummarizationRequest = req.body;
    const model = req.body.model || getDefaultModel("summarization");

    if (!validateInput(res, !!inputs, "Missing inputs field")) return;

    const client = getHFClient();
    const response = await wrapHFResponse(
      client.summarization({
        model,
        inputs,
        parameters: {
          max_length: 130,
          min_length: 30,
          do_sample: false,
          ...parameters,
        },
      })
    );

    res.status(200).json(response.data);
  } catch (error: any) {
    handleError(res, error, "Summarization");
  }
});

export const translation = functions.https.onRequest(async (req, res) => {
  try {
    await authenticateRequest(req);

    const {inputs, parameters}: TranslationRequest = req.body;
    const model = req.body.model || getDefaultModel("translation");

    if (!validateInput(res, !!inputs, "Missing inputs field")) return;

    const client = getHFClient();
    const response = await wrapHFResponse(
      client.translation({
        model,
        inputs,
        parameters,
      })
    );

    res.status(200).json(response.data);
  } catch (error: any) {
    handleError(res, error, "Translation");
  }
});

export const sentenceSimilarity = functions.https.onRequest(
  async (req, res) => {
    try {
      await authenticateRequest(req);

      const {inputs, parameters}: SentenceSimilarityRequest = req.body;
      const model =
                req.body.model || getDefaultModel("sentence-similarity");

      if (
        !validateInput(
          res,
          !!(inputs && inputs.source_sentence && inputs.sentences),
          "Missing inputs.source_sentence or inputs.sentences"
        )
      ) {
        return;
      }

      const client = getHFClient();
      const response = await wrapHFResponse(
        client.sentenceSimilarity({
          model,
          inputs,
          parameters,
        })
      );

      res.status(200).json(response.data);
    } catch (error: any) {
      handleError(res, error, "Sentence Similarity");
    }
  }
);

export const conversational = functions.https.onRequest(async (req, res) => {
  try {
    await authenticateRequest(req);

    const {inputs, parameters}: ConversationalRequest = req.body;
    const model = req.body.model || getDefaultModel("conversational");

    if (
      !validateInput(
        res,
        !!(inputs && inputs.text),
        "Missing inputs.text field"
      )
    ) {
      return;
    }

    const client = getHFClient();
    const response = await wrapHFResponse(
      client.textGeneration({
        model,
        inputs: inputs.text, // Use the text field for conversational
        parameters: {
          max_length: 1000,
          temperature: 0.7,
          ...parameters,
        },
      })
    );

    res.status(200).json(response.data);
  } catch (error: any) {
    handleError(res, error, "Conversational");
  }
});

export const featureExtraction = functions.https.onRequest(async (req, res) => {
  try {
    await authenticateRequest(req);

    const {inputs, parameters}: FeatureExtractionRequest = req.body;
    const model = req.body.model || getDefaultModel("feature-extraction");

    if (!validateInput(res, !!inputs, "Missing inputs field")) return;

    const client = getHFClient();
    const response = await wrapHFResponse(
      client.featureExtraction({
        model,
        inputs,
        parameters,
      })
    );

    res.status(200).json(response.data);
  } catch (error: any) {
    handleError(res, error, "Feature Extraction");
  }
});
