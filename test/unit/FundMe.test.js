const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");

!developmentChains.includes(network.name)
	? describe.skip
	: describe("FundMe", async function () {
			let fundMe;
			let deployer;
			let mockV3Aggregator;
			const sendValue = ethers.utils.parseEther("1");
			beforeEach(async function () {
				//	const accounts = await ethers.getSigners();
				deployer = (await getNamedAccounts()).deployer;
				await deployments.fixture(["all"]);
				fundMe = await ethers.getContract("FundMe", deployer);
				mockV3Aggregator = await ethers.getContract(
					"MockV3Aggregator",
					deployer
				);
			});

			describe("constructor", async function () {
				it("sets the aggregator address correctly", async function () {
					const response = await fundMe.getPriceFeed();
					assert.equal(response, mockV3Aggregator.address);
				});
			});

			describe("fund", async function () {
				it("Fails if you don't send enough ETH", async function () {
					await expect(fundMe.fund()).to.be.revertedWith(
						"You need to spend more ETH!"
					);
				});
				it("updated the amount funded data structure", async function () {
					await fundMe.fund({ value: sendValue });
					const response = await fundMe.getAddressToAmountFunded(
						deployer
					);
					assert.equal(response.toString(), sendValue.toString());
				});
				it("Adds funders to array of funders", async function () {
					await fundMe.fund({ value: sendValue });
					const response = await fundMe.getFunder(0);
					assert.equal(response, deployer);
				});
			});

			describe("withdraw", async function () {
				beforeEach(async function () {
					await fundMe.fund({ value: sendValue });
				});

				it("Withdraw ETH from a single founder", async function () {
					// Arrange
					const startingBalance = await fundMe.provider.getBalance(
						fundMe.address
					);
					const startingDeployerBalance =
						await fundMe.provider.getBalance(deployer);
					// Act
					const transactionResponse = await fundMe.c_withdrawal();
					const transactionReceipt = await transactionResponse.wait(
						1
					);
					// gasCost
					const { gasUsed, effectiveGasPrice } = transactionReceipt;
					const gasCost = gasUsed.mul(effectiveGasPrice);

					const endingFundMeBalance =
						await fundMe.provider.getBalance(fundMe.address);
					const endingDeployerBalance =
						await fundMe.provider.getBalance(deployer);

					// Assert
					assert.equal(endingFundMeBalance, 0);
					assert.equal(
						startingBalance.add(startingDeployerBalance).toString(),
						endingDeployerBalance.add(gasCost).toString()
					);
				});

				it("allows us to withdraw with multiple funders", async function () {
					const accounts = await ethers.getSigners();
					for (let i = 1; i < 6; i++) {
						const fundMeConnectedWallet = await fundMe.connect(
							accounts[i]
						);
						await fundMeConnectedWallet.fund({ value: sendValue });
					}
					const startingBalance = await fundMe.provider.getBalance(
						fundMe.address
					);
					const startingDeployerBalance =
						await fundMe.provider.getBalance(deployer);
					const transactionResponse = await fundMe.c_withdrawal();
					const transactionReceipt = await transactionResponse.wait(
						1
					);
					const { gasUsed, effectiveGasPrice } = transactionReceipt;
					const gasCost = gasUsed.mul(effectiveGasPrice);
					const endingFundMeBalance =
						await fundMe.provider.getBalance(fundMe.address);
					const endingDeployerBalance =
						await fundMe.provider.getBalance(deployer);

					// Assert
					assert.equal(endingFundMeBalance, 0);
					assert.equal(
						startingBalance.add(startingDeployerBalance).toString(),
						endingDeployerBalance.add(gasCost).toString()
					);
					await expect(fundMe.getFunder(0)).to.be.reverted;
					for (i = 1; i < 6; i++) {
						assert.equal(
							await fundMe.getAddressToAmountFunded(
								accounts[i].address
							),
							0
						);
					}
				});

				it("Should only allow owner to withdraw", async function () {
					const accounts = await ethers.getSigners();
					const attackerAccountConnected = await fundMe.connect(
						accounts[1]
					);
					await expect(
						attackerAccountConnected.c_withdrawal()
					).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
				});
			});
	  });
