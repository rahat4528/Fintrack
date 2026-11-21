import { PrismaClient, AccountCategory, TradeType, LotStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 6: Stock Market Portfolio Tracker...');

  // 1. Create Investor User
  const passwordHash = await bcrypt.hash('PortfolioPro2026!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'investor@fintrack-stocks.internal' },
    update: {},
    create: {
      email: 'investor@fintrack-stocks.internal',
      passwordHash,
      fullName: 'David Sterling (Private Wealth)',
    },
  });

  // 2. Create Securities
  const securitiesData = [
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology', currentPrice: new Decimal('192.5000') },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology', currentPrice: new Decimal('425.8000') },
    { symbol: 'NVDA', name: 'Nvidia Corporation', sector: 'Technology', currentPrice: new Decimal('128.4000') },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare', currentPrice: new Decimal('154.2000') },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials', currentPrice: new Decimal('198.6000') },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', sector: 'Broad Index ETF', currentPrice: new Decimal('495.3000') },
  ];

  const secMap = new Map<string, string>();
  for (const s of securitiesData) {
    const sec = await prisma.security.upsert({
      where: { symbol: s.symbol },
      update: {},
      create: s,
    });
    secMap.set(s.symbol, sec.id);
  }

  // 3. Create Investment Accounts
  const taxableAcc = await prisma.investmentAccount.create({
    data: {
      userId: user.id,
      accountName: 'Core Wealth Taxable Brokerage',
      category: AccountCategory.TAXABLE_BROKERAGE,
      cashBalance: new Decimal('24500.00'),
    },
  });

  const rothAcc = await prisma.investmentAccount.create({
    data: {
      userId: user.id,
      accountName: 'Retirement Roth IRA',
      category: AccountCategory.ROTH_IRA,
      cashBalance: new Decimal('8200.00'),
    },
  });

  // 4. Seed Positions and Tax Lots in Taxable Brokerage
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // AAPL:
  // Lot 1: 50 shares bought 420 days ago @ $150.00 (Long-Term Lot) -> Cost: $7,500
  // Lot 2: 30 shares bought 90 days ago @ $175.00 (Short-Term Lot) -> Cost: $5,250
  // Total AAPL: 80 shares, Total Cost: $12,750, Average Cost: $159.375
  const aaplId = secMap.get('AAPL')!;

  const aaplLot1 = await prisma.taxLot.create({
    data: {
      accountId: taxableAcc.id,
      securityId: aaplId,
      originalShares: new Decimal('50.000000'),
      remainingShares: new Decimal('50.000000'),
      costBasisPerShare: new Decimal('150.0000'),
      totalCostBasis: new Decimal('7500.00'),
      acquiredDate: new Date(now.getTime() - 420 * dayMs),
      status: LotStatus.OPEN,
    },
  });

  const aaplLot2 = await prisma.taxLot.create({
    data: {
      accountId: taxableAcc.id,
      securityId: aaplId,
      originalShares: new Decimal('30.000000'),
      remainingShares: new Decimal('30.000000'),
      costBasisPerShare: new Decimal('175.0000'),
      totalCostBasis: new Decimal('5250.00'),
      acquiredDate: new Date(now.getTime() - 90 * dayMs),
      status: LotStatus.OPEN,
    },
  });

  await prisma.position.create({
    data: {
      accountId: taxableAcc.id,
      securityId: aaplId,
      totalShares: new Decimal('80.000000'),
      averageCostPerShare: new Decimal('159.3750'),
      totalCostBasis: new Decimal('12750.00'),
    },
  });

  // MSFT: 40 shares @ $350.00 bought 200 days ago -> Cost $14,000
  const msftId = secMap.get('MSFT')!;
  await prisma.taxLot.create({
    data: {
      accountId: taxableAcc.id,
      securityId: msftId,
      originalShares: new Decimal('40.000000'),
      remainingShares: new Decimal('40.000000'),
      costBasisPerShare: new Decimal('350.0000'),
      totalCostBasis: new Decimal('14000.00'),
      acquiredDate: new Date(now.getTime() - 200 * dayMs),
      status: LotStatus.OPEN,
    },
  });

  await prisma.position.create({
    data: {
      accountId: taxableAcc.id,
      securityId: msftId,
      totalShares: new Decimal('40.000000'),
      averageCostPerShare: new Decimal('350.0000'),
      totalCostBasis: new Decimal('14000.00'),
    },
  });

  // VOO in Roth IRA: 50 shares @ $420.00 -> Cost $21,000
  const vooId = secMap.get('VOO')!;
  await prisma.taxLot.create({
    data: {
      accountId: rothAcc.id,
      securityId: vooId,
      originalShares: new Decimal('50.000000'),
      remainingShares: new Decimal('50.000000'),
      costBasisPerShare: new Decimal('420.0000'),
      totalCostBasis: new Decimal('21000.00'),
      acquiredDate: new Date(now.getTime() - 300 * dayMs),
      status: LotStatus.OPEN,
    },
  });

  await prisma.position.create({
    data: {
      accountId: rothAcc.id,
      securityId: vooId,
      totalShares: new Decimal('50.000000'),
      averageCostPerShare: new Decimal('420.0000'),
      totalCostBasis: new Decimal('21000.00'),
    },
  });

  // 5. Seed Cash Dividends
  await prisma.dividendRecord.create({
    data: {
      accountId: taxableAcc.id,
      securityId: aaplId,
      amount: new Decimal('120.00'),
      isReinvested: false,
      paidAt: new Date(now.getTime() - 15 * dayMs),
    },
  });

  // 6. Seed Target Asset Allocation for Rebalancing
  const targetAllocations = [
    { sector: 'Technology', targetPercent: new Decimal('40.00') },
    { sector: 'Healthcare', targetPercent: new Decimal('20.00') },
    { sector: 'Financials', targetPercent: new Decimal('20.00') },
    { sector: 'Broad Index ETF', targetPercent: new Decimal('20.00') },
  ];

  for (const t of targetAllocations) {
    await prisma.targetAllocation.create({
      data: {
        userId: user.id,
        sector: t.sector,
        targetPercent: t.targetPercent,
      },
    });
  }

  console.log('Phase 6 seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during Phase 6 seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
