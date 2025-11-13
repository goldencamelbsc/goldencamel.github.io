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
function initWeb3Modal() {
  const WalletConnectProvider = window.WalletConnectProvider
    ? window.WalletConnectProvider.default || window.WalletConnectProvider
    : null;

  const providerOptions = {};

  if (WalletConnectProvider) {
    providerOptions.walletconnect = {
      package: WalletConnectProvider,
      options: {
        rpc: {
          97: "https://data-seed-prebsc-1-s1.binance.org:8545/"
        },
        chainId: 97
      }
    };
  }

  const Web3ModalClass = window.Web3Modal
    ? window.Web3Modal.default || window.Web3Modal
    : null;

  if (!Web3ModalClass) {
    console.error("Web3Modal library not found");
    return;
  }

  web3Modal = new Web3ModalClass({
    cacheProvider: true,
    providerOptions,
    theme: "dark"
  });
}

// ======== تحديث حالة الواجهة ========
function setStatus(message) {
  if (statusDiv) {
    statusDiv.textContent = message;
  } else {
    console.log("STATUS:", message);
  }
}

function updateUIOnConnect() {
  if (connectButton) connectButton.disabled = true;
  if (disconnectButton) disconnectButton.disabled = false;
  if (switchNetworkButton) switchNetworkButton.disabled = false;

  if (buyButton) buyButton.disabled = false; // يمكنك تقييدها بشرط الشبكة لاحقًا
  if (claimButton) {
    // سيتم تفعيلها بعد التحقق من متابعة X
    // claimButton.disabled = true;
  }
}

function updateUIOnDisconnect() {
  if (connectButton) connectButton.disabled = false;
  if (disconnectButton) disconnectButton.disabled = true;
  if (switchNetworkButton) switchNetworkButton.disabled = false;

  if (buyButton) buyButton.disabled = true;
  if (claimButton) claimButton.disabled = true;

  setStatus("🔗 يرجى توصيل محفظتك");
  if (presaleStatusDiv) {
    presaleStatusDiv.textContent = "💵 أدخل الكمية لمعرفة السعر التقريبي";
  }
}

// ======== ربط المحفظة ========
async function connectWallet() {
  try {
    if (!web3Modal) {
      initWeb3Modal();
    }

    provider = await web3Modal.connect();
    ethersProvider = new window.ethers.providers.Web3Provider(provider);
    signer = ethersProvider.getSigner();

    const accounts = await ethersProvider.listAccounts();
    selectedAccount = accounts[0];

    setStatus(`✅ تم ربط المحفظة:\n${selectedAccount}`);
    updateUIOnConnect();

    // الاستماع لتغيير الحساب أو الشبكة
    if (provider.on) {
      provider.on("accountsChanged", handleAccountsChanged);
      provider.on("chainChanged", handleChainChanged);
      provider.on("disconnect", handleDisconnect);
    }
  } catch (err) {
    console.error("Connection error:", err);
    setStatus("❌ فشل ربط المحفظة أو تم الإلغاء من المستخدم");
  }
}

// ======== فصل المحفظة ========
async function disconnectWallet() {
  try {
    if (provider && provider.disconnect && typeof provider.disconnect === "function") {
      await provider.disconnect();
    }

    if (web3Modal) {
      await web3Modal.clearCachedProvider();
    }

    provider = null;
    ethersProvider = null;
    signer = null;
    selectedAccount = null;

    updateUIOnDisconnect();
  } catch (err) {
    console.error("Disconnect error:", err);
    setStatus("⚠️ حدث خطأ أثناء فصل المحفظة");
  }
}

// ======== تغيير الحساب/الشبكة/الانفصال من مزود Web3 ========
function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // لا يوجد حسابات متصلة
    disconnectWallet();
  } else {
    selectedAccount = accounts[0];
    setStatus(`✅ تم تغيير الحساب:\n${selectedAccount}`);
  }
}

function handleChainChanged(_chainId) {
  // يمكن إعادة تحميل الصفحة أو تحديث الحالة فقط
  setStatus(`🔄 تم تغيير الشبكة (Chain ID: ${_chainId})`);
}

function handleDisconnect(error) {
  console.log("Provider disconnected:", error);
  disconnectWallet();
}

