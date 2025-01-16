// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract UserRoles { 
    // Define roles using an enum
    enum Role {
        NONE,
        ADMIN,
        ACCOUNTANT,
        AUDITOR
    }

    // Mapping to store user roles
    mapping(address => Role) public userRoles;

    // Owner address
    address public owner;

    // Event emitted when ownership is transferred
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // Event emitted when a role is granted
    event RoleGranted(address indexed user, Role role);

    // Event emitted when a role is revoked
    event RoleRevoked(address indexed user, Role role);

    // Modifier to restrict access to ADMIN only
    modifier onlyAdmin() {
        require(userRoles[msg.sender] == Role.ADMIN, "Caller is not an admin");
        _;
    }

    // Modifier to restrict access to ACCOUNTANT or ADMIN
    modifier onlyAccountantOrAdmin() {
        require(
            userRoles[msg.sender] == Role.ACCOUNTANT || userRoles[msg.sender] == Role.ADMIN,
            "Caller is not an accountant or admin"
        );
        _;
    }

    // Modifier to restrict access to AUDITOR or ADMIN
    modifier onlyAuditorOrAdmin() {
        require(
            userRoles[msg.sender] == Role.AUDITOR || userRoles[msg.sender] == Role.ADMIN,
            "Caller is not an auditor or admin"
        );
        _;
    }

    // Modifier to restrict access to the owner only
    modifier onlyOwner() {
        require(owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    // Grant a role to a user (only callable by ADMIN)
    function grantRole(address user, Role role) external onlyAdmin {
        userRoles[user] = role;
        emit RoleGranted(user, role);
    }

    // Revoke a role from a user (only callable by ADMIN)
    function revokeRole(address user) external onlyAdmin {
        Role currentRole = userRoles[user];
        userRoles[user] = Role.NONE; // Reset to NONE
        emit RoleRevoked(user, currentRole);
    }

    // Constructor that sets the initial admin
    constructor() {
        owner = msg.sender; // Directly set the owner
        emit OwnershipTransferred(address(0), msg.sender);
        userRoles[msg.sender] = Role.ADMIN;
        emit RoleGranted(msg.sender, Role.ADMIN);
    }

    // Function to transfer ownership (only callable by the current owner)
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function hasAdminRole(address user) external view returns (bool) {
        return userRoles[user] == Role.ADMIN;
    }

    function hasAccountantRole(address user) external view returns (bool) {
        return userRoles[user] == Role.ACCOUNTANT;
    }

    function hasAuditorRole(address user) external view returns (bool) {
        return userRoles[user] == Role.AUDITOR;
    }
}