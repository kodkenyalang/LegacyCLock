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
import { useActiveAccount, useReadContract, useSendAndConfirmTransaction } from 'thirdweb/react';
import { getContract, prepareContractCall } from 'thirdweb';
import { createThirdwebClient, defineChain } from 'thirdweb';
import { BLOCKLOCKEDWILL_ADDRESS, BLOCKLOCKEDWILL_ABI } from '@/contracts/contractconfig.js';


const client = createThirdwebClient({
  clientId: "3ee25fd2f6865a2aea1c1acec675921f",
});

const filecoinCalibration = defineChain({
  id: 314159,
  name: 'Filecoin Calibration',
  nativeCurrency: {
    name: 'tFIL',
    symbol: 'tFIL',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://api.calibration.node.glif.io/rpc/v1'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Filscan',
      url: 'https://calibration.filscan.io',
    },
  },
});

const contract = getContract({
  client,
  chain: filecoinCalibration,
  address: BLOCKLOCKEDWILL_ADDRESS,
  abi: BLOCKLOCKEDWILL_ABI,
});

interface LegacyClockState {
  isConnected: boolean;
  userAddress: string | null;
  will: Will | null;
  lastCheckInTimestamp: number | null;
  isLoading: boolean;
}

interface LegacyClockContextType extends LegacyClockState {
  createWill: (data: Omit<Will, 'testatorAddress' | 'deploymentTimestamp' | 'encryptedContentIPFSHash' | 'keySharesIPFSHash'>) => Promise<void>;
  checkIn: () => Promise<void>;
  findWill: (testatorAddress: string) => Promise<{ will: Will; lastCheckIn: number | null } | null>;
  claimWill: (testatorAddress: string) => Promise<string | null>;
}

const LegacyClockContext = createContext<LegacyClockContextType | undefined>(undefined);

