// app.js
// GCAM Presale Frontend Logic
// Uses: ethers.js v5 + Web3Modal v1 + WalletConnect v1

// ======== إعدادات عامة قابلة للتعديل ========

// TODO: عدل عنوان محفظة أو عقد البيع المسبق هنا
const PRESALE_RECEIVER_ADDRESS = "0xYourPresaleWalletOrContractHere";

// TODO: سعر الرمز في BNB (مثال: 0.0001 BNB لكل 1 GCAM)
const TOKEN_PRICE_IN_BNB = 0.0001;

// Chain ID لشبكة BSC Testnet
const BSC_TESTNET_CHAIN_ID_HEX = "0x61";
const BSC_TESTNET_PARAMS = {
  chainId: BSC_TESTNET_CHAIN_ID_HEX,
  chainName: "Binance Smart Chain Testnet",
  nativeCurrency: {
    name: "Binance Coin",
    symbol: "tBNB",
    decimals: 18
  },
  rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
  blockExplorerUrls: ["https://testnet.bscscan.com"]
};

// TODO: لو عندك عقد توكن وتبي تستدعي دواله (buyTokens, claimAirdrop, ...)
// حط الـ ABI والعنوان هنا واستخدمه لاحقًا
const TOKEN_CONTRACT_ADDRESS = "0xYourTokenContractAddressHere";
const TOKEN_CONTRACT_ABI = [
  // مثال، أضف ABI الحقيقي هنا:
  // "function buyWithBNB(uint256 tokenAmount) external payable",
  // "function claimAirdrop() external",
];

// ======== متغيرات Web3 ========
let web3Modal;
let provider;          // Raw provider (MetaMask / WalletConnect)
let ethersProvider;    // Ethers.js provider
let signer;            // Ethers.js signer
let selectedAccount;   // Current wallet address

// عناصر الـ DOM
let connectButton;
let disconnectButton;
let switchNetworkButton;
let statusDiv;
let twitterInput;
let verifyFollowButton;
let claimButton;
let tokenAmountInput;
let buyButton;
let presaleStatusDiv;

// ======== تهيئة Web3Modal ========
function initWeb3Modal
