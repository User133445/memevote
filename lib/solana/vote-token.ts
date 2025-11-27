/**
 * Utilities for $VOTE SPL Token operations
 * 
 * This file contains helper functions to interact with the $VOTE SPL token
 * on Solana. The token mint address should be set in NEXT_PUBLIC_VOTE_TOKEN_MINT
 */

import { 
  Connection, 
  PublicKey, 
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// $VOTE Token Mint Address (to be set in .env.local)
export const VOTE_TOKEN_MINT = process.env.NEXT_PUBLIC_VOTE_TOKEN_MINT 
  ? new PublicKey(process.env.NEXT_PUBLIC_VOTE_TOKEN_MINT)
  : null;

// Treasury wallet (receives platform fees)
export const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_WALLET
  ? new PublicKey(process.env.NEXT_PUBLIC_TREASURY_WALLET)
  : null;

/**
 * Get the associated token address for a wallet
 */
export async function getVoteTokenAddress(wallet: PublicKey): Promise<PublicKey> {
  if (!VOTE_TOKEN_MINT) {
    throw new Error("VOTE_TOKEN_MINT not configured");
  }
  
  return getAssociatedTokenAddress(
    VOTE_TOKEN_MINT,
    wallet,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
}

/**
 * Create a transfer instruction for $VOTE tokens
 * 
 * @param from - Sender's wallet public key
 * @param to - Recipient's wallet public key
 * @param amount - Amount in $VOTE (will be converted to token decimals)
 * @param decimals - Token decimals (default: 9, like SOL)
 * @returns Transfer instruction
 */
export async function createVoteTransferInstruction(
  from: PublicKey,
  to: PublicKey,
  amount: number,
  decimals: number = 9
): Promise<Transaction> {
  if (!VOTE_TOKEN_MINT) {
    throw new Error("VOTE_TOKEN_MINT not configured. Please set NEXT_PUBLIC_VOTE_TOKEN_MINT in .env.local");
  }

  const transaction = new Transaction();

  // Get associated token addresses
  const fromTokenAddress = await getVoteTokenAddress(from);
  const toTokenAddress = await getVoteTokenAddress(to);

  // Convert amount to token units (with decimals)
  const amountInSmallestUnit = Math.floor(amount * Math.pow(10, decimals));

  // Create transfer instruction
  const transferInstruction = createTransferInstruction(
    fromTokenAddress,
    toTokenAddress,
    from,
    amountInSmallestUnit,
    [],
    TOKEN_PROGRAM_ID
  );

  transaction.add(transferInstruction);

  return transaction;
}

/**
 * Check if a wallet has enough $VOTE tokens
 */
export async function checkVoteBalance(
  connection: Connection,
  wallet: PublicKey
): Promise<number> {
  if (!VOTE_TOKEN_MINT) {
    throw new Error("VOTE_TOKEN_MINT not configured");
  }

  try {
    const tokenAddress = await getVoteTokenAddress(wallet);
    const balance = await connection.getTokenAccountBalance(tokenAddress);
    
    // Convert from smallest unit to $VOTE
    const decimals = balance.value.decimals;
    return parseFloat(balance.value.amount) / Math.pow(10, decimals);
  } catch (error) {
    // Token account doesn't exist = 0 balance
    return 0;
  }
}

/**
 * Get token metadata (name, symbol, decimals)
 */
export async function getVoteTokenMetadata(
  connection: Connection
): Promise<{ name: string; symbol: string; decimals: number } | null> {
  if (!VOTE_TOKEN_MINT) {
    return null;
  }

  try {
    const mintInfo = await connection.getParsedAccountInfo(VOTE_TOKEN_MINT);
    const data = mintInfo.value?.data;
    
    if (data && "parsed" in data) {
      return {
        name: "VOTE Token",
        symbol: "$VOTE",
        decimals: data.parsed.info.decimals,
      };
    }
  } catch (error) {
    console.error("Error fetching token metadata:", error);
  }

  return null;
}

