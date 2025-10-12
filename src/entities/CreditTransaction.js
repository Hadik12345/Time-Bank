import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const transactionsCollection = collection(db, "credit_transactions");

export const CreditTransaction = {
  create: async (data) => {
    const docRef = await addDoc(transactionsCollection, {
        ...data,
        transaction_date: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  },
};