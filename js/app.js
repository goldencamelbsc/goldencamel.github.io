// إضافة وظيفة شراء من البيع المسبق
const buyButton = document.getElementById("buyButton");
const amountInput = document.getElementById("amount");
const presaleStatus = document.getElementById("presaleStatus");

buyButton.onclick = async () => {
  if (!contract) {
    presaleStatus.innerText = "❌ Please connect your wallet first.";
    return;
  }

  try {
    const value = ethers.utils.parseEther(amountInput.value);
    presaleStatus.innerText = "⏳ Sending presale transaction... please confirm in wallet.";

    // استدعاء دالة الشراء من العقد الذكي (افترضنا اسمها buyTokens)
    const tx = await contract.buyTokens({ value });
    await tx.wait();

    presaleStatus.innerText = "🎉 Success! You bought GCAM tokens.";
  } catch (err) {
    console.error(err);
    presaleStatus.innerText = "❌ Transaction failed.";
  }
};
