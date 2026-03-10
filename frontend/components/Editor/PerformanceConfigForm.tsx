import styled from 'styled-components';
import { SongPerformanceConfig, Member } from '@/lib/types';

interface PerformanceConfigFormProps {
  config: SongPerformanceConfig;
  members: Member[];
  onChange: (config: SongPerformanceConfig) => void;
}

export function PerformanceConfigForm({ config, members, onChange }: PerformanceConfigFormProps) {
  return (
    <FormContainer>
      <FieldLabel>Lead Vocalists</FieldLabel>
      <FieldLabel>Backup Vocals</FieldLabel>
      <FieldLabel>Solos</FieldLabel>
      <FieldLabel>Instrument Overrides</FieldLabel>
      <FieldLabel>Notes</FieldLabel>
    </FormContainer>
  );
}

const FormContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const FieldLabel = styled.label`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;
