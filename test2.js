import mongoose from 'mongoose';
import User from '../../../../Downloads/projet-pointage/src/models/User.js';
import dbConnect from '../../../../Downloads/projet-pointage/src/lib/db.js';
import { signToken } from '../../../../Downloads/projet-pointage/src/lib/auth.js';
import axios from 'axios';

async function run() {
  await dbConnect();
  const admin = await User.findOne({ role: 'ADMIN' });
  if (!admin) {
    console.log('No admin found');
    process.exit(1);
  }
  const token = signToken({ userId: admin._id, role: admin.role });
  
  try {
    const res = await axios.get('http://localhost:3000/api/pointage', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Pointages count:', res.data.length);
  } catch(e) {
    console.log('Error GET pointage:', e.response?.data || e.message);
  }

  process.exit(0);
}

run();
