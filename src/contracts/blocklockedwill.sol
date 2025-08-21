// SPDX-License-Identifier: MIT
//
pragma solidity ^0.8.0;

// Import ReentrancyGuard which is an OpenZeppelin solidity library that helps prevent reentrant calls to a function.
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Block Locked Will interface
/// @author Randamu developers  
/// @notice An interface for a block-locked will smart contract
/// allowing encrypted wills to be revealed after a specified block number.
interface IBlockLockedWill {
    function setWill(bytes32 _encryptedWillHashOrCid, bytes memory _decryptionKey) external payable;
    function revealDecryptionKey() external returns (bytes memory);
    function claimFunds() external;
    function getWillHash() external view returns (bytes32);
    function getLockBlock() external view returns (uint256);
    function getMinDepositAmount() external view returns (uint256);
    function getBeneficiaryFunds() external view returns (uint256);
}

/// @title Block Locked Will contract
/// @author Randamu developers
/// @notice A will smart contract that releases decryption keys and funds after a specified block time
/// with a minimum Ether deposit requirement.
contract BlockLockedWill is IBlockLockedWill, ReentrancyGuard {
    
    // State Variables
    address public owner;
    address public beneficiary;
    bytes32 public encryptedWillHashOrCid;
    bytes public decryptionKey;
    uint256 public lockBlock;
    uint256 public immutable minDepositAmount;
    bool public isWillSet;
    bool public hasWillBeenRevealed;
    uint8 public networkType;
    uint256 private lockBlockDelay;

    // Private mapping to track Ether balances available for withdrawal by the beneficiary
    mapping(address => uint256) private fundsAvailableForWithdrawal;

    // Custom Errors
    error InvalidInput();

    // Events
    event WillSet(address indexed depositor, address indexed beneficiary, bytes32 encryptedWillHashOrCid, uint256 lockBlock);
    event WillDecryptionKeyRevealed(address indexed beneficiary, bytes decryptionKey);
    event FundsWithdrawn(address indexed beneficiary, uint256 amount);
    event FundsReceived(address indexed sender, uint256 amount);
    event BeneficiaryUpdated(address indexed oldBeneficiary, address indexed newBeneficiary);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyBeneficiary() {
        require(msg.sender == beneficiary, "Only beneficiary can call this function");
        _;
    }

    modifier willNotSetYet() {
        require(!isWillSet, "Will has already been set");
        _;
    }

    modifier willUnlocked() {
        require(block.number >= lockBlock, "Will is still locked");
        _;
    }

    modifier willNotRevealed() {
        require(!hasWillBeenRevealed, "Decryption key has already been revealed");
        _;
    }

    modifier willIsSet() {
        require(isWillSet, "Will has not been set yet");
        _;
    }

    /// @dev Constructor sets the owner, beneficiary, and minimum deposit amount
    /// @param _owner The address of the contract owner (who sets the will, sometimes referred to as 'blocklocksender')
    /// @param _beneficiary The address of the person designated to receive the will
    /// @param _networkType An identifier for the network type to configure contract parameters
    constructor(address _owner, address _beneficiary, uint8 _networkType) payable {
        require(_owner != address(0), "Owner cannot be zero address");
        require(_beneficiary != address(0), "Beneficiary cannot be zero address");

        owner = _owner; // Set owner from the provided parameter
        beneficiary = _beneficiary; // Initialize beneficiary
        networkType = _networkType;
        
        // Configure network-specific parameters
        if (_networkType == 0) {
            // Base Sepolia configuration
            lockBlockDelay = 10; // 10 blocks (2 second block times)
            minDepositAmount = 0.01 ether; // 0.01 ETH
        } else if (_networkType == 1) {
            // Filecoin Calibration configuration
            lockBlockDelay = 2880; // ~24 hours (30 second epochs)
            minDepositAmount = 0.1 ether; // 0.1 tFIL
        } else {
            revert InvalidInput();
        }
        
        // If ETH/tFIL sent during deployment, record it
        if (msg.value > 0) {
            fundsAvailableForWithdrawal[beneficiary] += msg.value;
            emit FundsReceived(msg.sender, msg.value);
        }
    }

    /// @dev Allows the owner to deposit the encrypted will's hash/CID and decryption key
    /// @notice This function can only be called once by the owner with minimum deposit
    /// @param _encryptedWillHashOrCid The hash of the encrypted will or its IPFS CID
    /// @param _decryptionKey The key required to decrypt the will
    function setWill(bytes32 _encryptedWillHashOrCid, bytes memory _decryptionKey) 
        external 
        payable 
        onlyOwner 
        willNotSetYet 
    {
        require(msg.value >= minDepositAmount, "Deposit must be at least the minimum amount");
        require(_encryptedWillHashOrCid != bytes32(0), "Will hash/CID cannot be empty");
        require(_decryptionKey.length > 0, "Decryption key cannot be empty");

        encryptedWillHashOrCid = _encryptedWillHashOrCid;
        decryptionKey = _decryptionKey;
        lockBlock = block.number + lockBlockDelay; // Uses configured lockBlockDelay
        isWillSet = true;
        
        // Record funds available for beneficiary withdrawal
        fundsAvailableForWithdrawal[beneficiary] += msg.value;

        emit WillSet(msg.sender, beneficiary, _encryptedWillHashOrCid, lockBlock);
    }

    /// @dev Allows the beneficiary to retrieve the decryption key after the lock period
    /// @notice Can only be called once by the beneficiary after lockBlock is reached
    /// @return bytes The decryption key for the encrypted will
    function revealDecryptionKey() 
        external 
        onlyBeneficiary 
        willIsSet
        willUnlocked 
        willNotRevealed 
        returns (bytes memory) 
    {
        hasWillBeenRevealed = true;
        
        emit WillDecryptionKeyRevealed(beneficiary, decryptionKey);
        
        return decryptionKey;
    }

    /// @dev Allows the beneficiary to withdraw deposited Ether funds
    /// @notice Uses pull pattern for security, can only be called by beneficiary after unlock
    function claimFunds() 
        external 
        onlyBeneficiary 
        willIsSet
        willUnlocked 
        nonReentrant 
    {
        uint256 amount = fundsAvailableForWithdrawal[beneficiary];
        require(amount > 0, "No funds available for withdrawal");
        
        // Reset balance before transfer (Checks-Effects-Interactions pattern)
        fundsAvailableForWithdrawal[beneficiary] = 0;
        
        // Transfer funds to beneficiary
        payable(beneficiary).transfer(amount);
        
        emit FundsWithdrawn(beneficiary, amount);
    }

    /// @dev Returns the encrypted will hash or CID
    /// @notice Can be called by anyone to verify the will's integrity
    /// @return bytes32 The hash of the encrypted will or its IPFS CID
    function getWillHash() external view returns (bytes32) {
        return encryptedWillHashOrCid;
    }

    /// @dev Returns the block number when the will becomes unlocked
    /// @notice Can be called by anyone
    /// @return uint256 The block number after which the will can be accessed
    function getLockBlock() external view returns (uint256) {
        return lockBlock;
    }

    /// @dev Returns the minimum deposit amount required
    /// @notice Can be called by anyone
    /// @return uint256 The minimum deposit amount in Wei
    function getMinDepositAmount() external view returns (uint256) {
        return minDepositAmount;
    }

    /// @dev Returns the amount of Ether available for beneficiary withdrawal
    /// @notice Can only be called by the beneficiary
    /// @return uint256 The amount available for withdrawal in Wei
    function getBeneficiaryFunds() external view onlyBeneficiary returns (uint256) {
        return fundsAvailableForWithdrawal[beneficiary];
    }

    /// @dev Returns the current block number for reference
    /// @notice Utility function to check current block against lock block
    /// @return uint256 The current block number
    function getCurrentBlock() external view returns (uint256) {
        return block.number;
    }

    /// @dev Returns whether the will is currently unlocked
    /// @notice Utility function to check if lock period has passed
    /// @return bool True if current block >= lockBlock, false otherwise
    function isUnlocked() external view returns (bool) {
        return isWillSet && block.number >= lockBlock;
    }

    /// @dev Returns comprehensive contract state information
    /// @notice Utility function for front-end applications
    /// @return willSet Whether the will has been set
    /// @return keyRevealed Whether the decryption key has been revealed
    /// @return currentBlock The current block number
    /// @return unlockBlock The block number when will unlocks
    /// @return unlocked Whether the will is currently unlocked
    function getContractState() 
        external 
        view 
        returns (
            bool willSet,
            bool keyRevealed,
            uint256 currentBlock,
            uint256 unlockBlock,
            bool unlocked
        ) 
    {
        return (
            isWillSet,
            hasWillBeenRevealed,
            block.number,
            lockBlock,
            isWillSet && block.number >= lockBlock
        );
    }

    /// @dev Emergency function to allow owner to update beneficiary before will is set
    /// @notice Can only be called by owner before will is set
    /// @param _newBeneficiary The new beneficiary address
    function updateBeneficiary(address _newBeneficiary) 
        external 
        onlyOwner 
        willNotSetYet 
    {
        require(_newBeneficiary != address(0), "New beneficiary cannot be zero address");
        require(_newBeneficiary != beneficiary, "New beneficiary must be different from current");
        
        address oldBeneficiary = beneficiary;
        beneficiary = _newBeneficiary;
        
        emit BeneficiaryUpdated(oldBeneficiary, _newBeneficiary);
    }

    /// @dev Fallback function to reject direct Ether transfers
    /// @notice Prevents accidental Ether transfers outside of setWill function
    receive() external payable {
        revert("Direct Ether transfers not allowed. Use setWill function.");
    }

    /// @dev Fallback function for non-existent function calls
    fallback() external payable {
        revert("Function does not exist");
    }
}
