import { db } from './services/firebase';
import { collection, getDocs } from 'firebase/firestore';

const testConnection = async () => {
  try {
    const testCollection = collection(db, 'test');
    await getDocs(testCollection);
    console.log('✅ Firebase connected!');
  } catch (error) {
    console.error('❌ Firebase error:', error);
  }
};

testConnection();