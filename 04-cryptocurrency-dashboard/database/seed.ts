import { PrismaClient, TransactionType, AlertCondition, AlertStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 4: Cryptocurrency Dashboard...');

  // 1. Create Demo Trader User
  const passwordHash = await bcrypt.hash('CryptoMaster2026!', 10);
  const trader = await prisma.user.upsert({
    where: { email: 'trader@fintrack-crypto.internal' },
    update: {},
    create: {
      email: 'trader@fintrack-crypto.internal',
      passwordHash,
      fullName: 'Alex Vance (Crypto Trader)',
    },
  });

  // 2. Create Core Digital Assets
  const assetsData = [
    { symbol: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin', decimals: 18 },
    { symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum', decimals: 18 },
    { symbol: 'SOL', name: 'Solana', coingeckoId: 'solana', decimals: 9 },
    { symbol: 'ADA', name: 'Cardano', coingeckoId: 'cardano', decimals: 6 },
    { symbol: 'DOT', name: 'Polkadot', coingeckoId: 'polkadot', decimals: 10 },
  ];

  const assetMap = new Map<string, string>();
  for (const a of assetsData) {
    const asset = await prisma.asset.upsert({
      where: { symbol: a.symbol },
      update: {},
      create: a,
    });
    assetMap.set(a.symbol, asset.id);
  }

  // 3. Create Market Quotes (Initial Data)
  const quotesData = [
    { symbol: 'BTC', priceUsd: '67450.25000000', change24h: '3.45', volume24h: '32450000000.00', marketCapUsd: '1320000000000.00' },
    { symbol: 'ETH', priceUsd: '3520.80000000', change24h: '-1.15', volume24h: '18200000000.00', marketCapUsd: '423000000000.00' },
    { symbol: 'SOL', priceUsd: '158.40000000', change24h: '7.82', volume24h: '4120000000.00', marketCapUsd: '72500000000.00' },
    { symbol: 'ADA', priceUsd: '0.48500000', change24h: '0.92', volume24h: '510000000.00', marketCapUsd: '17200000000.00' },
    { symbol: 'DOT', priceUsd: '7.25000000', change24h: '-2.40', volume24h: '280000000.00', marketCapUsd: '10100000000.00' },
  ];

  for (const q of quotesData) {
    const assetId = assetMap.get(q.symbol)!;
    await prisma.marketQuote.create({
      data: {
        assetId,
        priceUsd: new Decimal(q.priceUsd),
        change24h: new Decimal(q.change24h),
        volume24h: new Decimal(q.volume24h),
        marketCapUsd: new Decimal(q.marketCapUsd),
        isStale: false,
      },
    });
  }

  // 4. Create Portfolios
  const vault = await prisma.portfolio.create({
    data: {
      userId: trader.id,
      name: 'Cold Storage Vault',
      description: 'Long-term reserve digital assets',
      currency: 'USD',
    },
  });

  const defiPortfolio = await prisma.portfolio.create({
    data: {
      userId: trader.id,
      name: 'DeFi & Altcoin Fund',
      description: 'Active staking and high-growth altcoins',
      currency: 'USD',
    },
  });

  // 5. Seed Vault Holdings & Transactions (BTC and ETH)
  const btcId = assetMap.get('BTC')!;
  const ethId = assetMap.get('ETH')!;
  const solId = assetMap.get('SOL')!;

  // BTC: 1.5 BTC bought @ $60,000, 0.5 BTC bought @ $64,000 -> 2.0 BTC total, invested $122,000, avg cost $61,000
  await prisma.portfolioTransaction.create({
    data: {
      portfolioId: vault.id,
      assetId: btcId,
      type: TransactionType.BUY,
      quantity: new Decimal('1.500000000000000000'),
      unitPriceUsd: new Decimal('60000.00000000'),
      totalCostUsd: new Decimal('90000.00000000'),
      feeUsd: new Decimal('15.0000'),
      notes: 'Initial cold vault allocation',
    },
  });

  await prisma.portfolioTransaction.create({
    data: {
      portfolioId: vault.id,
      assetId: btcId,
      type: TransactionType.BUY,
      quantity: new Decimal('0.500000000000000000'),
      unitPriceUsd: new Decimal('64000.00000000'),
      totalCostUsd: new Decimal('32000.00000000'),
      feeUsd: new Decimal('8.0000'),
      notes: 'Dip accumulation',
    },
  });

  await prisma.portfolioHolding.create({
    data: {
      portfolioId: vault.id,
      assetId: btcId,
      quantity: new Decimal('2.000000000000000000'),
      averageCostBasisUsd: new Decimal('61000.00000000'),
      totalInvestedUsd: new Decimal('122000.00000000'),
      realizedPnLUsd: new Decimal('0'),
    },
  });

  // ETH in Vault: 10 ETH bought @ $3,000
  await prisma.portfolioTransaction.create({
    data: {
      portfolioId: vault.id,
      assetId: ethId,
      type: TransactionType.BUY,
      quantity: new Decimal('10.000000000000000000'),
      unitPriceUsd: new Decimal('3000.00000000'),
      totalCostUsd: new Decimal('30000.00000000'),
      feeUsd: new Decimal('12.0000'),
      notes: 'Staking reserve',
    },
  });

  await prisma.portfolioHolding.create({
    data: {
      portfolioId: vault.id,
      assetId: ethId,
      quantity: new Decimal('10.000000000000000000'),
      averageCostBasisUsd: new Decimal('3000.00000000'),
      totalInvestedUsd: new Decimal('30000.00000000'),
      realizedPnLUsd: new Decimal('0'),
    },
  });

  // SOL in DeFi Fund: 50 SOL bought @ $120
  await prisma.portfolioTransaction.create({
    data: {
      portfolioId: defiPortfolio.id,
      assetId: solId,
      type: TransactionType.BUY,
      quantity: new Decimal('50.000000000'),
      unitPriceUsd: new Decimal('120.00000000'),
      totalCostUsd: new Decimal('6000.00000000'),
      feeUsd: new Decimal('2.5000'),
      notes: 'Solana ecosystem exposure',
    },
  });

  await prisma.portfolioHolding.create({
    data: {
      portfolioId: defiPortfolio.id,
      assetId: solId,
      quantity: new Decimal('50.000000000'),
      averageCostBasisUsd: new Decimal('120.00000000'),
      totalInvestedUsd: new Decimal('6000.00000000'),
      realizedPnLUsd: new Decimal('0'),
    },
  });

  // 6. Create Price Alerts
  await prisma.priceAlert.create({
    data: {
      userId: trader.id,
      assetId: btcId,
      condition: AlertCondition.PRICE_ABOVE,
      targetValue: new Decimal('70000.00000000'),
      status: AlertStatus.ACTIVE,
    },
  });

  await prisma.priceAlert.create({
    data: {
      userId: trader.id,
      assetId: ethId,
      condition: AlertCondition.PRICE_BELOW,
      targetValue: new Decimal('3200.00000000'),
      status: AlertStatus.ACTIVE,
    },
  });

  // 7. Add Watchlist Items
  await prisma.watchlistItem.create({
    data: { userId: trader.id, assetId: btcId },
  });
  await prisma.watchlistItem.create({
    data: { userId: trader.id, assetId: ethId },
  });
  await prisma.watchlistItem.create({
    data: { userId: trader.id, assetId: solId },
  });

  console.log('Phase 4 seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during Phase 4 seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
