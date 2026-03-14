import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { AppLayout } from '@/components/AppLayout';
import { BandProvider } from '@/contexts/BandContext';
import { MemberProvider } from '@/contexts/MemberContext';
import { api } from '@/lib/api';

jest.mock('@/lib/api');
const mockedApi = jest.mocked(api);

const mockBand = {
  id: 1,
  name: 'Test Band',
  members: [
    { id: 1, name: 'Mike', instruments: ['guitar'], role: 'band_member' as const },
    { id: 2, name: 'Sarah', instruments: ['vocals'], role: 'band_member' as const },
    { id: 3, name: 'Chris', instruments: [], role: 'engineer' as const },
  ],
};

function renderWithProviders(ui: React.ReactElement) {
  mockedApi.bands.get.mockResolvedValue(mockBand);
  return render(
    <ThemeProvider theme={theme}>
      <BandProvider bandId={1}>
        <MemberProvider>
          {ui}
        </MemberProvider>
      </BandProvider>
    </ThemeProvider>
  );
}

describe('AppLayout', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the member picker dropdown', async () => {
    renderWithProviders(<AppLayout><div>Page content</div></AppLayout>);
    await waitFor(() => {
      expect(screen.getByLabelText('Select member')).toBeInTheDocument();
    });
  });

  it('renders children', async () => {
    renderWithProviders(<AppLayout><div>Page content</div></AppLayout>);
    await waitFor(() => {
      expect(screen.getByText('Page content')).toBeInTheDocument();
    });
  });

  it('shows all members including engineers in the dropdown', async () => {
    renderWithProviders(<AppLayout><div>Content</div></AppLayout>);
    await waitFor(() => {
      expect(screen.getByLabelText('Select member')).toBeInTheDocument();
    });
    const select = screen.getByLabelText('Select member');
    expect(select).toContainHTML('Mike');
    expect(select).toContainHTML('Sarah');
    expect(select).toContainHTML('Chris');
  });

  it('selects a member when dropdown changes', async () => {
    renderWithProviders(<AppLayout><div>Content</div></AppLayout>);
    await waitFor(() => {
      expect(screen.getByLabelText('Select member')).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText('Select member'), { target: { value: '1' } });
    expect((screen.getByLabelText('Select member') as HTMLSelectElement).value).toBe('1');
  });
});
