/**
 * Transfer $VOTE tokens between wallets
 * 
 * This module handles the actual transfer of $VOTE SPL tokens on Solana.
 * It creates the transaction and requires the user to sign it with their wallet.
 */

import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { createVoteTransferInstruction } from "./vote-token";

export interface TransferVoteOptions {
  from: PublicKey;
  to: PublicKey;
  amount: number;
  connection: Connection;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
}

/**
 * Transfer $VOTE tokens from one wallet to another
 * 
 * @param options - Transfer options
 * @returns Transaction signature
 */
export async function transferVoteTokens(
  options: TransferVoteOptions
): Promise<string> {
  const { from, to, amount, connection, signTransaction } = options;

  // Create transfer instruction
  const transaction = await createVoteTransferInstruction(from, to, amount);

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = from;

  // Sign transaction
  const signedTransaction = await signTransaction(transaction);

  // Send transaction
  const signature = await connection.sendRawTransaction(
    signedTransaction.serialize(),
    {
      skipPreflight: false,
      maxRetries: 3,
    }
  );

  // Wait for confirmation
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  }, "confirmed");

  return signature;
}

/**
 * Transfer $VOTE with platform fee
 * 
 * Transfers amount to recipient and fee to treasury
 * 
 * @param options - Transfer options
 * @param feePercentage - Platform fee percentage (default: 1%)
 * @returns Transaction signatures [main transfer, fee transfer]
 */
export async function transferVoteWithFee(
  options: TransferVoteOptions,
  feePercentage: number = 0.01
): Promise<{ signature: string; feeSignature: string | null }> {
  const { from, to, amount, connection, signTransaction } = options;

  const fee = amount * feePercentage;
  const netAmount = amount - fee;

  // Main transfer
  const mainTransaction = await createVoteTransferInstruction(from, to, netAmount);
  
  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  mainTransaction.recentBlockhash = blockhash;
  mainTransaction.feePayer = from;

  // Add fee transfer if treasury is configured
  let feeSignature: string | null = null;
  if (process.env.NEXT_PUBLIC_TREASURY_WALLET && fee > 0) {
    const treasuryWallet = new PublicKey(process.env.NEXT_PUBLIC_TREASURY_WALLET);
    const feeTransaction = await createVoteTransferInstruction(from, treasuryWallet, fee);
    feeTransaction.recentBlockhash = blockhash;
    feeTransaction.feePayer = from;

    const signedFeeTransaction = await signTransaction(feeTransaction);
    feeSignature = await connection.sendRawTransaction(
      signedFeeTransaction.serialize(),
      { skipPreflight: false, maxRetries: 3 }
    );
  }

  // Sign and send main transaction
  const signedTransaction = await signTransaction(mainTransaction);
  const signature = await connection.sendRawTransaction(
    signedTransaction.serialize(),
    { skipPreflight: false, maxRetries: 3 }
  );

  // Wait for confirmations
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  }, "confirmed");

  if (feeSignature) {
    await connection.confirmTransaction({
      signature: feeSignature,
      blockhash,
      lastValidBlockHeight,
    }, "confirmed");
  }

  return { signature, feeSignature };
}

