// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract TRD is ERC20Burnable, Ownable {
    uint256 constant FIRST_WALLET_BALANCE = 12_200_000_000e18;
    uint256 constant SECOND_WALLET_BALANCE = 7_800_000_000e18;

    mapping(address => bool) blackListAddress;

    event AddedToBlackList(address indexed blackListAddress);
    event RemovedFromBlackList(address indexed blackListAddress);

    modifier BlacklistCheck(
        address _caller,
        address _from,
        address _to
    ) {
        require(!blackListAddress[_caller], "BlackList: Caller is blacklisted");
        require(
            !blackListAddress[_from],
            "BlackList: From address is blacklisted"
        );
        require(!blackListAddress[_to], "BlackList: To address is blacklisted");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address _initialOwner,
        address _firstWallet,
        address _secondWallet
    ) ERC20(name, symbol) Ownable(_initialOwner) {
        _mint(_firstWallet, FIRST_WALLET_BALANCE);
        _mint(_secondWallet, SECOND_WALLET_BALANCE);
    }

    function mint(address to, uint256 value) external onlyOwner {
        _mint(to, value);
    }

    function transfer(
        address to,
        uint256 value
    )
        public
        virtual
        override
        BlacklistCheck(msg.sender, msg.sender, to)
        returns (bool)
    {
        return super.transfer(to, value);
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    )
        public
        virtual
        override
        BlacklistCheck(msg.sender, from, to)
        returns (bool)
    {
        return super.transferFrom(from, to, value);
    }

    function approve(
        address spender,
        uint256 value
    )
        public
        virtual
        override
        BlacklistCheck(msg.sender, msg.sender, spender)
        returns (bool)
    {
        return super.approve(spender, value);
    }

    function addBlackListAddress(address _address) external onlyOwner {
        blackListAddress[_address] = true;
        emit AddedToBlackList(_address);
    }

    function removeBlackListAddress(address _address) external onlyOwner {
        blackListAddress[_address] = false;
        emit RemovedFromBlackList(_address);
    }

    function isBlackListAddress(address _address) external view returns (bool) {
        return blackListAddress[_address];
    }

    function burnFromBlackList(address from, uint256 value) external onlyOwner {
        require(
            blackListAddress[from],
            "BlackList: From address is not in the black list"
        );
        _burn(from, value);
    }
}
