import React, { useState, useEffect } from "react";
import { User } from "../entities/User";
import { Task } from "../entities/Task";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { MapPin, Clock, ArrowRight, XCircle, ShieldCheck } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import HireRequestCard from "../components/ui/hirerequestcard";

// A new component to render each task item, now with requests
const TaskItem = ({ task, taskType, onCancel, onAcceptRequest, isAccepting, creators }) => {
    const [requests, setRequests] = useState([]);
    const creator = creators[task.creator_id];
    const isVerifiedOrg = creator?.account_type === 'organization' && creator?.is_verified;

    useEffect(() => {
        if (task.task_type === 'offer' && task.status === 'open' && taskType === 'created') {
            const unsubscribe = Task.onHireRequestsSnapshot(task.id, setRequests);
            return () => unsubscribe();
        }
    }, [task.id, task.status, task.task_type, taskType]);

    return (
        <div className="flex flex-col gap-1">
            <div className="relative group">
                 <Link to={createPageUrl(`TaskDetails?id=${task.id}`)}>
                    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                            <Badge className={
                                task.status === "open" ? "bg-blue-100 text-blue-700" :
                                task.status === "in_progress" ? "bg-yellow-100 text-yellow-700" :
                                task.status === "pending_validation" ? "bg-purple-100 text-purple-700" :
                                task.status === "completed" ? "bg-green-100 text-green-700" :
                                "bg-gray-100 text-gray-700"
                            }>{task.status.replace(/_/g, ' ')}</Badge>
                            <Badge className={ task.task_type === "offer" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700" }>{task.task_type}</Badge>
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{task.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{task.description}</p>
                        <div className="space-y-2">
                           <div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="w-4 h-4 text-blue-500" /><span>{task.time_required} minutes</span></div>
                           <div className="flex items-center gap-2 text-sm text-gray-600"><MapPin className="w-4 h-4 text-green-500" /><span>{task.city}</span></div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-medium text-gray-700">{task.creator_name}</span>
                                {isVerifiedOrg && <ShieldCheck className="w-4 h-4 text-green-500" />}
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                </Link>
                {taskType === 'created' && task.status === 'open' && (
                    <Button variant="destructive" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => onCancel(e, task.id)}>
                        <XCircle className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                )}
            </div>
            {requests.length > 0 && (
                <div className="p-2 bg-white rounded-b-lg shadow-lg -mt-2 z-10">
                    {requests.map(req => (
                        <HireRequestCard key={req.id} request={req} onAccept={onAcceptRequest} isAccepting={isAccepting} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function MyTasks() {
  const [user, setUser] = useState(null);
  const [createdTasks, setCreatedTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [creators, setCreators] = useState({}); // Cache creator profiles
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    const loadUserAndTasks = async () => {
      setIsLoading(true);
      const currentUser = await User.me();
      if (!currentUser) {
        setIsLoading(false);
        return;
      }
      setUser(currentUser);
      
      const fetchAndCacheCreators = async (tasks) => {
          const creatorIds = [...new Set(tasks.map(t => t.creator_id))];
          const newCreators = {};
          for(const id of creatorIds) {
              if(!creators[id]) {
                  newCreators[id] = await User.get(id);
              }
          }
          setCreators(prev => ({...prev, ...newCreators}));
      };

      const createdQuery = query(collection(db, "tasks"), where("creator_id", "==", currentUser.id), orderBy("created_date", "desc"));
      const unsubscribeCreated = onSnapshot(createdQuery, snap => {
          const tasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setCreatedTasks(tasks);
          fetchAndCacheCreators(tasks);
      });

      const assignedQuery = query(collection(db, "tasks"), where("assignee_id", "==", currentUser.id), where("status", "!=", "completed"), orderBy("created_date", "desc"));
      const unsubscribeAssigned = onSnapshot(assignedQuery, snap => {
          const tasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAssignedTasks(tasks);
          fetchAndCacheCreators(tasks);
      });
      
      const completedQuery = query(collection(db, "tasks"), where("assignee_id", "==", currentUser.id), where("status", "==", "completed"), orderBy("completion_date", "desc"));
      const unsubscribeCompleted = onSnapshot(completedQuery, snap => {
        const tasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCompletedTasks(tasks);
        fetchAndCacheCreators(tasks);
        setIsLoading(false);
      });

      return () => { unsubscribeCreated(); unsubscribeAssigned(); unsubscribeCompleted(); };
    };
    loadUserAndTasks();
  }, []);

  const handleCancelTask = async (e, taskId) => {
      e.preventDefault();
      if (window.confirm("Are you sure you want to cancel this task?")) {
          try { 
              await Task.delete(taskId);
          } catch (error) {
              console.error("Error cancelling task:", error);
              alert("Failed to cancel task.");
          }
      }
  };

  const handleAcceptRequest = async (request) => {
    setIsAccepting(true);
    try {
      const requester = await User.get(request.requester_id);
      if (requester.time_credits < request.task_credits_value) {
        alert(`${requester.full_name} does not have enough credits for this task.`);
        setIsAccepting(false);
        return;
      }

      await Task.update(request.taskId, {
          status: 'in_progress',
          assignee_id: request.requester_id,
          assignee_email: request.requester_email,
      });
      await Task.updateHireRequest(request.taskId, request.id, { status: 'accepted' });
    } catch(error) {
        console.error("Error accepting request:", error);
        alert("Failed to accept request.");
    }
    setIsAccepting(false);
  };
  
  const TaskList = ({ tasks, emptyMessage, taskType }) => {
    if (tasks.length === 0) {
        return ( <div className="text-center py-12 text-gray-500"><p>{emptyMessage}</p></div> );
    }
    return (
      <div className="grid md:grid-cols-2 gap-6">
        {tasks.map(task => (
          <TaskItem 
            key={task.id} 
            task={task} 
            taskType={taskType}
            onCancel={handleCancelTask}
            onAcceptRequest={handleAcceptRequest}
            isAccepting={isAccepting}
            creators={creators}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-10 w-full mb-6" />
        <div className="grid md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tasks</h1>
        <p className="text-gray-600">Track your task offers and assignments</p>
      </div>

      <Tabs defaultValue="created" className="space-y-6">
        <TabsList className="bg-gray-100 p-1 grid grid-cols-3">
          <TabsTrigger value="created" className="px-6">Tasks I Created ({createdTasks.length})</TabsTrigger>
          <TabsTrigger value="assigned" className="px-6">Tasks I'm Doing ({assignedTasks.length})</TabsTrigger>
          <TabsTrigger value="completed" className="px-6">Completed ({completedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="created">
          <TaskList tasks={createdTasks} emptyMessage="You haven't created any tasks yet." taskType="created" />
        </TabsContent>
        <TabsContent value="assigned">
          <TaskList tasks={assignedTasks} emptyMessage="You are not currently doing any tasks." taskType="assigned" />
        </TabsContent>
        <TabsContent value="completed">
            <TaskList tasks={completedTasks} emptyMessage="You haven't completed any tasks yet." taskType="completed" />
        </TabsContent>
      </Tabs>
    </div>
  );
}