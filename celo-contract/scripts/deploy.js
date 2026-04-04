import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
    const artifactPath = join(__dirname, "../artifacts/contracts/Chessxu.sol/Chessxu.json");
    if (!fs.existsSync(artifactPath)) {
        console.error("Artifact not found. Did you compile?");
        process.exit(1);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    
    // Target Celo Mainnet via Ankr
    const rpcUrl = "https://forno.celo.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    if (!process.env.MAINNET_PRIVATE_KEY) {
        throw new Error("Missing MAINNET_PRIVATE_KEY in .env");
    }

    const wallet = new ethers.Wallet(process.env.MAINNET_PRIVATE_KEY, provider);

    console.log(`Deploying from account: ${wallet.address}`);

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    
    console.log("Sending deployment transaction...");
    const contract = await factory.deploy(ethers.ZeroAddress); // zero address for token integration
    await contract.waitForDeployment();
    
    const targetAddress = await contract.getAddress();
    console.log(`Chessxu successfully deployed to Mainnet at: ${targetAddress}`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
