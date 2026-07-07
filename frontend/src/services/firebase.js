import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  enableNetwork,
  disableNetwork,
  onSnapshot,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAVHt5-CfztQeqF-coXkn-E-Yo1ia9zMb8",
  authDomain: "quick-step-cycles.firebaseapp.com",
  projectId: "quick-step-cycles",
  storageBucket: "quick-step-cycles.firebasestorage.app",
  messagingSenderId: "251473196708",
  appId: "1:251473196708:web:8d1de7f695af7f23acd831"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with MULTI-TAB persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Collection names
export const COLLECTIONS = {
  TENANTS: 'tenants',
  BIKES: 'bikes',
  CUSTOMERS: 'customers',
  RENTALS: 'rentals',
  EXPENSES: 'expenses',
  SETTINGS: 'settings'
};

// Track online/offline status
export const networkStatus = {
  online: true,
  listeners: [],
  
  setOnline(status) {
    this.online = status;
    this.listeners.forEach(cb => cb(status));
  },
  
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
};

// Monitor network status
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    networkStatus.setOnline(true);
    enableNetwork(db).catch(console.error);
  });
  
  window.addEventListener('offline', () => {
    networkStatus.setOnline(false);
    disableNetwork(db).catch(console.error);
  });
}

// Helper function
const handleResponse = async (promise, successMessage) => {
  try {
    const result = await promise;
    return { success: true, data: result, message: successMessage };
  } catch (error) {
    console.error("Firebase error:", error);
    return { success: false, error: error.message };
  }
};

// ========== TENANT FUNCTIONS ==========
export const createTenant = async (tenantData) => {
  return handleResponse(
    addDoc(collection(db, COLLECTIONS.TENANTS), {
      ...tenantData,
      createdAt: serverTimestamp()
    }),
    "Tenant created successfully"
  );
};

