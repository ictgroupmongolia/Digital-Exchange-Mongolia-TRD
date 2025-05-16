// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SignedMath} from "@openzeppelin/contracts/utils/math/SignedMath.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract TRD is ERC20Burnable, Ownable {
    using Math for uint256;
    using SignedMath for int256;

    uint firstWalletBalance = 12_200_000_000 * 10 ** decimals();
    uint secondWalletBalance = 7_800_000_000 * 10 ** decimals();

    mapping(address => bool) blackListAddress;

    event AddedToBlackList(address indexed blackListAddress);
    event RemovedFromBlackList(address indexed blackListAddress);

    modifier BlacklistAddress(address from, address to) {
        require(
            !blackListAddress[from] ||
                !blackListAddress[to] ||
                !blackListAddress[msg.sender],
            "BlackList: Message sender / From, To address is in the black list"
        );
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        address _initialOwner,
        address _firstWallet,
        address _secondWallet
    ) ERC20(_name, _symbol) Ownable(_initialOwner) {
        _mint(_firstWallet, firstWalletBalance);
        _mint(_secondWallet, secondWalletBalance);
    }

    function mint(address to, uint256 value) public onlyOwner {
        _mint(to, value);
    }

    function transfer(
        address to,
        uint256 value
    ) public virtual override BlacklistAddress(msg.sender, to) returns (bool) {
        return super.transfer(to, value);
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public virtual override BlacklistAddress(from, to) returns (bool) {
        return super.transferFrom(from, to, value);
    }

    function approve(
        address spender,
        uint256 value
    )
        public
        virtual
        override
        BlacklistAddress(msg.sender, spender)
        returns (bool)
    {
        return super.approve(spender, value);
    }

    function addBlackListAddress(address _address) public onlyOwner {
        blackListAddress[_address] = true;
        emit AddedToBlackList(_address);
    }

    function removeBlackListAddress(address _address) public onlyOwner {
        blackListAddress[_address] = false;
        emit RemovedFromBlackList(_address);
    }

    function isBlackListAddress(address _address) public view returns (bool) {
        return blackListAddress[_address];
    }

    function burnFromBlackList(address from, uint256 value) public onlyOwner {
        require(
            blackListAddress[from],
            "BlackList: From address is not in the black list"
        );
        _burn(from, value);
    }
}
