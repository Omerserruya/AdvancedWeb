import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './theme/ThemeProvider';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './components/OAuthCallback';
import ScrollToTop from './components/ScrollToTop';
import LikedPosts from './pages/LikedPosts';
import { SearchProvider } from './contexts/SearchContext';

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <SearchProvider>
          <ScrollToTop />
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            
            {/* Main routes */}
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/liked-posts" element={<LikedPosts />} />
            </Route>
          </Routes>
        </SearchProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;