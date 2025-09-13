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
  const retriever = vectorStore.asRetriever({ k: 10 });

  const prompt = PromptTemplate.fromTemplate(`
You are an AI assistant that can have natural conversations.

Rules:
- For casual or general conversation (e.g., greetings, chit-chat, opinions), you can answer freely. 
- For technical or factual questions, you MUST rely only on the provided context from the knowledge base.
- If the answer is not present in the context, respond with: "I don’t know based on the provided data."
- Never use external knowledge or assumptions for technical details.
- Try to check History if something is asked from user previously, then try to answer from it otherwise follow above steps.

Previous conversation:
{history}

Context from knowledge base:
{context}

Current Question: {question}

Answer:`);

  // Create the RAG chain - FIXED VERSION
  const ragChain = RunnableSequence.from([
    {
      context: async (input) => {
        const docs = await retriever.getRelevantDocuments(input.question);
        return docs.map((doc) => doc.pageContent).join("\n\n");
      },
      question: (input) => input.question,
      history: async (input) => {
        const history = getMessageHistory(sessionId || "default");
        const messages = await history.getMessages();
        return messages.map((msg) => `${msg.role}:${msg.content}`).join("\n");
      }, // Use the history passed from RunnableWithMessageHistory
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
