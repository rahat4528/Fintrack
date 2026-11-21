import { PrismaClient, UserRole, AccountType, AccountStatus, EntryType, TransferStatus, KycStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Banking Application demonstration database...');

  // 1. Clean existing banking data
  await prisma.auditLog.deleteMany({});
  await prisma.securityEvent.deleteMany({});
  await prisma.monitoringAlert.deleteMany({});
  await prisma.statement.deleteMany({});
  await prisma.transferRequest.deleteMany({});
  await prisma.ledgerEntry.deleteMany({});
  await prisma.ledgerTransaction.deleteMany({});
  await prisma.beneficiary.deleteMany({});
  await prisma.bankAccount.deleteMany({});
  await prisma.kYCRecord.deleteMany({});
  await prisma.customerProfile.deleteMany({});
  await prisma.bankEmployee.deleteMany({});
  await prisma.transactionLimit.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create Users across three roles
  const customerPass = await bcrypt.hash('DemoCustomer123!', 10);
  const employeePass = await bcrypt.hash('DemoEmployee123!', 10);
  const adminPass = await bcrypt.hash('DemoAdmin123!', 10);

  const customerUser = await prisma.user.create({
    data: {
      email: 'customer@fintrack.local',
      fullName: 'Sarah Jenkins (Demo Customer)',
      passwordHash: customerPass,
      role: UserRole.CUSTOMER,
      customerProfile: {
        create: {
          phoneNumber: '+1-555-0199',
          address: '742 Evergreen Terrace (Demo Address)',
          kycStatus: KycStatus.VERIFIED,
          kycRecord: {
            create: {
              documentType: 'SIMULATED_ID',
              documentNumber: 'SIM-ID-99420-X',
              status: KycStatus.VERIFIED,
              reviewNotes: 'Auto-verified with mock verification provider',
            },
          },
        },
      },
    },
    include: { customerProfile: true },
  });

  const employeeUser = await prisma.user.create({
    data: {
      email: 'employee@fintrack.local',
      fullName: 'David Vance (Operations Officer)',
      passwordHash: employeePass,
      role: UserRole.EMPLOYEE,
      isMfaEnabled: true,
      bankEmployee: {
        create: {
          employeeCode: 'EMP-OPS-402',
          department: 'ACCOUNTS_MONITORING',
        },
      },
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@fintrack.local',
      fullName: 'Eleanor Sterling (System Administrator)',
      passwordHash: adminPass,
      role: UserRole.ADMIN,
      isMfaEnabled: true,
    },
  });

  console.log('Seeded Roles: Customer, Employee, Admin.');

  // 3. Create Limits
  await prisma.transactionLimit.create({
    data: {
      accountType: AccountType.CURRENT,
      maxSingleTransfer: new Decimal('5000.00'),
      maxDailyTransfer: new Decimal('25000.00'),
    },
  });

  await prisma.transactionLimit.create({
    data: {
      accountType: AccountType.SAVINGS,
      maxSingleTransfer: new Decimal('10000.00'),
      maxDailyTransfer: new Decimal('50000.00'),
    },
  });

  // 4. Create Bank Accounts
  const currentAcc = await prisma.bankAccount.create({
    data: {
      customerId: customerUser.customerProfile!.id,
      accountNumber: 'SIM-8492-1001',
      accountType: AccountType.CURRENT,
      currency: 'USD',
      currentBalance: new Decimal('6500.00'),
      status: AccountStatus.ACTIVE,
    },
  });

  const savingsAcc = await prisma.bankAccount.create({
    data: {
      customerId: customerUser.customerProfile!.id,
      accountNumber: 'SIM-8492-1002',
      accountType: AccountType.SAVINGS,
      currency: 'USD',
      currentBalance: new Decimal('24000.00'),
      status: AccountStatus.ACTIVE,
    },
  });

  // 5. Create Double-Entry Ledger Transactions
  // Transaction 1: Initial Deposit Opening (Balanced entries)
  const openTx = await prisma.ledgerTransaction.create({
    data: {
      referenceCode: 'TX-SIM-INIT-001',
      description: 'Opening Initial Simulated Deposit',
      status: TransferStatus.COMPLETED,
    },
  });

  await prisma.ledgerEntry.create({
    data: {
      ledgerTransactionId: openTx.id,
      bankAccountId: currentAcc.id,
      entryType: EntryType.CREDIT,
      amount: new Decimal('8000.00'),
    },
  });

  await prisma.ledgerEntry.create({
    data: {
      ledgerTransactionId: openTx.id,
      bankAccountId: savingsAcc.id,
      entryType: EntryType.CREDIT,
      amount: new Decimal('22500.00'),
    },
  });

  // Transaction 2: Internal Transfer from Current to Savings ($1,500.00)
  const transferTx = await prisma.ledgerTransaction.create({
    data: {
      referenceCode: 'TX-SIM-INT-002',
      description: 'Internal Transfer from Current to Savings',
      status: TransferStatus.COMPLETED,
    },
  });

  // Debit Current (-$1,500)
  await prisma.ledgerEntry.create({
    data: {
      ledgerTransactionId: transferTx.id,
      bankAccountId: currentAcc.id,
      entryType: EntryType.DEBIT,
      amount: new Decimal('1500.00'),
    },
  });

  // Credit Savings (+$1,500)
  await prisma.ledgerEntry.create({
    data: {
      ledgerTransactionId: transferTx.id,
      bankAccountId: savingsAcc.id,
      entryType: EntryType.CREDIT,
      amount: new Decimal('1500.00'),
    },
  });

  // Record TransferRequest
  await prisma.transferRequest.create({
    data: {
      customerId: customerUser.customerProfile!.id,
      sourceAccountId: currentAcc.id,
      destAccountId: savingsAcc.id,
      amount: new Decimal('1500.00'),
      idempotencyKey: 'idem-sim-transfer-001',
      status: TransferStatus.COMPLETED,
      ledgerTransactionId: transferTx.id,
    },
  });

  // 6. Beneficiary Demo Record
  await prisma.beneficiary.create({
    data: {
      customerId: customerUser.customerProfile!.id,
      name: 'Acme Commercial Services (Demo Vendor)',
      targetAccountNumber: 'SIM-9900-5511',
      bankName: 'Simulated Clearing System',
      isVerified: true,
    },
  });

  // 7. Verify Double-Entry Balance Consistency
  for (const acc of [currentAcc, savingsAcc]) {
    const entries = await prisma.ledgerEntry.findMany({ where: { bankAccountId: acc.id } });
    let computed = new Decimal(0);
    for (const e of entries) {
      if (e.entryType === EntryType.CREDIT) computed = computed.plus(e.amount);
      else computed = computed.minus(e.amount);
    }
    console.log(`Account [${acc.accountNumber}] Balance Verification: Stored=${acc.currentBalance.toFixed(2)}, ComputedFromLedger=${computed.toFixed(2)}`);
  }

  console.log('Banking Application demo database successfully seeded.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
