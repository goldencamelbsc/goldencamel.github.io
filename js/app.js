const connectButton = document.getElementById("connectButton");
const status = document.getElementById("status");

connectButton.onclick = async () => {
  if (!window.ethereum) {
    status.innerText = "🦊 Please install MetaMask first.";
    return;
  }

  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    status.innerText = `✅ Connected: ${accounts[0]}`;
  } catch (err) {
    status.innerText = "❌ Connection failed.";
    console.error(err);
  }
};
