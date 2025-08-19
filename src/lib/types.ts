export interface Beneficiary {
  address: string;
}

export interface DigitalAsset {
  description:string;
  location: string;
}

export interface Will {
  content: string;
  beneficiaries: Beneficiary[];
  assets: DigitalAsset[];
  inactivityPeriodDays: number;
  encryptedContentIPFSHash: string;
  keySharesIPFSHash: string;
  testatorAddress: string;
  deploymentTimestamp: number;
}
