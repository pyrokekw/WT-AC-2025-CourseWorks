import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import reportRouter from './routes/reports';
import categoryRouter from './routes/categories';
import commentRouter from './routes/comments'


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/reports', reportRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/comments', commentRouter)

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});