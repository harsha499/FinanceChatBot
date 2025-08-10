import express from 'express';
import { getRAGAnswer } from '../rag.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { message } = req.body;

  if (!message) return res.status(400).json({ error: 'No message provided' });

  try {
    const answer = await getRAGAnswer(message);
    res.json({ response: answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get response' });
  }
});

export default router;
