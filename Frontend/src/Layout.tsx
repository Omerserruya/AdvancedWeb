import React from "react";
import SideMenu from "./components/SideMenuCustom/SideMenu";
import { Box } from "@mui/material";
import Stack from "@mui/material/Stack";
import { Home } from "./pages/Home";

function Layout() {
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
          p: 2
        }}
      >
        <Home />
      </Box>
    </Stack>
  );
}

export default Layout;