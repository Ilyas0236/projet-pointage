import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

async function checkDb() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({ email: 'ilyaina@gmail.com' });
  const todayStart = new Date();
  todayStart.setUTCHours(0,0,0,0);
  const pointages = await db.collection('pointages').find({ employe: user._id, date: { $gte: todayStart } }).toArray();
  console.log('Pointages:');
  pointages.forEach(p => console.log(`Type: ${p.type}, Date: ${p.date}`));
  mongoose.disconnect();
}

checkDb();

checkDb();
