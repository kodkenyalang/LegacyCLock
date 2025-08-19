'use client';

import { useLegacyClock } from '@/hooks/use-legacy-clock';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { ChevronDown, Copy, Loader2, LogOut, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ConnectWalletButton() {
  const { isConnected, userAddress, connectWallet, disconnect, isLoading } = useLegacyClock();
  const { toast } = useToast();

  const handleCopy = () => {
    if (userAddress) {
      navigator.clipboard.writeText(userAddress);
      toast({
        title: 'Address Copied!',
        description: 'Your wallet address is now in your clipboard.',
      });
    }
  };

  if (isLoading && !userAddress) {
    return <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</Button>
  }

  if (!isConnected || !userAddress) {
    return (
      <Button onClick={connectWallet} disabled={isLoading}>
        {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
            <Wallet className="mr-2 h-4 w-4" />
        )}
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {`${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy Address</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={disconnect}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
