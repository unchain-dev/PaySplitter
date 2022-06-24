// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
// import "./PaymentSplitterUpgradeableCustom.sol";
import "hardhat/console.sol";

contract PaySplitter is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    event PayeeAdded(address account, uint256 weights);
    event PaymentReleased(address to, uint256 amount);
    event PaymentReceived(address from, uint256 amount);

    uint256 private _totalWeights;
    uint256 private _totalReleased;

    struct Payee {
        uint256 weight;
        uint256 balance;
    }

    mapping(address => Payee) private _payee;
    address[] private _payeesList;

    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address[] memory payees, uint256[] memory weight_) {
        initialize(payees, weight_);
    }

    function initialize(address[] memory payees, uint256[] memory weight_)
        public
        initializer
    {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        __PaymentSplitter_init(payees, weight_);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    {}

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function deposit() public payable {
        uint256 depositValue = msg.value;
        uint256 depositLeft = depositValue;
        uint256 payeeLen = _payeesList.length;
        uint256 tempBalance;

        require(depositValue > 0, "The value must be bigger than 0");
        require(payeeLen > 0, "You need one payee at least");

        for (uint256 i = 0; i < payeeLen; i++) {
            if (i == payeeLen - 1) {
                _payee[_payeesList[i]].balance += depositLeft;
            } else {
                tempBalance =
                    (depositValue * _payee[_payeesList[i]].weight) /
                    _totalWeights;
                _payee[_payeesList[i]].balance += tempBalance;
                depositLeft -= tempBalance;
            }
        }
    }

    /**
     * @dev Creates an instance of `PaySplitter` where each account in `payees` is assigned the number of weights at
     * the matching position in the `weights` array.
     *
     * All addresses in `payees` must be non-zero. Both arrays must have the same non-zero length, and there must be no
     * duplicates in `payees`.
     */
    function __PaymentSplitter_init(
        address[] memory payees,
        uint256[] memory weight_
    ) internal onlyInitializing {
        addPayee(payees, weight_);
    }

    function addPayee(address[] memory payees, uint256[] memory weight_)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(
            payees.length == weight_.length,
            "PaySplitter: payees and weights length mismatch"
        );
        require(payees.length > 0, "PaySplitter: no payees");

        for (uint256 i = 0; i < payees.length; i++) {
            _addPayee(payees[i], weight_[i]);
        }
    }

    /**
     * @dev Add a new payee to the contract.
     * @param account The address of the payee to add.
     * @param weight_ The number of weights owned by the payee.
     */
    function _addPayee(address account, uint256 weight_) private {
        require(
            account != address(0),
            "PaySplitter: account is the zero address"
        );
        require(
            weight_ > 0 && weight_ <= 10000,
            "PaySplitter: 0 < weight <= 10000"
        );
        require(
            _payee[account].weight == 0,
            "PaySplitter: account already has weights"
        );

        _payeesList.push(account);
        _payee[account].weight = weight_;
        _totalWeights += weight_;
        emit PayeeAdded(account, weight_);
    }

    function deletePayee(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 payeesLen = _payeesList.length;

        require(payeesLen > 0, "PaySplitter: no payees");
        require(
            _payee[account].balance == 0,
            "PaySplitter: There is balance in the account"
        );
        require(
            _payee[account].weight > 0,
            "PaySplitter: account has no weights"
        );
        _deleteAddress(account, payeesLen);
        _totalWeights -= _payee[account].weight;
        delete _payee[account];
    }

    // unordered
    function _deleteAddress(address account, uint256 payeesLen) private {
        for (uint256 i = 0; i < payeesLen; i++) {
            if (_payeesList[i] == account) {
                _payeesList[i] = _payeesList[payeesLen - 1];
                _payeesList.pop();
                break;
            }
        }
    }

    /**
     * @dev The Ether received will be logged with {PaymentReceived} events. Note that these events are not fully
     * reliable: it's possible for a contract to receive Ether without triggering this function. This only affects the
     * reliability of the events, and not the actual splitting of Ether.
     *
     * To learn more about this see the Solidity documentation for
     * https://solidity.readthedocs.io/en/latest/contracts.html#fallback-function[fallback
     * functions].
     */
    receive() external payable virtual {
        deposit();
        emit PaymentReceived(_msgSender(), msg.value);
    }

    /**
     * @dev Getter for the total weights held by payees.
     */
    function totalWeights() public view returns (uint256) {
        return _totalWeights;
    }

    /**
     * @dev Getter for the amount of weights held by an account.
     */
    function weight(address account) public view returns (uint256) {
        return _payee[account].weight;
    }

    /**
     * @dev Getter for the address of the payee number `index`.
     */
    function payee(uint256 index) public view returns (address) {
        return _payeesList[index];
    }

    function totalBalance() public view returns (uint256) {
        return (address(this).balance);
    }

    function balance(address account) public view returns (uint256) {
        return (_payee[account].balance);
    }

    /**
     * @dev Triggers a transfer to `account` of the amount of Ether they are owed, according to their percentage of the
     * total weights and their previous withdrawals.
     */
    function release() public virtual {
        address payable account = payable(msg.sender);
        require(
            _payee[account].weight > 0,
            "PaySplitter: account has no weights"
        );

        uint256 payment = _payee[account].balance;

        require(payment != 0, "PaySplitter: account is not due payment");

        AddressUpgradeable.sendValue(account, payment);
        _payee[account].balance = 0;
        emit PaymentReleased(account, payment);
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[43] private __gap;
}
