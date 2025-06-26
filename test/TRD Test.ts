import {
	time,
	loadFixture,
} from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { expect } from 'chai'
import hre, { ethers } from 'hardhat'

const name = 'Trade.mn'
const symbol = 'TRD'

describe('TRD Test Cases', function () {
	// We define a fixture to reuse the same setup in every test.
	// We use loadFixture to run this setup once, snapshot that state,
	// and reset Hardhat Network to that snapshot in every test.
	async function deployTRD() {

		// Contracts are deployed using the first signer/account by default
		const [owner, firstWallet, secondWallet, receiver] = await hre.ethers.getSigners()
		const TRD = await hre.ethers.getContractFactory('TRD')
		const trd = await TRD.deploy(name, symbol, owner.address, firstWallet.address, secondWallet.address)

		return { trd, owner, firstWallet, secondWallet, receiver }
	}

	describe('Deployment', function () {
		it('Should set the right owner', async function () {
			const { trd, owner } = await loadFixture(deployTRD)
			expect(await trd.owner()).to.equal(owner.address)
		})

		it('Should have correct name', async function () {
			const { trd } = await loadFixture(deployTRD)
			expect(await trd.name()).to.equal(name)
		})

		it('Should have correct symbol', async function () {
			const { trd } = await loadFixture(deployTRD)
			expect(await trd.symbol()).to.equal(symbol)
		})
		it('Should have correct total supply', async function () {
			const { trd } = await loadFixture(deployTRD)
			expect(await trd.totalSupply()).to.equal(ethers.parseEther('20000000000'))
		})
		it('Should have correct address balance', async function () {
			const { trd, firstWallet, secondWallet } = await loadFixture(deployTRD)
			expect(await trd.balanceOf(firstWallet.address)).to.equal(ethers.parseEther('12200000000'))
			expect(await trd.balanceOf(secondWallet.address)).to.equal(ethers.parseEther('7800000000'))
		})
	})

	describe('Minting', function () {
		it('Should be able to mint tokens from owner address', async function () {
			const { trd, owner, receiver } = await loadFixture(deployTRD)
			await expect(await trd.connect(owner).mint(receiver.address, ethers.parseEther('1000000000'))).
				to.emit(trd, 'Transfer').withArgs(ethers.ZeroAddress, receiver.address, ethers.parseEther('1000000000'))
			expect(await trd.totalSupply()).to.equal(ethers.parseEther('21000000000'))
		})
		it('Should not be able to mint tokens from non owner address', async function () {
			const { trd, firstWallet, receiver } = await loadFixture(deployTRD)
			await expect(trd.connect(firstWallet).mint(receiver.address, ethers.parseEther('1000000000'))).
				to.revertedWithCustomError(trd, 'OwnableUnauthorizedAccount')
		})
	})

	describe('BlackList', function () {
		it('Owner should be able to add to black list', async function () {
			const { trd, owner, firstWallet } = await loadFixture(deployTRD)
			await expect(await trd.connect(owner).addBlackListAddress(firstWallet.address)).
				to.emit(trd, 'AddedToBlackList').withArgs(firstWallet.address)
			expect(await trd.isBlackListAddress(firstWallet.address)).to.equal(true)
		})
		it('Owner should be able to remove from black list', async function () {
			const { trd, owner, firstWallet } = await loadFixture(deployTRD)
			await expect(await trd.connect(owner).addBlackListAddress(firstWallet.address)).
				to.emit(trd, 'AddedToBlackList').withArgs(firstWallet.address)
			expect(await trd.isBlackListAddress(firstWallet.address)).to.equal(true)
			await expect(await trd.connect(owner).removeBlackListAddress(firstWallet.address)).
				to.emit(trd, 'RemovedFromBlackList').withArgs(firstWallet.address)
			expect(await trd.isBlackListAddress(firstWallet.address)).to.equal(false)
		})
	})


	describe('Burn', function () {
		it('Should be able to burn from own balance', async function () {
			const { trd, firstWallet } = await loadFixture(deployTRD)
			await expect(await trd.connect(firstWallet).burn(ethers.parseEther('12200000000'))).
				to.emit(trd, 'Transfer').withArgs(firstWallet.address, ethers.ZeroAddress, ethers.parseEther('12200000000'))
			expect(await trd.totalSupply()).to.equal(ethers.parseEther('7800000000'))
			expect(await trd.balanceOf(firstWallet.address)).to.equal(ethers.parseEther('0'))
		})
		it('Should be able to burn from own balance when address is blacklisted', async function () {
			const { trd, owner, firstWallet } = await loadFixture(deployTRD)
			await expect(await trd.connect(owner).addBlackListAddress(firstWallet.address)).
				to.emit(trd, 'AddedToBlackList').withArgs(firstWallet.address)
			await expect(await trd.connect(firstWallet).burn(ethers.parseEther('12200000000'))).
				to.emit(trd, 'Transfer').withArgs(firstWallet.address, ethers.ZeroAddress, ethers.parseEther('12200000000'))
			expect(await trd.totalSupply()).to.equal(ethers.parseEther('7800000000'))
			expect(await trd.balanceOf(firstWallet.address)).to.equal(ethers.parseEther('0'))
		})
		it('Should be able to burn from former blacklist address', async function () {
			const { trd, owner, firstWallet } = await loadFixture(deployTRD)
			await expect(await trd.connect(owner).addBlackListAddress(firstWallet.address)).
				to.emit(trd, 'AddedToBlackList').withArgs(firstWallet.address)
			await expect(await trd.connect(firstWallet).burn(ethers.parseEther('12000000000'))).
				to.emit(trd, 'Transfer').withArgs(firstWallet.address, ethers.ZeroAddress, ethers.parseEther('12000000000'))
			expect(await trd.totalSupply()).to.equal(ethers.parseEther('8000000000'))
			expect(await trd.balanceOf(firstWallet.address)).to.equal(ethers.parseEther('200000000'))
			await expect(await trd.connect(owner).removeBlackListAddress(firstWallet.address)).
				to.emit(trd, 'RemovedFromBlackList').withArgs(firstWallet.address)
			await expect(await trd.connect(firstWallet).burn(ethers.parseEther('200000000'))).
				to.emit(trd, 'Transfer').withArgs(firstWallet.address, ethers.ZeroAddress, ethers.parseEther('200000000'))
			expect(await trd.totalSupply()).to.equal(ethers.parseEther('7800000000'))
			expect(await trd.balanceOf(firstWallet.address)).to.equal(ethers.parseEther('0'))
		})
		it('Should be able to burn from approved address balance', async function () {
			const { trd, firstWallet, receiver } = await loadFixture(deployTRD)
			await expect(await trd.connect(firstWallet).approve(receiver.address, ethers.parseEther('12000000000'))).
				to.emit(trd, 'Approval').withArgs(firstWallet.address, receiver.address, ethers.parseEther('12000000000'))
			await expect(await trd.connect(receiver).burnFrom(firstWallet.address, ethers.parseEther('12000000000'))).
				to.emit(trd, 'Transfer').withArgs(firstWallet.address, ethers.ZeroAddress, ethers.parseEther('12000000000'))
			expect(await trd.totalSupply()).to.equal(ethers.parseEther('8000000000'))
			expect(await trd.balanceOf(firstWallet.address)).to.equal(ethers.parseEther('200000000'))
		})
		it('Should be able to burn from former approved address balance', async function () {
			const { trd, firstWallet, receiver } = await loadFixture(deployTRD)
			await expect(await trd.connect(firstWallet).approve(receiver.address, ethers.parseEther('12000000000'))).
				to.emit(trd, 'Approval').withArgs(firstWallet.address, receiver.address, ethers.parseEther('12000000000'))
			await expect(await trd.connect(receiver).burnFrom(firstWallet.address, ethers.parseEther('10000000000'))).
				to.emit(trd, 'Transfer').withArgs(firstWallet.address, ethers.ZeroAddress, ethers.parseEther('10000000000'))
			expect(await trd.totalSupply()).to.equal(ethers.parseEther('10000000000'))
			expect(await trd.balanceOf(firstWallet.address)).to.equal(ethers.parseEther('2200000000'))
			await expect(await trd.connect(firstWallet).approve(receiver.address, ethers.parseEther('0'))).
				to.emit(trd, 'Approval').withArgs(firstWallet, receiver.address, ethers.parseEther('0'))
			await expect(trd.connect(receiver).burnFrom(firstWallet.address, ethers.parseEther('10000000000'))).
				to.revertedWithCustomError(trd, 'ERC20InsufficientAllowance')
		})
	})
	describe('Approval', function () {
		it('Should not be able to approve when message sender is blacklisted address', async function () {
			const { trd, owner, firstWallet, receiver } = await loadFixture(deployTRD)
			await expect(await trd.connect(owner).addBlackListAddress(firstWallet.address)).
				to.emit(trd, 'AddedToBlackList').withArgs(firstWallet.address)
			await expect(trd.connect(firstWallet).approve(receiver.address, ethers.parseEther('12000000000'))).
				to.revertedWith('BlackList: Caller is blacklisted')
		})
		it('Should not be able to approve blacklisted address', async function () {
			const { trd, owner, firstWallet, receiver } = await loadFixture(deployTRD)
			await expect(await trd.connect(owner).addBlackListAddress(receiver.address)).
				to.emit(trd, 'AddedToBlackList').withArgs(receiver.address)
			await expect(trd.connect(firstWallet).approve(receiver.address, ethers.parseEther('12000000000'))).
				to.revertedWith('BlackList: To address is blacklisted')
		})
		it('Should be able to approve former blacklisted address', async function () {
			const { trd, owner, firstWallet, receiver } = await loadFixture(deployTRD)
			await expect(await trd.connect(owner).addBlackListAddress(receiver.address)).
				to.emit(trd, 'AddedToBlackList').withArgs(receiver.address)
			await expect(trd.connect(firstWallet).approve(receiver.address, ethers.parseEther('12000000000'))).
				to.revertedWith('BlackList: To address is blacklisted')
			await expect(await trd.connect(owner).removeBlackListAddress(receiver.address)).
				to.emit(trd, 'RemovedFromBlackList').withArgs(receiver.address)
			await expect(await trd.connect(firstWallet).approve(receiver.address, ethers.parseEther('12000000000'))).
				to.emit(trd, 'Approval').withArgs(firstWallet.address, receiver.address, ethers.parseEther('12000000000'))
		})
	})
	describe('Withdrawals', function () {
		describe('Transfer', function () {
			it('Should be able to transfer to receiver', async function () {
				const { trd, firstWallet, receiver } = await loadFixture(deployTRD)
				await expect(await trd.connect(firstWallet).transfer(receiver.address, ethers.parseEther('800000000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-800000000'), ethers.parseEther('800000000')])
			})
			it('Should not be able to transfer when message sender is blacklisted', async function () {
				const { trd, owner, firstWallet, receiver } = await loadFixture(deployTRD)
				await expect(await trd.connect(firstWallet).transfer(receiver.address, ethers.parseEther('800000000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-800000000'), ethers.parseEther('800000000')])
				await expect(await trd.connect(owner).addBlackListAddress(firstWallet.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(firstWallet.address)
				await expect(trd.connect(firstWallet).transfer(receiver.address, ethers.parseEther('800000000'))).
					to.be.revertedWith('BlackList: Caller is blacklisted')
			})
			it('Should be able to transfer when message sender is former blacklisted', async function () {
				const { trd, owner, firstWallet, receiver } = await loadFixture(deployTRD)
				await expect(await trd.connect(firstWallet).transfer(receiver.address, ethers.parseEther('800000000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-800000000'), ethers.parseEther('800000000')])
				await expect(await trd.connect(owner).addBlackListAddress(firstWallet.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(firstWallet.address)
				await expect(trd.connect(firstWallet).transfer(receiver.address, ethers.parseEther('800000000'))).
					to.be.revertedWith('BlackList: Caller is blacklisted')
				await expect(await trd.connect(owner).removeBlackListAddress(firstWallet.address)).
					to.emit(trd, 'RemovedFromBlackList').withArgs(firstWallet.address)
				await expect(await trd.connect(firstWallet).transfer(receiver.address, ethers.parseEther('800000000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-800000000'), ethers.parseEther('800000000')])
			})
			it('Should not be able to transfer when receiver is blacklisted', async function () {
				const { trd, owner, firstWallet, receiver } = await loadFixture(deployTRD)
				await expect(await trd.connect(firstWallet).transfer(receiver.address, ethers.parseEther('800000000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-800000000'), ethers.parseEther('800000000')])
				await expect(await trd.connect(owner).addBlackListAddress(receiver.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(receiver.address)
				await expect(trd.connect(firstWallet).transfer(receiver.address, ethers.parseEther('800000000'))).
					to.be.revertedWith('BlackList: To address is blacklisted')
			})
			it('Should be able to transfer when receiver is former blacklisted', async function () {
				const { trd, owner, firstWallet, receiver } = await loadFixture(deployTRD)
				await expect(await trd.connect(firstWallet).transfer(receiver.address, ethers.parseEther('800000000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-800000000'), ethers.parseEther('800000000')])
				await expect(await trd.connect(owner).addBlackListAddress(receiver.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(receiver.address)
				await expect(trd.connect(firstWallet).transfer(receiver.address, ethers.parseEther('800000000'))).
					to.be.revertedWith('BlackList: To address is blacklisted')
				await expect(await trd.connect(owner).removeBlackListAddress(receiver.address)).
					to.emit(trd, 'RemovedFromBlackList').withArgs(receiver.address)
				await expect(await trd.connect(firstWallet).transfer(receiver.address, ethers.parseEther('800000000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-800000000'), ethers.parseEther('800000000')])
			})
		})
		describe('Transfer from', function () {
			it('Should be able transferfrom others fund', async function () {
				const { trd, firstWallet, secondWallet, receiver } = await loadFixture(deployTRD)
				await expect(await trd.connect(firstWallet).approve(secondWallet.address, ethers.parseEther('800000000'))).
					to.emit(trd, 'Approval').withArgs(firstWallet.address, secondWallet.address, ethers.parseEther('800000000'))
				await expect(trd.connect(secondWallet).transferFrom(firstWallet.address, receiver.address, ethers.parseEther('80000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-80000'), ethers.parseEther('80000')])
			})
			it('Should not be able to transferfrom when message sender is blacklisted', async function () {
				const { trd, owner, firstWallet, secondWallet, receiver } = await loadFixture(deployTRD)
				await expect(await trd.connect(firstWallet).transfer(receiver.address, ethers.parseEther('800000000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-800000000'), ethers.parseEther('800000000')])
				await expect(await trd.connect(firstWallet).approve(secondWallet.address, ethers.parseEther('800000000'))).
					to.emit(trd, 'Approval').withArgs(firstWallet.address, secondWallet.address, ethers.parseEther('800000000'))
				await expect(await trd.connect(owner).addBlackListAddress(secondWallet.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(secondWallet.address)
				await expect(trd.connect(secondWallet).transferFrom(firstWallet.address, receiver.address, ethers.parseEther('800000'))).
					to.be.revertedWith('BlackList: Caller is blacklisted')
			})
			it('Should not be able to transferfrom when from address is blacklisted', async function () {
				const { trd, owner, firstWallet, secondWallet, receiver } = await loadFixture(deployTRD)
				await expect(await trd.connect(firstWallet).approve(secondWallet.address, ethers.parseEther('200000000'))).
					to.emit(trd, 'Approval').withArgs(firstWallet.address, secondWallet.address, ethers.parseEther('200000000'))
				await expect(await trd.connect(secondWallet).transferFrom(firstWallet.address, receiver.address, ethers.parseEther('8000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-8000'), ethers.parseEther('8000')])
				await expect(await trd.connect(owner).addBlackListAddress(firstWallet.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(firstWallet.address)
				await expect(trd.connect(secondWallet).transferFrom(firstWallet.address, receiver.address, ethers.parseEther('200000000'))).
					to.be.revertedWith('BlackList: From address is blacklisted')
			})
			it('Should not be adle to transferfrom when to is blacklisted', async function () {
				const { trd, owner, firstWallet, secondWallet, receiver } = await loadFixture(deployTRD)
				await expect(await trd.connect(firstWallet).approve(secondWallet.address, ethers.parseEther('200000000'))).
					to.emit(trd, 'Approval').withArgs(firstWallet.address, secondWallet.address, ethers.parseEther('200000000'))
				await expect(await trd.connect(secondWallet).transferFrom(firstWallet.address, receiver.address, ethers.parseEther('8000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-8000'), ethers.parseEther('8000')])
				await expect(await trd.connect(owner).addBlackListAddress(receiver.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(receiver.address)
				await expect(trd.connect(secondWallet).transferFrom(firstWallet.address, receiver.address, ethers.parseEther('100')))
					.to.be.revertedWith('BlackList: To address is blacklisted')
			})

			it('Should be able to transferfrom when message sender is former blacklisted', async function () {
				const { trd, owner, firstWallet, secondWallet, receiver } = await loadFixture(deployTRD)
				await expect(await trd.connect(firstWallet).transfer(receiver.address, ethers.parseEther('800000000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-800000000'), ethers.parseEther('800000000')])
				await expect(await trd.connect(firstWallet).approve(secondWallet.address, ethers.parseEther('800000000'))).
					to.emit(trd, 'Approval').withArgs(firstWallet.address, secondWallet.address, ethers.parseEther('800000000'))
				await expect(await trd.connect(owner).addBlackListAddress(secondWallet.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(secondWallet.address)
				await expect(trd.connect(secondWallet).transferFrom(firstWallet.address, receiver.address, ethers.parseEther('800000'))).
					to.be.revertedWith('BlackList: Caller is blacklisted')
				await expect(await trd.connect(owner).removeBlackListAddress(secondWallet.address)).
					to.emit(trd, 'RemovedFromBlackList').withArgs(secondWallet.address)
				await expect(trd.connect(secondWallet).transferFrom(firstWallet.address, receiver.address, ethers.parseEther('80000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-80000'), ethers.parseEther('80000')])
			})
			it('Should be able to transferfrom when from address is blacklisted', async function () {
				const { trd, owner, firstWallet, secondWallet, receiver } = await loadFixture(deployTRD)
				await expect(await trd.connect(firstWallet).approve(secondWallet.address, ethers.parseEther('200000000'))).
					to.emit(trd, 'Approval').withArgs(firstWallet.address, secondWallet.address, ethers.parseEther('200000000'))
				await expect(await trd.connect(secondWallet).transferFrom(firstWallet.address, receiver.address, ethers.parseEther('8000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-8000'), ethers.parseEther('8000')])
				await expect(await trd.connect(owner).addBlackListAddress(firstWallet.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(firstWallet.address)
				await expect(trd.connect(secondWallet).transferFrom(firstWallet.address, receiver.address, ethers.parseEther('200000000'))).
					to.be.revertedWith('BlackList: From address is blacklisted')
				await expect(await trd.connect(owner).removeBlackListAddress(firstWallet.address)).
					to.emit(trd, 'RemovedFromBlackList').withArgs(firstWallet.address)
				await expect(await trd.connect(secondWallet).transferFrom(firstWallet.address, receiver.address, ethers.parseEther('8000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-8000'), ethers.parseEther('8000')])
			})
			it('Should be adle to transferfrom when to is blacklisted', async function () {
				const { trd, owner, firstWallet, secondWallet, receiver } = await loadFixture(deployTRD)
				await expect(await trd.connect(firstWallet).approve(secondWallet.address, ethers.parseEther('200000000'))).
					to.emit(trd, 'Approval').withArgs(firstWallet.address, secondWallet.address, ethers.parseEther('200000000'))
				await expect(await trd.connect(secondWallet).transferFrom(firstWallet.address, receiver.address, ethers.parseEther('8000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-8000'), ethers.parseEther('8000')])
				await expect(await trd.connect(owner).addBlackListAddress(receiver.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(receiver.address)
				await expect(trd.connect(secondWallet).transferFrom(firstWallet.address, receiver.address, ethers.parseEther('100')))
					.to.be.revertedWith('BlackList: To address is blacklisted')
				await expect(await trd.connect(owner).removeBlackListAddress(receiver.address)).
					to.emit(trd, 'RemovedFromBlackList').withArgs(receiver.address)
				await expect(await trd.connect(secondWallet).transferFrom(firstWallet.address, receiver.address, ethers.parseEther('8000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-8000'), ethers.parseEther('8000')])
			})
		})
	})
})
