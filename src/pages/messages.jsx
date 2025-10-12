import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { User } from '../entities/User';
import { Chat } from '../entities/chat';
import { Skeleton } from '../components/ui/skeleton';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

// Sub-component for displaying a single chat in the conversation list
const ChatListItem = ({ chat, currentUserId, onSelect, isActive, users }) => {
    const otherUserId = chat.participants.find(p => p !== currentUserId);
    const otherUser = users[otherUserId];
    const unreadCount = chat.unreadCount?.[currentUserId] || 0;

    return (
        <button 
            onClick={() => onSelect(chat)} 
            className={cn(
                'w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors',
                isActive ? 'bg-blue-100' : 'hover:bg-gray-50'
            )}
        >
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {otherUser?.profile_photo_url ? <img src={otherUser.profile_photo_url} alt={otherUser.full_name} className="w-full h-full object-cover" /> : <span>{otherUser?.full_name?.charAt(0) || '?'}</span>}
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="font-semibold truncate">{otherUser?.full_name || 'Loading...'}</p>
                <p className={cn("text-sm truncate", unreadCount > 0 ? "text-blue-600 font-bold" : "text-gray-500")}>{chat.lastMessage}</p>
            </div>
            {unreadCount > 0 && <Badge className="bg-blue-500 text-white flex-shrink-0">{unreadCount}</Badge>}
        </button>
    );
};

// Main component for the Messages page
export default function Messages() {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState({}); // To cache user profiles
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      const currentUser = await User.me();
      if (!currentUser) return;
      setUser(currentUser);

      const unsubscribe = Chat.onUserChatsSnapshot(currentUser.id, async (userChats) => {
        setChats(userChats);
        
        const participantIds = new Set(userChats.flatMap(c => c.participants));
        const profilesToFetch = Array.from(participantIds).filter(id => !users[id]);

        if (profilesToFetch.length > 0) {
            const profiles = {};
            for (const id of profilesToFetch) {
                profiles[id] = await User.get(id);
            }
            setUsers(prev => ({ ...prev, ...profiles }));
        }
        
        const chatIdFromUrl = searchParams.get('chatId');
        if (chatIdFromUrl) {
            const chatToSelect = userChats.find(c => c.id === chatIdFromUrl);
            if (chatToSelect) handleSelectChat(chatToSelect);
            // Clean URL after selecting chat to avoid re-selecting on refresh
            navigate('/messages', { replace: true });
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    };
    loadData();
  }, [searchParams, navigate]);
  
  useEffect(() => {
    if (selectedChat) {
      const unsubscribe = Chat.onMessagesSnapshot(selectedChat.id, setMessages);
      return () => unsubscribe();
    }
  }, [selectedChat]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    // Mark the chat as read when it's selected
    if (user && chat.unreadCount?.[user.id] > 0) {
      Chat.markChatAsRead(chat.id, user.id);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedChat || isSending) return;
    
    const recipientId = selectedChat.participants.find(p => p !== user.id);
    setIsSending(true);
    try {
      await Chat.sendMessage(selectedChat.id, user.id, recipientId, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
    setIsSending(false);
  };

  const otherUser = selectedChat ? users[selectedChat.participants.find(p => p !== user?.id)] : null;
  
  if (isLoading) {
    return (
        <div className="p-6 md:p-8 h-full">
            <Skeleton className="h-full w-full rounded-xl" />
        </div>
    );
  }

  return (
    <div className="h-full flex">
        {/* Sidebar with conversation list */}
        <div className={cn("w-full md:w-1/3 border-r flex-col h-full", selectedChat ? "hidden md:flex" : "flex")}>
            <div className="p-4 border-b flex-shrink-0">
                <h1 className="text-2xl font-bold">Conversations</h1>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {chats.length > 0 ? chats.map(chat => (
                    <ChatListItem key={chat.id} chat={chat} currentUserId={user.id} onSelect={handleSelectChat} isActive={selectedChat?.id === chat.id} users={users} />
                )) : (
                    <div className="text-center text-gray-500 pt-10 px-4">
                        <MessageSquare className="w-12 h-12 mx-auto mb-2" />
                        <p>No conversations yet. Start a chat from a user's profile!</p>
                    </div>
                )}
            </div>
        </div>

        {/* Main chat window */}
        <div className={cn("w-full flex-col h-full", selectedChat ? "flex" : "hidden md:flex")}>
            {selectedChat ? (
                <>
                    <div className="p-4 border-b flex items-center gap-3 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={() => setSelectedChat(null)}><ArrowLeft className="w-5 h-5" /></Button>
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {otherUser?.profile_photo_url ? <img src={otherUser.profile_photo_url} alt={otherUser.full_name} className="w-full h-full object-cover" /> : <span>{otherUser?.full_name?.charAt(0) || '?'}</span>}
                        </div>
                        <p className="font-semibold">{otherUser?.full_name || '...'}</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex items-start gap-3 ${msg.from === user.id ? 'justify-end' : ''}`}>
                                 <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.from === user.id ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                                    <p>{msg.text}</p>
                                    <p className="text-xs mt-1 text-right opacity-70">{msg.timestamp ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}</p>
                                 </div>
                            </div>
                        ))}
                         <div ref={messagesEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3 p-4 border-t bg-white flex-shrink-0">
                        <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." autoComplete="off" />
                        <Button type="submit" disabled={isSending}><Send className="w-4 h-4" /></Button>
                    </form>
                </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                    <MessageSquare className="w-16 h-16 mb-4" />
                    <h2 className="text-xl font-semibold">Your Messages</h2>
                    <p>Select a conversation from the left to start chatting.</p>
                </div>
            )}
        </div>
    </div>
  );
}

