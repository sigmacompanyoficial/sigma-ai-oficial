export type SigmaModel = {
    modelId: string;
    modelName: string;
    provider: string;
    hostedId: string;
    platformLink: string;
    imageInput: boolean;
    maxContext: number;
};

export const models: SigmaModel[] = [
    {
        modelId: "openai/gpt-oss-120b:free",
        modelName: "Sigma LLM",
        provider: "openrouter",
        hostedId: "openai/gpt-oss-120b:free",
        platformLink: "https://openrouter.ai",
        imageInput: false,
        maxContext: 128000
    },
    {
        modelId: "qwen/qwen3-coder:free",
        modelName: "Sigma LLM Coder",
        provider: "openrouter",
        hostedId: "qwen/qwen3-coder:free",
        platformLink: "https://openrouter.ai",
        imageInput: false,
        maxContext: 32768
    },
    {
        modelId: "google/gemma-3-4b-it:free",
        modelName: "Sigma Vision",
        provider: "openrouter",
        hostedId: "google/gemma-3-4b-it:free",
        platformLink: "https://openrouter.ai",
        imageInput: true,
        maxContext: 32768
    },
    {
        modelId: "google/gemini-2.0-flash-001",
        modelName: "Sigma LLM Mini",
        provider: "openrouter",
        hostedId: "google/gemini-2.0-flash-001",
        platformLink: "https://openrouter.ai",
        imageInput: false,
        maxContext: 128000
    }
];
