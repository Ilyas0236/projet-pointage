import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

async function checkDb() {
  await mongoose.connect(MONGODB_URI);
  
  // Check users
  const User = mongoose.connection.collection('users');
  const employees = await User.find({ role: 'EMPLOYE', actif: true }).toArray();
  console.log(`Trouvé ${employees.length} employés actifs.`);
  
  // Check anomalies today
  const Anomalie = mongoose.connection.collection('anomalies');
  const todayStart = new Date();
  todayStart.setUTCHours(0,0,0,0);
  const anomalies = await Anomalie.find({ date: { $gte: todayStart } }).toArray();
  console.log(`Trouvé ${anomalies.length} anomalies aujourd'hui.`);
  
  // Check notifications today
  const Notification = mongoose.connection.collection('notifications');
  const notifs = await Notification.find({ createdAt: { $gte: todayStart } }).toArray();
  console.log(`Trouvé ${notifs.length} notifications aujourd'hui.`);

  mongoose.disconnect();
}

checkDb();
