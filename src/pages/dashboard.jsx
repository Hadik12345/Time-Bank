import React, { useState, useEffect } from "react";
import { User } from "@/entities/User.js";
import { Task } from "@/entities/Task.js";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  Users,
  Sparkles,
  ArrowRight,
  MapPin,
  ListChecks
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuth } from "firebase/auth";
import { doc, onSnapshot, collection, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Dashboard() {
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [suggestedTasks, setSuggestedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }

    // Real-time listener for user data
    const userDocRef = doc(db, "users", auth.currentUser.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const currentUserData = { id: doc.id, ...doc.data() };
        setUser(currentUserData);
        // After getting user data, load tasks that depend on it
        loadTasks(currentUserData);
      } else {
        setIsLoading(false);
      }
    });

    // Real-time listener for active tasks
    const tasksQuery = query(
        collection(db, "tasks"), 
        where("status", "in", ["open", "in_progress", "pending_validation"])
    );
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
        const allTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if(auth.currentUser){
            const userActiveTasks = allTasks.filter(
                task => (task.creator_id === auth.currentUser.uid || task.assignee_id === auth.currentUser.uid)
            );
            setMyTasks(userActiveTasks);
        }
    });

    // Initial load call to get suggested tasks (can remain a one-time fetch)
    const loadTasks = async (currentUser) => {
      try {
        const allTasks = await Task.list("created_date", 50);
        
        const availableTasks = allTasks.filter(
          task => task.status === "open" 
          && task.creator_id !== currentUser.id
          && task.city === currentUser.city
        );

        const skillMatches = availableTasks.filter(task => {
          const userSkills = currentUser.skills || [];
          return userSkills.some(skill => 
            task.title.toLowerCase().includes(skill.toLowerCase()) ||
            task.description.toLowerCase().includes(skill.toLowerCase())
          );
        });

        setSuggestedTasks(skillMatches.slice(0, 3));
      } catch (error) {
        console.error("Error loading suggested tasks:", error);
      }
      setIsLoading(false);
    };

    return () => {
      unsubscribeUser();
      unsubscribeTasks();
    };
  }, [auth.currentUser]);

  const stats = [
    {
      title: "Time Credits",
      value: user?.time_credits || 0,
      suffix: "min",
      icon: Clock,
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-blue-100"
    },
    {
      title: "Tasks Completed",
      value: user?.total_tasks_completed || 0,
      icon: CheckCircle,
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-green-100"
    },
    {
      title: "Tasks Received",
      value: user?.total_tasks_received || 0,
      icon: Users,
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-purple-100"
    },
    {
      title: "Impact Score",
      value: ((user?.total_tasks_completed || 0) + (user?.total_tasks_received || 0)) * 10,
      icon: TrendingUp,
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-orange-100"
    }
  ];

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto animate-pulse">
        <Skeleton className="h-10 w-1/3 mb-2" />
        <Skeleton className="h-5 w-1/4 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.full_name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-600">
          {user?.city ? `Building community in ${user.city}` : "Ready to exchange time and skills"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.bgGradient} rounded-full transform translate-x-16 -translate-y-16 opacity-50`} />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900">
                {stat.value}
                {stat.suffix && <span className="text-lg ml-1 text-gray-500">{stat.suffix}</span>}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {suggestedTasks.length > 0 && (
        <Card className="mb-8 border-none shadow-lg bg-gradient-to-r from-blue-500 to-green-500 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="w-6 h-6" />
              AI Suggested for You
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestedTasks.map(task => (
              <Link key={task.id} to={createPageUrl(`TaskDetails?id=${task.id}`)}>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
                      <p className="text-white/80 text-sm line-clamp-2">{task.description}</p>
                    </div>
                    <Badge className="bg-white/20 text-white border-white/30 ml-4">
                      {task.time_required} min
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-white/80">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {task.city}
                    </span>
                    <Badge variant="outline" className="bg-white/10 text-white border-white/30">
                      {task.category}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
            <Link to={createPageUrl("Explore")}>
              <Button variant="outline" className="w-full bg-white/10 hover:bg-white/20 text-white border-white/30">
                View All Tasks <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Active Tasks</span>
              <Badge variant="secondary">{myTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ListChecks className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="mb-4">No active tasks yet</p>
                <Link to={createPageUrl("CreateTask")}>
                  <Button size="sm" className="bg-gradient-to-r from-blue-500 to-green-500">
                    Create Your First Task
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myTasks.slice(0, 3).map(task => (
                  <Link key={task.id} to={createPageUrl(`TaskDetails?id=${task.id}`)}>
                    <div className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 line-clamp-1">{task.title}</h4>
                        <Badge className={
                          task.status === "open" ? "bg-blue-100 text-blue-700" :
                          task.status === "in_progress" ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                        }>
                          {task.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-1">{task.description}</p>
                    </div>
                  </Link>
                ))}
                {myTasks.length > 3 && (
                  <Link to={createPageUrl("MyTasks")}>
                    <Button variant="outline" size="sm" className="w-full">
                      View All ({myTasks.length})
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-gray-50 to-white">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to={createPageUrl("CreateTask")}>
              <Button className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 justify-start text-left h-auto py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Offer Your Time</p>
                    <p className="text-xs opacity-90">Help someone and earn credits</p>
                  </div>
                </div>
              </Button>
            </Link>

            <Link to={createPageUrl("Explore")}>
              <Button variant="outline" className="w-full justify-start text-left h-auto py-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Request Help</p>
                    <p className="text-xs text-gray-600">Find someone to assist you</p>
                  </div>
                </div>
              </Button>
            </Link>

            <Link to={createPageUrl("Profile")}>
              <Button variant="outline" className="w-full justify-start text-left h-auto py-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Update Skills</p>
                    <p className="text-xs text-gray-600">Get better task matches</p>
                  </div>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}