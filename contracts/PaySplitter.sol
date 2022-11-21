// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

contract PaySplitter is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    // Main initializer
    function initialize() public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        __PaymentSplitter_init();
    }

    // For use if contract implementation must be updated later
    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // This function override is required by Solidity.
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Initializing implementation.
     * Creates an instance of `PaySplitter` where each address in `payees` is assigned a weight.
     * All address in `payees` must be non-zero. There must be the one weight assigned per one payee.
     * There must be no duplicates in `payees`.
     */
    function __PaymentSplitter_init() internal onlyInitializing {
        /////////////////////////////////
        ///// INITIALIZER CODE HERE /////
        /////////////////////////////////
    }

    //////////////////////////////////////
    ///// IMPLEMENT PAYSPLITTER HERE /////
    //////////////////////////////////////

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[43] private __gap;
}
