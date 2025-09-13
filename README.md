# FinanceChatBot

An intelligent finance chatbot built with Node.js, Express, and LangChain that provides answers to financial queries using RAG (Retrieval-Augmented Generation). The chatbot can process both web content and PDF documents to create a comprehensive knowledge base for financial information.

## Features

- **RAG-based Question Answering**: Uses Retrieval-Augmented Generation to provide accurate answers based on your knowledge base
- **Multiple Data Sources**: Supports both web scraping and PDF document processing
- **Conversation History**: Maintains session-based conversation history for contextual responses
- **File Upload**: Upload PDF documents to expand the knowledge base
- **Vector Database**: Uses Weaviate for efficient document storage and retrieval
- **OpenAI Integration**: Leverages OpenAI's embeddings and language models

## Tech Stack

- **Backend**: Node.js, Express.js
- **Vector Database**: Weaviate Cloud
- **AI/ML**: OpenAI GPT, LangChain
- **Document Processing**: Cheerio (web scraping), PDF-parse (PDF processing)
- **File Upload**: Multer

## Prerequisites

Before running this application, make sure you have:

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key
- Weaviate Cloud instance

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd FinanceChatBot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key
WEAVIATE_URL=your_weaviate_cloud_url
WEAVIATE_API_KEY=your_weaviate_api_key
collectionName=your_collection_name
columnName=your_column_name
PORT=3001
```

## Configuration

The application comes pre-configured with financial data sources from Bajaj Financial Services:

- Home loan terms and conditions
- Home loan eligibility and documents
- Personal loan eligibility and documents
- Personal loan detailed terms and conditions (PDF)

You can modify these sources in `index.js` or add your own.

## Usage

### Starting the Server

```bash
npm start
```

The server will start on port 3001 (or the PORT specified in your .env file).

### API Endpoints

#### POST `/api/chat`

Send a message to the chatbot or upload files.

**For text queries:**
```json
{
  "message": "What are the eligibility criteria for a home loan?",
  "uuid": "unique_session_id"
}
```

**For file uploads:**
- Use multipart/form-data
- Include PDF files in the request
- Optionally include a message for immediate querying

**Response:**
```json
{
  "response": "Based on the provided data, the eligibility criteria for home loans include..."
}
```

### Session Management

The chatbot maintains conversation history using session IDs (uuid). Each unique session ID creates a separate conversation thread, allowing multiple users or conversation contexts.

## Project Structure

```
FinanceChatBot/
├── Weaviate/
│   ├── util.js              # Weaviate utilities and vector operations
│   └── weaviate_client.js   # Weaviate client configuration
├── routes/
│   └── chat.js              # Chat API routes
├── resources/               # Static PDF resources
├── config.js                # Environment configuration
├── index.js                 # Main server file
├── rag.js                   # RAG implementation
├── package.json
├── .env                     # Environment variables
└── README.md
```

## Key Components

### RAG Implementation (`rag.js`)
- Handles retrieval-augmented generation
- Manages conversation history
- Integrates with OpenAI and Weaviate

### Weaviate Integration (`Weaviate/util.js`)
- Vector store operations
- Document processing and chunking
- Collection management

### File Processing (`routes/chat.js`)
- PDF file upload handling
- Dynamic knowledge base expansion
- Multi-format query processing

## Data Processing

The application supports two types of data sources:

1. **Web Content**: Uses CheerioWebBaseLoader to scrape and process web pages
2. **PDF Documents**: Uses PDFLoader to extract and process PDF content

All documents are:
- Split into chunks (1000 characters with 100 character overlap)
- Converted to embeddings using OpenAI
- Stored in Weaviate vector database

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `WEAVIATE_URL` | Weaviate Cloud URL | Yes |
| `WEAVIATE_API_KEY` | Weaviate API key | Yes |
| `collectionName` | Weaviate collection name | Yes |
| `columnName` | Text column name in collection | Yes |
| `PORT` | Server port (default: 3001) | No |

## Development

### Adding New Data Sources

To add new data sources, modify the `index.js` file:

```javascript
// For web content
await loadDataToDb(
  collectionName,
  columnName,
  "https://your-website.com",
  "web"
);

// For PDF files
await loadDataToDb(
  collectionName,
  columnName,
  "./path/to/your/file.pdf",
  "pdf"
);
```

### Customizing the Prompt

Modify the prompt template in `rag.js` to adjust the chatbot's behavior:

```javascript
const prompt = PromptTemplate.fromTemplate(`
Your custom prompt template here...
`);
```

## Error Handling

The application includes error handling for:
- Invalid file uploads
- Database connection issues
- OpenAI API failures
- Invalid requests

## Limitations

- File size limit: 10MB per upload
- Supported file types: PDF only for uploads
- Requires active internet connection for OpenAI and Weaviate
- Session history is stored in memory (resets on server restart)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC

## Support

For issues and questions, please create an issue in the repository or contact the development team.

---

**Note**: This chatbot is designed for financial information queries. Always verify important financial decisions with official sources and financial advisors.