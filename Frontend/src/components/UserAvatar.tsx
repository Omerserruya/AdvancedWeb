import React from 'react';
import { Avatar, Stack, Typography, Box } from '@mui/material';
import { useUser } from '../contexts/UserContext';

export default function UserAvatar() {
    const { user } = useUser();

    // Get initials from username
    const getInitials = (name: string | undefined) => {
        if (!name) return 'G';
        
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase();
    };

    return (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
            <Avatar 
                src={user?.avatarUrl || ""}
                sx={{ width: 40, height: 40 }}
            >
                {getInitials(user?.username)}
            </Avatar>
            <Box>
                <Typography variant="subtitle2">{user?.username || 'Guest'}</Typography>
            </Box>
        </Stack>
    );
}