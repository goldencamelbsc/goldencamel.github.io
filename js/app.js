// عنوان العقد الذكي GCAM
const contractAddress = "0xe5037f8A3B689c986f11d7c84B83be6E8a9199ff";

// ABI مبسط للتعامل مع وظائف العقد
const contractABI = [
  "function claimAirdrop() public",
  "function hasClaimed(address) public view returns (bool)",
  "function buyTokens(uint256 amount) public", // دالة شراء التوكنات
];

// عنوان عقد USDT (مثال على BSC Testnet)
const usdtAddress = "0x..."; // ضع هنا عنوان عقد USDT الصحيح
const usdtABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
  "function balanceOf(address owner) public view returns (uint256)"
];

let provider, signer, contract, usdt;

const connectButton = document.getElementById("connectButton");
const claimButton = document.getElementById("claimButton");
const status = document.getElementById("status");

const verifyButton = document.getElementById("verifyFollow");
const twitterHandle = document.getElementById("twitterHandle");

const buyButton = document.getElementById("buyButton");
const tokenAmountInput = document.getElementById("tokenAmount");
const presaleStatus = document.getElementById("presaleStatus");

// زر الاتصال بالمحفظة
connectButton.onclick = async () => {
  if (!window.ethereum) {
    status.innerText = "🦊 Please install MetaMask first.";
    return;
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();

    const userAddress = await signer.getAddress();
    contract = new ethers.Contract(contractAddress, contractABI, signer);
    usdt = new ethers.Contract(usdtAddress, usdtABI, signer);

    status.innerText = `✅ Connected: ${userAddress}`;
    buyButton.disabled = false;
  } catch (err) {
    console.error(err);
    status.innerText = "❌ Wallet connection failed.";
  }
};

// تحقق من متابعة حساب X
verifyButton.onclick = () => {
  if (twitterHandle.value.trim() === "") {
    status.innerText = "⚠️ Please enter your X username.";
    return;
  }
  status.innerText = `✅ Verified follow for @${twitterHandle.value}`;
  claimButton.disabled = false; // تفعيل زر Airdrop بعد التحقق
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

  const pricePerToken = 0.01; // مثال: كل توكن = 0.01 USDT
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

    // الموافقة على العقد لسحب USDT
    const approveTx = await usdt.approve(contractAddress, totalPrice);
    await approveTx.wait();

    presaleStatus.innerText = "⏳ Sending presale transaction... please confirm in wallet.";

    // استدعاء دالة شراء التوكنات
    const tx = await contract.buyTokens(amount);
    await tx.wait();

    presaleStatus.innerText = "🎉 Success! You bought GCAM tokens.";
  } catch (err) {
    console.error(err);
    presaleStatus.innerText = "❌ Transaction failed.";
  }
};
