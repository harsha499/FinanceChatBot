import { ChatOpenAI } from "@langchain/openai";
import { ChatMessageHistory } from "@langchain/community/stores/message/in_memory";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { RunnableSequence } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { getVectorStore } from "./Weaviate/util.js";

const llm = new ChatOpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory conversation history
const messageHistories = new Map();

// creating ChatMessageHistory object for each sessionId
function getMessageHistory(sessionId = "default") {
  if (!messageHistories.has(sessionId)) {
    messageHistories.set(sessionId, new ChatMessageHistory());
  }
  return messageHistories.get(sessionId);
}

export async function getRAGAnswer(query, sessionId = "default") {
  const vectorStore = await getVectorStore();
  const retriever = vectorStore.asRetriever({ k: 5 });

  const prompt = PromptTemplate.fromTemplate(`
Use the following pieces of context to answer the question at the end. 
If you don't know the answer, just say that you don't know, don't try to make up an answer.

You have access to the previous conversation history. Pay attention to earlier questions and topics discussed.
If asked about previous questions or conversation, refer to the history provided.

Previous conversation:
{history}

Context from knowledge base:
{context}

Current Question: {question}

Helpful Answer:`);

  // Create the RAG chain - FIXED VERSION
  const ragChain = RunnableSequence.from([
    {
      context: async (input) => {
        const docs = await retriever.getRelevantDocuments(input.question);
        return docs.map((doc) => doc.pageContent).join("\n\n");
      },
      question: (input) => input.question,
      history: (input) => input.history || "", // Use the history passed from RunnableWithMessageHistory
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  // Wrap with message history - this automatically manages conversation history
  const chainWithHistory = new RunnableWithMessageHistory({
    runnable: ragChain,
    getMessageHistory: getMessageHistory,
    inputMessagesKey: "question",
    historyMessagesKey: "history",
  });

  try {
    const result = await chainWithHistory.invoke(
      { question: query },
      { configurable: { sessionId } }
    );

    return result;
  } catch (error) {
    console.error("Error in RAG chain:", error);
    throw error;
  }
}