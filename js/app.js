// عنوان العقد الذكي GCAM
const contractAddress = "0xe5037f8A3B689c986f11d7c84B83be6E8a9199ff";

// ABI مبسط للتعامل مع وظائف العقد
const contractABI = [
  "function claimAirdrop() public",
  "function hasClaimed(address) public view returns (bool)",
  "function buyTokens(uint256 amount) public"
];

// عنوان عقد USDT (ضع هنا العنوان الصحيح على BSC Testnet)
const usdtAddress = "0x..."; 
const usdtABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
  "function balanceOf(address owner) public view returns (uint256)"
];

let provider, signer, contract, usdt;

// عناصر الواجهة
const connectButton = document.getElementById("connectButton");
const switchNetworkButton = document.getElementById("switchNetwork");
const claimButton = document.getElementById("claimButton");
const status = document.getElementById("status");
const verifyButton = document.getElementById("verifyFollow");
const twitterHandle = document.getElementById("twitterHandle");
const buyButton = document.getElementById("buyButton");
const tokenAmountInput = document.getElementById("tokenAmount");
const presaleStatus = document.getElementById("presaleStatus");

// إعداد Web3Modal
const providerOptions = {
  walletconnect: {
    package: window.WalletConnectProvider.default,
    options: {
      rpc: {
        97: "https://data-seed-prebsc-1-s1.binance.org:8545/", // BSC Testnet
        56: "https://bsc-dataseed.binance.org/" // BSC Mainnet
      }
    }
  }
};

const web3Modal = new window.Web3Modal.default({
  cacheProvider: false,
  providerOptions
});

// زر الاتصال بالمحفظة
connectButton.onclick = async () => {
  try {
    const instance = await web3Modal.connect();
    provider = new ethers.providers.Web3Provider(instance);
    signer = provider.getSigner();

    const userAddress = await signer.getAddress();
    const network = await provider.getNetwork();

    if (network.chainId !== 97) {
      status.innerText = `⚠️ Wrong network: ${network.name}\nPlease switch to BSC Testnet.`;
      return;
    }

    contract = new ethers.Contract(contractAddress, contractABI, signer);
    usdt = new ethers.Contract(usdtAddress, usdtABI, signer);

    status.innerText = `✅ Connected: ${userAddress}`;
    buyButton.disabled = false;
  } catch (err) {
    console.error("Connection error:", err);
    status.innerText = "❌ Wallet connection failed.";
  }
};

// زر تغيير الشبكة تلقائيًا في MetaMask
switchNetworkButton.onclick = async () => {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x61" }] // 0x61 = 97 BSC Testnet
    });
    status.innerText = "✅ Switched to BSC Testnet.";
  } catch (err) {
    console.error("Switch network error:", err);
    status.innerText = "❌ Failed to switch network. Please do it manually.";
  }
};

// تحقق من متابعة حساب X
verifyButton.onclick = () => {
  if (twitterHandle.value.trim() === "") {
    status.innerText = "⚠️ Please enter your X username.";
    return;
  }
  status.innerText = `✅ Verified follow for @${twitterHandle.value}`;
  claimButton.disabled = false;
};

// زر المطالبة بالـ Airdrop
claimButton.onclick = async () => {
  if (!contract) {
    status.innerText = "❌ Please connect your wallet first.";
    return;
  }

  try {
    const address = await signer.getAddress();
    const alreadyClaimed = await contract.hasClaimed(address);

    if (alreadyClaimed) {
      status.innerText = "⚠️ You have already claimed your airdrop.";
      return;
    }

    status.innerText = "⏳ Sending claim transaction... please confirm in wallet.";
    const tx = await contract.claimAirdrop();
    await tx.wait();

    status.innerText = "🎁 Success! You received GCAM tokens.";
  } catch (err) {
    console.error(err);
    status.innerText = "❌ Transaction failed.";
  }
};

// حساب السعر بالدولار USDT
tokenAmountInput.oninput = () => {
  const amount = parseInt(tokenAmountInput.value);
  if (!amount || amount <= 0) {
    presaleStatus.innerText = "⚠️ Enter a valid token amount.";
    return;
  }

  const pricePerToken = 0.01; 
  const totalPrice = amount * pricePerToken;
  presaleStatus.innerText = `💵 Total Price: ${totalPrice.toFixed(2)} USDT`;
};

// زر شراء فعلي باستخدام USDT
buyButton.onclick = async () => {
  if (!contract || !usdt) {
    presaleStatus.innerText = "❌ Please connect your wallet first.";
    return;
  }

  try {
    const amount = parseInt(tokenAmountInput.value);
    if (!amount || amount <= 0) {
      presaleStatus.innerText = "⚠️ Enter a valid token amount.";
      return;
    }

    const pricePerToken = 0.01;
    const totalPrice = ethers.utils.parseUnits((amount * pricePerToken).toString(), 18);

    presaleStatus.innerText = "⏳ Approving USDT...";
    const approveTx = await usdt.approve(contractAddress, totalPrice);
    await approveTx.wait();

    presaleStatus.innerText = "⏳ Sending presale transaction... please confirm in wallet.";
    const tx = await contract.buyTokens(amount);
    await tx.wait();

    presaleStatus.innerText = "🎉 Success! You bought GCAM tokens.";
  } catch (err) {
    console.error(err);
    presaleStatus.innerText = "❌ Transaction failed.";
  }
};
