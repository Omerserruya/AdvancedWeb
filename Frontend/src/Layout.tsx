import React from "react";
import SideMenu from "./components/SideMenuCustom/SideMenu";
import { Box, Fab, Tooltip } from "@mui/material";
import Stack from "@mui/material/Stack";
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show FAB on the add-post page
  const showAddButton = location.pathname !== '/add-post';

  return (
    <Stack direction="row" spacing={2}>
      <Box
        sx={{
          width: '240px', // Adjust the width as needed
          height: '100vh', // Full height of the viewport
          overflow: 'auto', // Add scroll if content overflows
        }}
      >
        <SideMenu />
      </Box>
      <Box 
        flex={1}
        sx={{
          bgcolor: 'background.secondary',
          height: '100vh',
          overflow: 'auto',
          p: 2,
          position: 'relative', // Added for FAB positioning
        }}
      >
        <Outlet />
        {showAddButton && (
          <Tooltip title="Create new post" placement="left">
            <Fab
              color="primary"
              aria-label="add"
              onClick={() => navigate('/add-post')}
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
              }}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
        )}
      </Box>
    </Stack>
  );
}

export default Layout;