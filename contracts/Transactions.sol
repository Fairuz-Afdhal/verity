// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./UserRoles.sol";
import "./Accounts.sol";

contract Transactions {
    UserRoles public userRoles;
    Accounts public accounts;

    enum TransactionType {
        DEPOSIT,
        WITHDRAWAL,
        TRANSFER
    }

    struct Transaction {
        uint256 transactionId;
        uint256 date;
        TransactionType transactionType;
        uint256 fromAccountId;
        uint256 toAccountId;
        uint256 amount;
        string description;
    }

    mapping(uint256 => uint256) public balances; // Use accountId for balances
    Transaction[] public transactions;
    uint256 private nextTransactionId;

    // Events for debugging
    event AccountExistsDebug(uint256 accountId, address accountAddress);
    event RecordTransactionDebug(uint256 fromAccountId, uint256 toAccountId);

    event TransactionRecorded(
        uint256 indexed transactionId,
        TransactionType transactionType,
        uint256 indexed fromAccountId,
        uint256 indexed toAccountId,
        uint256 amount,
        string description
    );

    event BalanceUpdated(uint256 indexed accountId, uint256 newBalance);

    modifier onlyAccountantOrAdmin() {
        require(
            userRoles.hasAccountantRole(msg.sender) ||
                userRoles.hasAdminRole(msg.sender),
            "Caller is not an accountant or admin"
        );
        _;
    }

    modifier accountExists(uint256 accountId) {
        if (accountId != 0) {
            emit AccountExistsDebug(accountId, accounts.accountIdToAddress(accountId));
            require(accounts.accountIdToAddress(accountId) != address(0), "Account does not exist");
        }
        _;
    }

    constructor(address userRolesAddress, address accountsAddress) {
        userRoles = UserRoles(userRolesAddress);
        accounts = Accounts(accountsAddress);
        nextTransactionId = 1;
    }

    function recordTransaction(
        TransactionType transactionType,
        uint256 fromAccountId,
        uint256 toAccountId,
        uint256 amount,
        string calldata description
    ) external onlyAccountantOrAdmin accountExists(fromAccountId) accountExists(toAccountId) {
        emit RecordTransactionDebug(fromAccountId, toAccountId);
        require(amount > 0, "Amount must be greater than zero");

        if (transactionType == TransactionType.DEPOSIT) {
            // Check existence of toAccountId only
            require(accounts.accountIdToAddress(toAccountId) != address(0), "Account does not exist");
            balances[toAccountId] += amount;
            emit BalanceUpdated(toAccountId, balances[toAccountId]);
        } else if (transactionType == TransactionType.WITHDRAWAL) {
            // Check existence of fromAccountId only
            require(accounts.accountIdToAddress(fromAccountId) != address(0), "Account does not exist");
            require(balances[fromAccountId] >= amount, "Insufficient balance");
            balances[fromAccountId] -= amount;
            emit BalanceUpdated(fromAccountId, balances[fromAccountId]);
        } else if (transactionType == TransactionType.TRANSFER) {
            // Check existence of both fromAccountId and toAccountId
            require(accounts.accountIdToAddress(fromAccountId) != address(0), "Account does not exist");
            require(accounts.accountIdToAddress(toAccountId) != address(0), "Account does not exist");
            require(fromAccountId != toAccountId, "Cannot transfer to the same account");
            require(balances[fromAccountId] >= amount, "Insufficient balance");
            balances[fromAccountId] -= amount;
            emit BalanceUpdated(fromAccountId, balances[fromAccountId]);

            balances[toAccountId] += amount;
            emit BalanceUpdated(toAccountId, balances[toAccountId]);
        }

        Transaction memory newTransaction = Transaction({
            transactionId: nextTransactionId,
            date: block.timestamp,
            transactionType: transactionType,
            fromAccountId: fromAccountId,
            toAccountId: toAccountId,
            amount: amount,
            description: description
        });

        transactions.push(newTransaction);

        emit TransactionRecorded(
            nextTransactionId,
            transactionType,
            fromAccountId,
            toAccountId,
            amount,
            description
        );

        nextTransactionId++;
    }

    function getTransaction(uint256 transactionId)
        external
        view
        returns (Transaction memory)
    {
        for (uint256 i = 0; i < transactions.length; i++) {
            if (transactions[i].transactionId == transactionId) {
                return transactions[i];
            }
        }
        revert("Transaction not found");
    }

    function getBalance(uint256 accountId) external view returns (uint256) {
        return balances[accountId];
    }
}