import { db } from "../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";

const tasksCollection = collection(db, "tasks");

export const Task = {
  list: async (sort = "created_date", lim = 100) => {
    const q = query(tasksCollection, orderBy(sort, "desc"), firestoreLimit(lim));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  get: async (id) => {
    const taskDocRef = doc(db, "tasks", id);
    const taskDoc = await getDoc(taskDocRef);
    if (taskDoc.exists()) {
        return { id: taskDoc.id, ...taskDoc.data() };
    }
    return null;
  },

  filter: async (filters, sort = "created_date", lim = 100) => {
    let q = query(tasksCollection);
    for (const key in filters) {
        q = query(q, where(key, "==", filters[key]));
    }
    q = query(q, orderBy(sort, "desc"), firestoreLimit(lim));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  getCompletedByUser: async (userId) => {
    const q = query(
      tasksCollection,
      where("assignee_id", "==", userId),
      where("status", "==", "completed"),
      orderBy("completion_date", "desc"),
      firestoreLimit(10)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  createHireRequest: async (taskId, requestData) => {
    const requestsCollection = collection(db, "tasks", taskId, "hire_requests");
    await addDoc(requestsCollection, {
      ...requestData,
      timestamp: serverTimestamp(),
      status: 'pending'
    });
  },

  onHireRequestsSnapshot: (taskId, callback) => {
    const requestsCollection = collection(db, "tasks", taskId, "hire_requests");
    const q = query(requestsCollection, where("status", "==", "pending"), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), taskId }));
      callback(requests);
    });
  },

  updateHireRequest: async (taskId, requestId, data) => {
    const requestDocRef = doc(db, "tasks", taskId, "hire_requests", requestId);
    await updateDoc(requestDocRef, data);
  },

  create: async (data) => {
    const docRef = await addDoc(tasksCollection, {
      ...data,
      created_date: serverTimestamp(),
    });
    return { id: docRef.id, ...data };
  },

  update: async (id, data) => {
    const taskDocRef = doc(db, "tasks", id);
    await updateDoc(taskDocRef, data);
  },

  delete: async (id) => {
    const taskDocRef = doc(db, "tasks", id);
    await deleteDoc(taskDocRef);
  },
};

