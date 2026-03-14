import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { api } from '@/lib/api';

interface MemberNoteTextareaProps {
  memberId: number;
  setlistSongId: number;
  initialNote: string;
}

export function MemberNoteTextarea({ memberId, setlistSongId, initialNote }: MemberNoteTextareaProps) {
  const [value, setValue] = useState(initialNote);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const lastSavedRef = useRef(initialNote);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset when initialNote changes (e.g., member switch)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setValue(initialNote);
    lastSavedRef.current = initialNote;
    setSaveStatus('idle');
  }, [initialNote]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (fadeRef.current) clearTimeout(fadeRef.current);
    };
  }, []);

  const save = useCallback(async (note: string) => {
    if (note === lastSavedRef.current) return;

    try {
      await api.memberSongNotes.upsert({
        member_id: memberId,
        setlist_song_id: setlistSongId,
        note,
      });
      lastSavedRef.current = note;
      setSaveStatus('saved');

      if (fadeRef.current) clearTimeout(fadeRef.current);
      fadeRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
    }
  }, [memberId, setlistSongId]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(newValue), 1000);
  };

  const handleBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value !== lastSavedRef.current) {
      save(value);
    }
  };

  return (
    <Container>
      <LabelRow>
        <Label htmlFor={`member-note-${setlistSongId}`}>My Notes</Label>
        {saveStatus === 'saved' && <StatusSaved>Saved</StatusSaved>}
        {saveStatus === 'error' && <StatusError>Save failed</StatusError>}
      </LabelRow>
      <Textarea
        id={`member-note-${setlistSongId}`}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Your personal notes..."
        rows={2}
        aria-label="My Notes"
      />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Label = styled.label`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const StatusSaved = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.primary};
`;

const StatusError = styled.span`
  font-size: 0.75rem;
  color: #e74c3c;
`;

const Textarea = styled.textarea`
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
