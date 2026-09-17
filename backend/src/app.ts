import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { apiRouter } from './routes';
import { errorHandler } from './middlewares/error-handler';
import { NotFoundError } from './errors/not-found-error';

export const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.use('/api', apiRouter);

app.all('*', () => {
  throw new NotFoundError();
});

app.use(errorHandler);
