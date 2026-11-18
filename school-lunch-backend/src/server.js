import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

const startServer = async () => {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on http://localhost:${env.PORT}`);
    console.log(`📍 API base: http://localhost:${env.PORT}/api`);
    console.log(`🔐 CORS origin: ${env.FRONTEND_ORIGIN}`);
    console.log(`🧪 Environment: ${env.NODE_ENV}`);
  });
};

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});