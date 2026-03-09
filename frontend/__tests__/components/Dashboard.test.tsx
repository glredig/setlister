import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { Dashboard } from '@/components/Dashboard/Dashboard';
import { api } from '@/lib/api';

jest.mock('@/lib/api');
const mockedApi = jest.mocked(api);

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('Dashboard', () => {
  it('renders setlist cards', async () => {
    mockedApi.setlists.list.mockResolvedValueOnce([
      { id: 1, name: 'Friday Night Set', date: '2026-03-20', notes: 'Opening night' },
      { id: 2, name: 'Saturday Matinee', date: '2026-03-21', notes: '' },
    ]);

    renderWithTheme(<Dashboard bandId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Friday Night Set')).toBeInTheDocument();
      expect(screen.getByText('Saturday Matinee')).toBeInTheDocument();
    });
  });

  it('shows empty state when no setlists', async () => {
    mockedApi.setlists.list.mockResolvedValueOnce([]);

    renderWithTheme(<Dashboard bandId={1} />);

    await waitFor(() => {
      expect(screen.getByText(/no setlists/i)).toBeInTheDocument();
    });
  });
});
