import React, { useState, useEffect, useRef } from 'react';
import { User } from '../entities/User';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Send, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import UserProfileModal from '../components/ui/userprofilemodal';

export default function CommunityChat() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    const loadUserAndMessages = async () => {
      setIsLoading(true);
      const currentUser = await User.me();
      setUser(currentUser);

      if (!currentUser || !currentUser.city) {
        setIsLoading(false);
        return;
      }

      const messagesQuery = query(
        collection(db, 'community_chats'),
        where('city', '==', currentUser.city.toLowerCase()),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
        const fetchedMessages = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(fetchedMessages);
        setIsLoading(false);
      }, (error) => {
          console.error("Error fetching messages:", error);
          setIsLoading(false);
      });

      return () => unsubscribe();
    };

    loadUserAndMessages();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isSending) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, 'community_chats'), {
        text: newMessage,
        city: user.city.toLowerCase(),
        timestamp: serverTimestamp(),
        userId: user.id,
        userName: user.full_name,
        userPhotoURL: user.profile_photo_url || null,
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
    setIsSending(false);
  };
  
  const openProfileModal = (userId) => {
      if(userId !== user.id) {
          setSelectedUserId(userId);
      }
  }

  if (isLoading) {
    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
            <Skeleton className="h-10 w-64 mb-6" />
            <Skeleton className="h-[60vh] rounded-xl" />
        </div>
    );
  }

  if (!user?.city) {
    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
            <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Join the Conversation</h2>
                    <p className="text-gray-600 mb-6">Please add your city to your profile to join your local community chat.</p>
                    <Button onClick={() => navigate(createPageUrl("Profile"))}>Go to Profile</Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <>
      {selectedUserId && <UserProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}
    
      {/* This main container is now a flex column that takes the full height */}
      <div className="p-6 md:p-8 max-w-4xl mx-auto h-full flex flex-col">
          <div className="mb-8 flex-shrink-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Chat: {user.city}</h1>
              <p className="text-gray-600">Connect with other TimeBank members in your area.</p>
          </div>

          {/* This card is now a flex container that grows to fill available space */}
          <Card className="border-none shadow-lg flex-1 flex flex-col overflow-hidden">
              <CardHeader className="border-b flex-shrink-0">
                  <CardTitle className="flex items-center gap-2">
                      <Users className="w-6 h-6 text-blue-600" />
                      <span>Local Chat</span>
                  </CardTitle>
              </CardHeader>
              {/* This content area is the only part that scrolls */}
              <CardContent className="p-6 flex-1 overflow-y-auto space-y-4">
                  {messages.map((msg) => (
                      <div key={msg.id} className={`flex items-start gap-3 ${msg.userId === user.id ? 'justify-end' : ''}`}>
                          {msg.userId !== user.id && (
                              <button onClick={() => openProfileModal(msg.userId)} className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                  {msg.userPhotoURL ? <img src={msg.userPhotoURL} alt={msg.userName} className="w-full h-full object-cover" /> : <span>{msg.userName?.charAt(0) || 'U'}</span>}
                              </button>
                          )}
                          <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.userId === user.id ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                              {msg.userId !== user.id && <button onClick={() => openProfileModal(msg.userId)} className="font-semibold text-sm mb-1 text-blue-700 hover:underline focus:outline-none">{msg.userName}</button>}
                              <p>{msg.text}</p>
                              <p className={`text-xs mt-2 ${msg.userId === user.id ? 'text-blue-100' : 'text-gray-500'}`}>{msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString() : 'sending...'}</p>
                          </div>
                          {msg.userId === user.id && (
                              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {user.profile_photo_url ? <img src={user.profile_photo_url} alt={user.full_name} className="w-full h-full object-cover" /> : <span className="text-white">{user.full_name?.charAt(0) || 'U'}</span>}
                              </div>
                          )}
                      </div>
                  ))}
                  <div ref={messagesEndRef} />
              </CardContent>
              {/* This input area is fixed at the bottom of the card */}
              <div className="p-4 border-t bg-gray-50 flex-shrink-0">
                  <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                      <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          autoComplete="off"
                      />
                      <Button type="submit" disabled={isSending} className="bg-gradient-to-r from-blue-500 to-green-500">
                          <Send className="w-4 h-4" />
                      </Button>
                  </form>
              </div>
          </Card>
      </div>
    </>
  );
}

