import { PrismaClient, AccountType, TransactionType, RecurrenceFrequency, RuleOperator, RuleActionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Expense Tracker demo database...');

  // 1. Create or upsert demo user
  const passwordHash = await bcrypt.hash('DemoPassword123!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@fintrack.local' },
    update: { passwordHash },
    create: {
      email: 'demo@fintrack.local',
      fullName: 'Financial Demo User',
      passwordHash,
      defaultCurrency: 'USD',
    },
  });

  console.log(`User seeded: ${user.email} (${user.id})`);

  // 2. Clean existing user data to ensure clean seed
  await prisma.transactionTagAssignment.deleteMany({ where: { transaction: { userId: user.id } } });
  await prisma.transactionTransfer.deleteMany({ where: { sourceAccount: { userId: user.id } } });
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.recurringOccurrence.deleteMany({ where: { recurring: { userId: user.id } } });
  await prisma.recurringTransaction.deleteMany({ where: { userId: user.id } });
  await prisma.transactionRule.deleteMany({ where: { userId: user.id } });
  await prisma.savingsGoal.deleteMany({ where: { userId: user.id } });
  await prisma.budgetAlert.deleteMany({ where: { userId: user.id } });
  await prisma.transactionCategory.deleteMany({ where: { userId: user.id } });
  await prisma.financialAccount.deleteMany({ where: { userId: user.id } });

  // 3. Create Categories
  const categoriesData = [
    { name: 'Salary & Income', colorHex: '#10b981', iconName: 'briefcase', isSystem: true },
    { name: 'Freelance & Consulting', colorHex: '#059669', iconName: 'laptop', isSystem: false },
    { name: 'Groceries', colorHex: '#3b82f6', iconName: 'shopping-cart', isSystem: true },
    { name: 'Dining Out', colorHex: '#f59e0b', iconName: 'utensils', isSystem: false },
    { name: 'Housing & Rent', colorHex: '#6366f1', iconName: 'home', isSystem: true },
    { name: 'Utilities & Bills', colorHex: '#8b5cf6', iconName: 'zap', isSystem: true },
    { name: 'Transportation', colorHex: '#ec4899', iconName: 'car', isSystem: true },
    { name: 'Entertainment', colorHex: '#14b8a6', iconName: 'film', isSystem: false },
    { name: 'Healthcare & Wellness', colorHex: '#ef4444', iconName: 'activity', isSystem: true },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    const created = await prisma.transactionCategory.create({
      data: { ...cat, userId: user.id },
    });
    categories[cat.name] = created;
  }

  // 4. Create Accounts
  const checking = await prisma.financialAccount.create({
    data: {
      userId: user.id,
      name: 'Primary Checking',
      accountType: AccountType.CHECKING,
      currency: 'USD',
      initialBalance: new Decimal('2500.00'),
      currentBalance: new Decimal('2500.00'),
      colorHex: '#2563eb',
    },
  });

  const savings = await prisma.financialAccount.create({
    data: {
      userId: user.id,
      name: 'High-Yield Savings Vault',
      accountType: AccountType.SAVINGS,
      currency: 'USD',
      initialBalance: new Decimal('10000.00'),
      currentBalance: new Decimal('10000.00'),
      colorHex: '#059669',
    },
  });

  const cash = await prisma.financialAccount.create({
    data: {
      userId: user.id,
      name: 'Physical Cash Wallet',
      accountType: AccountType.CASH,
      currency: 'USD',
      initialBalance: new Decimal('200.00'),
      currentBalance: new Decimal('200.00'),
      colorHex: '#d97706',
    },
  });

  const creditCard = await prisma.financialAccount.create({
    data: {
      userId: user.id,
      name: 'Sapphire Credit Card',
      accountType: AccountType.CREDIT_CARD,
      currency: 'USD',
      initialBalance: new Decimal('0.00'),
      currentBalance: new Decimal('0.00'),
      colorHex: '#dc2626',
    },
  });

  // 5. Seed Transactions and recalculate balances
  const txRecords = [
    {
      accountId: checking.id,
      categoryId: categories['Salary & Income'].id,
      type: TransactionType.INCOME,
      amount: new Decimal('4500.00'),
      description: 'Monthly Engineering Salary',
      date: new Date(Date.now() - 25 * 86400000),
    },
    {
      accountId: checking.id,
      categoryId: categories['Housing & Rent'].id,
      type: TransactionType.EXPENSE,
      amount: new Decimal('1650.00'),
      description: 'Monthly Apartment Rent',
      date: new Date(Date.now() - 24 * 86400000),
    },
    {
      accountId: checking.id,
      categoryId: categories['Utilities & Bills'].id,
      type: TransactionType.EXPENSE,
      amount: new Decimal('145.20'),
      description: 'Electric & Fiber Internet Bill',
      date: new Date(Date.now() - 20 * 86400000),
    },
    {
      accountId: creditCard.id,
      categoryId: categories['Groceries'].id,
      type: TransactionType.EXPENSE,
      amount: new Decimal('284.50'),
      description: 'Organic Market Weekly Groceries',
      date: new Date(Date.now() - 15 * 86400000),
    },
    {
      accountId: creditCard.id,
      categoryId: categories['Dining Out'].id,
      type: TransactionType.EXPENSE,
      amount: new Decimal('78.35'),
      description: 'Dinner with Colleagues',
      date: new Date(Date.now() - 10 * 86400000),
    },
    {
      accountId: cash.id,
      categoryId: categories['Transportation'].id,
      type: TransactionType.EXPENSE,
      amount: new Decimal('25.00'),
      description: 'Metro Transit Card Refill',
      date: new Date(Date.now() - 5 * 86400000),
    },
    {
      accountId: checking.id,
      categoryId: categories['Freelance & Consulting'].id,
      type: TransactionType.INCOME,
      amount: new Decimal('1200.00'),
      description: 'Client Web Architecture Advisory',
      date: new Date(Date.now() - 2 * 86400000),
    },
  ];

  for (const tx of txRecords) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: tx.accountId,
        categoryId: tx.categoryId,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        transactionDate: tx.date,
        currency: 'USD',
      },
    });
  }

  // 6. Create an Atomic Transfer: $1,000 from Checking to Savings
  const transferAmount = new Decimal('1000.00');
  const transferDate = new Date(Date.now() - 12 * 86400000);

  const debitTx = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: checking.id,
      type: TransactionType.TRANSFER,
      amount: transferAmount,
      description: 'Transfer to High-Yield Savings Vault',
      transactionDate: transferDate,
      currency: 'USD',
    },
  });

  const creditTx = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: savings.id,
      type: TransactionType.TRANSFER,
      amount: transferAmount,
      description: 'Transfer from Primary Checking',
      transactionDate: transferDate,
      currency: 'USD',
    },
  });

  await prisma.transactionTransfer.create({
    data: {
      sourceAccountId: checking.id,
      destinationAccountId: savings.id,
      sourceTransactionId: debitTx.id,
      destinationTransactionId: creditTx.id,
      exchangeRate: new Decimal('1.000000'),
    },
  });

  // 7. Recalculate & Reconcile Account Balances
  const allAccounts = [checking, savings, cash, creditCard];
  for (const acc of allAccounts) {
    const txs = await prisma.transaction.findMany({
      where: { accountId: acc.id, deletedAt: null },
      include: {
        transferAsSource: true,
        transferAsDestination: true,
      },
    });

    let balance = new Decimal(acc.initialBalance);
    for (const t of txs) {
      const amt = new Decimal(t.amount);
      if (t.type === TransactionType.INCOME) {
        balance = balance.plus(amt);
      } else if (t.type === TransactionType.EXPENSE) {
        balance = balance.minus(amt);
      } else if (t.type === TransactionType.TRANSFER) {
        if (t.transferAsSource) {
          balance = balance.minus(amt);
        } else if (t.transferAsDestination) {
          balance = balance.plus(amt);
        }
      }
    }

    await prisma.financialAccount.update({
      where: { id: acc.id },
      data: { currentBalance: balance },
    });
    console.log(`Reconciled Account [${acc.name}]: Initial=${acc.initialBalance}, Final=${balance.toFixed(2)}`);
  }

  // 8. Create Recurring Transaction
  const recurring = await prisma.recurringTransaction.create({
    data: {
      userId: user.id,
      accountId: checking.id,
      categoryId: categories['Salary & Income'].id,
      type: TransactionType.INCOME,
      amount: new Decimal('4500.00'),
      currency: 'USD',
      description: 'Bi-Weekly Paycheck',
      frequency: RecurrenceFrequency.BIWEEKLY,
      startDate: new Date('2026-01-01'),
      nextOccurrence: new Date(Date.now() + 5 * 86400000),
      autoPost: true,
    },
  });

  // 9. Create Transaction Rule
  await prisma.transactionRule.create({
    data: {
      userId: user.id,
      name: 'Categorize Coffee & Cafes',
      priority: 1,
      field: 'description',
      operator: RuleOperator.CONTAINS,
      matchValue: 'Starbucks',
      actionType: RuleActionType.SET_CATEGORY,
      actionValue: categories['Dining Out'].id,
    },
  });

  // 10. Create Savings Goal & Budget Alert
  await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      name: 'Emergency Fund (6 Months)',
      targetAmount: new Decimal('20000.00'),
      currentAmount: new Decimal('11000.00'),
      targetDate: new Date('2027-12-31'),
    },
  });

  await prisma.budgetAlert.create({
    data: {
      userId: user.id,
      categoryId: categories['Dining Out'].id,
      thresholdValue: new Decimal('200.00'),
      periodMonth: new Date().getMonth() + 1,
      periodYear: new Date().getFullYear(),
      hasFired: false,
    },
  });

  console.log('Expense Tracker seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
