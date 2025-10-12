import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
} from 'firebase/firestore';

const chatsCollection = collection(db, 'chats');

export const Chat = {
  findOrCreateChat: async (user1Id, user2Id) => {
    const participants = [user1Id, user2Id].sort();
    const q = query(chatsCollection, where('participants', '==', participants));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id;
    } else {
      const docRef = await addDoc(chatsCollection, {
        participants,
        participantInfo: {},
        lastMessage: "Chat created",
        lastUpdated: serverTimestamp(),
        // Initialize unread counts for both users
        unreadCount: {
          [user1Id]: 0,
          [user2Id]: 0,
        },
      });
      return docRef.id;
    }
  },

  onUserChatsSnapshot: (userId, callback) => {
    const q = query(
        chatsCollection, 
        where('participants', 'array-contains', userId),
        orderBy('lastUpdated', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(chats);
    });
  },
  
  onMessagesSnapshot: (chatId, callback) => {
    const messagesCollection = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesCollection, orderBy('timestamp', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(messages);
    });
  },

  sendMessage: async (chatId, fromId, toId, text) => {
    const messagesCollection = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesCollection, {
      from: fromId,
      to: toId,
      text: text,
      timestamp: serverTimestamp(),
      read: false, // Mark new messages as unread
    });
    
    const chatDocRef = doc(db, 'chats', chatId);
    await updateDoc(chatDocRef, {
        lastMessage: text,
        lastUpdated: serverTimestamp(),
        // Increment the unread count for the recipient
        [`unreadCount.${toId}`]: increment(1)
    });
  },

  markChatAsRead: async (chatId, userId) => {
    const chatDocRef = doc(db, 'chats', chatId);
    await updateDoc(chatDocRef, {
      // Reset the unread count for the current user
      [`unreadCount.${userId}`]: 0
    });
  },
};