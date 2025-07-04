import { useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from './contracts/etherPiggyBank';
import './App.css'

function App() {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState("0");
  const [amount, setAmount] = useState("");

  const connectWallet = async () => {
    if (window.ethereum) {
      const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWallet(account);
    } else {
      alert("Install MetaMask");
    }
  };

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  };

  const deposit = async () => {
    const contract = await getContract();
    const tx = await contract.deposit({ value: ethers.parseEther(amount) });
    await tx.wait();
    alert("Deposited!");
  };

  const withdraw = async () => {
    const contract = await getContract();
    const tx = await contract.withdraw(ethers.parseEther(amount));
    await tx.wait();
    alert("Withdrawn!");
  };

  const fetchBalance = async () => {
    const contract = await getContract();
    const result = await contract.getBalance();
    setBalance(ethers.formatEther(result));
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Ether Piggy Bank 🐷</h1>
      <button onClick={connectWallet}>Connect Wallet</button>
      <p>Wallet: {wallet}</p>

      <button onClick={fetchBalance}>Check Balance</button>
      <p>Your Balance: {balance} ETH</p>

      <input
        placeholder="Amount in ETH"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={deposit}>Deposit</button>
      <button onClick={withdraw}>Withdraw</button>
    </div>
  );
}

export default App;
