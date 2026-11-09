import 'dotenv/config';
import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.get('/api/health', (_req, res) => {
  res.status(200).json({ data: { status: 'ok' } });
});

app.listen(port, () => {
  console.log(`API démarrée sur le port ${port}`);
});
