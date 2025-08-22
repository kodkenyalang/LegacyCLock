# LegacyClock: Decentralized Digital Will


LegacyClock is a decentralized application (dApp) that allows users to create, manage, and securely store their digital wills on the blockchain. It ensures that your digital assets and last wishes are passed on to your designated beneficiaries only after a specific block height is reached, providing a trustless and secure system for digital inheritance.

![LegacyClock Screenshot](https://github.com/kodkenyalang/LegacyCLock/blob/main/LegacyClock.png)

## Core Features

*   **Seamless Wallet Integration**: Connect with Web3 wallets like MetaMask or use social logins via the integrated Thirdweb SDK.
*   **On-Chain Will Creation**: Create your will and lock it in a smart contract on the Filecoin Calibration testnet. The transaction defines an encrypted will hash and a future block number for release.
*   **Decentralized & Secure**: The core logic is governed by the `BlocklockedWill` smart contract. While this version uses `localStorage` to simulate off-chain data (like will content), the release mechanism is fully on-chain.
*   **Block-Based Release**: The will's decryption key can only be revealed by the beneficiary after the current blockchain height surpasses the `lockBlock` defined during creation, ensuring it's only released when intended.
*   **Secure Beneficiary Access**: A beneficiary can interact with the contract to check the will's status. If the `lockBlock` has passed, they can call a function to receive the decryption key.
*   **Dual-Role Interface**: A clean, tab-based UI allowing users to switch between the "Testator" view (to manage their own will) and the "Beneficiary" view (to access a will left to them).
  
## Technology Stack

This project is built with a modern, robust, and type-safe technology stack:

*   **Frontend**: [Next.js](https://nextjs.org/) (with App Router) & [React](https://reactjs.org/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN/UI](https://ui.shadcn.com/) for beautiful, accessible components.
*   **Web3**: [Thirdweb](https://thirdweb.com/) for multi-wallet connectivity and smart contract interaction.
*   **Smart Contract**: A `BlocklockedWill` contract written in Solidity.

## Getting Started

To set up and run the project locally, follow these steps.

### Prerequisites

*   [Node.js](https://nodejs.org/en/) (v18 or later)
*   A package manager like [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
*   A Web3 wallet browser extension (e.g., [MetaMask](https://metamask.io/))

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/legacy-clock.git
    cd legacy-clock
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    This project uses Thirdweb for wallet connections. You will need a `clientId` from Thirdweb.
    *   Create a `.env.local` file in the root of the project.
    *   Add your Thirdweb client ID to the file:
        ```
        NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id_here
        ```

### Running the Development Server

Once the installation is complete, you can start the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the application. The app will automatically reload if you make any changes to the code.

## How It Works

The core of LegacyClock is the `useLegacyClock` hook, which interacts with a deployed `BlocklockedWill` smart contract.

1.  **Will Creation**: A user connects their wallet and fills out the `CreateWillForm`. Upon submission, the dApp sends a transaction to the `setWill` function of the smart contract. This on-chain call records a hash of the encrypted will (simulated IPFS hash) and a decryption key (both mocked for this version). The UI-related will data is stored in `localStorage` to simulate retrieval from a service like IPFS.
2.  **Beneficiary Search**: A beneficiary enters a testator's address. The application reads the will's status from the smart contract using `getContractState`.
3.  **Claiming the Will**: If a will exists and the blockchain's current block number has surpassed the will's `lockBlock`, the beneficiary can claim it. This calls the `revealDecryptionKey` function on the smart contract. If successful, the contract releases the decryption key, and the dApp displays the (simulated) decrypted content from `localStorage`.
4.  **Check-in**: The "Check-in" functionality in the UI is a placeholder from the previous design. The current smart contract uses a fixed `lockBlock` for release and does not support a "heartbeat" or check-in mechanism to extend the lock.

## Future Development

*   **Full IPFS Integration**: Replace the `localStorage` simulation with a real decentralized storage solution like IPFS. The `createWill` flow would first upload the encrypted will content to IPFS and then pass the resulting hash to the smart contract.
*   **Enhanced Security**: Implement robust, real-world encryption/decryption logic and a secure method for managing keys.
*   **Dynamic Lock Period**: Update the smart contract to allow the testator to "check-in" and postpone the `lockBlock`, aligning with the original inactivity-based design.
*   **Multi-Beneficiary Key Management**: Implement a key-splitting mechanism (e.g., Shamir's Secret Sharing) and store the key shares on a decentralized network, allowing multiple beneficiaries to collectively decrypt the will.