// ======== التبديل إلى شبكة BSC Testnet ========
async function switchToBscTestnet() {
  if (!window.ethereum) {
    alert("⚠️ تحتاج إلى MetaMask أو متصفح يدعم Web3 للتبديل بين الشبكات.");
    return;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BSC_TESTNET_CHAIN_ID_HEX }]
    });
    setStatus("✅ تم التبديل إلى شبكة BSC Testnet");
  } catch (switchError) {
    // لو الشبكة غير مضافة في MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [BSC_TESTNET_PARAMS]
        });
        setStatus("✅ تم إضافة شبكة BSC Testnet والتبديل إليها");
      } catch (addError) {
        console.error("Add chain error:", addError);
        setStatus("❌ لم يتم إضافة شبكة BSC Testnet");
      }
    } else {
      console.error("Switch chain error:", switchError);
      setStatus("❌ تعذر التبديل إلى شبكة BSC Testnet");
    }
  }
}

// ======== حساب السعر التقريبي بناءً على الكمية ========
function updatePresalePricePreview() {
  if (!tokenAmountInput || !presaleStatusDiv) return;

  const amountStr = tokenAmountInput.value.trim();
  if (!amountStr || isNaN(amountStr) || Number(amountStr) <= 0) {
    presaleStatusDiv.textContent = "💵 أدخل الكمية لمعرفة السعر التقريبي";
    return;
  }

  const amount = Number(amountStr);
  const totalBNB = amount * TOKEN_PRICE_IN_BNB;

  presaleStatusDiv.textContent =
    `🧮 الكمية: ${amount} GCAM\n` +
    `💰 السعر التقريبي: ${totalBNB} BNB\n` +
    `⚠️ هذا مجرد تقدير — تأكد من تفاصيل العقد الفعلي.`;
}

// ======== عملية الشراء (إرسال BNB) ========
async function handleBuyTokens() {
  if (!signer || !selectedAccount) {
    alert("⚠️ الرجاء ربط المحفظة أولاً.");
    return;
  }

  const amountStr = tokenAmountInput.value.trim();
  if (!amountStr || isNaN(amountStr) || Number(amountStr) <= 0) {
    alert("⚠️ الرجاء إدخال كمية صحيحة من رموز GCAM.");
    return;
  }

  const amount = Number(amountStr);
  const totalBNB = amount * TOKEN_PRICE_IN_BNB;

  if (!PRESALE_RECEIVER_ADDRESS || PRESALE_RECEIVER_ADDRESS === "0xYourPresaleWalletOrContractHere") {
    alert("⚠️ لم يتم ضبط عنوان محفظة/عقد البيع المسبق بعد. عدل PRESALE_RECEIVER_ADDRESS في app.js");
    return;
  }

  try {
    // تحويل القيمة إلى Wei
    const valueInWei = window.ethers.utils.parseEther(totalBNB.toString());

    // ✅ مثال مبسط: إرسال BNB مباشرة لمحفظة Presale
    // TODO: لو عندك عقد Presale بدالة buyWithBNB استخدمها بدل sendTransaction
    const tx = await signer.sendTransaction({
      to: PRESALE_RECEIVER_ADDRESS,
      value: valueInWei
    });

    setStatus("⏳ تم إرسال العملية، جارٍ الانتظار لتأكيدها على البلوكشين...");

    const receipt = await tx.wait();
    if (receipt.status === 1) {
      setStatus(
        `✅ تمت عملية الشراء بنجاح!\n` +
        `Hash:\n${tx.hash}`
      );
    } else {
      setStatus("⚠️ فشل تنفيذ العملية على البلوكشين.");
    }
  } catch (err) {
    console.error("Buy error:", err);
    setStatus("❌ حدث خطأ أثناء محاولة الشراء. راجع المحفظة أو الرصيد.");
  }
}

