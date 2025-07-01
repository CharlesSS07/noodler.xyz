import { Jimp } from 'jimp';
import { aiServiceInstance } from '$lib/services/AIInferenceService';
import * as d3 from 'd3';
import * as unpdf from 'unpdf';

export const utils = {
    Jimp: Jimp,
    aiServices: aiServiceInstance,
    unpdf: unpdf,
    d3: d3,
};
