// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UserRoles.sol";

contract Accounts {
    UserRoles public userRoles;

    enum AccountType {
        PERSONAL,
        BUSINESS,
        EXPENSE,
        REVENUE
    }

    struct Account {
        uint256 accountId;
        address owner;
        string accountName;
        AccountType accountType;
        uint256 creationDate;
        bool isActive;
    }

    mapping(address => Account) public accounts;
    mapping(uint256 => address) public accountIdToAddress;
    uint256 public nextAccountId;

    event AccountCreated(
        uint256 indexed accountId,
        address indexed owner,
        string accountName,
        AccountType accountType
    );
    event AccountUpdated(uint256 indexed accountId, string accountName, AccountType accountType);

    event AccountStatusChanged(uint256 indexed accountId, bool isActive);

    // Add this event for debugging
    event AccountCreationDebug(uint256 accountId, address owner);

    modifier onlyAdmin() {
        require(
            userRoles.hasAdminRole(msg.sender),
            "Caller is not an admin"
        );
        _;
    }

    constructor(address userRolesAddress) {
        userRoles = UserRoles(userRolesAddress);
        nextAccountId = 1;
    }

    function createAccount(
        string calldata accountName,
        AccountType accountType
    ) external {
        require(accounts[msg.sender].owner == address(0), "Account already exists for this address");

        // Create the new account struct
        Account memory newAccount = Account({
            accountId: nextAccountId,
            owner: msg.sender,
            accountName: accountName,
            accountType: accountType,
            creationDate: block.timestamp,
            isActive: true
        });

        // Update the mappings
        accounts[msg.sender] = newAccount;
        accountIdToAddress[nextAccountId] = msg.sender;

        // Emit debug event
        emit AccountCreationDebug(nextAccountId, msg.sender);

        // Increment the next account ID
        nextAccountId++;

        // Emit the AccountCreated event
        emit AccountCreated(newAccount.accountId, newAccount.owner, newAccount.accountName, newAccount.accountType);
    }

    function updateAccount(
        string calldata accountName,
        AccountType accountType
    ) external {
        require(accounts[msg.sender].owner != address(0), "Account does not exist");
        require(
            accounts[msg.sender].owner == msg.sender,
            "Caller is not the account owner"
        );

        Account storage account = accounts[msg.sender];
        account.accountName = accountName;
        account.accountType = accountType;

        emit AccountUpdated(account.accountId, account.accountName, account.accountType);
    }

    function changeAccountStatus(uint256 accountId, bool isActive) external onlyAdmin {
        address accountAddress = accountIdToAddress[accountId];
        require(accountAddress != address(0), "Account does not exist");

        Account storage account = accounts[accountAddress];
        account.isActive = isActive;

        emit AccountStatusChanged(accountId, isActive);
    }

    function getAccount(address owner) external view returns (Account memory) {
        return accounts[owner];
    }

    function getAccountById(uint256 accountId) external view returns (Account memory) {
        address owner = accountIdToAddress[accountId];
        require(owner != address(0), "Account does not exist");
        return accounts[owner];
    }
}