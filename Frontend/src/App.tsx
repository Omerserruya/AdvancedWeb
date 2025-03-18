import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './theme/ThemeProvider';
import Layout from './components/Layout';

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <Routes>
          {/* Redirect root to home */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          
          {/* Main routes */}
          <Route element={<Layout />}>
            <Route path="home" element={<Home />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
