import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopflow_db';
await mongoose.connect(uri);
const hashed = await bcrypt.hash('mondher1234', 12);
const result = await mongoose.connection.db.collection('users').findOneAndUpdate(
  { email: 'mondher.1857@gmail.com' },
  { $set: { password: hashed, loginAttempts: 0, lockUntil: null } },
  { returnDocument: 'after', projection: { email: 1, role: 1 } }
);
console.log('Password reset for:', JSON.stringify(result));
await mongoose.disconnect();