// ======== التحقق من متابعة حساب X (تويتر) ========
async function handleVerifyFollow() {
  const handle = twitterInput ? twitterInput.value.trim() : "";
  if (!handle) {
    alert("⚠️ الرجاء إدخال اسم مستخدم X بدون @");
    return;
  }

  // TODO: هنا تحتاج API من عندك (باك إند) يتحقق فعلياً من متابعة الحساب
  // هذا مثال توضيحي فقط:
  /*
  try {
    const response = await fetch("/api/verify-twitter-follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        twitterHandle: handle,
        targetAccount: "GoldenCamelBSC", // حسابك في X
        wallet: selectedAccount
      })
    });

    const result = await response.json();
    if (result.isFollowing) {
      alert("✅ تم التحقق: حسابك يتابع @GoldenCamelBSC");
      if (claimButton) claimButton.disabled = false;
    } else {
      alert("❌ حسابك لا يتابع @GoldenCamelBSC. الرجاء المتابعة ثم إعادة المحاولة.");
    }
  } catch (err) {
    console.error("Verify follow error:", err);
    alert("⚠️ حدث خطأ أثناء التحقق من متابعة X. تحقق من API.");
  }
  */

  // 🔹 حالياً – بدون API حقيقي – سنفعل الزر تجريبياً لإكمال تجربة الواجهة:
  alert("🔧 (وضع تجريبي) تم افتراض أنك متابع لـ @GoldenCamelBSC.\nتم تفعيل زر المطالبة بالإيردروب.");
  if (claimButton) claimButton.disabled = false;
}

// ======== المطالبة بالإيردروب ========
async function handleClaimAirdrop() {
  if (!signer || !selectedAccount) {
    alert("⚠️ الرجاء ربط المحفظة أولاً.");
    return;
  }

  // TODO: استبدل هذا بتنفيذ دالة claimAirdrop من عقدك، لو كانت موجودة
  /*
  const tokenContract = new window.ethers.Contract(
    TOKEN_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    signer
  );

  try {
    const tx = await tokenContract.claimAirdrop();
    setStatus("⏳ تم إرسال طلب المطالبة بالإيردروب، جارٍ الانتظار للتأكيد...");
    const receipt = await tx.wait();
    if (receipt.status === 1) {
      setStatus(`✅ تم استلام الإيردروب بنجاح!\nHash:\n${tx.hash}`);
    } else {
      setStatus("⚠️ فشل تنفيذ عملية الإيردروب على البلوكشين.");
    }
  } catch (err) {
    console.error("Claim airdrop error:", err);
    setStatus("❌ حدث خطأ أثناء المطالبة بالإيردروب.");
  }
  */

  // نسخة تجريبية فقط:
  alert("🎁 (وضع تجريبي) هنا سيتم استدعاء دالة الإيردروب من العقد عندما تضيفها.");
}

// ======== تهيئة الصفحة بعد تحميل DOM ========
document.addEventListener("DOMContentLoaded", () => {
  // ربط عناصر الواجهة
  connectButton = document.getElementById("connectButton");
  disconnectButton = document.getElementById("disconnectButton");
  switchNetworkButton = document.getElementById("switchNetwork");
  statusDiv = document.getElementById("status");
  twitterInput = document.getElementById("twitterHandle");
  verifyFollowButton = document.getElementById("verifyFollow");
  claimButton = document.getElementById("claimButton");
  tokenAmountInput = document.getElementById("tokenAmount");
  buyButton = document.getElementById("buyButton");
  presaleStatusDiv = document.getElementById("presaleStatus");

  // حالة أولية
  updateUIOnDisconnect();

  // تهيئة Web3Modal
  initWeb3Modal();

  // ربط الأحداث
  if (connectButton) {
    connectButton.addEventListener("click", connectWallet);
  }
  if (disconnectButton) {
    disconnectButton.addEventListener("click", disconnectWallet);
  }
  if (switchNetworkButton) {
    switchNetworkButton.addEventListener("click", switchToBscTestnet);
  }
  if (tokenAmountInput) {
    tokenAmountInput.addEventListener("input", updatePresalePricePreview);
  }
  if (buyButton) {
    buyButton.addEventListener("click", handleBuyTokens);
  }
  if (verifyFollowButton) {
    verifyFollowButton.addEventListener("click", handleVerifyFollow);
  }
  if (claimButton) {
    claimButton.addEventListener("click", handleClaimAirdrop);
  }

  // لو كان فيه مزود محفوظ من جلسة سابقة (Web3Modal cache)
  if (web3Modal && web3Modal.cachedProvider) {
    connectWallet().catch(console.error);
  }
});
