const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
	const { deployer } = await getNamedAccounts();
	const fundMe = await ethers.getContract("FundMe", deployer);
	console.log("Funding contract...");
	const transactionResponse = await fundMe.c_withdrawal();
	await transactionResponse.wait(1);
	console.log("Withdraw!");
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
