import { useState } from 'react';
import styled from 'styled-components';

interface CreateSetlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; date: string }) => Promise<void>;
}

export function CreateSetlistModal({ isOpen, onClose, onCreate }: CreateSetlistModalProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreate({ name, date });
    setName('');
    onClose();
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <h2>New Setlist</h2>
        <Form onSubmit={handleSubmit}>
          <Label>
            Name
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </Label>
          <Label>
            Date
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Label>
          <ButtonRow>
            <CancelButton type="button" onClick={onClose}>Cancel</CancelButton>
            <SubmitButton type="submit">Create</SubmitButton>
          </ButtonRow>
        </Form>
      </Modal>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const Modal = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  padding: ${({ theme }) => theme.spacing.xl};
  width: 400px;
  max-width: 90vw;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Input = styled.input`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  padding: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const CancelButton = styled.button`
  background: none;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.text};
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  cursor: pointer;
`;

const SubmitButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  border: none;
  border-radius: 4px;
  color: white;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  cursor: pointer;
  font-weight: bold;
`;
