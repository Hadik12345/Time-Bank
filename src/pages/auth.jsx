import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Alert, AlertDescription } from "../components/ui/alert";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { AlertCircle, Clock } from "lucide-react";

export default function AuthPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState("individual"); // New state for account type
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: fullName,
      });

      // --- MODIFIED USER DOCUMENT ---
      const userData = {
        uid: user.uid,
        full_name: fullName,
        email: email,
        account_type: accountType, // Save the selected account type
        time_credits: accountType === 'individual' ? 60 : 0, // Orgs start with 0 credits
        city: "",
        country: "India",
        skills: [],
        bio: "",
        profile_photo_url: "",
        total_tasks_completed: 0,
        total_tasks_received: 0,
        created_date: serverTimestamp(),
      };

      if (accountType === 'organization') {
        userData.is_verified = false; // Add verification status for orgs
      }

      await setDoc(doc(db, "users", user.uid), userData);
      // --- END MODIFICATION ---

      navigate("/");
    } catch (error) {
      setError(error.message);
    }
    setIsSubmitting(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      setError(error.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
        <div className="w-full max-w-md">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  TimeBank
                </h1>
                <p className="text-sm text-gray-500">Exchange Time, Build Community</p>
              </div>
            </div>

            <Card className="border-none shadow-2xl shadow-blue-100/50">
                <CardContent className="p-0">
                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login" className="p-6">
                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div>
                                <Label htmlFor="login-email">Email</Label>
                                <Input
                                    id="login-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="login-password">Password</Label>
                                <Input
                                    id="login-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-green-500" disabled={isSubmitting}>
                                {isSubmitting ? "Logging in..." : "Login"}
                            </Button>
                        </form>
                    </TabsContent>
                    <TabsContent value="signup" className="p-6">
                        <form onSubmit={handleSignUp} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            {/* --- NEW ACCOUNT TYPE SELECTOR --- */}
                            <div>
                                <Label className="mb-2 block">Account Type</Label>
                                <RadioGroup
                                  value={accountType}
                                  onValueChange={setAccountType}
                                  className="grid grid-cols-2 gap-4"
                                >
                                  <div>
                                    <RadioGroupItem value="individual" id="individual" className="peer sr-only" />
                                    <Label htmlFor="individual" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                      Individual
                                    </Label>
                                  </div>
                                  <div>
                                    <RadioGroupItem value="organization" id="organization" className="peer sr-only" />
                                    <Label htmlFor="organization" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                      Organization
                                    </Label>
                                  </div>
                                </RadioGroup>
                            </div>
                            {/* --- END --- */}
                            <div>
                                <Label htmlFor="signup-name">{accountType === 'individual' ? 'Full Name' : 'Organization Name'}</Label>
                                <Input
                                    id="signup-name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder={accountType === 'individual' ? "John Doe" : "e.g., Local Community Center"}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="signup-email">Email</Label>
                                <Input
                                    id="signup-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="signup-password">Password</Label>
                                <Input
                                    id="signup-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-green-500" disabled={isSubmitting}>
                                {isSubmitting ? "Creating Account..." : "Create Account"}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}