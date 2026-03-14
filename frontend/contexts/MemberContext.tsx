import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Member } from '@/lib/types';
import { useBand } from '@/contexts/BandContext';

interface MemberContextValue {
  currentMember: Member | null;
  setCurrentMember: (member: Member | null) => void;
}

const MemberContext = createContext<MemberContextValue>({
  currentMember: null,
  setCurrentMember: () => {},
});

export function MemberProvider({ children }: { children: ReactNode }) {
  const { band } = useBand();
  const [currentMember, setCurrentMemberState] = useState<Member | null>(null);

  useEffect(() => {
    if (!band) return;
    const storageKey = `setlister_member_id_${band.id}`;
    const storedId = localStorage.getItem(storageKey);
    if (storedId) {
      const found = band.members.find((m) => m.id === Number(storedId));
      if (found) {
        setCurrentMemberState(found);
      } else {
        localStorage.removeItem(storageKey);
      }
    }
  }, [band]);

  const setCurrentMember = useCallback((member: Member | null) => {
    if (!band) return;
    const storageKey = `setlister_member_id_${band.id}`;
    setCurrentMemberState(member);
    if (member) {
      localStorage.setItem(storageKey, String(member.id));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [band]);

  return (
    <MemberContext.Provider value={{ currentMember, setCurrentMember }}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  return useContext(MemberContext);
}
