import * as React from 'react';
import Stack from '@mui/material/Stack';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import NavbarBreadcrumbs from './NavbarBreadcrumbs';
import MenuButton from './MenuButton';
import ColorModeIconDropdown from '../shared-theme/ColorModeIconDropdown';
import Search from './Search';
import { Box } from '@mui/material';

export default function Header() {
  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 1
      }}
    >
      <Stack
        direction="row"
        sx={{
          width: '100%',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        spacing={2}
      >
        <NavbarBreadcrumbs />
        <Stack direction="row" spacing={1}>
          <Search />
          <MenuButton showBadge aria-label="Open notifications">
            <NotificationsRoundedIcon />
          </MenuButton>
          <ColorModeIconDropdown />
        </Stack>
      </Stack>
    </Box>
  );
}
