import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BandProvider, useBand } from '@/contexts/BandContext';
import { api } from '@/lib/api';

jest.mock('@/lib/api');
const mockedApi = jest.mocked(api);

function TestConsumer() {
  const { band, loading } = useBand();
  if (loading) return <div>Loading...</div>;
  if (!band) return <div>No band</div>;
  return (
    <div>
      <span data-testid="band-name">{band.name}</span>
      <span data-testid="member-count">{band.members.length}</span>
    </div>
  );
}

describe('BandContext', () => {
  it('provides band data after loading', async () => {
    mockedApi.bands.get.mockResolvedValueOnce({
      id: 1,
      name: 'The Originals',
      members: [
        { id: 1, name: 'Mike', instruments: ['guitar'], role: 'band_member' },
        { id: 2, name: 'Sarah', instruments: ['guitar'], role: 'band_member' },
      ],
    });

    render(
      <BandProvider bandId={1}>
        <TestConsumer />
      </BandProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('band-name')).toHaveTextContent('The Originals');
      expect(screen.getByTestId('member-count')).toHaveTextContent('2');
    });
  });
});
