import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from 'styled-components';
import { theme } from '@/styles/theme';
import { PerformanceConfigForm } from '@/components/Editor/PerformanceConfigForm';
import { SongPerformanceConfig, Member } from '@/lib/types';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const mockMembers: Member[] = [
  { id: 1, name: 'Mike', instruments: ['guitar', 'vocals', 'keys'], role: 'band_member' },
  { id: 2, name: 'Sarah', instruments: ['guitar', 'vocals', 'keys'], role: 'band_member' },
  { id: 3, name: 'Jake', instruments: ['bass', 'vocals'], role: 'band_member' },
  { id: 4, name: 'Dave', instruments: ['drums'], role: 'band_member' },
  { id: 5, name: 'Chris', instruments: [], role: 'engineer' },
];

const emptyConfig: SongPerformanceConfig = {
  id: 1,
  lead_vocalist_ids: [],
  backup_vocalist_ids: [],
  solos: [],
  instrument_overrides: {},
  free_text_notes: '',
};

describe('PerformanceConfigForm', () => {
  describe('Lead Vocalists', () => {
    it('renders checkboxes for band members only (no engineers)', () => {
      renderWithTheme(
        <PerformanceConfigForm config={emptyConfig} members={mockMembers} onChange={jest.fn()} />
      );

      expect(screen.getByLabelText('Lead: Mike')).toBeInTheDocument();
      expect(screen.getByLabelText('Lead: Sarah')).toBeInTheDocument();
      expect(screen.getByLabelText('Lead: Jake')).toBeInTheDocument();
      expect(screen.getByLabelText('Lead: Dave')).toBeInTheDocument();
      expect(screen.queryByLabelText('Lead: Chris')).not.toBeInTheDocument();
    });

    it('checks lead vocalist checkboxes based on config', () => {
      const config = { ...emptyConfig, lead_vocalist_ids: [1, 2] };
      renderWithTheme(
        <PerformanceConfigForm config={config} members={mockMembers} onChange={jest.fn()} />
      );

      expect((screen.getByLabelText('Lead: Mike') as HTMLInputElement).checked).toBe(true);
      expect((screen.getByLabelText('Lead: Sarah') as HTMLInputElement).checked).toBe(true);
      expect((screen.getByLabelText('Lead: Jake') as HTMLInputElement).checked).toBe(false);
    });

    it('calls onChange when lead vocalist is toggled', () => {
      const onChange = jest.fn();
      renderWithTheme(
        <PerformanceConfigForm config={emptyConfig} members={mockMembers} onChange={onChange} />
      );

      fireEvent.click(screen.getByLabelText('Lead: Mike'));

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ lead_vocalist_ids: [1] })
      );
    });
  });

  describe('Backup Vocals', () => {
    it('auto-excludes lead vocalists from backup options', () => {
      const config = { ...emptyConfig, lead_vocalist_ids: [1] };
      renderWithTheme(
        <PerformanceConfigForm config={config} members={mockMembers} onChange={jest.fn()} />
      );

      expect(screen.queryByLabelText('Backup: Mike')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Backup: Sarah')).toBeInTheDocument();
    });

    it('removes member from backup when they become lead', () => {
      const config = { ...emptyConfig, lead_vocalist_ids: [], backup_vocalist_ids: [1] };
      const onChange = jest.fn();
      renderWithTheme(
        <PerformanceConfigForm config={config} members={mockMembers} onChange={onChange} />
      );

      fireEvent.click(screen.getByLabelText('Lead: Mike'));

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          lead_vocalist_ids: [1],
          backup_vocalist_ids: [],
        })
      );
    });
  });

  describe('Solos', () => {
    it('renders existing solos', () => {
      const config = {
        ...emptyConfig,
        solos: [{ member_id: 1, instrument: 'guitar' }],
      };
      renderWithTheme(
        <PerformanceConfigForm config={config} members={mockMembers} onChange={jest.fn()} />
      );

      expect(screen.getByDisplayValue('guitar')).toBeInTheDocument();
    });

    it('adds a solo row when Add Solo is clicked', () => {
      const onChange = jest.fn();
      renderWithTheme(
        <PerformanceConfigForm config={emptyConfig} members={mockMembers} onChange={onChange} />
      );

      fireEvent.click(screen.getByRole('button', { name: /add solo/i }));

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          solos: [{ member_id: 0, instrument: '' }],
        })
      );
    });

    it('removes a solo row when remove is clicked', () => {
      const config = {
        ...emptyConfig,
        solos: [
          { member_id: 1, instrument: 'guitar' },
          { member_id: 2, instrument: 'keys' },
        ],
      };
      const onChange = jest.fn();
      renderWithTheme(
        <PerformanceConfigForm config={config} members={mockMembers} onChange={onChange} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Remove solo 1' }));

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          solos: [{ member_id: 2, instrument: 'keys' }],
        })
      );
    });

    it('clears instrument when switching to member who does not play it', () => {
      const config = {
        ...emptyConfig,
        solos: [{ member_id: 1, instrument: 'guitar' }],
      };
      const onChange = jest.fn();
      renderWithTheme(
        <PerformanceConfigForm config={config} members={mockMembers} onChange={onChange} />
      );

      // Switch to Dave (drums only) — guitar is not valid
      fireEvent.change(screen.getByLabelText('Solo 1 member'), { target: { value: '4' } });

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          solos: [{ member_id: 4, instrument: '' }],
        })
      );
    });

    it('keeps instrument when switching to member who also plays it', () => {
      const config = {
        ...emptyConfig,
        solos: [{ member_id: 1, instrument: 'guitar' }],
      };
      const onChange = jest.fn();
      renderWithTheme(
        <PerformanceConfigForm config={config} members={mockMembers} onChange={onChange} />
      );

      // Switch to Sarah (guitar, vocals, keys) — guitar is still valid
      fireEvent.change(screen.getByLabelText('Solo 1 member'), { target: { value: '2' } });

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          solos: [{ member_id: 2, instrument: 'guitar' }],
        })
      );
    });

    it('updates solo member when dropdown changes', () => {
      const config = {
        ...emptyConfig,
        solos: [{ member_id: 1, instrument: 'guitar' }],
      };
      const onChange = jest.fn();
      renderWithTheme(
        <PerformanceConfigForm config={config} members={mockMembers} onChange={onChange} />
      );

      fireEvent.change(screen.getByLabelText('Solo 1 member'), { target: { value: '2' } });

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          solos: [{ member_id: 2, instrument: 'guitar' }],
        })
      );
    });
  });
});
