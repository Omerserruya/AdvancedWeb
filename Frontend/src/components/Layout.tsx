import React from 'react';
import { Box } from "@mui/material";
import { Outlet, Navigate } from 'react-router-dom';
import SideMenu from './SideMenuCustom/SideMenu';
import Header from './Header';
import { useUser } from '../contexts/UserContext';

function Layout() {
  const { user } = useUser();

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <SideMenu />
      
      {/* Main content */}
      <Box sx={{ 
        flexGrow: 1, 
        p: 2,
        marginLeft: { xs: 0, md: '200px' },
        width: { xs: '100%', md: 'calc(100% - 200px)' }
      }}>
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <Box sx={{ 
          maxWidth: '1100px',
          margin: '0 auto',
          mt: 3,
          px: 2
        }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default Layout; 