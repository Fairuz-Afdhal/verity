// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UserRoles.sol";

contract Accounts {
    UserRoles public userRoles;

    // Define account types using an enum
    enum AccountType {
        PERSONAL,
        BUSINESS,
        EXPENSE,
        REVENUE,
        ASSET, // Add for balance sheet
        LIABILITY, // Add for balance sheet
        EQUITY // Add for balance sheet
    }

    // Structure to store account details
    struct Account {
        uint256 accountId;
        address owner;
        string accountName;
        AccountType accountType;
        uint256 creationDate;
        bool isActive;
    }

    // Mapping to store accounts by owner address
    mapping(address => Account) public accounts;
    // Mapping to store account owner address by account ID
    mapping(uint256 => address) public accountIdToAddress;
    uint256 public nextAccountId;

    // Event emitted when an account is created
    event AccountCreated(
        uint256 indexed accountId,
        address indexed owner,
        string accountName,
        AccountType accountType
    );
    // Event emitted when an account is updated
    event AccountUpdated(uint256 indexed accountId, string accountName, AccountType accountType);

    // Event emitted when an account's status is changed
    event AccountStatusChanged(uint256 indexed accountId, bool isActive);

    // Modifier to restrict access to ADMIN only
    modifier onlyAdmin() {
        require(
            userRoles.hasAdminRole(msg.sender),
            "Caller is not an admin"
        );
        _;
    }

    // Constructor to initialize the user roles contract address
    constructor(address userRolesAddress) {
        userRoles = UserRoles(userRolesAddress);
        nextAccountId = 1;
    }

    // Function to create a new account
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

        // Emit the AccountCreated event
        emit AccountCreated(newAccount.accountId, newAccount.owner, newAccount.accountName, newAccount.accountType);

        // Increment the next account ID
        nextAccountId++;
    }

    // Function to update an existing account
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

    // Function to change the status of an account (only callable by ADMIN)
    function changeAccountStatus(uint256 accountId, bool isActive) external onlyAdmin {
        address accountAddress = accountIdToAddress[accountId];
        require(accountAddress != address(0), "Account does not exist");

        Account storage account = accounts[accountAddress];
        account.isActive = isActive;

        emit AccountStatusChanged(accountId, isActive);
    }

    // Function to get account details by owner address
    function getAccount(address owner) external view returns (Account memory) {
        return accounts[owner];
    }

    // Function to get account details by account ID
    function getAccountById(uint256 accountId) external view returns (Account memory) {
        address owner = accountIdToAddress[accountId];
        require(owner != address(0), "Account does not exist");
        return accounts[owner];
    }
}