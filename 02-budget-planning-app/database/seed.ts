import { PrismaClient, DebtStrategy, EventType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Budget Planning App demo workspace...');

  // 1. Create or upsert demo user
  const passwordHash = await bcrypt.hash('DemoPassword123!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@fintrack.local' },
    update: { passwordHash },
    create: {
      email: 'demo@fintrack.local',
      fullName: 'Budget Planning Demo User',
      passwordHash,
      defaultCurrency: 'USD',
    },
  });

  // 2. Clean existing budgets for user
  const existingBudgets = await prisma.budget.findMany({ where: { userId: user.id } });
  for (const b of existingBudgets) {
    await prisma.budgetEvent.deleteMany({ where: { budgetId: b.id } });
    await prisma.debtPlan.deleteMany({ where: { budgetId: b.id } });
    await prisma.recurringBill.deleteMany({ where: { budgetId: b.id } });
    await prisma.budgetTransfer.deleteMany({ where: { sourceCategory: { group: { budgetId: b.id } } } });
    await prisma.budgetTransaction.deleteMany({ where: { period: { budgetId: b.id } } });
    await prisma.allocation.deleteMany({ where: { period: { budgetId: b.id } } });
    await prisma.budgetCategory.deleteMany({ where: { group: { budgetId: b.id } } });
    await prisma.categoryGroup.deleteMany({ where: { budgetId: b.id } });
    await prisma.budgetPeriod.deleteMany({ where: { budgetId: b.id } });
    await prisma.budget.delete({ where: { id: b.id } });
  }

  // 3. Create Budget Workspace
  const startingBal = new Decimal('3500.00');
  const budget = await prisma.budget.create({
    data: {
      userId: user.id,
      name: 'Family Zero-Based Operating Budget',
      currency: 'USD',
      startingBalance: startingBal,
    },
  });

  // 4. Create Category Groups and Categories
  const groupsData = [
    {
      name: 'Immediate Obligations',
      sortOrder: 1,
      categories: [
        { name: 'Apartment Rent', targetAmount: new Decimal('1650.00'), colorHex: '#ef4444' },
        { name: 'Utilities & Internet', targetAmount: new Decimal('180.00'), colorHex: '#f59e0b' },
        { name: 'Groceries & Household', targetAmount: new Decimal('550.00'), colorHex: '#10b981' },
      ],
    },
    {
      name: 'True Expenses & Reserves',
      sortOrder: 2,
      categories: [
        { name: 'Auto Maintenance Reserve', targetAmount: new Decimal('150.00'), colorHex: '#3b82f6' },
        { name: 'Health & Pharmacy', targetAmount: new Decimal('100.00'), colorHex: '#8b5cf6' },
      ],
    },
    {
      name: 'Quality of Life & Discretionary',
      sortOrder: 3,
      categories: [
        { name: 'Dining Out & Takeaway', targetAmount: new Decimal('200.00'), colorHex: '#ec4899' },
        { name: 'Hobbies & Entertainment', targetAmount: new Decimal('120.00'), colorHex: '#06b6d4' },
      ],
    },
    {
      name: 'Financial Goals',
      sortOrder: 4,
      categories: [
        { name: 'Emergency Vault Contribution', targetAmount: new Decimal('350.00'), colorHex: '#059669' },
        { name: 'Credit Card Accelerated Payoff', targetAmount: new Decimal('200.00'), colorHex: '#14b8a6' },
      ],
    },
  ];

  const categoryMap: Record<string, any> = {};
  for (const g of groupsData) {
    const group = await prisma.categoryGroup.create({
      data: {
        budgetId: budget.id,
        name: g.name,
        sortOrder: g.sortOrder,
      },
    });

    for (let i = 0; i < g.categories.length; i++) {
      const c = g.categories[i];
      const category = await prisma.budgetCategory.create({
        data: {
          groupId: group.id,
          name: c.name,
          targetAmount: c.targetAmount,
          colorHex: c.colorHex,
          sortOrder: i + 1,
        },
      });
      categoryMap[c.name] = category;
    }
  }

  // 5. Create Current Period
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const totalMonthlyIncome = new Decimal('5200.00'); // Monthly paycheck income
  const totalOnBudgetFunds = startingBal.plus(totalMonthlyIncome); // 3500 + 5200 = 8700

  const period = await prisma.budgetPeriod.create({
    data: {
      budgetId: budget.id,
      year: currentYear,
      month: currentMonth,
      totalIncome: totalMonthlyIncome,
      totalAssigned: new Decimal('0.00'),
      totalActivity: new Decimal('0.00'),
      readyToAssign: totalOnBudgetFunds,
    },
  });

  // 6. Assign Funds to Envelopes
  const assignments = [
    { category: 'Apartment Rent', assigned: new Decimal('1650.00'), activity: new Decimal('1650.00') },
    { category: 'Utilities & Internet', assigned: new Decimal('180.00'), activity: new Decimal('145.20') },
    { category: 'Groceries & Household', assigned: new Decimal('550.00'), activity: new Decimal('284.50') },
    { category: 'Auto Maintenance Reserve', assigned: new Decimal('150.00'), activity: new Decimal('0.00') },
    { category: 'Health & Pharmacy', assigned: new Decimal('100.00'), activity: new Decimal('35.00') },
    { category: 'Dining Out & Takeaway', assigned: new Decimal('200.00'), activity: new Decimal('78.35') },
    { category: 'Hobbies & Entertainment', assigned: new Decimal('120.00'), activity: new Decimal('40.00') },
    { category: 'Emergency Vault Contribution', assigned: new Decimal('350.00'), activity: new Decimal('0.00') },
    { category: 'Credit Card Accelerated Payoff', assigned: new Decimal('200.00'), activity: new Decimal('200.00') },
  ];

  let cumulativeAssigned = new Decimal('0.00');
  let cumulativeActivity = new Decimal('0.00');

  for (const item of assignments) {
    const cat = categoryMap[item.category];
    const available = item.assigned.minus(item.activity);

    await prisma.allocation.create({
      data: {
        periodId: period.id,
        categoryId: cat.id,
        assignedAmount: item.assigned,
        activityAmount: item.activity,
        availableAmount: available,
      },
    });

    cumulativeAssigned = cumulativeAssigned.plus(item.assigned);
    cumulativeActivity = cumulativeActivity.plus(item.activity);
  }

  // Update Period Ready to Assign
  const finalReadyToAssign = totalOnBudgetFunds.minus(cumulativeAssigned);
  await prisma.budgetPeriod.update({
    where: { id: period.id },
    data: {
      totalAssigned: cumulativeAssigned,
      totalActivity: cumulativeActivity,
      readyToAssign: finalReadyToAssign,
    },
  });

  console.log(`Ready to Assign Calculated: ${finalReadyToAssign.toFixed(2)} (Available to plan)`);

  // 7. Seed Debt Payoff Plans
  await prisma.debtPlan.create({
    data: {
      budgetId: budget.id,
      name: 'Chase Sapphire Visa',
      currentBalance: new Decimal('3450.00'),
      interestRateApr: new Decimal('22.99'),
      minimumPayment: new Decimal('110.00'),
      strategy: DebtStrategy.AVALANCHE,
    },
  });

  await prisma.debtPlan.create({
    data: {
      budgetId: budget.id,
      name: 'Undergraduate Federal Student Loan',
      currentBalance: new Decimal('14200.00'),
      interestRateApr: new Decimal('5.25'),
      minimumPayment: new Decimal('165.00'),
      strategy: DebtStrategy.AVALANCHE,
    },
  });

  // 8. Seed Recurring Bills
  await prisma.recurringBill.create({
    data: {
      budgetId: budget.id,
      name: 'Apartment Rent Lease',
      amount: new Decimal('1650.00'),
      dueDay: 1,
      frequency: 'MONTHLY',
    },
  });

  await prisma.recurringBill.create({
    data: {
      budgetId: budget.id,
      name: 'Electric Power Grid',
      amount: new Decimal('115.00'),
      dueDay: 15,
      frequency: 'MONTHLY',
    },
  });

  // 9. Seed Budget Event for Auditability
  await prisma.budgetEvent.create({
    data: {
      budgetId: budget.id,
      sequenceNumber: 1,
      eventType: EventType.ALLOCATE_FUNDS,
      payload: {
        periodId: period.id,
        totalAssigned: cumulativeAssigned.toFixed(2),
        readyToAssign: finalReadyToAssign.toFixed(2),
      },
    },
  });

  console.log('Budget Planning App seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
