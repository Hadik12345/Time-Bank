import React, { useState, useEffect } from "react";
import { User } from "../entities/User.js";
import { Task } from "../entities/Task.js";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Alert, AlertDescription } from "../components/ui/alert";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

const CATEGORIES = [
  "Tech Support", "Home Help", "Teaching/Tutoring", "Creative Work",
  "Administrative", "Gardening", "Pet Care", "Cooking",
  "Language Practice", "Fitness/Sports", "Other"
];

export default function CreateTask() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    task_type: "offer",
    time_required: 30,
    urgency: "medium",
    city: "",
    country: "India"
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await User.me();
    setUser(currentUser);
    
    if (currentUser.city && currentUser.country) {
      setFormData(prev => ({
        ...prev,
        city: currentUser.city,
        country: currentUser.country
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !formData.title || !formData.category || !formData.city) return;

    setIsSubmitting(true);
    try {
      await Task.create({
        ...formData,
        city: formData.city.toLowerCase(),
        credits_value: formData.time_required,
        status: "open",
        // Add creator info for easy display on task cards
        creator_id: user.id,
        creator_email: user.email,
        creator_name: user.full_name,
        creator_photo_url: user.profile_photo_url || null,
      });
      navigate(createPageUrl("MyTasks"));
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Error creating task. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Dashboard"))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a Task</h1>
        <p className="text-gray-600">Offer your skills or request help from your community</p>
      </div>

      {user && !user.city && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Please complete your profile with your city information first.{" "}
            <Link to={createPageUrl("Profile")} className="font-semibold underline">
              Go to Profile
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>Task Type</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={formData.task_type}
              onValueChange={(value) => setFormData({ ...formData, task_type: value })}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <label className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  formData.task_type === "offer"
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="offer" id="offer" />
                    <div>
                      <p className="font-semibold text-gray-900">I'm Offering Help</p>
                      <p className="text-sm text-gray-600 mt-1">Share your skills and earn time credits</p>
                    </div>
                  </div>
                </label>

                <label className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  formData.task_type === "request"
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="request" id="request" />
                    <div>
                      <p className="font-semibold text-gray-900">I Need Help</p>
                      <p className="text-sm text-gray-600 mt-1">Request assistance and use your credits</p>
                    </div>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg mb-6">
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Help set up a WordPress website"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide details about what you need or what you can offer..."
                required
                className="mt-1 h-32"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="time_required">Time Required (minutes) *</Label>
                <Select
                  value={formData.time_required.toString()}
                  onValueChange={(value) => setFormData({ ...formData, time_required: parseInt(value) })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Enter your city"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="country">Country *</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="United States">United States</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="urgency">Urgency</Label>
              <Select
                value={formData.urgency}
                onValueChange={(value) => setFormData({ ...formData, urgency: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Flexible timing</SelectItem>
                  <SelectItem value="medium">Medium - Within a few days</SelectItem>
                  <SelectItem value="high">High - Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !formData.title || !formData.category || !formData.city}
            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
          >
            {isSubmitting ? (
              "Creating..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Create Task
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}