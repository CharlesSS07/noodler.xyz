

export interface Tier {
    name: string;
    monthly_price?: number;
    annual_discount?: 0.15;
    daily_token_budget?: number,
    features: string[];
}

export const tiers: Record<string, Tier> = {}

tiers.free = {
    name: "Content Creator",
    monthly_price: 0,
    daily_token_budget: 1000,
    features: [
        'Social Media Posting Nodes',
        'Image Editing',
        'Gen. AI Nodes',
    ]
}

tiers.paid = {
    name: "Indie Filmmaker",
    monthly_price: 20,
    daily_token_budget: 10000,
    features: [
        `${tiers.free.name} features.`,
        'Video Generation',
        'High Speed Inference'
    ]
}

tiers.enterprise = {
    name: "Studio",
    features: [
        `${tiers.paid.name} features.`,
        'Managed user accounts.'
    ]
}