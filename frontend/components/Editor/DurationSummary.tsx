import styled from 'styled-components';

interface DurationSummaryProps {
  songDurations: number[];
  gapSeconds: number;
  onGapChange: (gap: number) => void;
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (seconds > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${minutes}m`;
}

export function DurationSummary({ songDurations, gapSeconds, onGapChange }: DurationSummaryProps) {
  const songTotal = songDurations.reduce((sum, d) => sum + d, 0);
  const gapCount = Math.max(0, songDurations.length - 1);
  const totalSeconds = songTotal + gapCount * gapSeconds;

  return (
    <Container>
      <DurationDisplay>
        <DurationLabel>Duration</DurationLabel>
        <DurationValue>{formatDuration(totalSeconds)}</DurationValue>
      </DurationDisplay>
      <GapControl>
        <GapLabel htmlFor="gap-input">Time between songs (seconds)</GapLabel>
        <GapInput
          id="gap-input"
          type="number"
          min={0}
          value={gapSeconds}
          onChange={(e) => onGapChange(e.target.value === '' ? 0 : Number(e.target.value))}
          aria-label="Time between songs (seconds)"
        />
      </GapControl>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surfaceLight};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const DurationDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const DurationLabel = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const DurationValue = styled.span`
  font-size: 1rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.text};
`;

const GapControl = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const GapLabel = styled.label`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const GapInput = styled.input`
  width: 60px;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  padding: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.85rem;
  text-align: center;
`;
