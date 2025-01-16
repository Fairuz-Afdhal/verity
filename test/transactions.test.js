const Transactions = artifacts.require("Transactions");
const Accounts = artifacts.require("Accounts");
const UserRoles = artifacts.require("UserRoles");
const assert = require("assert");

contract("Transactions", (accounts) => {
  let transactionsInstance;
  let accountsInstance;
  let userRolesInstance;
  const owner = accounts[0];
  const admin = accounts[1];
  const accountant = accounts[2];
  const auditor = accounts[3];
  const user1 = accounts[4];
  const user2 = accounts[5];

  let user1AccountId;
  let user2AccountId;

  beforeEach(async () => {
    userRolesInstance = await UserRoles.new({ from: owner });
    accountsInstance = await Accounts.new(userRolesInstance.address, {
      from: owner,
    });
    transactionsInstance = await Transactions.new(
      userRolesInstance.address,
      accountsInstance.address,
      { from: owner }
    );

    // Grant roles
    await userRolesInstance.grantRole(admin, 1, { from: owner }); // ADMIN
    await userRolesInstance.grantRole(accountant, 2, { from: owner }); // ACCOUNTANT
    await userRolesInstance.grantRole(auditor, 3, { from: owner }); // AUDITOR

    // Create accounts and capture IDs from emitted events
    const receipt1 = await accountsInstance.createAccount("User1 Account", 0, { from: user1 });
    const accountCreatedEvent1 = receipt1.logs.find(
      (log) => log.event === "AccountCreated"
    );
    if (!accountCreatedEvent1) {
      throw new Error("AccountCreated event not found for User1");
    }
    user1AccountId = accountCreatedEvent1.args.accountId.toNumber(); // Capture ID from event

    const receipt2 = await accountsInstance.createAccount("User2 Account", 0, { from: user2 });
    const accountCreatedEvent2 = receipt2.logs.find(
      (log) => log.event === "AccountCreated"
    );
    if (!accountCreatedEvent2) {
      throw new Error("AccountCreated event not found for User2");
    }
    user2AccountId = accountCreatedEvent2.args.accountId.toNumber(); // Capture ID from event

    // Log account creation for debugging
    console.log("User 1 account created - ID:", user1AccountId, "Address:", user1);
    console.log("User 2 account created - ID:", user2AccountId, "Address:", user2);
  });

  it("should allow accountant to record a deposit", async () => {
    const amount = 1000;

    const tx = await transactionsInstance.recordTransaction(
      0, // Transaction type: Deposit
      0, // Not applicable for deposit
      user1AccountId, // Deposit to user1's account
      amount,
      "Deposit",
      { from: accountant }
    );

    // Check for emitted events
    const accountExistsDebugEvent = tx.logs.find(
      (log) => log.event === "AccountExistsDebug"
    );
    const recordTransactionDebugEvent = tx.logs.find(
      (log) => log.event === "RecordTransactionDebug"
    );

    assert.ok(
      accountExistsDebugEvent,
      "AccountExistsDebug event not found"
    );
    assert.ok(
      recordTransactionDebugEvent,
      "RecordTransactionDebug event not found"
    );

    const balance = await transactionsInstance.getBalance(user1AccountId);
    assert.equal(balance.toNumber(), amount, "Balance should be updated");
  });

  it("should allow accountant to record a withdrawal", async () => {
    const initialAmount = 1000;
    const withdrawalAmount = 400;

    await transactionsInstance.recordTransaction(
      0,
      0,
      user1AccountId,
      initialAmount,
      "Deposit",
      { from: accountant }
    );

    const tx = await transactionsInstance.recordTransaction(
      1,
      user1AccountId,
      0,
      withdrawalAmount,
      "Withdrawal",
      { from: accountant }
    );

    // Check for emitted events
    const accountExistsDebugEvents = tx.logs.filter(
      (log) => log.event === "AccountExistsDebug"
    );
    const recordTransactionDebugEvent = tx.logs.find(
      (log) => log.event === "RecordTransactionDebug"
    );

    assert.equal(
      accountExistsDebugEvents.length,
      1,
      "Should have 1 AccountExistsDebug events"
    );
    assert.ok(
      recordTransactionDebugEvent,
      "RecordTransactionDebug event not found"
    );

    const balance = await transactionsInstance.getBalance(user1AccountId);
    assert.equal(
      balance.toNumber(),
      initialAmount - withdrawalAmount,
      "Balance should be updated after withdrawal"
    );
  });

  it("should allow accountant to record a transfer", async () => {
    const initialAmount = 1000;
    const transferAmount = 600;

    await transactionsInstance.recordTransaction(
      0,
      0,
      user1AccountId,
      initialAmount,
      "Deposit",
      { from: accountant }
    );

    const tx = await transactionsInstance.recordTransaction(
      2,
      user1AccountId,
      user2AccountId,
      transferAmount,
      "Transfer",
      { from: accountant }
    );

    // Check for emitted events
    const accountExistsDebugEvents = tx.logs.filter(
      (log) => log.event === "AccountExistsDebug"
    );
    const recordTransactionDebugEvent = tx.logs.find(
      (log) => log.event === "RecordTransactionDebug"
    );

    assert.equal(
      accountExistsDebugEvents.length,
      2,
      "Should have 2 AccountExistsDebug events"
    );
    assert.ok(
      recordTransactionDebugEvent,
      "RecordTransactionDebug event not found"
    );

    const balance1 = await transactionsInstance.getBalance(user1AccountId);
    const balance2 = await transactionsInstance.getBalance(user2AccountId);

    assert.equal(
      balance1.toNumber(),
      initialAmount - transferAmount,
      "User 1 balance should be updated after transfer"
    );
    assert.equal(
      balance2.toNumber(),
      transferAmount,
      "User 2 balance should be updated after transfer"
    );
  });

  it("should not allow recording a transaction with amount 0", async () => {
    await assert.rejects(
      async () => {
        await transactionsInstance.recordTransaction(
          2,
          user1AccountId,
          user2AccountId,
          0,
          "Invalid Transfer",
          { from: accountant }
        );
      },
      /Amount must be greater than zero/,
      "Should throw 'Amount must be greater than zero'"
    );
  });

  it("should not allow recording a transfer to the same account", async () => {
    await assert.rejects(
      async () => {
        await transactionsInstance.recordTransaction(
          2,
          user1AccountId,
          user1AccountId,
          500,
          "Invalid Transfer",
          { from: accountant }
        );
      },
      /Cannot transfer to the same account/,
      "Should throw 'Cannot transfer to the same account'"
    );
  });

  it("should not allow recording a withdrawal with insufficient balance", async () => {
    await assert.rejects(
      async () => {
        await transactionsInstance.recordTransaction(
          1,
          user1AccountId,
          0,
          500,
          "Invalid Withdrawal",
          { from: accountant }
        );
      },
      /Insufficient balance/,
      "Should throw 'Insufficient balance'"
    );
  });

  it("should not allow non-accountant or non-admin to record transactions", async () => {
    await assert.rejects(
      async () => {
        await transactionsInstance.recordTransaction(
          2,
          user1AccountId,
          user2AccountId,
          500,
          "Transfer",
          { from: auditor }
        );
      },
      /Caller is not an accountant or admin/,
      "Should throw 'Caller is not an accountant or admin'"
    );
  });

  it("should get transaction details correctly", async () => {
    const amount = 1000;
    const description = "Test Deposit";

    const firstTx = await transactionsInstance.recordTransaction(
      0,
      0,
      user1AccountId,
      amount,
      description,
      { from: accountant }
    );

    const transactionId = 1;

    const transaction = await transactionsInstance.getTransaction(transactionId);

    assert.equal(
      transaction.transactionId,
      transactionId,
      "Transaction ID should match"
    );
    assert.equal(
      transaction.transactionType,
      0,
      "Transaction type should be DEPOSIT"
    );
    assert.equal(
      transaction.fromAccountId,
      0,
      "From account ID should match"
    );
    assert.equal(
      transaction.toAccountId,
      user1AccountId,
      "To account ID should match"
    );
    assert.equal(transaction.amount, amount, "Amount should match");
    assert.equal(transaction.description, description, "Description should match");
  });
});