export function LegacyClockProvider({ children }: { children: ReactNode }) {
  const account = useActiveAccount();
  const userAddress = account?.address ?? null;
  const { toast } = useToast();
  const { mutate: sendAndConfirmTx, isPending } = useSendAndConfirmTransaction();

  const { data: contractState, isLoading: isContractStateLoading } = useReadContract({
      contract,
      method: "getContractState",
      params: [],
  });
  
  const [state, setState] = useState<Omit<LegacyClockState, 'isConnected' | 'userAddress'>>({
    will: null,
    lastCheckInTimestamp: null,
    isLoading: true,
  });

  const loadDataForAddress = useCallback(async (address: string) => {
    setState((s) => ({ ...s, isLoading: true }));
    if (!contractState) {
        setState((s) => ({...s, isLoading: false}));
        return;
    }

    const [isWillSet, , , unlockBlock] = contractState;

    if(isWillSet) {
        // This part would fetch will details from IPFS or a backend in a real scenario
        // For now, we continue to use a simplified localStorage version for non-contract data
        const willData = localStorage.getItem(`legacy-clock-will-${address}`);
        const checkInData = localStorage.getItem(`legacy-clock-checkin-${address}`);

        const will = willData ? JSON.parse(willData) : {
            content: "Will content stored on-chain/IPFS",
            beneficiaries: [{address: '0x...'}],
            assets: [{description: "Asset details stored elsewhere", location: "ipfs://..."}],
            inactivityPeriodDays: 0, // This would be calculated from unlockBlock
            testatorAddress: address,
            deploymentTimestamp: 0, // This would come from the contract event
            encryptedContentIPFSHash: "Fetching from contract...",
            keySharesIPFSHash: "Fetching from contract..."
        };
        
        setState({
            will,
            lastCheckInTimestamp: checkInData ? parseInt(checkInData, 10) : null,
            isLoading: false,
        });

    } else {
         setState({
            will: null,
            lastCheckInTimestamp: null,
            isLoading: false,
        });
    }

  }, [contractState]);


  const createWill = useCallback(async (data: Omit<Will, 'testatorAddress' | 'deploymentTimestamp' | 'encryptedContentIPFSHash' | 'keySharesIPFSHash'>): Promise<void> => {
    if (!account) throw new Error('User not connected');
    
    // In a real app, you'd upload to IPFS first to get the hash.
    const mockIpfsHash = "0x" + "0".repeat(64); // bytes32
    // Decryption key should be securely handled.
    const mockDecryptionKey = "0x" + "0".repeat(64);
    
    const transaction = prepareContractCall({
      contract,
      method: "setWill",
      params: [mockIpfsHash as `0x${string}`, mockDecryptionKey as `0x${string}`]
    });

    sendAndConfirmTx(transaction, {
      onSuccess: () => {
        toast({
          title: 'Will Creation Sent!',
          description: 'Transaction is being processed.',
        });
        // We use localStorage to store the UI-related parts of the will
        const newWill: Will = {
          ...data,
          testatorAddress: account.address,
          deploymentTimestamp: Date.now(),
          encryptedContentIPFSHash: mockIpfsHash,
          keySharesIPFSHash: 'Qm...keys', // This is also mocked
        };
        localStorage.setItem(`legacy-clock-will-${account.address}`, JSON.stringify(newWill));
        localStorage.setItem(`legacy-clock-checkin-${account.address}`, Date.now().toString());

        setTimeout(() => loadDataForAddress(account.address), 2000); // Refresh data after a delay
      },
      onError: (error) => {
        toast({
          variant: 'destructive',
          title: 'Error Creating Will',
          description: error.message,
        });
      },
    });

  }, [account, sendAndConfirmTx, toast, loadDataForAddress]);

  const checkIn = useCallback(async (): Promise<void> => {
    if (!account) throw new Error('User not connected');
    toast({ title: 'Check-in not implemented', description: 'This feature requires a smart contract function not present in the ABI.' });
  }, [account, toast]);
  
  const findWill = useCallback(async (testatorAddress: string): Promise<{ will: Will; lastCheckIn: number | null } | null> => {
     setState((s) => ({ ...s, isLoading: true }));
     // This function will now check contract state
     // but will still rely on some local data for the full will object
      const willData = localStorage.getItem(`legacy-clock-will-${testatorAddress}`);
      const checkInData = localStorage.getItem(`legacy-clock-checkin-${testatorAddress}`);
      setState(s => ({...s, isLoading: false}));
      if (willData) {
        return {
          will: JSON.parse(willData),
          lastCheckIn: checkInData ? parseInt(checkInData, 10) : null
        }
      }
      return null;
  }, []);

  const claimWill = useCallback(async (testatorAddress: string): Promise<string | null> => {
    if (!account) throw new Error('User not connected');
    
    const transaction = prepareContractCall({
      contract,
      method: "revealDecryptionKey",
      params: []
    });

    return new Promise((resolve) => {
       sendAndConfirmTx(transaction, {
            onSuccess: (data: any) => {
                toast({ title: 'Claim Successful!', description: 'Decrypting will content...'});
                // In a real app, this data would be the key to decrypt content from IPFS.
                // For this simulation, we'll just return the "decrypted" key.
                const willData = localStorage.getItem(`legacy-clock-will-${testatorAddress}`);
                if (willData) {
                    resolve(JSON.parse(willData).content);
                } else {
                    resolve("Decryption key revealed, but off-chain content not found.");
                }
            },
            onError: (error) => {
                toast({ variant: 'destructive', title: 'Claim Failed', description: error.message});
                resolve(null);
            }
       });
    });
  }, [account, sendAndConfirmTx, toast]);


  useEffect(() => {
    if (userAddress) {
      loadDataForAddress(userAddress);
    } else {
      setState({
        will: null,
        lastCheckInTimestamp: null,
        isLoading: false,
      });
    }
  }, [userAddress, loadDataForAddress, contractState]);

  return (
    <LegacyClockContext.Provider value={{
      ...state,
      isLoading: state.isLoading || isPending || isContractStateLoading,
      isConnected: !!userAddress,
      userAddress,
      createWill,
      checkIn,
      findWill,
      claimWill
    }}>
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
