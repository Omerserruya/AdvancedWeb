import { Theme, alpha } from '@mui/material/styles';
import type { Components } from '@mui/material/styles';
import { gray } from '../themePrimitives';

type SurfacesComponents = Pick<Components<Theme>,
  | 'MuiAccordion'
  | 'MuiAccordionSummary'
  | 'MuiAccordionDetails'
  | 'MuiPaper'
  | 'MuiCard'
  | 'MuiCardContent'
  | 'MuiCardHeader'
  | 'MuiCardActions'
>;

interface CustomTheme extends Theme {
  applyStyles: (mode: 'light' | 'dark', styles: Record<string, unknown>) => Record<string, unknown>;
}

type StyleProps<T> = T & { 
  theme: CustomTheme;
};

/* eslint-disable import/prefer-default-export */
export const surfacesCustomizations: SurfacesComponents = {
  MuiAccordion: {
    defaultProps: {
      elevation: 0,
      disableGutters: true,
    },
    styleOverrides: {
      root: ({ theme }: StyleProps<any>) => ({
        padding: 4,
        overflow: 'clip',
        backgroundColor: theme.palette.background.default,
        border: '1px solid',
        borderColor: theme.palette.divider,
        ':before': {
          backgroundColor: 'transparent',
        },
        '&:not(:last-of-type)': {
          borderBottom: 'none',
        },
        '&:first-of-type': {
          borderTopLeftRadius: theme.shape.borderRadius,
          borderTopRightRadius: theme.shape.borderRadius,
        },
        '&:last-of-type': {
          borderBottomLeftRadius: theme.shape.borderRadius,
          borderBottomRightRadius: theme.shape.borderRadius,
        },
      }),
    },
  },
  MuiAccordionSummary: {
    styleOverrides: {
      root: ({ theme }: StyleProps<any>) => ({
        border: 'none',
        borderRadius: 8,
        '&:hover': { backgroundColor: gray[50] },
        '&:focus-visible': { backgroundColor: 'transparent' },
        ...theme.applyStyles('dark', {
          '&:hover': { backgroundColor: gray[800] },
        }),
      }),
    },
  },
  MuiAccordionDetails: {
    styleOverrides: {
      root: { mb: 20, border: 'none' },
    },
  },
  MuiPaper: {
    defaultProps: {
      elevation: 0,
    },
  },
  MuiCard: {
    styleOverrides: {
      root: ({ theme }: StyleProps<any>) => ({
        padding: 16,
        gap: 16,
        transition: 'all 100ms ease',
        backgroundColor: gray[50],
        borderRadius: theme.shape.borderRadius,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: 'none',
        ...theme.applyStyles('dark', {
          backgroundColor: gray[800],
        }),
        variants: [
          {
            props: {
              variant: 'outlined',
            },
            style: {
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 'none',
              background: 'hsl(0, 0%, 100%)',
              ...theme.applyStyles('dark', {
                background: alpha(gray[900], 0.4),
              }),
            },
          },
        ],
      }),
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: 0,
        '&:last-child': { paddingBottom: 0 },
      },
    },
  },
  MuiCardHeader: {
    styleOverrides: {
      root: {
        padding: 0,
      },
    },
  },
  MuiCardActions: {
    styleOverrides: {
      root: {
        padding: 0,
      },
    },
  },
}; 