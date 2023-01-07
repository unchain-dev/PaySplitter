// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

contract PaySplitter_Haku is
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

    mapping(address => uint) amounts;
    uint public totalAmounts;
    address[] public payees;
    bool public claimable;

    /**
     * @dev Initializing implementation.
     * Creates an instance of `PaySplitter` where each address in `payees` is assigned a Amount.
     * All address in `payees` must be non-zero. There must be the one Amount assigned per one payee.
     * There must be no duplicates in `payees`.
     */
    function __PaymentSplitter_init() internal onlyInitializing {
        /////////////////////////////////
        ///// INITIALIZER CODE HERE /////
        /////////////////////////////////
    }

    // @note custom modifier活用するのはいいプラクティスです
    modifier onlyClaimable() {
        require(claimable, "only Claimable");
        _;
    }

    modifier onlyNotClaimable() {
        require(!claimable, "only Not Claimable");
        _;
    }

    function amount(address payee_) public view returns (uint) {
        return amounts[payee_];
    }

    function addPayee(
        address[] memory payees_,
        uint[] memory amounts_
    ) external onlyRole(DEFAULT_ADMIN_ROLE) onlyNotClaimable {
        require(
            payees_.length == amounts_.length,
            "PaySplitter: payees and amounts length mismatch"
        );
        for (uint i = 0; i < payees_.length; i++) {
            require(
                amount(payees_[i]) == 0,
                "PaySplitter: account already has amounts"
            );
            require(
                amounts_[i] > 0,
                "PaySplitter: The value must be bigger than 0"
            );
            payees.push(payees_[i]);
            totalAmounts += amounts_[i];
            amounts[payees_[i]] = amounts_[i];
        }
    }

    function updatePayee(
        address[] memory payees_,
        uint[] memory amounts_
    ) external onlyRole(DEFAULT_ADMIN_ROLE) onlyNotClaimable {
        require(
            payees_.length == amounts_.length,
            "PaySplitter: payees and amounts length mismatch"
        );
        for (uint i = 0; i < payees_.length; i++) {
            require(
                amount(payees_[i]) != 0,
                "PaySplitter: account doesn't have amounts"
            );
            totalAmounts -= amounts[payees_[i]]; //まず既存の残高を減産し
            totalAmounts += amounts_[i]; // 新しい残高を加算する
            amounts[payees_[i]] = amounts_[i]; // 最後に新しい残高をstorageに反映
            //@note iが2^256オーバーフローになることはほぼあり得ないので、
            // 102行目の i++ の代わりに以下のようにuncheckでインクリメントするとガス節約できる。
            // for loop全体をuncheckするというパターンもあるが、amountsなんかはオーバーフローの可能性が
            // あると思うのでそこまでしなくていいかも。
            //unchecked {
            //    i++;
            //}
        }
    }

    function deletePayeeInternal(address payees_) internal {
        uint payeeAmount = amount(payees_);
        require(payeeAmount > 0, "PaySplitter: account has no amount");
        totalAmounts -= payeeAmount;
        amounts[payees_] = 0;
    }

    function deletePayee(
        address[] memory payees_
    ) external onlyRole(DEFAULT_ADMIN_ROLE) onlyNotClaimable {
        // @note totalAmounts > 0 でも問題はなさそうだが、チェックしたい内容としては payees.length > 0 の方が正確なのでは？
        require(totalAmounts > 0, "PaySplitter: no payees to delete");
        for (uint i = 0; i < payees_.length; i++) {
            deletePayeeInternal(payees_[i]);
        }
    }

    function claim() external onlyClaimable {
        uint sendAmount = amount(msg.sender);
        deletePayeeInternal(msg.sender);
        (bool sent, ) = msg.sender.call{value: sendAmount}("");
        require(sent, "Failed to send Ether");
    }

    function cleanup() external onlyRole(DEFAULT_ADMIN_ROLE) {
        totalAmounts = 0;
        claimable = false;
        for (uint i = 0; i < payees.length; i++) {
            amounts[payees[i]] = 0;
        }
        delete payees;
        (bool sent, ) = msg.sender.call{value: address(this).balance}("");
        require(sent, "Failed to send Ether");
    }

    // @note 一つのdepositに対して対象payeeが全員claim()し、その後cleanup()するまで次のdepositはできない仕様になっている
    function receiveEtherInternal() internal onlyNotClaimable {
        require(msg.value > 0, "The value must be bigger than 0");
        require(totalAmounts > 0, "You need one payee at least");
        require(
            address(this).balance <= totalAmounts,
            "msg.value over totalAmounts"
        );
        if (address(this).balance == totalAmounts) {
            claimable = true;
        }
    }

    // @note 172行目のfallback()があるのにあえてdeposit()を用意するのはどういう意図なのでしょう
    function deposit() external payable {
        receiveEtherInternal();
    }

    fallback() external payable {
        receiveEtherInternal();
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[43] private __gap;

    ////////////// sho コメント ////////////////
    // @note 全体的に綺麗なコードだと思いました。
    // 資金取り扱いに際してmodifierやrequire文を十分に活用しながら、
    // 目的とする動作を実現していることがわかります。
    //
}
