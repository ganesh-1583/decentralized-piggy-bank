import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Record a new transaction
export const recordTransaction = async (walletAddress, type, amount, txHash) => {
  const { error } = await supabase.from('transactions').insert([
    {
      wallet_address: walletAddress,
      type,
      amount,
      tx_hash: txHash,
      status: 'pending',
    },
  ]);

  if (error) throw error;
};

// Update transaction status
export const updateTransactionStatus = async (txHash, status) => {
  const { error } = await supabase
    .from('transactions')
    .update({ status })
    .eq('tx_hash', txHash);

  if (error) throw error;
};

// Fetch transactions for a wallet
export const getTransactions = async (walletAddress) => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('wallet_address', walletAddress)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
};
