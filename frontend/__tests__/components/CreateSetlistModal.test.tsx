import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { CreateSetlistModal } from '@/components/Dashboard/CreateSetlistModal';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('CreateSetlistModal', () => {
  it('calls onCreate with form data', async () => {
    const onCreate = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();

    renderWithTheme(
      <CreateSetlistModal isOpen={true} onClose={onClose} onCreate={onCreate} />
    );

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Set' } });
    fireEvent.change(screen.getByLabelText(/date/i), { target: { value: '2026-04-01' } });
    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({ name: 'New Set', date: '2026-04-01' });
    });
  });

  it('does not render when closed', () => {
    renderWithTheme(
      <CreateSetlistModal isOpen={false} onClose={jest.fn()} onCreate={jest.fn()} />
    );

    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
  });
});
