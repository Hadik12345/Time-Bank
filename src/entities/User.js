import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";

export const User = {
  me: async () => {
    const user = auth.currentUser;
    if (!user) return null;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return { id: user.uid, ...userDoc.data() };
    } else {
      console.error("No such user document!");
      return null;
    }
  },
  
  get: async (id) => {
    if (!id) return null;
    const userDocRef = doc(db, "users", id);
    const userDoc = await getDoc(userDocRef);
     if (userDoc.exists()) {
      return { id: id, ...userDoc.data() };
    } else {
      console.error("No such user document!");
      return null;
    }
  },

  update: async (id, data) => {
     const userDocRef = doc(db, "users", id);
     
     // Check for incrementable fields and use increment
     const updateData = {};
     if (data.total_tasks_completed) {
         updateData.total_tasks_completed = increment(data.total_tasks_completed);
     }
     if (data.total_tasks_received) {
         updateData.total_tasks_received = increment(data.total_tasks_received);
     }
     // Add other non-incrementable fields
     for (const key in data) {
         if (key !== 'total_tasks_completed' && key !== 'total_tasks_received') {
             updateData[key] = data[key];
         }
     }
     
     await updateDoc(userDocRef, updateData);
  },

  updateMyUserData: async (data) => {
    const user = auth.currentUser;
    if (!user) return null;

    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, data);
  },

  incrementCredits: async (userId, amount) => {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      time_credits: increment(amount)
    });
  },

  decrementCredits: async (userId, amount) => {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      time_credits: increment(-amount)
    });
  },
};