export const getTenantByLicense = async (licenseKey) => {
  try {
    const q = query(collection(db, COLLECTIONS.TENANTS), where("licenseKey", "==", licenseKey));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { success: true, data: { id: doc.id, ...doc.data() } };
    }
    return { success: false, error: "Tenant not found" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== BIKES FUNCTIONS ==========
export const getBikes = (tenantId, callback) => {
  if (!tenantId) return () => {};
  
  const q = query(
    collection(db, COLLECTIONS.TENANTS, tenantId, COLLECTIONS.BIKES),
    orderBy("createdAt", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const bikes = [];
    snapshot.forEach((doc) => {
      bikes.push({ id: doc.id, ...doc.data() });
    });
    callback(bikes);
  }, (error) => {
    console.error("Bikes listener error:", error);
  });
};

export const addBike = async (tenantId, bikeData) => {
  if (!tenantId) return { success: false, error: "No tenant ID" };
  
  const bikesRef = collection(db, COLLECTIONS.TENANTS, tenantId, COLLECTIONS.BIKES);
  return handleResponse(
    addDoc(bikesRef, {
      ...bikeData,
      createdAt: serverTimestamp()
    }),
    "Bike added"
  );
};

// ========== BATCH BIKE ADDITION ==========
export const addBikesBatch = async (tenantId, bikeNames) => {
  if (!tenantId) return { success: false, error: "No tenant ID" };
  if (!bikeNames.length) return { success: false, error: "No bikes to add" };
  
  const bikesRef = collection(db, COLLECTIONS.TENANTS, tenantId, COLLECTIONS.BIKES);
  const results = [];
  const errors = [];
  
  const BATCH_SIZE = 5;
  
  for (let i = 0; i < bikeNames.length; i += BATCH_SIZE) {
    const batch = bikeNames.slice(i, i + BATCH_SIZE);
    
    const promises = batch.map(name => 
      addDoc(bikesRef, {
        name,
        status: 'active',
        createdAt: serverTimestamp()
      }).then(ref => ({ success: true, id: ref.id, name }))
        .catch(err => ({ success: false, error: err.message, name }))
    );
    
    const batchResults = await Promise.all(promises);
    batchResults.forEach(r => {
      if (r.success) results.push(r);
      else errors.push(r);
    });
  }
  
  return {
    success: errors.length === 0,
    added: results.length,
    failed: errors.length,
    errors
  };
};

// ========== CUSTOMERS FUNCTIONS ==========
export const getCustomers = (tenantId, callback) => {
  if (!tenantId) return () => {};
  
  const q = query(
    collection(db, COLLECTIONS.TENANTS, tenantId, COLLECTIONS.CUSTOMERS),
    orderBy("createdAt", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const customers = [];
    snapshot.forEach((doc) => {
      customers.push({ id: doc.id, ...doc.data() });
    });
    callback(customers);
  });
};

export const addCustomer = async (tenantId, customerData) => {
  const customersRef = collection(db, COLLECTIONS.TENANTS, tenantId, COLLECTIONS.CUSTOMERS);
  return handleResponse(
    addDoc(customersRef, {
      ...customerData,
      createdAt: serverTimestamp()
    }),
    "Customer added"
  );
};

// ========== RENTALS FUNCTIONS ==========
export const getActiveRentals = (tenantId, callback) => {
  if (!tenantId) return () => {};
  
  const q = query(
    collection(db, COLLECTIONS.TENANTS, tenantId, COLLECTIONS.RENTALS),
    where("status", "==", "ACTIVE"),
    orderBy("startTime", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const rentals = [];
    snapshot.forEach((doc) => {
      rentals.push({ id: doc.id, ...doc.data() });
    });
    callback(rentals);
  });
};

export const startRental = async (tenantId, rentalData) => {
  const rentalsRef = collection(db, COLLECTIONS.TENANTS, tenantId, COLLECTIONS.RENTALS);
  
  const bikesQuery = query(
    collection(db, COLLECTIONS.TENANTS, tenantId, COLLECTIONS.BIKES),
    where("name", "==", rentalData.bikeName)
  );
  
  const bikeSnapshot = await getDocs(bikesQuery);
  if (!bikeSnapshot.empty) {
    const bikeDoc = bikeSnapshot.docs[0];
    await updateDoc(doc(db, COLLECTIONS.TENANTS, tenantId, COLLECTIONS.BIKES, bikeDoc.id), {
      status: 'rented'
    });
  }
  
  return handleResponse(
    addDoc(rentalsRef, {
      ...rentalData,
      startTime: new Date().toISOString(),
      status: "ACTIVE",
      createdAt: serverTimestamp()
    }),
    "Rental started"
  );
};

export const endRental = async (tenantId, rentalId, endData) => {
  const rentalRef = doc(db, COLLECTIONS.TENANTS, tenantId, COLLECTIONS.RENTALS, rentalId);
  
  const rentalSnap = await getDoc(rentalRef);
  if (rentalSnap.exists()) {
    const rental = rentalSnap.data();
    
    const bikesQuery = query(
      collection(db, COLLECTIONS.TENANTS, tenantId, COLLECTIONS.BIKES),
      where("name", "==", rental.bikeName)
    );
    
    const bikeSnapshot = await getDocs(bikesQuery);
    if (!bikeSnapshot.empty) {
      const bikeDoc = bikeSnapshot.docs[0];
      await updateDoc(doc(db, COLLECTIONS.TENANTS, tenantId, COLLECTIONS.BIKES, bikeDoc.id), {
        status: 'active'
      });
    }
  }
  
  return handleResponse(
    updateDoc(rentalRef, {
      ...endData,
      status: "COMPLETED",
      endTime: new Date().toISOString()
    }),
    "Rental completed"
  );
};

// ========== EXPENSES FUNCTIONS ==========
export const getExpenses = (tenantId, callback) => {
  if (!tenantId) return () => {};
  
  const q = query(
    collection(db, COLLECTIONS.TENANTS, tenantId, COLLECTIONS.EXPENSES),
    orderBy("date", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const expenses = [];
    snapshot.forEach((doc) => {
      expenses.push({ id: doc.id, ...doc.data() });
    });
    callback(expenses);
  });
};

export const addExpense = async (tenantId, expenseData) => {
  const expensesRef = collection(db, COLLECTIONS.TENANTS, tenantId, COLLECTIONS.EXPENSES);
  return handleResponse(
    addDoc(expensesRef, {
      ...expenseData,
      amount: Number(expenseData.amount),
      createdAt: serverTimestamp()
    }),
    "Expense added"
  );
};

// ========== SETTINGS FUNCTIONS ==========
export const getSettings = async (tenantId) => {
  const settingsRef = collection(db, COLLECTIONS.TENANTS, tenantId, COLLECTIONS.SETTINGS);
  const snapshot = await getDocs(settingsRef);
  
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { success: true, data: { id: doc.id, ...doc.data() } };
  }
  return { success: true, data: null };
};

export const saveSettings = async (tenantId, settingsData) => {
  const settingsRef = collection(db, COLLECTIONS.TENANTS, tenantId, COLLECTIONS.SETTINGS);
  const snapshot = await getDocs(settingsRef);
  
  if (snapshot.empty) {
    return handleResponse(
      addDoc(settingsRef, settingsData),
      "Settings saved"
    );
  } else {
    const docId = snapshot.docs[0].id;
    return handleResponse(
      updateDoc(doc(db, COLLECTIONS.TENANTS, tenantId, COLLECTIONS.SETTINGS, docId), settingsData),
      "Settings updated"
    );
  }
};

export default db;