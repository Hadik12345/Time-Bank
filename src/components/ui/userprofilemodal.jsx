import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/entities/User';
import { Task } from '@/entities/Task';
import { Chat } from '@/entities/chat';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { X, User as UserIcon, CheckCircle, TrendingUp, Clock, MessageSquare, ShieldCheck } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { getAuth } from 'firebase/auth';

export default function UserProfileModal({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) return;
      setIsLoading(true);
      try {
        const userProfile = await User.get(userId);
        setProfile(userProfile);
        const tasks = await Task.getCompletedByUser(userId);
        setCompletedTasks(tasks);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
      setIsLoading(false);
    };
    fetchProfileData();
  }, [userId]);
  
  const handleStartChat = async () => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId || !userId) return;

    setIsStartingChat(true);
    try {
      const chatId = await Chat.findOrCreateChat(currentUserId, userId);
      onClose();
      navigate(createPageUrl(`Messages?chatId=${chatId}`));
    } catch (error) {
        console.error("Error starting chat:", error);
    }
    setIsStartingChat(false);
  };

  const impactScore = ((profile?.total_tasks_completed || 0) + (profile?.total_tasks_received || 0)) * 10;
  const isOrganization = profile?.account_type === 'organization';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-in zoom-in-95">
        <header className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">{isOrganization ? "Organization Profile" : "User Profile"}</h2>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}><X className="w-5 h-5" /></Button>
        </header>
        <main className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="w-full h-48" />
            </div>
          ) : profile ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white text-4xl font-bold overflow-hidden mb-4">
                    {profile.profile_photo_url ? <img src={profile.profile_photo_url} alt={profile.full_name} className="w-full h-full object-cover" /> : <span>{profile.full_name?.charAt(0) || 'U'}</span>}
                </div>
                <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-gray-900">{profile.full_name}</h3>
                    {isOrganization && profile.is_verified && <Badge className="bg-green-100 text-green-700"><ShieldCheck className="w-3 h-3 mr-1"/>Verified</Badge>}
                </div>
                <p className="text-sm text-gray-500">{profile.city}, {profile.country}</p>
              </div>
              <Button onClick={handleStartChat} disabled={isStartingChat} className="w-full bg-gradient-to-r from-blue-500 to-green-500">
                <MessageSquare className="w-4 h-4 mr-2" />
                {isStartingChat ? "Starting Chat..." : `Message ${profile.full_name.split(' ')[0]}`}
              </Button>
              {profile.bio && <p className="text-gray-700 italic border-l-4 border-gray-200 pl-4">{profile.bio}</p>}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg"><CheckCircle className="w-6 h-6 text-blue-500 mx-auto mb-1" /><p className="text-2xl font-bold">{profile.total_tasks_completed || 0}</p><p className="text-xs text-gray-600">{isOrganization ? "Tasks Hosted" : "Tasks Completed"}</p></div>
                <div className="p-4 bg-green-50 rounded-lg"><TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-1" /><p className="text-2xl font-bold">{impactScore}</p><p className="text-xs text-gray-600">Impact Score</p></div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">{isOrganization ? "Skills/Services Needed" : "Skills"}</h4>
                <div className="flex flex-wrap gap-2">{profile.skills?.length > 0 ? profile.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>) : <p className="text-sm text-gray-500">No skills listed.</p>}</div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Recently Completed Tasks</h4>
                <div className="space-y-2">{completedTasks.length > 0 ? completedTasks.slice(0, 3).map(task => <div key={task.id} className="p-3 bg-gray-50 rounded-lg text-sm"><p className="font-medium text-gray-800">{task.title}</p></div>) : <p className="text-sm text-gray-500">No completed tasks yet.</p>}</div>
              </div>
            </div>
          ) : ( <div className="text-center py-10"><UserIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" /><p className="text-gray-600">Could not load user profile.</p></div> )}
        </main>
      </div>
    </div>
  );
}