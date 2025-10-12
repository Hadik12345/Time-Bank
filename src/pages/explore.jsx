import React, { useState, useEffect } from "react";
import { User } from "../entities/User.js";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { 
  Search, 
  MapPin, 
  Clock, 
  Filter,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import UserProfileModal from "../components/ui/userprofilemodal";

const CATEGORIES = [
  "All", "Tech Support", "Home Help", "Teaching/Tutoring", "Creative Work",
  "Administrative", "Gardening", "Pet Care", "Cooking",
  "Language Practice", "Fitness/Sports", "Other"
];

export default function Explore() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [creators, setCreators] = useState({}); // Cache creator profiles
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [taskTypeFilter, setTaskTypeFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    const loadUserAndTasks = async () => {
      const currentUser = await User.me();
      setUser(currentUser);

      if (!currentUser) {
          setIsLoading(false);
          return;
      }

      const tasksQuery = query(
        collection(db, "tasks"),
        where("status", "==", "open"),
        orderBy("created_date", "desc")
      );

      const unsubscribe = onSnapshot(tasksQuery, async (querySnapshot) => {
        const allTasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const availableTasks = allTasks.filter(task => task.creator_email !== currentUser.email);
        setTasks(availableTasks);

        // Fetch creator profiles for the tasks
        const creatorIds = [...new Set(availableTasks.map(t => t.creator_id))];
        const newCreators = {};
        for(const id of creatorIds) {
            if(!creators[id]) {
                newCreators[id] = await User.get(id);
            }
        }
        setCreators(prev => ({...prev, ...newCreators}));

        setIsLoading(false);
      });

      return () => unsubscribe();
    };
    
    loadUserAndTasks();
  }, []);

  useEffect(() => {
    let filtered = [...tasks];

    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== "All") {
      filtered = filtered.filter(task => task.category === categoryFilter);
    }

    if (taskTypeFilter !== "all") {
      filtered = filtered.filter(task => task.task_type === taskTypeFilter);
    }

    setFilteredTasks(filtered);
  }, [searchQuery, categoryFilter, taskTypeFilter, tasks]);

  const getMatchScore = (task) => {
    if (!user) return 0;
    let score = 0;
    if (task.city === user?.city) score += 50;
    
    const userSkills = user?.skills || [];
    const taskText = `${task.title} ${task.description}`.toLowerCase();
    userSkills.forEach(skill => {
      if (taskText.includes(skill.toLowerCase())) score += 30;
    });

    return score;
  };
  
  const openProfileModal = (e, userId) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedUserId(userId);
  }

  const sortedTasks = [...filteredTasks].sort((a, b) => getMatchScore(b) - getMatchScore(a));

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64 mb-6" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {selectedUserId && <UserProfileModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Tasks</h1>
          <p className="text-gray-600">Find opportunities to help or get help from your community</p>
        </div>

        <Card className="border-none shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={taskTypeFilter} onValueChange={setTaskTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="offer">Offers</SelectItem>
                  <SelectItem value="request">Requests</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {sortedTasks.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters or create a new task</p>
              <Link to={createPageUrl("CreateTask")}>
                <Button className="bg-gradient-to-r from-blue-500 to-green-500">
                  Create Task
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedTasks.map((task) => {
              const matchScore = getMatchScore(task);
              const isHighMatch = matchScore >= 50;
              const creator = creators[task.creator_id];
              const isVerifiedOrg = creator?.account_type === 'organization' && creator?.is_verified;

              return (
                <Link key={task.id} to={createPageUrl(`TaskDetails?id=${task.id}`)}>
                  <Card className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col ${
                    isHighMatch ? 'ring-2 ring-blue-400' : ''
                  }`}>
                    <CardContent className="p-6 flex flex-col flex-1">
                      {isHighMatch && (
                        <Badge className="mb-3 bg-gradient-to-r from-blue-500 to-green-500 text-white w-fit">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Great Match
                        </Badge>
                      )}

                      <div className="flex items-start justify-between mb-3">
                        <Badge className={
                          task.task_type === "offer"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }>
                          {task.task_type === "offer" ? "Offering" : "Requesting"}
                        </Badge>
                        <Badge variant="outline" className="text-gray-600">
                          <Clock className="w-3 h-3 mr-1" />
                          {task.time_required} min
                        </Badge>
                      </div>

                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                        {task.title}
                      </h3>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                        {task.description}
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          <span>{task.city}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {task.category}
                        </Badge>
                      </div>
                      
                       <div className="mt-4 pt-4 border-t border-gray-100">
                         <button onClick={(e) => openProfileModal(e, task.creator_id)} className="w-full flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors focus:outline-none">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {task.creator_photo_url ? <img src={task.creator_photo_url} alt={task.creator_name} className="w-full h-full object-cover" /> : <span>{task.creator_name?.charAt(0) || 'U'}</span>}
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-medium truncate">{task.creator_name}</span>
                                {isVerifiedOrg && <ShieldCheck className="w-4 h-4 text-green-500" />}
                            </div>
                         </button>
                       </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}