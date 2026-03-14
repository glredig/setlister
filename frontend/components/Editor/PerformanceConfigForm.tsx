import styled from 'styled-components';
import { SongPerformanceConfig, Member } from '@/lib/types';
import { MemberNoteTextarea } from '@/components/Editor/MemberNoteTextarea';

interface PerformanceConfigFormProps {
  config: SongPerformanceConfig;
  members: Member[];
  onChange: (config: SongPerformanceConfig) => void;
  memberNote?: string;
  currentMemberId?: number | null;
  setlistSongId?: number;
}

export function PerformanceConfigForm({ config, members, onChange, memberNote, currentMemberId, setlistSongId }: PerformanceConfigFormProps) {
  const bandMembers = members.filter((m) => m.role === 'band_member');
  const backupEligible = bandMembers.filter((m) => !config.lead_vocalist_ids.includes(m.id));
  const multiInstrumentMembers = bandMembers.filter((m) => m.instruments.length >= 2);

  const handleLeadToggle = (memberId: number) => {
    const isLead = config.lead_vocalist_ids.includes(memberId);
    const newLeads = isLead
      ? config.lead_vocalist_ids.filter((id) => id !== memberId)
      : [...config.lead_vocalist_ids, memberId];
    const newBackups = config.backup_vocalist_ids.filter((id) => !newLeads.includes(id));
    onChange({ ...config, lead_vocalist_ids: newLeads, backup_vocalist_ids: newBackups });
  };

  const handleBackupToggle = (memberId: number) => {
    const isBackup = config.backup_vocalist_ids.includes(memberId);
    const newBackups = isBackup
      ? config.backup_vocalist_ids.filter((id) => id !== memberId)
      : [...config.backup_vocalist_ids, memberId];
    onChange({ ...config, backup_vocalist_ids: newBackups });
  };

  const handleAddSolo = () => {
    onChange({ ...config, solos: [...config.solos, { member_id: 0, instrument: '' }] });
  };

  const handleRemoveSolo = (index: number) => {
    onChange({ ...config, solos: config.solos.filter((_, i) => i !== index) });
  };

  const handleSoloChange = (index: number, field: 'member_id' | 'instrument', value: string) => {
    const newSolos = config.solos.map((solo, i) => {
      if (i !== index) return solo;
      if (field === 'member_id') {
        const newMemberId = Number(value);
        const newMemberInstruments = members.find((m) => m.id === newMemberId)?.instruments || [];
        const instrumentStillValid = newMemberInstruments.includes(solo.instrument);
        return { member_id: newMemberId, instrument: instrumentStillValid ? solo.instrument : '' };
      }
      return { ...solo, [field]: value };
    });
    onChange({ ...config, solos: newSolos });
  };

  const handleOverrideChange = (memberId: number, instrument: string) => {
    const newOverrides = { ...config.instrument_overrides };
    if (instrument === '') {
      delete newOverrides[String(memberId)];
    } else {
      newOverrides[String(memberId)] = instrument;
    }
    onChange({ ...config, instrument_overrides: newOverrides });
  };

  const handleNotesChange = (notes: string) => {
    onChange({ ...config, free_text_notes: notes });
  };

  return (
    <FormContainer>
      <FieldGroup>
        <FieldLabel>Lead Vocalists</FieldLabel>
        <CheckboxGroup>
          {bandMembers.map((m) => (
            <CheckboxLabel key={m.id} htmlFor={`lead-${m.id}`}>
              <input
                type="checkbox"
                id={`lead-${m.id}`}
                checked={config.lead_vocalist_ids.includes(m.id)}
                onChange={() => handleLeadToggle(m.id)}
                aria-label={`Lead: ${m.name}`}
              />
              {m.name}
            </CheckboxLabel>
          ))}
        </CheckboxGroup>
      </FieldGroup>

      <FieldGroup>
        <FieldLabel>Backup Vocals</FieldLabel>
        <CheckboxGroup>
          {backupEligible.map((m) => (
            <CheckboxLabel key={m.id} htmlFor={`backup-${m.id}`}>
              <input
                type="checkbox"
                id={`backup-${m.id}`}
                checked={config.backup_vocalist_ids.includes(m.id)}
                onChange={() => handleBackupToggle(m.id)}
                aria-label={`Backup: ${m.name}`}
              />
              {m.name}
            </CheckboxLabel>
          ))}
        </CheckboxGroup>
      </FieldGroup>

      <FieldGroup>
        <FieldLabel>Solos</FieldLabel>
        {config.solos.map((solo, index) => (
          <SoloRow key={`solo-${index}-${solo.member_id}`}>
            <Select
              value={solo.member_id || ''}
              onChange={(e) => handleSoloChange(index, 'member_id', e.target.value)}
              aria-label={`Solo ${index + 1} member`}
            >
              <option value="">Select member</option>
              {bandMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
            <Select
              value={solo.instrument}
              onChange={(e) => handleSoloChange(index, 'instrument', e.target.value)}
              aria-label={`Solo ${index + 1} instrument`}
            >
              <option value="">Select instrument</option>
              {solo.member_id
                ? (members.find((m) => m.id === solo.member_id)?.instruments || []).map((inst) => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))
                : bandMembers.flatMap((m) => m.instruments)
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .map((inst) => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))
              }
            </Select>
            <RemoveButton
              onClick={() => handleRemoveSolo(index)}
              aria-label={`Remove solo ${index + 1}`}
              type="button"
            >
              ×
            </RemoveButton>
          </SoloRow>
        ))}
        <AddButton onClick={handleAddSolo} type="button" aria-label="Add solo">
          + Add Solo
        </AddButton>
      </FieldGroup>

      <FieldGroup>
        <FieldLabel>Instrument Overrides</FieldLabel>
        {multiInstrumentMembers.map((m) => (
          <OverrideRow key={m.id}>
            <MemberName>{m.name}</MemberName>
            <Select
              value={config.instrument_overrides[String(m.id)] || ''}
              onChange={(e) => handleOverrideChange(m.id, e.target.value)}
              aria-label={`Override for ${m.name}`}
            >
              <option value="">Default</option>
              {m.instruments.map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </Select>
          </OverrideRow>
        ))}
      </FieldGroup>

      <FieldGroup>
        <FieldLabel>Notes</FieldLabel>
        <NotesTextarea
          value={config.free_text_notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Performance notes..."
          rows={3}
          aria-label="Notes"
        />
      </FieldGroup>

      {currentMemberId && setlistSongId && (
        <FieldGroup>
          <MemberNoteTextarea
            memberId={currentMemberId}
            setlistSongId={setlistSongId}
            initialNote={memberNote ?? ''}
          />
        </FieldGroup>
      )}
    </FormContainer>
  );
}

const FormContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const FieldLabel = styled.label`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: 0.85rem;
  cursor: pointer;
`;

const OverrideRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const MemberName = styled.span`
  font-size: 0.85rem;
  min-width: 80px;
`;

const NotesTextarea = styled.textarea`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.85rem;
  font-family: inherit;
  resize: vertical;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const SoloRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const Select = styled.select`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.85rem;
  flex: 1;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.1rem;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.xs};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const AddButton = styled.button`
  background: none;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  font-size: 0.85rem;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`;
