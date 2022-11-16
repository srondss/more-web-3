const { assert } = require("chai");
const { getNamedAccounts, ethers, network } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
	? describe.skip
	: describe("FundMe", async function () {
			let fundMe;
			let deployer;
			const sendValue = ethers.utils.parseEther("1");
			beforeEach(async function () {
				deployer = (await getNamedAccounts()).deployer;
				fundMe = await ethers.getContract("FundMe", deployer);
			});

			it("allos people to fund and withdraw", async function () {
				await fundMe.fund({ value: sendValue });
				await fundMe.c_withdrawal();
				const endingBalance = await fundMe.provider.getBalance(
					fundMe.address
				);
				assert(endingBalance.toString(), "0");
			});
	  });
