const contractAddress = "0xe5037f8A3B689c986f11d7c84B83be6E8a9199ff";

const contractABI = [
  "function claimAirdrop() public",
  "function hasClaimed(address) public view returns (bool)"
];

let provider, signer, contract;

const connectButton = document.getElementById("connectButton");
const claimButton = document.getElementById("claimButton");
const status = document.getElementById("status");

connectButton.onclick = async () => {
  if (!window.ethereum) {
    status.innerText = "🦊 Please install MetaMask or Binance Wallet first.";
    return;
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();

    const userAddress = await signer.getAddress();
    contract = new ethers.Contract(contractAddress, contractABI, signer);

    status.innerText = `✅ Connected: ${userAddress}`;
    claimButton.disabled = false;
  } catch (err) {
    console.error(err);
    status.innerText = "❌ Wallet connection failed.";
  }
};

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

    status.innerText = "🎁 Success! You received 2,000 GCAM 💎";
  } catch (err) {
    console.error(err);
    status.innerText = "❌ Transaction failed.";
  }
};

