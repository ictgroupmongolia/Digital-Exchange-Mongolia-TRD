import {
	time,
	loadFixture,
} from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { expect } from 'chai'
import hre, { ethers } from 'hardhat'

const name = 'Trade.mn'
const symbol = 'TRD'

describe('TRD', function () {
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

	describe('Withdrawals', function () {
		describe('Transfer', function () {
			it('Should be able transfer to receiver', async function () {
				const { trd, firstWallet, receiver } = await loadFixture(deployTRD)
				expect(await trd.connect(firstWallet).transfer(receiver.address, ethers.parseEther('800000000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-800000000'), ethers.parseEther('800000000')])
			})

			it('Should be able transfer to transfer others fund', async function () {
				const { trd, firstWallet, secondWallet, receiver } = await loadFixture(deployTRD)
				await expect(trd.connect(firstWallet).transferFrom(secondWallet.address, receiver.address, ethers.parseEther('800000000'))).
					to.be.revertedWithCustomError
			})
		})
	})

	describe('Blacklist', function () {
		describe('Add and remove from black list', function () {
			it('Owner should be able to add to black list', async function () {
				const { trd, owner, firstWallet } = await loadFixture(deployTRD)
				expect(await trd.connect(owner).addBlackListAddress(firstWallet.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(firstWallet.address)
				expect(await trd.isBlackListAddress(firstWallet.address)).to.equal(true)
			})

			it('Owner should be able to remove from black list', async function () {
				const { trd, owner, firstWallet } = await loadFixture(deployTRD)
				expect(await trd.connect(owner).removeBlackListAddress(firstWallet.address)).
					to.emit(trd, 'RemovedFromBlackList').withArgs(firstWallet.address)
				expect(await trd.isBlackListAddress(firstWallet.address)).to.equal(false)
			})
		})
		describe('Transfer from black list', function () {
			it('Should not be able to transfer from black list address', async function () {
				const { trd, owner, firstWallet, secondWallet } = await loadFixture(deployTRD)
				expect(await trd.connect(owner).addBlackListAddress(firstWallet.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(firstWallet.address)
				await expect(trd.connect(firstWallet).transfer(secondWallet.address, ethers.parseEther('800000000'))).
					to.be.revertedWithCustomError
			})
			it('Should not be able to transfer to black list address', async function () {
				const { trd, owner, firstWallet, secondWallet } = await loadFixture(deployTRD)
				expect(await trd.connect(owner).addBlackListAddress(secondWallet.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(secondWallet.address)
				await expect(trd.connect(firstWallet).transfer(secondWallet.address, ethers.parseEther('800000000'))).
					to.be.revertedWithCustomError
			})
		})
		describe('TransferFrom from black list', function () {
			it('Should not be able to transfer when msg.sender is in blacklist', async function () {
				const { trd, owner, firstWallet, secondWallet, receiver } = await loadFixture(deployTRD)

				expect(await trd.connect(firstWallet).transfer(receiver.address, ethers.parseEther('800000000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-800000000'), ethers.parseEther('800000000')])


				expect(await trd.connect(receiver).approve(firstWallet.address, ethers.parseEther('800000000'))).
					to.emit(trd, 'Approval').withArgs(receiver.address, firstWallet.address, ethers.parseEther('800000000'))

				expect(await trd.connect(owner).addBlackListAddress(firstWallet.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(firstWallet.address)

				await expect(trd.connect(firstWallet).transferFrom(receiver.address, secondWallet.address, ethers.parseEther('800000000'))).
					to.be.revertedWithCustomError
			})
			it('Should not be able to transfer from black list address', async function () {
				const { trd, owner, firstWallet, secondWallet } = await loadFixture(deployTRD)
				expect(await trd.connect(firstWallet).approve(owner.address, ethers.parseEther('200000000'))).
					to.emit(trd, 'Approval').withArgs(firstWallet.address, owner.address, ethers.parseEther('200000000'))

				expect(await trd.connect(owner).addBlackListAddress(firstWallet.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(firstWallet.address)

				await expect(trd.connect(owner).transferFrom(firstWallet.address, secondWallet.address, ethers.parseEther('200000000'))).
					to.be.revertedWithCustomError
			})
			it('Should not be able to transfer to black list address', async function () {
				const { trd, owner, firstWallet, secondWallet, receiver } = await loadFixture(deployTRD)

				expect(await trd.connect(firstWallet).transfer(receiver.address, ethers.parseEther('800000000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-800000000'), ethers.parseEther('800000000')])


				expect(await trd.connect(receiver).approve(firstWallet.address, ethers.parseEther('800000000'))).
					to.emit(trd, 'Approval').withArgs(receiver.address, firstWallet.address, ethers.parseEther('800000000'))


				expect(await trd.connect(owner).addBlackListAddress(secondWallet.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(secondWallet.address)

				await expect(trd.connect(firstWallet).transferFrom(receiver.address, secondWallet.address, ethers.parseEther('800000000'))).
					to.be.revertedWithCustomError
			})
		})

		describe('Approve blacklist address', function () {
			it('Should not be able to approve blacklisted address as spender', async function () {
				const { trd, owner, firstWallet, receiver } = await loadFixture(deployTRD)
				expect(await trd.connect(owner).addBlackListAddress(receiver.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(receiver.address)
				expect(await trd.connect(firstWallet).approve(receiver.address, ethers.parseEther('800000000'))).
					to.be.revertedWithCustomError
			})
			it('Blacklisted address should not be able to approve another spender', async function () {
				const { trd, owner, firstWallet, receiver } = await loadFixture(deployTRD)
				expect(await trd.connect(owner).addBlackListAddress(firstWallet.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(firstWallet.address)
				expect(await trd.connect(firstWallet).approve(receiver.address, ethers.parseEther('800000000'))).
					to.be.revertedWithCustomError
			})
		})

		describe('Retrieve from blacklisted address', function () {
			it('Should be able to retrieve from blacklisted address', async function () {
				const { trd, owner, firstWallet, receiver } = await loadFixture(deployTRD)
				expect(await trd.connect(owner).addBlackListAddress(firstWallet.address)).
					to.emit(trd, 'AddedToBlackList').withArgs(firstWallet.address)
				expect(await trd.connect(owner).retrieveFromBlackList(firstWallet.address, receiver.address, ethers.parseEther('800000000'))).
					to.changeTokenBalances(trd, [firstWallet, receiver], [ethers.parseEther('-800000000'), ethers.parseEther('800000000')])
			})
			it('Should not be able to retrieve from non blacklisted address', async function () {
				const { trd, owner, firstWallet, receiver } = await loadFixture(deployTRD)
				await expect(trd.connect(owner).retrieveFromBlackList(firstWallet.address, receiver.address, ethers.parseEther('800000000'))).
					to.be.revertedWith("BlackList: From address is not in the black list")
			})
		})
	})
})
