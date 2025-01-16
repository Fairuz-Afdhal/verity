<template>
  <div>
    <h2>Create Account</h2>
    <div>
      <label for="accountName">Account Name:</label>
      <input type="text" id="accountName" v-model="accountName" />
    </div>
    <div>
      <label for="accountType">Account Type:</label>
      <select id="accountType" v-model="accountType">
        <option value="0">PERSONAL</option>
        <option value="1">BUSINESS</option>
        <option value="2">EXPENSE</option>
        <option value="3">REVENUE</option>
        <option value="4">ASSET</option>
        <option value="5">LIABILITY</option>
        <option value="6">EQUITY</option>
      </select>
    </div>
    <button @click="createAccount" :disabled="!isReady">
      Create Account
    </button>
    <p v-if="creationResult">{{ creationResult }}</p>
  </div>
</template>

<script>
import { ethers } from "ethers";
import config from "@/config.json"; // Use relative path
import Accounts from "/public/build/contracts/Accounts.json";
import Transactions from "/public/build/contracts/Transactions.json";
import UserRoles from "/public/build/contracts/UserRoles.json";

export default {
  name: "CreateAccount",
  data() {
    return {
      accountName: "",
      accountType: 0,
      creationResult: null,
      provider: null,
      signer: null,
      accountsContract: null,
      transactionsContract: null,
      userRolesContract: null,
      isReady: false, // Add a data property to track readiness
    };
  },
  async mounted() {
    await this.connectToBlockchain();
  },
  methods: {
    async connectToBlockchain() {
      try {
        // Ensure ethers is defined
        if (typeof ethers === "undefined") {
          throw new Error("Ethers library is not loaded");
        }

        // Check for MetaMask or other compatible wallets
        if (window.ethereum) {
          if (!ethers.providers || !ethers.providers.Web3Provider) {
            throw new Error("Ethers providers are not available");
          }

          this.provider = new ethers.providers.Web3Provider(
            window.ethereum,
            "any"
          );
          // Request account access if needed
          await window.ethereum.request({ method: "eth_requestAccounts" });
          this.signer = this.provider.getSigner();
          console.log("Using Metamask provider");

          // Listen for network changes
          window.ethereum.on("chainChanged", () => {
            window.location.reload();
          });
          // Listen for account changes
          window.ethereum.on("accountsChanged", () => {
            window.location.reload();
          });
        } else {
          // Provide a user-friendly message if MetaMask is not installed
          console.error("MetaMask is not installed. Please install MetaMask and try again.");
          this.creationResult = "MetaMask is not installed. Please install MetaMask and try again.";
          return;
        }

        // Create contract instances
        this.accountsContract = new ethers.Contract(
          config.Accounts, // Use the address from config.json
          Accounts.abi,
          this.signer
        );

        this.transactionsContract = new ethers.Contract(
          config.Transactions, // Use the address from config.json
          Transactions.abi,
          this.signer
        );

        this.userRolesContract = new ethers.Contract(
          config.UserRoles, // Use the address from config.json
          UserRoles.abi,
          this.signer
        );

        // Check if contracts are loaded correctly
        if (
          this.accountsContract &&
          this.transactionsContract &&
          this.userRolesContract
        ) {
          console.log("Contracts loaded successfully");
          this.isReady = true; // Set the flag to true after contract initialization
        } else {
          console.error("Failed to load contracts");
        }

        console.log("Connected to blockchain");
        console.log("Accounts contract:", this.accountsContract.address);
        console.log(
          "Transactions contract:",
          this.transactionsContract.address
        );
        console.log("UserRoles contract:", this.userRolesContract.address);
      } catch (error) {
        console.error("Error connecting to blockchain:", error);
        this.creationResult =
          "Error connecting to blockchain: " + error.message;
      }
    },
    async createAccount() {
      if (!this.isReady) {
        console.error("Contract is not initialized yet.");
        this.creationResult = "Contract not initialized. Please wait.";
        return;
      }
      try {
        // Ensure that this.accountName and this.accountType are correctly bound to the input fields
        const name = this.accountName;
        const type = parseInt(this.accountType, 10); // Ensure type is a number

        console.log("Creating account with name:", name, "and type:", type);

        // Check if the contract instance is initialized
        if (!this.accountsContract) {
          console.error("Accounts contract is not initialized");
          this.creationResult =
            "Failed to create account: Contract not initialized";
          return;
        }

        const tx = await this.accountsContract.createAccount(name, type);
        const receipt = await tx.wait();
        console.log("Transaction receipt:", receipt);

        // Get the account ID from the AccountCreated event
        const accountCreatedEvent = receipt.events?.find(
          (event) => event.event === "AccountCreated"
        );
        if (accountCreatedEvent) {
          const accountId = accountCreatedEvent.args.accountId.toNumber();
          this.creationResult = `Account created successfully. Account ID: ${accountId}`;
        } else {
          this.creationResult = "Account created but could not retrieve ID.";
        }
      } catch (error) {
        console.error("Error creating account:", error);
        this.creationResult = "Error creating account: " + error.message;
      }
    },
  },
};
</script>