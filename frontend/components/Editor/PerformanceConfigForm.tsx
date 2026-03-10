import styled from 'styled-components';
import { SongPerformanceConfig, Member } from '@/lib/types';

interface PerformanceConfigFormProps {
  config: SongPerformanceConfig;
  members: Member[];
  onChange: (config: SongPerformanceConfig) => void;
}

export function PerformanceConfigForm({ config, members, onChange }: PerformanceConfigFormProps) {
  const bandMembers = members.filter((m) => m.role === 'band_member');
  const backupEligible = bandMembers.filter((m) => !config.lead_vocalist_ids.includes(m.id));

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
      </FieldGroup>

      <FieldGroup>
        <FieldLabel>Instrument Overrides</FieldLabel>
      </FieldGroup>

      <FieldGroup>
        <FieldLabel>Notes</FieldLabel>
      </FieldGroup>
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
