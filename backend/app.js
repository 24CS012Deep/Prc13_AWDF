require('dotenv').config();
const express = require('express');
const cors = require('cors');

const aiRoutes = require('./routes/aiRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'AI Task Assistant API',
    timestamp: new Date().toISOString()
  });
});

// Mounted Routes
app.use('/api/ai', aiRoutes);
app.use('/api/tasks', taskRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error'
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 AI Task Assistant Server running on http://localhost:${PORT}`);
    console.log(`📡 AI Provider: ${process.env.AI_PROVIDER || 'heuristic-fallback'}`);
  });
}

module.exports = app;
