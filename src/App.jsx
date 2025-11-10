import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from './contracts/etherPiggyBank';
import {
  PiggyBank,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  AlertCircle,
  History,
  Check,
  Clock,
  X,
} from 'lucide-react';
import {
  recordTransaction,
  updateTransactionStatus,
  getTransactions,
} from './lib/supabase';

function App() {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState('0');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          await loadTransactions(accounts[0]);
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
      }
    }
  };

  const loadTransactions = async (walletAddress) => {
    try {
      const txs = await getTransactions(walletAddress);
      setTransactions(txs);
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsLoading(true);
        setError('');
        const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWallet(account);
        await loadTransactions(account);
        setSuccess('Wallet connected successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to connect wallet');
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Please install MetaMask to use this app');
    }
  };

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  };

  const deposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const contract = await getContract();
      const tx = await contract.deposit({ value: ethers.parseEther(amount) });

      if (wallet) {
        await recordTransaction(wallet, 'deposit', amount, tx.hash);
      }

      await tx.wait();

      if (wallet) {
        await updateTransactionStatus(tx.hash, 'completed');
        await loadTransactions(wallet);
      }

      setSuccess(`Successfully deposited ${amount} ETH!`);
      setAmount('');
      await fetchBalance();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to deposit');
    } finally {
      setIsLoading(false);
    }
  };

  const withdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const contract = await getContract();
      const tx = await contract.withdraw(ethers.parseEther(amount));

      if (wallet) {
        await recordTransaction(wallet, 'withdraw', amount, tx.hash);
      }

      await tx.wait();

      if (wallet) {
        await updateTransactionStatus(tx.hash, 'completed');
        await loadTransactions(wallet);
      }

      setSuccess(`Successfully withdrawn ${amount} ETH!`);
      setAmount('');
      await fetchBalance();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to withdraw');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const contract = await getContract();
      const result = await contract.getBalance();
      setBalance(ethers.formatEther(result));
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'failed':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'pending':
        return 'bg-blue-50 border-blue-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <PiggyBank className="w-12 h-12 text-cyan-600" strokeWidth={2} />
            <h1 className="text-5xl font-bold text-slate-800">Ether Piggy Bank</h1>
          </div>
          <p className="text-slate-600 text-lg">Save your Ether securely on the blockchain</p>
        </header>

        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            {!wallet ? (
              <div className="text-center py-8">
                <Wallet className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-slate-800 mb-2">Connect Your Wallet</h2>
                <p className="text-slate-600 mb-6">Connect your MetaMask wallet to get started</p>
                <button
                  onClick={connectWallet}
                  disabled={isLoading}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Connected Wallet</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-sm font-mono text-slate-700 break-all">{wallet}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-600">Your Balance</span>
                    <button
                      onClick={fetchBalance}
                      disabled={isLoading}
                      className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Refresh balance"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-100">
                    <div className="text-4xl font-bold text-slate-800 mb-1">{balance} ETH</div>
                    <p className="text-sm text-slate-600">In your piggy bank</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-2">
                      Amount (ETH)
                    </label>
                    <input
                      id="amount"
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-800 placeholder-slate-400 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={deposit}
                      disabled={isLoading || !amount}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowDownToLine className="w-5 h-5" />
                      Deposit
                    </button>

                    <button
                      onClick={withdraw}
                      disabled={isLoading || !amount}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowUpFromLine className="w-5 h-5" />
                      Withdraw
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {wallet && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-800">Transaction History</h3>
                </div>
                <span className={`transform transition-transform ${showHistory ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {showHistory && (
                <div className="mt-4 space-y-2">
                  {transactions.length === 0 ? (
                    <p className="text-slate-600 text-sm text-center py-4">No transactions yet</p>
                  ) : (
                    transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className={`p-3 rounded-lg border ${getStatusColor(tx.status)} flex items-center justify-between`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {getStatusIcon(tx.status)}
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 capitalize">{tx.type}</p>
                            <p className="text-xs text-slate-600 truncate">
                              {tx.tx_hash.slice(0, 10)}...{tx.tx_hash.slice(-8)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-800">{tx.amount} ETH</p>
                          <p className="text-xs text-slate-600">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">How it works</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center font-semibold text-xs">
                  1
                </span>
                <p>Connect your MetaMask wallet to interact with the smart contract</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center font-semibold text-xs">
                  2
                </span>
                <p>Deposit Ether to save it securely on the blockchain</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center font-semibold text-xs">
                  3
                </span>
                <p>Withdraw your funds anytime you need them</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
