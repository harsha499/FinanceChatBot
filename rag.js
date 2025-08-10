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

function getMessageHistory(sessionId = "default") {
  if (!messageHistories.has(sessionId)) {
    messageHistories.set(sessionId, new ChatMessageHistory());
  }
  return messageHistories.get(sessionId);
}

// Format conversation history for the prompt
function formatChatHistory(messages) {
  return messages
    .map((message) => {
      if (message._getType() === "human") {
        return `Human: ${message.content}`;
      } else if (message._getType() === "ai") {
        return `Assistant: ${message.content}`;
      }
      return "";
    })
    .join("\n");
}

export async function getRAGAnswer(query, sessionId = "default") {
  const vectorStore = await getVectorStore();
  const retriever = vectorStore.asRetriever({ k: 3 });

  const prompt = PromptTemplate.fromTemplate(`
Use the following pieces of context to answer the question at the end. 
If you don't know the answer, just say that you don't know, don't try to make up an answer.

Previous conversation:
{history}

Context:
{context}

Question: {question}

Helpful Answer:`);

  // Create the RAG chain
  const ragChain = RunnableSequence.from([
    {
      context: async (input) => {
        const docs = await retriever.getRelevantDocuments(input.question);
        return docs.map((doc) => doc.pageContent).join("\n\n");
      },
      question: (input) => input.question,
      history: async (input) => {
        const messageHistory = getMessageHistory(input.sessionId);
        const messages = await messageHistory.getMessages();
        return formatChatHistory(messages);
      },
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  // Wrap with message history
  const chainWithHistory = new RunnableWithMessageHistory({
    runnable: ragChain,
    getMessageHistory,

    inputMessagesKey: "question",
    historyMessagesKey: "history",
  });

  try {
    const result = await chainWithHistory.invoke(
      { question: query, sessionId },
      { configurable: { sessionId } }
    );

    return result;
  } catch (error) {
    console.error("Error in RAG chain:", error);
    throw error;
  }
}

// Utility function to clear conversation history
export function clearConversationHistory(sessionId = "default") {
  if (messageHistories.has(sessionId)) {
    messageHistories.delete(sessionId);
  }
}

// Get conversation history for a session
export async function getConversationHistory(sessionId = "default") {
  const messageHistory = getMessageHistory(sessionId);
  const messages = await messageHistory.getMessages();
  return messages.map((msg) => ({
    type: msg._getType(),
    content: msg.content,
  }));
}
