document.addEventListener("DOMContentLoaded", () => {
  // عنوان عقد GCAM على BSC Testnet
  const contractAddress = "0xe5037f8A3B689c986f11d7c84B83be6E8a9199ff";

  // ABI مبسط للتعامل مع وظائف العقد
  const contractABI = [
    "function claimAirdrop() public",
    "function hasClaimed(address) public view returns (bool)",
    "function buyTokens(uint256 amount) public"
  ];

  // عنوان عقد USDT (ضع عنواناً صالحاً على BSC Testnet أو اتركه غير مفعل)
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
  const disconnectButton = document.getElementById("disconnectButton");
  const claimButton = document.getElementById("claimButton");
  const status = document.getElementById("status");
  const verifyButton = document.getElementById("verifyFollow");
  const twitterHandle = document.getElementById("twitterHandle");
  const buyButton = document.getElementById("buyButton");
  const tokenAmountInput = document.getElementById("tokenAmount");
  const presaleStatus = document.getElementById("presaleStatus");

  // تحقق سريع من وجود العناصر
  if (!connectButton || !switchNetworkButton || !disconnectButton || !status) {
    console.error("Buttons/DOM not found. Check IDs in index.html");
    return;
  }

  // إعداد Web3Modal
  const providerOptions = {
    walletconnect: {
      package: window.WalletConnectProvider?.default || window.WalletConnectProvider,
      options: {
        rpc: {
          97: "https://data-seed-prebsc-1-s1.binance.org:8545/",
          56: "https://bsc-dataseed.binance.org/"
        }
      }
    }
  };

  const web3Modal = new window.Web3Modal.default({
    cacheProvider: false,
    providerOptions,
    theme: "dark"
  });

  // اتصال بالمحفظة
  connectButton.onclick = async () => {
    try {
      status.innerText = "⏳ جاري فتح نافذة المحفظة...";
      const instance = await web3Modal.connect();
      provider = new ethers.providers.Web3Provider(instance);
      signer = provider.getSigner();

      // التحويل إلى BSC Testnet إن لزم
      const net = await provider.getNetwork();
      if (net.chainId !== 97 && window.ethereum) {
        status.innerText = "🌐 محاولة التبديل إلى BSC Testnet...";
        await switchToBscTestnet();
      }

      // تأكيد الشبكة بعد التبديل
      const network = await provider.getNetwork();
      if (network.chainId !== 97) {
        status.innerText = `⚠️ شبكة خاطئة: ${network.name}. الرجاء اختيار BSC Testnet (97).`;
        return;
      }

      // تهيئة العقد
      contract = new ethers.Contract(contractAddress, contractABI, signer);

      // تهيئة USDT فقط إذا العنوان صالح
      if (/^0x[a-fA-F0-9]{40}$/.test(usdtAddress)) {
        usdt = new ethers.Contract(usdtAddress, usdtABI, signer);
      } else {
        usdt = null;
        console.warn("USDT address not set. Buying will be disabled until set.");
      }

      const userAddress = await signer.getAddress();
      status.innerText = `✅ تم الاتصال: ${userAddress}`;
      claimButton.disabled = false;
      buyButton.disabled = !usdt; // فعل الشراء فقط إذا USDT مهيأ
    } catch (err) {
      console.error("Connection error:", err);
      status.innerText = "❌ فشل اتصال المحفظة.";
    }
  };

  // التبديل إلى شبكة BSC Testnet (مع إضافة الشبكة إذا غير موجودة)
  async function switchToBscTestnet() {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x61" }]
      });
      status.innerText = "✅ تم التبديل إلى BSC Testnet.";
    } catch (switchError) {
      // إذا الشبكة غير مضافة إلى MetaMask
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0x61",
            chainName: "BSC Testnet",
            nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
            rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
            blockExplorerUrls: ["https://testnet.bscscan.com"]
          }]
        });
        status.innerText = "✅ تمت إضافة شبكة BSC Testnet والتبديل لها.";
      } else {
        throw switchError;
      }
    }
  }

  switchNetworkButton.onclick = async () => {
    if (!window.ethereum) {
      status.innerText = "⚠️ لا توجد محفظة مثبتة. الرجاء تثبيت MetaMask.";
      return;
    }
    try {
      await switchToBscTestnet();
    } catch (err) {
      console.error("Switch network error:", err);
      status.innerText = "❌ فشل تبديل الشبكة. الرجاء التبديل يدوياً من المحفظة.";
    }
  };

  // قطع الاتصال
  disconnectButton.onclick = async () => {
    try {
      await web3Modal.clearCachedProvider();
      provider = null;
      signer = null;
      contract = null;
      usdt = null;
      status.innerText = "🔌 تم فصل المحفظة.";
      claimButton.disabled = true;
      buyButton.disabled = true;
    } catch (err) {
      console.error("Disconnect error:", err);
      status.innerText = "❌ فشل فصل المحفظة.";
    }
  };

  // التحقق من متابعة حساب X (واجهة فقط)
  verifyButton.onclick = () => {
    if (twitterHandle.value.trim() === "") {
      status.innerText = "⚠️ الرجاء إدخال اسم مستخدم X.";
      return;
    }
    status.innerText = `✅ تم التحقق من متابعة @${twitterHandle.value}`;
    claimButton.disabled = false;
  };

  // المطالبة بالإسقاط الجوي
  claimButton.onclick = async () => {
    if (!contract || !signer) {
      status.innerText = "❌ الرجاء توصيل المحفظة أولاً.";
      return;
    }
    try {
      const address = await signer.getAddress();
      const alreadyClaimed = await contract.hasClaimed(address);
      if (alreadyClaimed) {
        status.innerText = "⚠️ لقد طالبت بالإسقاط مسبقاً.";
        return;
      }
      status.innerText = "⏳ جاري إرسال معاملة المطالبة... أكد في المحفظة.";
      const tx = await contract.claimAirdrop();
      await tx.wait();
      status.innerText = "🎁 نجاح! تم استلام رموز GCAM.";
    } catch (err) {
      console.error(err);
      status.innerText = "❌ فشلت المعاملة.";
    }
  };

  // حساب السعر وعرضه
  tokenAmountInput.oninput = () => {
    const amount = parseInt(tokenAmountInput.value);
    if (!amount || amount <= 0) {
      presaleStatus.innerText = "⚠️ أدخل مقداراً صالحاً.";
      return;
    }
    const pricePerToken = 0.01; // بالدولار USDT
    const totalPrice = amount * pricePerToken;
    presaleStatus.innerText = `💵 السعر الإجمالي: ${totalPrice.toFixed(2)} USDT`;
  };

  // شراء عبر USDT (يتطلب عنوان USDT صالح)
  buyButton.onclick = async () => {
    if (!contract || !usdt) {
      presaleStatus.innerText = "❌ الرجاء توصيل المحفظة أو ضبط عنوان USDT.";
      return;
    }
    try {
      const amount = parseInt(tokenAmountInput.value);
      if (!amount || amount <= 0) {
        presaleStatus.innerText = "⚠️ أدخل مقداراً صالحاً.";
        return;
      }
      const pricePerToken = 0.01;
      const totalPriceFloat = amount * pricePerToken;
      const totalPrice = ethers.utils.parseUnits(totalPriceFloat.toString(), 18);

      presaleStatus.innerText = "⏳ الموافقة على USDT...";
      const approveTx = await usdt.approve(contractAddress, totalPrice);
      await approveTx.wait();

      presaleStatus.innerText = "⏳ إرسال معاملة الشراء... أكد في المحفظة.";
      const tx = await contract.buyTokens(amount);
      await tx.wait();

      presaleStatus.innerText = "🎉 نجاح! تم شراء رموز GCAM.";
    } catch (err) {
      console.error(err);
      presaleStatus.innerText = "❌ فشلت المعاملة.";
    }
  };
});
