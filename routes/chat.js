import express from "express";
import { getRAGAnswer } from "../rag.js";
import { tmpdir } from "os";
import path from "path";
import { loadDataToDb } from "../Weaviate/util.js";
import fs from "fs";

const router = express.Router();

router.post("/", async (req, res) => {
  const collectionName = process.env.collectionName;
  const columnName = process.env.columnName;
  const {
    body: { message, uuid },
    files,
  } = req;

  if (files.length == 0 && message) {
    try {
      const answer = await getRAGAnswer(message,uuid);
      res.json({ response: answer });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to get response" });
    }
  } else if (files.length > 0 && !message) {
    await uploadFiles(files, collectionName, columnName, res);
    res.json({
      response: "file has been saved successfully! you may now ask queries",
    });
  } else {
    await uploadFiles(files, collectionName, columnName, res);
    const answer = await getRAGAnswer(message);
    res.json({ response: answer });
  }
});
async function uploadFiles(files, collectionName, columnName) {
  const data = files?.[0].buffer;
  const originalName = files?.[0].originalname;
  const tempPath = path.join(tmpdir(), originalName);

  // Save buffer to temp file
  await fs.writeFileSync(tempPath, data);
  const response = await loadDataToDb(
    collectionName,
    columnName,
    tempPath,
    "pdf"
  );
  await fs.unlinkSync(tempPath);
}

export default router;
