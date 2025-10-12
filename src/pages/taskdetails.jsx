import React, { useState, useEffect } from "react";
import { User } from "../entities/User";
import { Task } from "../entities/Task.js";
import { CreditTransaction } from "../entities/CreditTransaction.js";
import { UploadFile, InvokeLLM } from "../integrations/Core";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Clock,
  User as UserIcon,
  Upload,
  CheckCircle,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import HireModal from "../components/ui/hiremodal";
import HireRequestCard from "../components/ui/hirerequestcard";

export default function TaskDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSendingHireRequest, setIsSendingHireRequest] = useState(false);
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);
  const [showHireModal, setShowHireModal] = useState(false);
  const [hireRequests, setHireRequests] = useState([]);
  
  const taskId = searchParams.get('id');

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await User.me();
      setUser(currentUser);
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!taskId) {
        setIsLoading(false);
        return;
    };
    const taskDocRef = doc(db, "tasks", taskId);
    const unsubscribeTask = onSnapshot(taskDocRef, doc => {
      if (doc.exists()) {
        const taskData = { id: doc.id, ...doc.data() };
        setTask(taskData);
        if (taskData.before_photo_url) setBeforePhoto(taskData.before_photo_url);
        if (taskData.after_photo_url) setAfterPhoto(taskData.after_photo_url);
      } else {
        setTask(null);
      }
      setIsLoading(false);
    });

    const unsubscribeRequests = Task.onHireRequestsSnapshot(taskId, setHireRequests);

    return () => {
      unsubscribeTask();
      unsubscribeRequests();
    };
  }, [taskId]);

  const handleSendHireRequest = async (message) => {
    if (!user || !task) return;
    setIsSendingHireRequest(true);
    try {
      await Task.createHireRequest(taskId, {
        message: message,
        requester_id: user.id,
        requester_name: user.full_name,
        requester_email: user.email,
        requester_photo_url: user.profile_photo_url || null,
        task_credits_value: task.credits_value
      });
      setShowHireModal(false);
      alert("Your hire request has been sent!");
    } catch (error) {
      console.error("Error sending hire request:", error);
    }
    setIsSendingHireRequest(false);
  };
  
  const handleAcceptRequest = async (request) => {
      setIsAccepting(true);
      try {
        const requester = await User.get(request.requester_id);
        if (requester.time_credits < task.credits_value) {
            alert(`${requester.full_name} does not have enough credits to hire you for this task.`);
            setIsAccepting(false);
            return;
        }

        await Task.update(taskId, {
            status: 'in_progress',
            assignee_id: request.requester_id,
            assignee_email: request.requester_email,
        });
        await Task.updateHireRequest(taskId, request.id, { status: 'accepted' });
      } catch(error) {
          console.error("Error accepting request:", error);
      }
      setIsAccepting(false);
  };

  const handleAcceptTask = async () => {
    if (!user || !task) return;
    if (user.time_credits < task.credits_value) {
      alert("You don't have enough time credits for this task.");
      return;
    }
    setIsAccepting(true);
    try {
      await Task.update(task.id, {
        assignee_id: user.id,
        assignee_email: user.email,
        status: "in_progress"
      });
      navigate(createPageUrl("MyTasks"));
    } catch (error) {
      console.error("Error accepting task:", error);
    }
    setIsAccepting(false);
  };
  
  const handleConfirmCompletion = async () => {
    if (!task || !user) return;
    try {
      const isCreator = task.creator_id === user.id;
      await Task.update(task.id, isCreator ? { creator_confirmed: true } : { assignee_confirmed: true });
      const updatedTask = await Task.get(task.id);

      if (updatedTask.creator_confirmed && updatedTask.assignee_confirmed) {
        await Task.update(task.id, { status: "completed", completion_date: new Date().toISOString() });
        
        if (task.task_type === "request") {
          await User.decrementCredits(task.creator_id, task.credits_value);
          await User.incrementCredits(task.assignee_id, task.credits_value);
        } else {
          await User.decrementCredits(task.assignee_id, task.credits_value);
          await User.incrementCredits(task.creator_id, task.credits_value);
        }

        await User.update(task.assignee_id, { total_tasks_completed: 1 });
        await User.update(task.creator_id, { total_tasks_received: 1 });

        await CreditTransaction.create({
          from_user_id: task.task_type === 'request' ? task.creator_id : task.assignee_id,
          to_user_id: task.task_type === 'request' ? task.assignee_id : task.creator_id,
          task_id: task.id, amount: task.credits_value, transaction_type: "task_completed", description: `Completed: ${task.title}`
        });
        navigate(createPageUrl("Dashboard"));
      }
    } catch (error) {
      console.error("Error confirming completion:", error);
    }
  };
  
  const handlePhotoUpload = async (file, type) => {
    if(!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      await Task.update(task.id, type === "before" ? { before_photo_url: file_url } : { after_photo_url: file_url });
    } catch (error) {
      console.error("Error uploading photo:", error);
    }
    setIsUploading(false);
  };

  const handleValidateTask = async () => {
    if (!beforePhoto || !afterPhoto) return alert("Please upload both before and after photos");
    setIsValidating(true);
    try {
      const result = await InvokeLLM({ prompt: `...`, file_urls: [beforePhoto, afterPhoto] });
      await Task.update(task.id, { status: "pending_validation", validation_notes: result.explanation, ai_validation_score: result.confidence_score });
    } catch (error) {
      console.error("Error validating task:", error);
    }
    setIsValidating(false);
  };

  if (isLoading || !user) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-[70vh]" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Card className="border-none shadow-lg">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Task not found</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCreator = task.creator_id === user.id;
  const isAssignee = task.assignee_id === user.id;

  // --- CORRECTED LOGIC HERE ---
  // The "Work Provider" is the person who performs the service.
  const isWorkProvider = (task.task_type === 'request' && isAssignee) || (task.task_type === 'offer' && isCreator);
  
  const canUploadPhotos = isWorkProvider && task.status === 'in_progress';
  const canValidate = isWorkProvider && task.status === 'in_progress' && beforePhoto && afterPhoto;
  // --- END CORRECTION ---

  const canAcceptOrHire = task.status === "open" && !isCreator;
  const canConfirm = (isCreator || isAssignee) && task.status === "pending_validation";
  const buttonText = task.task_type === 'offer' ? "Hire for Task" : "Accept Task";

  const handleAcceptOrHire = () => {
    if (task.task_type === 'offer') {
        setShowHireModal(true);
    } else {
        handleAcceptTask();
    }
  };
  
  return (
    <>
      {showHireModal && <HireModal taskCreatorName={task.creator_name} onClose={() => setShowHireModal(false)} onSend={handleSendHireRequest} isSending={isSendingHireRequest} />}
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <Badge className={ task.task_type === "offer" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700" }>{task.task_type === "offer" ? "Offering" : "Requesting"}</Badge>
                        <Badge className={ task.status === "open" ? "bg-blue-100 text-blue-700" : task.status === "in_progress" ? "bg-yellow-100 text-yellow-700" : task.status === "pending_validation" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700" }>{task.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <CardTitle className="text-3xl mb-2">{task.title}</CardTitle>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Credits</div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">{task.credits_value}<span className="text-lg ml-1">min</span></div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{task.description}</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                 <div className="flex items-center gap-3"><div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-blue-600" /></div><div><p className="text-sm text-gray-600">Duration</p><p className="font-semibold text-gray-900">{task.time_required} minutes</p></div></div>
                 <div className="flex items-center gap-3"><div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center"><MapPin className="w-6 h-6 text-green-600" /></div><div><p className="text-sm text-gray-600">Location</p><p className="font-semibold text-gray-900">{task.city}</p></div></div>
                 <div className="flex items-center gap-3"><div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center"><UserIcon className="w-6 h-6 text-purple-600" /></div><div><p className="text-sm text-gray-600">Category</p><p className="font-semibold text-gray-900">{task.category}</p></div></div>
              </div>
              {canAcceptOrHire && (
                <Button onClick={handleAcceptOrHire} disabled={isAccepting} className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 h-12 text-lg">
                  {isAccepting ? "Processing..." : buttonText}
                </Button>
              )}
            </CardContent>
          </Card>

          {isCreator && task.status === 'open' && hireRequests.length > 0 && (
              <Card className="border-none shadow-lg">
                  <CardHeader>
                      <CardTitle>Incoming Hire Requests ({hireRequests.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                      <div className="divide-y divide-blue-200">
                        {hireRequests.map(req => (
                            <HireRequestCard key={req.id} request={req} onAccept={handleAcceptRequest} isAccepting={isAccepting} />
                        ))}
                      </div>
                  </CardContent>
              </Card>
          )}

          {canUploadPhotos && (
            <Card className="border-none shadow-lg">
              <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" /> Upload Verification Photos</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Before Photo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Before Photo</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                      {beforePhoto ? <img src={beforePhoto} alt="Before" className="w-full h-48 object-cover rounded-lg mb-3" /> : <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />}
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e.target.files[0], "before")} className="hidden" id="before-photo" name="before-photo" />
                      <Button asChild variant="outline"><label htmlFor="before-photo" className="cursor-pointer">{isUploading ? "Uploading..." : "Choose File"}</label></Button>
                    </div>
                  </div>
                  {/* After Photo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">After Photo</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 transition-colors">
                      {afterPhoto ? <img src={afterPhoto} alt="After" className="w-full h-48 object-cover rounded-lg mb-3" /> : <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />}
                      <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e.target.files[0], "after")} className="hidden" id="after-photo" name="after-photo" />
                      <Button asChild variant="outline"><label htmlFor="after-photo" className="cursor-pointer">{isUploading ? "Uploading..." : "Choose File"}</label></Button>
                    </div>
                  </div>
                </div>
                {canValidate && (
                  <Button onClick={handleValidateTask} disabled={isValidating} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    {isValidating ? "Validating..." : <><Sparkles className="w-5 h-5 mr-2" /> Submit for AI Validation</>}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {task.status === "pending_validation" && (
            <Card className="border-none shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
              <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-600" /> AI Validation Result</CardTitle></CardHeader>
              <CardContent>
                  {task.validation_notes && (
                      <div className="mb-4">
                          <div className="flex items-center gap-3 mb-2"><span className="text-sm font-medium text-gray-700">Confidence Score:</span><Badge className="bg-purple-100 text-purple-700">{task.ai_validation_score}%</Badge></div>
                          <p className="text-gray-700">{task.validation_notes}</p>
                      </div>
                  )}
                {canConfirm && (
                  <div className="space-y-3 pt-4 border-t border-purple-200">
                    <p className="text-sm font-medium text-gray-700 text-center">{isCreator ? "Please confirm the task was completed satisfactorily" : "Please confirm you completed the task"}</p>
                    <Button onClick={handleConfirmCompletion} className="w-full bg-gradient-to-r from-green-500 to-green-600" disabled={ (isCreator && task.creator_confirmed) || (isAssignee && task.assignee_confirmed) }>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      { (isCreator && task.creator_confirmed) || (isAssignee && task.assignee_confirmed) ? "Waiting for other party" : "Confirm Completion" }
                    </Button>
                    {task.creator_confirmed && isAssignee && <p className="text-sm text-green-600 text-center">✓ Task creator has confirmed</p>}
                    {task.assignee_confirmed && isCreator && <p className="text-sm text-green-600 text-center">✓ Task doer has confirmed</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}