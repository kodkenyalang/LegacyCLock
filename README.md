# LegacyClock: Decentralized Digital Will

LegacyClock is a decentralized application (dApp) that allows users to create, manage, and securely store their digital wills on the blockchain. It ensures that your digital assets and last wishes are passed on to your designated beneficiaries only after a predetermined period of inactivity, providing peace of mind and a secure, trustless system for digital inheritance.

![LegacyClock Screenshot](https://placehold.co/800x450.png?text=LegacyClock+Interface)

## Core Features

*   **Seamless Wallet Integration**: Easily connect with a variety of Web3 wallets like MetaMask, Coinbase Wallet, or social accounts using the integrated Thirdweb SDK.
*   **Create & Encrypt Your Will**: A user-friendly interface to write your will, define beneficiaries, and list digital assets. All content is encrypted before being stored.
*   **Decentralized Storage**: The encrypted will and its decryption keys are stored on decentralized networks (simulation using IPFS hashes), preventing single points of failure.
*   **Inactivity-Based Release**: The will can only be accessed by beneficiaries after the creator (testator) fails to "check-in" within a specified time period (e.g., 90 days), ensuring it's only released when intended.
*   **Secure Beneficiary Access**: Beneficiaries can search for a will using the testator's address and, if the inactivity period has passed, can use their unique key share to decrypt the will's content.
*   **Dual-Role Interface**: A clean, tab-based UI allowing users to seamlessly switch between the "Testator" view (to manage their own will) and the "Beneficiary" view (to access a will left to them).

## Technology Stack

This project is built with a modern, robust, and type-safe technology stack:

*   **Frontend**: [Next.js](https://nextjs.org/) (with App Router) & [React](https://reactjs.org/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN/UI](https://ui.shadcn.com/) for beautiful, accessible components.
*   **Web3**: [Thirdweb](https://thirdweb.com/) for multi-wallet connectivity and smart contract interaction.
*   **AI (optional)**: [Genkit](https://firebase.google.com/docs/genkit) is configured for potential future AI-powered features.

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

The core of LegacyClock is the `useLegacyClock` hook, which currently simulates the backend logic using the browser's `localStorage`.

1.  **Will Creation**: A user connects their wallet and fills out the `CreateWillForm`. Upon submission, the will's data is stringified and stored in `localStorage`, keyed by the user's wallet address. Mock IPFS hashes are generated to simulate decentralized storage.
2.  **Check-in**: The testator can click the "I'm Alive!" button to update a timestamp in `localStorage`. This action resets the inactivity timer.
3.  **Beneficiary Search**: A beneficiary enters a testator's address. The application checks `localStorage` for a corresponding will.
4.  **Claiming the Will**: If a will is found, the beneficiary can attempt to claim it. The app checks if the time since the last check-in exceeds the will's `inactivityPeriodDays`. If it does, the (simulated) decrypted content of the will is revealed.

## Future Development

*   **Smart Contract Integration**: Replace the `localStorage` simulation with real smart contract interactions on a network like Filecoin Calibration or an EVM-compatible L2.
*   **IPFS Integration**: Use a service like Thirdweb Storage or a public IPFS gateway to upload the encrypted will content and key shares.
*   **Enhanced Security**: Implement robust encryption/decryption logic and a secure method for splitting and distributing decryption keys to beneficiaries.
