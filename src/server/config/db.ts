import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Disable buffering so queries fail immediately or switch to memory store instead of hanging
mongoose.set('bufferCommands', false);

export interface DbStatus {
  connected: boolean;
  mode: 'mongodb_atlas' | 'fallback_in_memory';
  host?: string;
  database?: string;
}

export const dbStatus: DbStatus = {
  connected: false,
  mode: 'fallback_in_memory',
};

export const isDbConnected = (): boolean => {
  return dbStatus.mode === 'mongodb_atlas' && mongoose.connection.readyState === 1;
};

export const connectDB = async (): Promise<DbStatus> => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('MY_MONGODB_URI')) {
    console.warn(
      '⚠️ MONGODB_URI not configured or contains placeholder credentials. Initializing in high-performance in-memory persistence mode for development/preview.'
    );
    dbStatus.connected = true;
    dbStatus.mode = 'fallback_in_memory';
    return dbStatus;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    dbStatus.connected = true;
    dbStatus.mode = 'mongodb_atlas';
    dbStatus.host = conn.connection.host;
    dbStatus.database = conn.connection.name;
    return dbStatus;
  } catch (error: any) {
    console.warn(`⚠️ MongoDB Atlas connection error: ${error.message}. Running with fallback memory database.`);
    dbStatus.connected = false;
    dbStatus.mode = 'fallback_in_memory';
    return dbStatus;
  }
};
