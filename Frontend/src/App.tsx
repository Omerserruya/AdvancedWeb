import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import MyPosts from './pages/MyPosts';
import Profile from './pages/Profile';
import AddPost from './pages/AddPost';
import { UserProvider } from './contexts/UserContext';
import OAuthCallback from './components/OAuthCallback';
import { ThemeProvider } from './theme/ThemeProvider';
import Layout from './components/Layout';
import { Navigate } from 'react-router-dom';
function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          
          {/* Protected routes with Layout */}
          <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/add-post" element={<AddPost />} />
            <Route path="/my-posts" element={<MyPosts />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;