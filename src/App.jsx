import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Layout from "./layout";
import Dashboard from "./pages/dashboard";
import Explore from "./pages/explore";
import MyTasks from "./pages/mytasks";
import Profile from "./pages/profile";
import CreateTask from "./pages/createtask";
import TaskDetails from "./pages/taskdetails";
import AuthPage from "./pages/auth";
import CommunityChat from "./pages/community";
import Messages from "./pages/messages"; // Import the new page
import { Skeleton } from "./components/ui/skeleton";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><Skeleton className="w-48 h-48" /></div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={!user ? <AuthPage /> : <Navigate to="/" />} />
        <Route path="/*" element={ user ? (
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/mytasks" element={<MyTasks />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/createtask" element={<CreateTask />} />
                  <Route path="/taskdetails" element={<TaskDetails />} />
                  <Route path="/community" element={<CommunityChat />} />
                  <Route path="/messages" element={<Messages />} /> {/* Add new route */}
                  <Route path="/" element={<Dashboard />} />
                </Routes>
              </Layout>
            ) : ( <Navigate to="/auth" /> )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;