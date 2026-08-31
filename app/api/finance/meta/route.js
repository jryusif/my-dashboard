import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    accounts: ['Cash Wallet', 'Bank Checking', 'Trading Account', 'Gold Bullion Vault', 'Savings Account'],
    categories: ['Clinical Income', 'Trading Profits', 'Salary', 'Food & Dining', 'Education & Board Prep', 'Gym & Training', 'Dental Equipment', 'Utilities', 'Investments', 'General']
  });
}
