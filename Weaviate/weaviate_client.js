import weaviate from "weaviate-client";

export const client = await weaviate.connectToWeaviateCloud(
  process.env.WEAVIATE_URL.replace("https://", ""), // Replace with your Weaviate Cloud URL
  {
    authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY), // Replace with your Weaviate Cloud API key
    headers: {
      "X-OpenAI-Api-Key": process.env.OPENAI_API_KEY,
    },
  }
);

