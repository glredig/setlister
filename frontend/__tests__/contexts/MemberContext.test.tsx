import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { MemberProvider, useMember } from '@/contexts/MemberContext';
import { BandProvider } from '@/contexts/BandContext';
import { api } from '@/lib/api';

jest.mock('@/lib/api');
const mockedApi = jest.mocked(api);

const mockBand = {
  id: 1,
  name: 'Test Band',
  members: [
    { id: 1, name: 'Mike', instruments: ['guitar'], role: 'band_member' as const },
    { id: 2, name: 'Sarah', instruments: ['vocals'], role: 'band_member' as const },
  ],
};

function TestConsumer() {
  const { currentMember, setCurrentMember } = useMember();
  return (
    <div>
      <span data-testid="current">{currentMember?.name ?? 'none'}</span>
      <button onClick={() => setCurrentMember(mockBand.members[0])}>Select Mike</button>
      <button onClick={() => setCurrentMember(null)}>Clear</button>
    </div>
  );
}

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

describe('MemberContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with no member selected', async () => {
    renderWithProviders(<TestConsumer />);
    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('none');
    });
  });

  it('allows selecting a member', async () => {
    renderWithProviders(<TestConsumer />);
    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('none');
    });
    fireEvent.click(screen.getByText('Select Mike'));
    expect(screen.getByTestId('current')).toHaveTextContent('Mike');
  });

  it('persists selection to localStorage', async () => {
    renderWithProviders(<TestConsumer />);
    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('none');
    });
    fireEvent.click(screen.getByText('Select Mike'));
    expect(localStorage.getItem('setlister_member_id_1')).toBe('1');
  });

  it('restores selection from localStorage', async () => {
    localStorage.setItem('setlister_member_id_1', '2');
    renderWithProviders(<TestConsumer />);
    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('Sarah');
    });
  });

  it('resets to null if stored member not found in band', async () => {
    localStorage.setItem('setlister_member_id_1', '999');
    renderWithProviders(<TestConsumer />);
    await waitFor(() => {
      expect(localStorage.getItem('setlister_member_id_1')).toBeNull();
    });
    expect(screen.getByTestId('current')).toHaveTextContent('none');
  });

  it('clears selection and localStorage', async () => {
    localStorage.setItem('setlister_member_id_1', '1');
    renderWithProviders(<TestConsumer />);
    await waitFor(() => {
      expect(screen.getByTestId('current')).toHaveTextContent('Mike');
    });
    fireEvent.click(screen.getByText('Clear'));
    expect(screen.getByTestId('current')).toHaveTextContent('none');
    expect(localStorage.getItem('setlister_member_id_1')).toBeNull();
  });
});
