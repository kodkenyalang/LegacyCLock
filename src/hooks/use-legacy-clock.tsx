'use client';

import { useToast } from '@/hooks/use-toast';
import type { Will } from '@/lib/types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

interface LegacyClockState {
  isConnected: boolean;
  userAddress: string | null;
  will: Will | null;
  lastCheckInTimestamp: number | null;
  isLoading: boolean;
}

interface LegacyClockContextType extends LegacyClockState {
  connectWallet: () => void;
  disconnect: () => void;
  createWill: (data: Omit<Will, 'testatorAddress' | 'deploymentTimestamp' | 'encryptedContentIPFSHash' | 'keySharesIPFSHash'>) => Promise<void>;
  checkIn: () => Promise<void>;
  findWill: (testatorAddress: string) => Promise<{ will: Will; lastCheckIn: number | null } | null>;
  claimWill: (testatorAddress: string) => Promise<string | null>;
}

const LegacyClockContext = createContext<LegacyClockContextType | undefined>(undefined);

export function LegacyClockProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LegacyClockState>({
    isConnected: false,
    userAddress: null,
    will: null,
    lastCheckInTimestamp: null,
    isLoading: true,
  });

  const { toast } = useToast();

  const loadDataForAddress = useCallback((address: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const willData = localStorage.getItem(`legacy-clock-will-${address}`);
      const checkInData = localStorage.getItem(`legacy-clock-checkin-${address}`);
      
      setState({
        isConnected: true,
        userAddress: address,
        will: willData ? JSON.parse(willData) : null,
        lastCheckInTimestamp: checkInData ? parseInt(checkInData, 10) : null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load data from storage', error);
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const connectWallet = useCallback(() => {
    setState((s) => ({ ...s, isLoading: true }));
    // Simulate wallet connection
    setTimeout(() => {
      const mockAddress = '0x1234567890AbCdEf1234567890aBcDeF12345678';
      loadDataForAddress(mockAddress);
      toast({
        title: 'Wallet Connected',
        description: `Connected as ${mockAddress.slice(0, 6)}...${mockAddress.slice(-4)}`,
      });
    }, 1000);
  }, [loadDataForAddress, toast]);

  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      userAddress: null,
      will: null,
      lastCheckInTimestamp: null,
      isLoading: false,
    });
    toast({ title: 'Wallet Disconnected' });
  }, [toast]);

  const createWill = useCallback(async (data: Omit<Will, 'testatorAddress' | 'deploymentTimestamp' | 'encryptedContentIPFSHash' | 'keySharesIPFSHash'>): Promise<void> => {
    if (!state.userAddress) throw new Error('User not connected');
    setState((s) => ({ ...s, isLoading: true }));

    return new Promise((resolve) => {
      setTimeout(() => {
        const newWill: Will = {
          ...data,
          testatorAddress: state.userAddress!,
          deploymentTimestamp: Date.now(),
          // Mock IPFS hashes
          encryptedContentIPFSHash: `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
          keySharesIPFSHash: `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        };
        const now = Date.now();

        localStorage.setItem(`legacy-clock-will-${state.userAddress!}`, JSON.stringify(newWill));
        localStorage.setItem(`legacy-clock-checkin-${state.userAddress!}`, now.toString());
        
        setState((s) => ({ ...s, will: newWill, lastCheckInTimestamp: now, isLoading: false }));
        toast({
          title: 'Will Created Successfully!',
          description: 'Your encrypted will has been deployed.',
        });
        resolve();
      }, 2000);
    });
  }, [state.userAddress, toast]);

  const checkIn = useCallback(async (): Promise<void> => {
    if (!state.userAddress) throw new Error('User not connected');
    setState((s) => ({ ...s, isLoading: true }));
    return new Promise((resolve) => {
      setTimeout(() => {
        const now = Date.now();
        localStorage.setItem(`legacy-clock-checkin-${state.userAddress!}`, now.toString());
        setState((s) => ({ ...s, lastCheckInTimestamp: now, isLoading: false }));
        toast({
          title: 'Check-in Successful!',
          description: 'Your activity has been recorded.',
        });
        resolve();
      }, 1000);
    });
  }, [state.userAddress, toast]);
  
  const findWill = useCallback(async (testatorAddress: string): Promise<{ will: Will; lastCheckIn: number | null } | null> => {
     setState((s) => ({ ...s, isLoading: true }));
     return new Promise((resolve) => {
        setTimeout(() => {
            try {
                const willData = localStorage.getItem(`legacy-clock-will-${testatorAddress}`);
                const checkInData = localStorage.getItem(`legacy-clock-checkin-${testatorAddress}`);
                setState((s) => ({ ...s, isLoading: false }));
                if (willData) {
                    resolve({
                        will: JSON.parse(willData),
                        lastCheckIn: checkInData ? parseInt(checkInData, 10) : null,
                    });
                } else {
                    resolve(null);
                }
            } catch (e) {
                console.error("Failed to find will", e);
                setState((s) => ({ ...s, isLoading: false }));
                resolve(null);
            }
        }, 1500);
     });
  }, []);

  const claimWill = useCallback(async (testatorAddress: string): Promise<string | null> => {
    return new Promise(async (resolve) => {
        const willData = await findWill(testatorAddress);
        if (!willData || !willData.will || !willData.lastCheckIn) {
            toast({ variant: 'destructive', title: 'Claim Failed', description: 'Will could not be claimed.'});
            return resolve(null);
        }

        const inactivityPeriodMs = willData.will.inactivityPeriodDays * 24 * 60 * 60 * 1000;
        const timeSinceCheckIn = Date.now() - willData.lastCheckIn;

        if (timeSinceCheckIn > inactivityPeriodMs) {
            toast({ title: 'Claim Successful!', description: 'Decrypting will content...'});
            // Simulate decryption
            return resolve(willData.will.content);
        } else {
            toast({ variant: 'destructive', title: 'Claim Failed', description: 'The inactivity period has not passed.'});
            return resolve(null);
        }
    });
  }, [findWill, toast]);


  useEffect(() => {
    // on initial load, check if we were previously connected
    const wasConnected = localStorage.getItem('legacy-clock-connected');
    if (wasConnected) {
      loadDataForAddress(wasConnected);
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, [loadDataForAddress]);
  
  useEffect(() => {
    // Persist connection state
    if (state.isConnected && state.userAddress) {
      localStorage.setItem('legacy-clock-connected', state.userAddress);
    } else {
      localStorage.removeItem('legacy-clock-connected');
    }
  }, [state.isConnected, state.userAddress]);

  return (
    <LegacyClockContext.Provider value={{ ...state, connectWallet, disconnect, createWill, checkIn, findWill, claimWill }}>
      {children}
    </LegacyClockContext.Provider>
  );
}

export function useLegacyClock() {
  const context = useContext(LegacyClockContext);
  if (context === undefined) {
    throw new Error('useLegacyClock must be used within a LegacyClockProvider');
  }
  return context;
}
