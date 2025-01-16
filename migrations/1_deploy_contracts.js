const UserRoles = artifacts.require("UserRoles");
const Accounts = artifacts.require("Accounts");
const Transactions = artifacts.require("Transactions");

module.exports = async function (deployer) {
  // Deploy UserRoles first
  await deployer.deploy(UserRoles);
  const userRolesInstance = await UserRoles.deployed();

  // Then deploy Accounts, passing the address of UserRoles
  await deployer.deploy(Accounts, userRolesInstance.address);
  const accountsInstance = await Accounts.deployed();

  // Finally, deploy Transactions, passing the addresses of UserRoles and Accounts
  await deployer.deploy(
    Transactions,
    userRolesInstance.address,
    accountsInstance.address
  );
  const transactionsInstance = await Transactions.deployed();
};