import Together from "together-ai";

const together = new Together();

// this is most of the inputs to together.images.create
// ImageCreateParams
// {
//     model: "black-forest-labs/FLUX.1-schnell-Free" | "black-forest-labs/FLUX.1-schnell" | "black-forest-labs/FLUX.1.1-pro" | string
//     prompt: string
//     guidance ? : number
//     height ? : number
//     image_loras ? : Array<ImageCreateParams.ImageLora>
//     image_url ? : string
//     n ? : number
//     negative_prompt ? : string
//     output_format ? : "jpeg" | "png"
//     response_format ? : "base64" | "url"
//     seed ? : number
//     steps ? : number
//     width ? : number
// }

// Example usage:
/*
const response = await together.images.create({
    model: "black-forest-labs/FLUX.1-kontext-dev",
    prompt: "Cats eating popcorn",
    steps: 10,
    n: 4
});
*/

interface TextToImageParams {
    model: string;
    prompt: string;
    negative_prompt?: string;
    guidance?: number;
    height?: number;
    width?: number;
    seed?: number;
    steps?: number;
}

export async function textToImage(params: TextToImageParams) {
    // Validate prompt
    if (!params.prompt || params.prompt.trim() === '') {
        throw new Error('Prompt cannot be empty.');
    }

    // Validate steps
    if (params.steps !== undefined && params.steps <= 0) {
        throw new Error('Steps must be a positive number.');
    }

    // Validate height and width
    const minDimension = 128;
    const maxDimension = 1024;
    const minAspectRatio = 0.5;
    const maxAspectRatio = 2.0;

    if (params.height !== undefined && params.width !== undefined) {
        if (params.height < minDimension || params.width < minDimension) {
            throw new Error(`Height and width must be at least ${minDimension}px.`);
        }
        if (params.height > maxDimension || params.width > maxDimension) {
            throw new Error(`Height and width cannot exceed ${maxDimension}px.`);
        }
        const aspectRatio = params.width / params.height;
        if (aspectRatio < minAspectRatio || aspectRatio > maxAspectRatio) {
            throw new Error(`Aspect ratio (width/height) must be between ${minAspectRatio} and ${maxAspectRatio}.`);
        }
    } else if (params.height !== undefined || params.width !== undefined) {
        throw new Error('Both height and width must be provided if either is specified.');
    }

    // Validate guidance
    const minGuidance = 1;
    const maxGuidance = 20;
    if (params.guidance !== undefined && (params.guidance < minGuidance || params.guidance > maxGuidance)) {
        throw new Error(`Guidance must be between ${minGuidance} and ${maxGuidance}.`);
    }

    const response = await together.images.create({
        model: params.model || "black-forest-labs/FLUX.1-schnell-Free",
        prompt: params.prompt,
        negative_prompt: params.negative_prompt || '',
        guidance: params.guidance,
        width: params.width,
        height: params.height,
        seed: params.seed || 0,
        steps: params.steps,
        n: 1, // Default to 1 image
        response_format: 'url',
        output_format: 'png'
    });
    return response;
}
