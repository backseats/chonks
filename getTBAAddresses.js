import { createPublicClient, http } from 'viem'
import { base } from 'viem/chains'
import fs from 'fs'

// Configure the client
const client = createPublicClient({
  chain: base,
  // transport: http('https://base-mainnet.g.alchemy.com/v2/Uw0LYFe_eBxGBgXb_sTxc_UPD_1Ot_Vc')
  transport: http('https://frosty-soft-shadow.base-mainnet.quiknode.pro/')
})

// Chonks contract address
const CHONKS_ADDRESS = '0x07152bfde079b5319e5308C43fB1Dbc9C76cb4F9'

// ABI fragment for the function we need
const abi = [{
  name: 'getTBAAddressForChonkId',
  inputs: [{ name: '_chonkId', type: 'uint256' }],
  outputs: [{ name: '', type: 'address' }],
  stateMutability: 'view',
  type: 'function'
}]

async function main() {
  // Create CSV header
  let csvContent = 'Chonk Id,TBA Address\n'

  // Assuming we want to check Chonk IDs from 1 to 5000 (adjust range as needed)
  for (let chonkId = 1; chonkId <= 83300; chonkId++) {
    try {
      const tbaAddress = await client.readContract({
        address: CHONKS_ADDRESS,
        abi,
        functionName: 'getTBAAddressForChonkId',
        args: [BigInt(chonkId)]
      })

      console.log(`Processing Chonk #${chonkId}: ${tbaAddress}`)
      csvContent += `${chonkId},${tbaAddress}\n`

      // Optional: Write to file every 100 entries to prevent data loss
      if (chonkId % 100 === 0) {
        fs.writeFileSync('chonk_tba_mapping.csv', csvContent)
      }
    } catch (error) {
      console.error(`Error processing Chonk #${chonkId}:`, error)
      // Add error entry to CSV
      csvContent += `${chonkId},ERROR\n`
    }

    // Optional: Add delay to prevent rate limiting
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  // Write final CSV file
  fs.writeFileSync('chonk_tba_mapping.csv', csvContent)
  console.log('CSV file has been created: chonk_tba_mapping.csv')
}

main().catch(console.error)
