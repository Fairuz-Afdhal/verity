const Accounts = artifacts.require("Accounts");
const UserRoles = artifacts.require("UserRoles");
const assert = require("assert");

contract("Accounts", (accounts) => {
  let accountsInstance;
  let userRolesInstance;
  const owner = accounts[0];
  const admin = accounts[1];
  const nonAdmin = accounts[2];

  beforeEach(async () => {
    userRolesInstance = await UserRoles.new({ from: owner });
    accountsInstance = await Accounts.new(userRolesInstance.address, {
      from: owner,
    });
    await userRolesInstance.grantRole(admin, 1, { from: owner });
  });

  it("should allow anyone to create an account", async () => {
    const accountName = "Test Account";
    const accountType = 0; // PERSONAL
    await accountsInstance.createAccount(accountName, accountType, {
      from: nonAdmin,
    });
    const account = await accountsInstance.getAccount(nonAdmin);
    assert.equal(account.accountName, accountName, "Account name should match");
    assert.equal(account.accountType, accountType, "Account type should match");
    assert.equal(account.isActive, true, "Account should be active");
  });

  it("should not allow creating an account for an address that already has one", async () => {
    const accountName = "Test Account";
    const accountType = 0; // PERSONAL
    await accountsInstance.createAccount(accountName, accountType, {
      from: nonAdmin,
    });

    await assert.rejects(
      async () => {
        await accountsInstance.createAccount("Another Account", 1, {
          from: nonAdmin,
        });
      },
      /Account already exists for this address/,
      "Should throw 'Account already exists for this address'"
    );
  });

  it("should allow account owner to update account details", async () => {
    const initialName = "Initial Name";
    const initialType = 0; // PERSONAL
    const updatedName = "Updated Name";
    const updatedType = 1; // BUSINESS

    await accountsInstance.createAccount(initialName, initialType, {
      from: nonAdmin,
    });
    await accountsInstance.updateAccount(updatedName, updatedType, {
      from: nonAdmin,
    });

    const account = await accountsInstance.getAccount(nonAdmin);
    assert.equal(account.accountName, updatedName, "Account name should be updated");
    assert.equal(account.accountType, updatedType, "Account type should be updated");
  });

  it("should not allow non-owner to update account details", async () => {
    const initialName = "Initial Name";
    const initialType = 0; // PERSONAL
    const updatedName = "Updated Name";
    const updatedType = 1; // BUSINESS

    await accountsInstance.createAccount(initialName, initialType, {
      from: nonAdmin,
    });

    await assert.rejects(
      async () => {
        await accountsInstance.updateAccount(updatedName, updatedType, {
          from: owner,
        });
      },
      /Caller is not the account owner/,
      "Should throw 'Caller is not the account owner'"
    );
  });

  it("should allow admin to change account status", async () => {
    const accountName = "Test Account";
    const accountType = 0; // PERSONAL

    await accountsInstance.createAccount(accountName, accountType, {
      from: nonAdmin,
    });
    const accountId = (await accountsInstance.getAccount(nonAdmin)).accountId;

    await accountsInstance.changeAccountStatus(accountId, false, { from: admin });

    const account = await accountsInstance.getAccount(nonAdmin);
    assert.equal(account.isActive, false, "Account should be inactive");

    await accountsInstance.changeAccountStatus(accountId, true, { from: admin });

    const accountAfter = await accountsInstance.getAccount(nonAdmin);
    assert.equal(accountAfter.isActive, true, "Account should be active");
  });

  it("should not allow non-admin to change account status", async () => {
    const accountName = "Test Account";
    const accountType = 0; // PERSONAL

    await accountsInstance.createAccount(accountName, accountType, {
      from: nonAdmin,
    });
    const accountId = (await accountsInstance.getAccount(nonAdmin)).accountId;

    await assert.rejects(
      async () => {
        await accountsInstance.changeAccountStatus(accountId, false, {
          from: nonAdmin,
        });
      },
      /Caller is not an admin/,
      "Should throw 'Caller is not an admin'"
    );
  });
});