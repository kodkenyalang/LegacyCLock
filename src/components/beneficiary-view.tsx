'use client';
import { useLegacyClock } from '@/hooks/use-legacy-clock';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { useState } from 'react';
import type { Will } from '@/lib/types';
import { AlertTriangle, KeyRound, Loader2, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function BeneficiaryView() {
  const { findWill, claimWill, isLoading } = useLegacyClock();
  const [testatorAddress, setTestatorAddress] = useState('');
  const [searchResult, setSearchResult] = useState<{ will: Will; lastCheckIn: number | null } | null | 'not_found'>(null);
  const [decryptedWill, setDecryptedWill] = useState<string | null>(null);
  const [keyShare, setKeyShare] = useState('');

  const handleSearch = async () => {
    if (!testatorAddress) return;
    const result = await findWill(testatorAddress);
    setSearchResult(result || 'not_found');
  };

  const handleClaim = async () => {
      if(searchResult && searchResult !== 'not_found' && searchResult.will.beneficiaries.some(b => b.address === keyShare)) {
        const content = await claimWill(searchResult.will.testatorAddress);
        if (content) {
            setDecryptedWill(content);
        }
      } else {
        setDecryptedWill('invalid_key');
      }
  };

  const renderResult = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    if (searchResult === 'not_found') {
      return (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>No will was found for the provided address.</AlertDescription>
        </Alert>
      );
    }
    if (searchResult) {
      const { will, lastCheckIn } = searchResult;
      const inactivityPeriodMs = will.inactivityPeriodDays * 24 * 60 * 60 * 1000;
      const timeSinceCheckIn = lastCheckIn ? Date.now() - lastCheckIn : Infinity;
      const isReleasable = timeSinceCheckIn > inactivityPeriodMs;

      return (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Will Status for Testator</CardTitle>
            <CardDescription className="font-mono break-all">{will.testatorAddress}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={isReleasable ? 'default' : 'outline'}>
                {isReleasable ? 'Releasable' : 'Locked'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Activity</span>
              <span>{lastCheckIn ? `${formatDistanceToNow(new Date(lastCheckIn))} ago` : 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Inactivity Period</span>
              <span>{will.inactivityPeriodDays} days</span>
            </div>
          </CardContent>
          <CardFooter>
            <Dialog>
              <DialogTrigger asChild>
                <Button disabled={!isReleasable || isLoading} className="w-full">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Claim & Decrypt Will
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Decrypt Will</DialogTitle>
                  <DialogDescription>
                    To decrypt the will, you must provide your secret key share. This is a simulation, enter a beneficiary address from the will.
                  </DialogDescription>
                </DialogHeader>
                {decryptedWill === 'invalid_key' && (
                    <Alert variant="destructive">
                        <AlertTitle>Invalid Key Share</AlertTitle>
                        <AlertDescription>The provided key share is incorrect. You might not be a beneficiary.</AlertDescription>
                    </Alert>
                )}
                {decryptedWill && decryptedWill !== 'invalid_key' ? (
                  <div>
                    <h3 className="font-semibold mb-2">Decrypted Will Content:</h3>
                    <pre className="p-4 bg-muted rounded-md whitespace-pre-wrap text-sm">{decryptedWill}</pre>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Input
                      placeholder="Enter your key share (beneficiary address)"
                      value={keyShare}
                      onChange={(e) => setKeyShare(e.target.value)}
                    />
                    <Button onClick={handleClaim} disabled={isLoading} className="w-full">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                      Decrypt
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      );
    }
    return null;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Access a Will</CardTitle>
        <CardDescription>
          Enter the testator's wallet address to find their will and check its status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Enter testator's address (e.g., 0x123...)"
            value={testatorAddress}
            onChange={(e) => setTestatorAddress(e.target.value)}
          />
          <Button type="submit" onClick={handleSearch} disabled={isLoading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        {renderResult()}
      </CardContent>
    </Card>
  );
}
