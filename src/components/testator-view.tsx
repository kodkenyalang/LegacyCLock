'use client';
import { useLegacyClock } from '@/hooks/use-legacy-clock';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { CreateWillForm } from './create-will-form';
import { useState } from 'react';
import { Badge } from './ui/badge';
import { AlertCircle, CheckCircle, Diamond, Fingerprint, Hash, Loader2, Package, ScrollText, Timer, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function TestatorView() {
  const { will, isLoading, checkIn, lastCheckInTimestamp } = useLegacyClock();
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!will) {
    return (
      <Card className="w-full max-w-2xl mx-auto mt-8 text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <ScrollText className="w-6 h-6 text-primary" />
            Create Your Digital Will
          </CardTitle>
          <CardDescription>
            Secure your digital legacy by creating an encrypted, decentralized will.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Your will is encrypted and stored on a decentralized network. Only your designated beneficiaries can access it after a specified period of inactivity.
          </p>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button size="lg">Create Will Now</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Create Your Will</DialogTitle>
                <DialogDescription>
                  Fill in the details below. This information will be encrypted and stored securely.
                </DialogDescription>
              </DialogHeader>
              <CreateWillForm onFinished={() => setIsFormOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  const timeSinceCheckIn = lastCheckInTimestamp ? Date.now() - lastCheckInTimestamp : 0;
  const inactivityPeriodMs = will.inactivityPeriodDays * 24 * 60 * 60 * 1000;
  const isInactive = timeSinceCheckIn > inactivityPeriodMs;

  return (
    <div className="space-y-6 mt-4">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-3">
                   Will Status
                   <Badge variant={isInactive ? "destructive" : "default"}>
                        {isInactive ? "Inactive" : "Active"}
                   </Badge>
                </CardTitle>
                <CardDescription>
                    This is the current status of your will. Check-in periodically to keep it active.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-md border">
                    <div className='flex items-center gap-2'>
                        {isInactive ? <AlertCircle className="w-5 h-5 text-destructive" /> : <CheckCircle className="w-5 h-5 text-green-600" />}
                        <span className="font-medium">Last Check-in:</span>
                    </div>
                    <span>{lastCheckInTimestamp ? `${formatDistanceToNow(new Date(lastCheckInTimestamp))} ago` : 'Never'}</span>
                </div>
                 <div className="flex items-center justify-between p-3 rounded-md border">
                    <div className='flex items-center gap-2'>
                        <Timer className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">Inactivity Period:</span>
                    </div>
                    <span>{will.inactivityPeriodDays} days</span>
                </div>
            </CardContent>
            <CardFooter>
                 <Button onClick={checkIn} disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Fingerprint className="mr-2 h-4 w-4" />}
                    I'm Alive! (Check-in)
                 </Button>
            </CardFooter>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="text-primary"/>Beneficiaries</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {will.beneficiaries.map((b, i) => (
                           <li key={i} className="flex items-center gap-2 text-sm font-mono p-2 border rounded-md bg-muted/50">
                             <span className='truncate'>{b.address}</span>
                           </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Package className="text-primary"/>Digital Assets</CardTitle>
                </CardHeader>
                <CardContent>
                     <ul className="space-y-2">
                        {will.assets.map((a, i) => (
                           <li key={i} className="flex flex-col p-2 border rounded-md">
                             <span className='font-semibold'>{a.description}</span>
                             <span className="text-sm text-muted-foreground font-mono truncate">{a.location}</span>
                           </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ScrollText className="text-primary" /> Encrypted Will Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 font-mono text-sm">
                 <div className="flex items-center gap-2"><Hash className="w-4 h-4 text-muted-foreground"/> <strong>Content (IPFS):</strong> <span className='truncate text-muted-foreground'>{will.encryptedContentIPFSHash}</span></div>
                 <div className="flex items-center gap-2"><Hash className="w-4 h-4 text-muted-foreground"/> <strong>Keys (IPFS):</strong> <span className='truncate text-muted-foreground'>{will.keySharesIPFSHash}</span></div>
            </CardContent>
        </Card>

    </div>
  )
}
