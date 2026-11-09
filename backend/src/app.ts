import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middlewares/errorHandler.js';
import { router } from './routers/index.router.js';

const app = express();

// Derrière le proxy de l'hébergeur, l'adresse IP réelle est dans X-Forwarded-For.
// Sans cette ligne, le limiteur de tentatives verrait la même IP pour tous les clients.
// [À FAIRE au déploiement : définir NODE_ENV=production dans l'image de production.]
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Origines autorisées : le frontend local et celui de l'environnement (FRONTEND_URL).
const allowedOrigins: string[] = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({ origin: allowedOrigins }));
app.use(helmet());
app.use(express.json());

app.use('/api', router);

app.use(errorHandler);

export default app;
