import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    accounts: ['Cash Wallet', 'Bank Checking', 'Trading Account', 'Gold Bullion Vault', 'Savings Account'],
    paymentMethods: ['Cash', 'Debit Card', 'Credit Card', 'Bank Transfer', 'InstaPay'],
    categories: ['Clinical Practice', 'US Stocks Trading', 'Freelance / Consulting', 'Salary', 'Food & Dining', 'Education & Board Prep', 'Gym & Training', 'Dental Equipment', 'Utilities', 'Investments', 'General'],
    incomeSources: ['Clinical Practice', 'US Stocks Trading', 'Salary', 'Investment Returns', 'Freelance / Consulting', 'Other Income'],
    incomeStatuses: ['Received', 'Pending', 'Expected'],
    expenseCategories: ['Clinic & Dental Materials', 'Trading Tools / Subscriptions', 'Studies & Books', 'Gym & Nutrition', 'Living & Food', 'Transport', 'Tech & Gear', 'Other Expenses'],
    expenseStatuses: ['Paid', 'Pending']
  });
}
