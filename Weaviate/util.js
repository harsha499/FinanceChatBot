import { WeaviateStore } from "@langchain/weaviate";
import { OpenAIEmbeddings } from "@langchain/openai";
import { client } from "./weaviate_client.js";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { configure } from "weaviate-client";


const collectionName = process.env.collectionName;
const columnName = process.env.columnName;
export const getVectorStore = async () => {
  const vectorStore = new WeaviateStore(
    new OpenAIEmbeddings({ apiKey: process.env.OPENAI_API_KEY }),
    {
      client,
      indexName: collectionName,
      textKey: columnName,
    }
  );
  return vectorStore;
};
export const createCollection = async (collectionName, schemaProperties) => {
  let collection;
  const { isExist, result } = await getCollections(collectionName);
  if (!isExist) {
    collection = await client.collections.create({
      name: collectionName,
      vectorizer: "text2vec-openai",
      vectorIndexConfig: configure.vectorIndex.hnsw(),
      moduleConfig: {
        "generative-openai": {
          model: "gpt-3.5-turbo", // Optional - Defaults to `gpt-3.5-turbo`
          temperatureProperty: ".2", // Optional, applicable to both OpenAI and Azure OpenAI
          maxTokensProperty: "20", // Optional, applicable to both OpenAI and Azure OpenAI
          topPProperty: ".5", // Optional, applicable to both OpenAI and Azure OpenAI
        },
      },
      generative: configure.generative.openAI(),
      properties: schemaProperties.map((data) => {
        return { name: data.name, dataType: data.dataType };
      }),
    });
  } else return result;
  return collection;
};
export const insertRecords = async (collection, obj) => {
  const result = await collection.data.insert({
    properties: obj,
  });
  return result;
};
export const getCollections = async (collectionName) => {
  const result = await client.collections.get(collectionName);
  const isExist = await result.exists();
  return { isExist, result };
};
export const loadDataToDb = async (
  collectionName,
  columnName,
  url,
  type
) => {
  let loader;
  let docs;
  let splitter;
  if (type == "pdf") {
    loader = new PDFLoader(url, { splitPages: false });
    docs = await loader.load();
    splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 100,
      separators: ["\n\n", "\n", ".", " "], // proper descending order
    });
  }
  if (type == "web") {
    loader = new CheerioWebBaseLoader(url);
    docs = await loader.load();
    splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 100,
    });
  }

  const splitDocs = await splitter.splitDocuments(docs);
  let vector;

  vector = await WeaviateStore.fromExistingIndex(
    new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
    }),
    {
      client,
      indexName: collectionName,
      textKey: columnName,
    }
  );
  await vector.addDocuments(splitDocs);
  return vector;
};
