const UserRoles = artifacts.require("UserRoles");
const assert = require("assert");

contract("UserRoles", (accounts) => {
  let userRoles;
  const owner = accounts[0];
  const admin = accounts[1];
  const accountant = accounts[2];
  const auditor = accounts[3];
  const nonAdmin = accounts[4];

  beforeEach(async () => {
    userRoles = await UserRoles.new({ from: owner });
    // Grant ADMIN role to admin (accounts[1])
    await userRoles.grantRole(admin, 1, { from: owner });
  });

  it("should set the deployer as the initial admin", async () => {
    const role = await userRoles.userRoles(owner);
    assert.equal(role.toNumber(), 1, "Deployer should be the initial admin");
  });

  it("should allow admin to grant roles", async () => {
    // Use admin (accounts[1]) to grant the role
    await userRoles.grantRole(accountant, 2, { from: admin });
    const role = await userRoles.userRoles(accountant);
    assert.equal(role.toNumber(), 2, "Accountant role should be granted");
  });

  it("should not allow non-admin to grant roles", async () => {
    await assert.rejects(
      async () => {
        await userRoles.grantRole(auditor, 3, { from: nonAdmin });
      },
      /Caller is not an admin/,
      "Should throw 'Caller is not an admin'"
    );
  });

  it("should allow admin to revoke roles", async () => {
    // Use admin (accounts[1]) to grant and revoke roles
    await userRoles.grantRole(accountant, 2, { from: admin });
    await userRoles.revokeRole(accountant, { from: admin });
    const role = await userRoles.userRoles(accountant);
    assert.equal(
      role.toNumber(),
      0,
      "Accountant role should be revoked (set to default NONE)"
    );
  });

  it("should not allow non-admin to revoke roles", async () => {
    await userRoles.grantRole(accountant, 2, { from: admin });
    await assert.rejects(
      async () => {
        await userRoles.revokeRole(accountant, { from: nonAdmin });
      },
      /Caller is not an admin/,
      "Should throw 'Caller is not an admin'"
    );
  });

  it("should transfer ownership correctly", async () => {
    await userRoles.transferOwnership(nonAdmin, { from: owner });
    const newOwner = await userRoles.owner();
    assert.equal(newOwner, nonAdmin, "New owner should be set correctly");
  });

  it("should not allow non-owner to transfer ownership", async () => {
    await assert.rejects(
      async () => {
        await userRoles.transferOwnership(admin, { from: nonAdmin });
      },
      /caller is not the owner/,
      "Should throw 'caller is not the owner'"
    );
  });
});