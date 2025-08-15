// server/index.js
import express from "express";
import "./config.js";
import chatRoute from "./routes/chat.js";
import cors from "cors";
import multer from "multer"; 

import { createCollection, loadDataToDb } from "./Weaviate/util.js";
const app = express();

const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory (you can also use diskStorage)
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/chat", upload.any(),chatRoute);
const collectionName = process.env.collectionName;
const columnName = process.env.columnName;

await createCollection(collectionName, [
  { name: columnName, dataType: "text" },
]);
await loadDataToDb(
  collectionName,
  columnName,
  "https://www.bajajfinserv.in/tnc-home-loan",
  "web"
);
await loadDataToDb(
  collectionName,
  columnName,
  "https://bajajhousingfinance.in/home-loan-eligibility-and-documents",
  "web"
);
await loadDataToDb(
  collectionName,
  columnName,
  "https://www.bajajfinserv.in/personal-loan-eligibility-and-documents",
  "web"
);
await loadDataToDb(
  collectionName,
  columnName,
  "./resources/detailed-tncs-applicable-for-personal-loan.pdf",
  "pdf"
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
