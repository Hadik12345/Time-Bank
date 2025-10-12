import React, { useState, useEffect } from "react";
import { User } from "../entities/User";
import { UploadFile } from "../integrations/Core";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Camera, Save, X, Plus, CheckCircle, ShieldCheck } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";

const SKILL_OPTIONS = [
  "Web Development", "Mobile Apps", "Graphic Design", "Writing", "Teaching",
  "Cooking", "Gardening", "Pet Care", "Photography", "Music",
  "Fitness Training", "Language Teaching", "Accounting", "Marketing",
  "Home Repair", "Cleaning", "Childcare", "Elder Care", "Transportation",
  "Event Planning", "Fundraising", "Grant Writing", "Mentorship" // Added skills for orgs
];

const TIME_SLOT_OPTIONS = [
  "Weekday Mornings", "Weekday Afternoons", "Weekday Evenings",
  "Weekend Mornings", "Weekend Afternoons", "Weekend Evenings"
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    bio: "",
    skills: [],
    city: "",
    country: "India",
    available_time_slots: [],
    profile_photo_url: "",
    full_name: ""
  });

  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await User.me();
    setUser(currentUser);
    setFormData({
      bio: currentUser.bio || "",
      skills: currentUser.skills || [],
      city: currentUser.city || "",
      country: currentUser.country || "India",
      available_time_slots: currentUser.available_time_slots || [],
      profile_photo_url: currentUser.profile_photo_url || "",
      full_name: currentUser.full_name || ""
    });
    setIsLoading(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData({ ...formData, profile_photo_url: file_url });
    } catch (error) {
      console.error("Error uploading photo:", error);
    }
    setIsUploadingPhoto(false);
  };

  const addSkill = (skill) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData({ ...formData, skills: [...formData.skills, skill] });
    }
    setNewSkill("");
  };

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skillToRemove)
    });
  };

  const toggleTimeSlot = (slot) => {
    const slots = formData.available_time_slots;
    if (slots.includes(slot)) {
      setFormData({
        ...formData,
        available_time_slots: slots.filter(s => s !== slot)
      });
    } else {
      setFormData({
        ...formData,
        available_time_slots: [...slots, slot]
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        city: formData.city.toLowerCase()
      };
      await User.updateMyUserData(dataToSave);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
    setIsSaving(false);
  };

  if (isLoading || !user) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const isOrganization = user.account_type === 'organization';

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
        <p className="text-gray-600">Manage your skills and availability to get better matches</p>
      </div>

      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-800">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Profile updated successfully!</span>
        </div>
      )}

      <div className="space-y-6">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>{isOrganization ? "Organization Logo" : "Profile Photo"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                  {formData.profile_photo_url ? (
                    <img src={formData.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.full_name?.charAt(0) || 'U'
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                  <Camera className="w-4 h-4 text-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{user?.full_name}</p>
                    {isOrganization && user.is_verified && <Badge className="bg-green-100 text-green-700"><ShieldCheck className="w-3 h-3 mr-1"/>Verified</Badge>}
                    {isOrganization && !user.is_verified && <Badge variant="destructive">Unverified</Badge>}
                </div>
                <p className="text-sm text-gray-600">{user?.email}</p>
                {isUploadingPhoto && <p className="text-xs text-blue-600 mt-1">Uploading...</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             {isOrganization && (
                 <div>
                    <Label htmlFor="org-name">Organization Name</Label>
                    <Input id="org-name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="Your organization's name" className="mt-1"/>
                 </div>
             )}
            <div>
              <Label htmlFor="bio">{isOrganization ? "About your Organization" : "Bio"}</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder={isOrganization ? "Describe your organization's mission..." : "Tell others about yourself..."}
                className="mt-1 h-24"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Enter your city"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
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
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>{isOrganization ? "Skills/Services Needed" : "Your Skills"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {formData.skills.map(skill => (
                <Badge
                  key={skill}
                  className="bg-gradient-to-r from-blue-500 to-green-500 text-white pl-3 pr-2 py-2 text-sm"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-2 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Select value={newSkill} onValueChange={setNewSkill}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a skill to add" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_OPTIONS.filter(s => !formData.skills.includes(s)).map(skill => (
                    <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => addSkill(newSkill)}
                disabled={!newSkill}
                className="bg-gradient-to-r from-blue-500 to-green-500"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {TIME_SLOT_OPTIONS.map(slot => (
                <button
                  key={slot}
                  onClick={() => toggleTimeSlot(slot)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 ${
                    formData.available_time_slots.includes(slot)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 px-8"
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}