import { Routes, Route } from 'react-router-dom';
import { Feed } from './pages/Home';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import { UserProvider } from './contexts/UserContext';
import OAuthCallback from './components/OAuthCallback';
import MyPosts from './pages/MyPosts';
import Profile from './pages/Profile';
import AddPost from './pages/AddPost';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/" element={<Login />} />
          <Route path="/auth/google/callback" element={<OAuthCallback />} />
          <Route path="/auth/github/callback" element={<OAuthCallback />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

// Removed placeholder components for MyPosts and Profile

export default App;
