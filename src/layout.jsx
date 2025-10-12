import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { createPageUrl } from "@/utils";
import { Chat } from "@/entities/chat"; // Import Chat entity
import {
  Home, Compass, ListChecks, UserCircle, PlusCircle, Clock, LogOut, Users, MessageSquare
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // Import Badge
import HelpBox from '@/components/ui/helpbox';
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const navigationItems = [
  { title: "Dashboard", url: createPageUrl("Dashboard"), icon: Home },
  { title: "Explore Tasks", url: createPageUrl("Explore"), icon: Compass },
  { title: "My Tasks", url: createPageUrl("MyTasks"), icon: ListChecks },
  { title: "Messages", url: createPageUrl("Messages"), icon: MessageSquare },
  { title: "Community Chat", url: createPageUrl("Community"), icon: Users },
  { title: "Profile", url: createPageUrl("Profile"), icon: UserCircle },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    if (auth.currentUser) {
      // Listener for the user's profile data
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUser({ id: doc.id, ...doc.data() });
        } else {
          console.error("Current user's document not found in Firestore.");
          setUser(null);
        }
      });
      
      // Listener for the user's chats to calculate total unread messages
      const unsubscribeChats = Chat.onUserChatsSnapshot(auth.currentUser.uid, (chats) => {
        const total = chats.reduce((acc, chat) => acc + (chat.unreadCount?.[auth.currentUser.uid] || 0), 0);
        setTotalUnread(total);
      });

      // Cleanup both listeners on component unmount
      return () => {
        unsubscribeUser();
        unsubscribeChats();
      };
    } else {
      // Clear state if user logs out
      setUser(null);
      setTotalUnread(0);
    }
  }, [auth.currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  return (
    <SidebarProvider>
      <div className="h-screen flex w-full overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Sidebar className="border-r border-gray-200 bg-white/80 backdrop-blur-sm">
          <SidebarHeader className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">TimeBank</h2>
                <p className="text-xs text-gray-500">Exchange Time, Build Community</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-3">
              {user && (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl text-white shadow-lg">
                  <div className="text-sm opacity-90 mb-1">Your Time Credits</div>
                  <div className="text-3xl font-bold flex items-center gap-2">{user.time_credits || 0}<span className="text-sm font-normal opacity-90">min</span></div>
                </div>
              )}
              <SidebarGroup>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {navigationItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-lg mb-1 ${ location.pathname === item.url ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white hover:text-white' : '' }`}>
                                    <Link to={item.url} className="flex items-center justify-between gap-3 px-3 py-3 w-full">
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium">{item.title}</span>
                                        </div>
                                        {item.title === "Messages" && totalUnread > 0 && (
                                            <Badge className="bg-white text-blue-600">{totalUnread}</Badge>
                                        )}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <div className="mt-4 px-3">
                <Link to={createPageUrl("CreateTask")}>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white shadow-lg"><PlusCircle className="w-5 h-5 mr-2" />Create Task</Button>
                </Link>
              </div>
          </SidebarContent>
          <SidebarFooter className="border-t border-gray-200 p-4">
              {user && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-green-400 rounded-full flex items-center justify-center overflow-hidden">
                      {user.profile_photo_url ? <img src={user.profile_photo_url} alt="You" className="w-full h-full object-cover" /> : <span className="text-white font-semibold text-sm">{user.full_name?.charAt(0) || 'U'}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleLogout} size="sm"><LogOut className="w-4 h-4 mr-2" />Logout</Button>
                </div>
              )}
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 flex flex-col h-screen">
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4 md:hidden sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">TimeBank</h1>
            </div>
          </header>
          <div className="flex-1 relative overflow-y-auto">
            {children}
            <HelpBox />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

