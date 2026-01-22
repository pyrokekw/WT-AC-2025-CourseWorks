import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import sourcesRoutes from './routes/sources.routes';
import feedRoutes from './routes/feed.routes';
import tagsRoutes from './routes/tags.routes';
import favoritesRoutes from './routes/favorites.routes';
import reportsRoutes from './routes/reports.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(cookieParser());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'News Aggregator API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
    },
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/sources', sourcesRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/reports', reportsRoutes);

// Error handling
app.use(errorHandler);

export default app;
