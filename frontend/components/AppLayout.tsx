import { ReactNode } from 'react';
import styled from 'styled-components';
import { useBand } from '@/contexts/BandContext';
import { useMember } from '@/contexts/MemberContext';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { band } = useBand();
  const { currentMember, setCurrentMember } = useMember();

  const handleMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const memberId = Number(e.target.value);
    if (memberId === 0) {
      setCurrentMember(null);
      return;
    }
    const member = band?.members.find((m) => m.id === memberId);
    if (member) setCurrentMember(member);
  };

  return (
    <Wrapper>
      {band && (
        <TopBar>
          <BandName>{band.name}</BandName>
          <MemberSelect
            value={currentMember?.id ?? 0}
            onChange={handleMemberChange}
            aria-label="Select member"
          >
            <option value={0}>Select member...</option>
            {band.members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </MemberSelect>
        </TopBar>
      )}
      <Main>{children}</Main>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
`;

const BandName = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MemberSelect = styled.select`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.85rem;
`;

const Main = styled.main`
  flex: 1;
  min-height: 0;
`;
