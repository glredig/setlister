export const theme = {
  colors: {
    background: '#1a1a2e',
    surface: '#16213e',
    surfaceLight: '#0f3460',
    primary: '#e94560',
    text: '#eee',
    textMuted: '#aaa',
    border: '#333',
  },
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'SFMono-Regular, Menlo, monospace',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
};

export type Theme = typeof theme;
