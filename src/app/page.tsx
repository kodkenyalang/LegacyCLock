'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLegacyClock } from '@/hooks/use-legacy-clock';
import { Wallet } from 'lucide-react';
import { Header } from '@/components/header';
import { TestatorView } from '@/components/testator-view';
import { BeneficiaryView } from '@/components/beneficiary-view';

export default function Home() {
  const { isConnected, userAddress } = useLegacyClock();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        {!isConnected ? (
          <div className="flex items-center justify-center h-full pt-20">
            <Card className="w-full max-w-md text-center">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                  <Wallet className="w-6 h-6" />
                  Connect Your Wallet
                </CardTitle>
                <CardDescription>
                  Please connect your Web3 wallet to manage your digital will and assets securely.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your wallet is your key to the decentralized web. LegacyClock uses it to ensure only you can create and manage your will.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Tabs defaultValue="testator" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto">
              <TabsTrigger value="testator">My Will (Testator)</TabsTrigger>
              <TabsTrigger value="beneficiary">Beneficiary</TabsTrigger>
            </TabsList>
            <TabsContent value="testator">
              <TestatorView />
            </TabsContent>
            <TabsContent value="beneficiary">
              <BeneficiaryView />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
