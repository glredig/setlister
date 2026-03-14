import type { AppProps } from 'next/app';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { GlobalStyle } from '@/styles/GlobalStyle';
import { BandProvider } from '@/contexts/BandContext';
import { MemberProvider } from '@/contexts/MemberContext';
import { AppLayout } from '@/components/AppLayout';

const BAND_ID = Number(process.env.NEXT_PUBLIC_BAND_ID) || 1;

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <BandProvider bandId={BAND_ID}>
        <MemberProvider>
          <AppLayout>
            <Component {...pageProps} />
          </AppLayout>
        </MemberProvider>
      </BandProvider>
    </ThemeProvider>
  );
}
