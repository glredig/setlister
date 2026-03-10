import styled from 'styled-components';
import { Setlist } from '@/lib/types';

interface SetlistCardProps {
  setlist: Setlist;
  onDelete: (id: number) => void;
}

export function SetlistCard({ setlist, onDelete }: SetlistCardProps) {
  const formattedDate = new Date(setlist.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card>
      <CardBody href={`/setlists/${setlist.id}/edit`}>
        <SetlistName>{setlist.name}</SetlistName>
        <SetlistDate>{formattedDate}</SetlistDate>
        {setlist.notes && <SetlistNotes>{setlist.notes}</SetlistNotes>}
      </CardBody>
      <DeleteButton onClick={() => onDelete(setlist.id)} aria-label={`Delete ${setlist.name}`}>
        &times;
      </DeleteButton>
    </Card>
  );
}

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  display: flex;
  align-items: center;
  transition: border-color 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const CardBody = styled.a`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  display: block;
`;

const SetlistName = styled.h3`
  font-size: 1.1rem;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const SetlistDate = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const SetlistNotes = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 1.5rem;
  padding: ${({ theme }) => theme.spacing.md};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;
