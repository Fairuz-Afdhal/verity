<template>
  <div>
    <h2>Record Transaction</h2>
    <label for="fromAccount">From Account ID:</label>
    <input type="number" id="fromAccount" v-model="fromAccountId" /><br /><br />

    <label for="toAccount">To Account ID:</label>
    <input type="number" id="toAccount" v-model="toAccountId" /><br /><br />

    <label for="amount">Amount:</label>
    <input type="number" id="amount" v-model="amount" /><br /><br />

    <label for="description">Description:</label>
    <input type="text" id="description" v-model="description" /><br /><br />

    <label for="transactionType">Transaction Type:</label>
    <select id="transactionType" v-model="transactionType">
      <option value="0">DEPOSIT</option>
      <option value="1">WITHDRAWAL</option>
      <option value="2">TRANSFER</option>
    </select><br /><br />

    <button @click="recordTransaction">Record Transaction</button>
    <p v-if="transactionResult">{{ transactionResult }}</p>
  </div>
</template>

<script>
import { ethers } from "ethers";
import Transactions from "../../build/contracts/Transactions.json";

export default {
  name: "RecordTransaction",
  data() {
    return {
      fromAccountId: null,
      toAccountId: null,
      amount: null,
      description: "",
      transactionType: 0,
      transactionResult: null,
      provider: null,
      signer: null,
      transactionsContract: null,
    };
  },
  async mounted() {
    await this.connectToBlockchain();
  },
  methods: {
    async connectToBlockchain() {
      if (typeof window.ethereum !== "undefined") {
        this.provider = new ethers.providers.Web3Provider(
          window.ethereum
        );
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } else {
        // This is local Ganache
        this.provider = new ethers.providers.JsonRpcProvider("http://localhost:7545");
      }
      this.signer = this.provider.getSigner();

      // Create contract instances
      this.transactionsContract = new ethers.Contract(
        "YOUR_TRANSACTIONS_CONTRACT_ADDRESS",
        Transactions.abi,
        this.signer
      );
    },
    async recordTransaction() {
      try {
        const tx = await this.transactionsContract.recordTransaction(
          this.transactionType,
          this.fromAccountId,
          this.toAccountId,
          this.amount,
          this.description,
          { from: this.signer._address } // Assuming the signer is the 'accountant'
        );
        const receipt = await tx.wait();
        this.transactionResult = "Transaction recorded successfully.";
      } catch (error) {
        console.error("Error recording transaction:", error);
        this.transactionResult =
          "Error recording transaction: " + error.message;
      }
    },
  },
};
</script>