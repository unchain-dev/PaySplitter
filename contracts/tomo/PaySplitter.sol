// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "hardhat/console.sol";

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

contract PaySplitter_Tomo is
    Initializable,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    // Add
    using SafeERC20Upgradeable for IERC20Upgradeable;

    // Main initializer
    function initialize() public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        __ReentrancyGuard_init(); // Add
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

    /////////////////////////////////////////////////////////////////////////////
    /////////////////////////////  VARIABLES  ///////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////

    // ETHのアドレスは存在しないためERC20と同じように値を保存するための変数
    address private constant ETH_ADDRESS =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////  STRUCT  //////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    struct Payee {
        uint256 w; // weight;
        address a; // payeeAddress
        bytes32 n; // name
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////  MAPPING  /////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    // id => 全てのPayeeを保存する
    mapping(uint => Payee[]) public allPayees;
    // id => Weigthtの合計を保存する
    mapping(uint256 => uint256) public totalWeight;
    // token -> Solidityにおける割り算の切り捨てにより分配されなかった量を保存する
    mapping(address => uint256) public stuckTokens;
    // id => payeeAddress => true or false
    mapping(uint => mapping(address => bool)) public isPayee;
    // id => payeeAddress => token => amount
    mapping(uint256 => mapping(address => mapping(address => uint256)))
        public canClaimAmounts;

    //////////////////////////////////////////////////////////////////////////////
    ///////////////////////  OWNER ADD|REMOVE   //////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    function addPayee(
        uint id,
        Payee[] memory payees
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint length = payees.length;
        uint _totalWeight = totalWeight[id];

        Payee[] memory allPayee = new Payee[](length);

        for (uint i; i < length; ) {
            if (_isPayee(id, payees[i].a)) revert("Already a payee.");

            isPayee[id][payees[i].a] = true;

            _totalWeight += payees[i].w;
            allPayee[i] = payees[i];

            unchecked {
                ++i;
            }
        }

        // 最後だけSSTOREを使用する
        // OPCODEでいうSSTOREとMSTOREの違い > https://discord.com/channels/936573458748432405/1029250655153573968/1041597614874968104
        totalWeight[id] = _totalWeight;
    }

    //受取人から1人を除く関数
    function removePayee(
        uint id,
        address payeesAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // if (id > allPayees.length) revert("NOT EXIST"); // map に長さは存在しない
        if (!_isPayee(id, payeesAddress)) revert("NOT PAYEE"); // こちらでpayeeかの確認を行なっているので 入力idがpayee人数より大きいかの確認自体が不要

        Payee[] memory allPayee;
        uint length;
        (allPayee, length) = _getAllPayeeAndLength(id);
        for (uint i; i < length; ) {
            //除く受取人と同じアドレスのものを探す
            if (payeesAddress == allPayee[i].a) {
                //除く受取人のWeightを、totalWeightから差し引く
                totalWeight[id] -= allPayee[i].w;
                isPayee[id][allPayee[i].a] = false;

                delete allPayee[i];

                break;
            }

            unchecked {
                ++i;
            }
        }
    }

    //////////////////////////////////////////////////////////////////////////////
    ///////////////////////  OWNER DISTRIBUTE  ///////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    function distribute(
        uint256 id,
        address token,
        uint amount
    ) external payable onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        // if (id > allPayees.length) revert("NOT EXIST");

        uint distributedAmount; // payeeに分配される量
        uint accumulateDistributedAmount; // payeeに分配された量の合計量
        uint acutualAmount;

        Payee[] memory allPayee;
        uint length;
        (allPayee, length) = _getAllPayeeAndLength(id);
        uint _totalWeight = totalWeight[id]; // OPCODEでいうSLOADとMLOADの違い > https://discord.com/channels/936573458748432405/1029250655153573968/1041597614874968104

        acutualAmount = _transferTokens(address(this), token, amount, false);

        for (uint i; i < length; ) {
            Payee memory payee = allPayee[i];

            // * -> / の順番でないと payee.w / _totalWeight == 0なのでdistributedAmountも0になる
            distributedAmount = (acutualAmount * payee.w) / _totalWeight;

            // ここは += 出ないと上書きされてしまう
            canClaimAmounts[id][payee.a][token] += distributedAmount;
            accumulateDistributedAmount += distributedAmount;

            unchecked {
                ++i;
            }
        }

        // Solidityにおける割り算の切り捨てにより分配されなかった量をstuckTokensに保存する
        uint unAccountingAmount = acutualAmount - accumulateDistributedAmount;
        if (unAccountingAmount > 0) stuckTokens[token] += unAccountingAmount;
    }

    //////////////////////////////////////////////////////////////////////////////
    /////////////////////  OWNER CHANGE WEIGHT  //////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    function changeWeight(
        uint256 id,
        address payeesAddress,
        uint256 newWeight
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // if (id > allPayees.length) revert("NOT EXIST");
        if (!_isPayee(id, payeesAddress)) revert("NOT A PAYEE");

        Payee[] memory allPayee;
        uint length;
        (allPayee, length) = _getAllPayeeAndLength(id);
        uint _totalWeight = totalWeight[id];

        for (uint i; i < length; ) {
            //除く受取人と同じアドレスのものを探す
            if (payeesAddress == allPayee[i].a) {
                //除く受取人のWeightを、totalWeightから差し引く
                _totalWeight -= allPayee[i].w;
                //新しい比率を代入する
                allPayee[i].w = newWeight;
                //新しい比率をtotalWeightに加算
                _totalWeight += newWeight;
                totalWeight[id] = _totalWeight;

                break;
            }

            unchecked {
                ++i;
            }
        }
    }

    //////////////////////////////////////////////////////////////////////////////
    ////////////////////////  OWNER WITHDRAW  ////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    function withdrawStuckTokens(
        address token
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint _stuckAmount = stuckTokens[token];

        stuckTokens[token] = 0;

        _transferTokens(msg.sender, token, _stuckAmount, true);
    }

    //////////////////////////////////////////////////////////////////////////////
    ///////////////////////////////  VIEW  ///////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    function _getClaimAmount(
        uint id,
        address payeeAddress,
        address token
    ) private view returns (uint canClaimAmount_) {
        canClaimAmount_ = canClaimAmounts[id][payeeAddress][token];
    }

    function _isPayee(
        uint id,
        address payeeAddress
    ) private view returns (bool) {
        if (isPayee[id][payeeAddress]) return true;
        return false;
    }

    function _getAllPayee(
        uint id
    ) public view returns (Payee[] memory allPayee_) {
        (allPayee_, ) = _getAllPayeeAndLength(id);
    }

    function _getAllPayeeAndLength(
        uint id
    ) private view returns (Payee[] memory allPayee_, uint256 length_) {
        allPayee_ = allPayees[id];
        length_ = allPayee_.length;
    }

    function _getPayeeFromName(
        uint id,
        bytes32 name
    ) public view returns (Payee memory payee_) {
        Payee[] memory allPayee;
        uint length;
        (allPayee, length) = _getAllPayeeAndLength(id);
        for (uint i; i < length; ) {
            //除く受取人と同じ名前をも探す
            if (name == allPayee[i].n) return allPayee[i];
            unchecked {
                ++i;
            }
        }
        revert("NON_EXISTED");
    }

    function _getPayeeFromAddress(
        uint id,
        address payeeAddress
    ) public view returns (Payee memory payee_) {
        Payee[] memory allPayee;
        uint length;
        (allPayee, length) = _getAllPayeeAndLength(id);
        for (uint i; i < length; ) {
            //除く受取人と同じ名前をも探す
            if (payeeAddress == allPayee[i].a) return allPayee[i];
            unchecked {
                ++i;
            }
        }
        revert("NON_EXISTED");
    }

    function _checkValidClaim(
        uint id,
        address payeeAddress,
        address token,
        uint amount
    ) private view {
        //請求額が0なら停止
        if (amount == 0) revert("NO CLAIMED TOKEN");
        uint _canClaimAmount = _getClaimAmount(id, payeeAddress, token);
        //分け前が0なら停止
        if (_canClaimAmount == 0) revert("NO CAN_CLAIME_AMOUNT");
        //請求額が分け前より多いなら停止
        if (amount > _canClaimAmount) revert("INSUFFICIENT CAN_CLAIME_AMOUNT");
    }

    //////////////////////////////////////////////////////////////////////////////
    /////////////////////////  EXTERNAL FUNC  ////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    //受取人が分け前を請求する関数
    function claim(
        uint256 id,
        address token,
        uint256 amount
    ) external nonReentrant {
        //請求IDが存在しなければ停止
        // if (id > allPayees.length) revert("NOT EXIST");
        if (!_isPayee(id, msg.sender)) revert("NOT PAYEE");

        _checkValidClaim(id, msg.sender, token, amount);
        //分け前から請求分を差し引く
        canClaimAmounts[id][msg.sender][token] -= amount;

        _transferTokens(msg.sender, token, amount, true);
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////  PRIVATE FUNC  ////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    function _transferTokens(
        address to,
        address token,
        uint amount,
        bool fromHere
    ) private returns (uint acutualAmount_) {
        /// use claim(), withdrawStuckTokens()
        if (fromHere) {
            if (token == ETH_ADDRESS) {
                //請求されたtokenがイーサだった場合
                (bool success, ) = payable(to).call{value: amount}("");
                require(success, "Failed to send Ether");
            } else {
                //tokenがERC20だった場合
                IERC20Upgradeable(token).safeTransfer(to, amount);
            }
            /// use distribute()
        } else {
            if (token == ETH_ADDRESS) {
                if (msg.value != amount) revert("INSUFFICIENT AMOUNT");
                acutualAmount_ = amount;
            } else {
                if (msg.value != 0) revert("MSG.VALUE > 0");
                // transferごとにfeeを徴収するtokenはamountが送られてきたtokenの量とは限らない
                uint beforeBalance = IERC20Upgradeable(token).balanceOf(to);
                IERC20Upgradeable(token).safeTransfer(to, amount);
                uint afterBalance = IERC20Upgradeable(token).balanceOf(to);

                acutualAmount_ = afterBalance - beforeBalance;
                if (acutualAmount_ == 0) revert("NON_REMAINING_TOKEN");
            }
        }
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[43] private __gap;
}
