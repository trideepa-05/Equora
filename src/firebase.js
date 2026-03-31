import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "equora-e939c.firebaseapp.com",
    projectId: "equora-e939c",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ✅ CREATE BILL
export const createBill = async (billData) => {
    await addDoc(collection(db, "bills"), billData);
};

// ✅ REAL-TIME FETCH
export const subscribeBills = (callback) => {
    return onSnapshot(collection(db, "bills"), (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        callback(data);
    });
};