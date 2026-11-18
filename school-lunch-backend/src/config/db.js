import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Connect to MongoDB. Used by src/server.js (app) and tests.
 */
export const connectDB = async () => {
  const conn = await mongoose.connect(env.MONGODB_URI, {
    autoIndex: true,
  });
  console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  return conn;
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log('✅ MongoDB disconnected');
};