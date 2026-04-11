const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  boolCV
} = require('@stacks/transactions');

const senderKey = 'STX_KEY_SCRUBBED';
const contractAddress = 'SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B';
const contractName = 'chessxu';
const FEE_PER_TX = 250000; // 0.25 STX per tx
const NUM_TXS = 45;

async function getNextNonce(address) {
  const res = await fetch(`https://api.hiro.so/extended/v1/address/${address}/nonces`);
  const data = await res.json();
  return data.possible_next_nonce || 0;
}

async function runInteractions() {
  console.log('Fetching starting nonce...');
  const baseNonce = await getNextNonce(contractAddress);
  console.log(`Starting ${NUM_TXS} transactions at nonce ${baseNonce}, fee ${FEE_PER_TX} uSTX (0.25 STX) each...`);
  console.log(`Total STX needed for fees: ${(NUM_TXS * FEE_PER_TX / 1_000_000).toFixed(2)} STX\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < NUM_TXS; i++) {
    try {
      const tx = await makeContractCall({
        contractAddress,
        contractName,
        functionName: 'create-game',
        functionArgs: [uintCV(0), boolCV(true)],
        senderKey,
        network: 'mainnet',
        nonce: baseNonce + i,
        fee: FEE_PER_TX,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
      });

      const result = await broadcastTransaction({ transaction: tx, network: 'mainnet' });

      if (result.error) {
        console.log(`Tx ${i + 1}/${NUM_TXS} FAILED: ${result.error} (${result.reason || ''})`);
        failCount++;
      } else {
        console.log(`Tx ${i + 1}/${NUM_TXS} OK: ${result.txid}`);
        successCount++;
      }
    } catch (e) {
      console.error(`Tx ${i + 1}/${NUM_TXS} error: ${e.message}`);
      failCount++;
    }
  }

  console.log(`\nDone! ${successCount} succeeded, ${failCount} failed.`);
}

runInteractions().catch(console.error);
