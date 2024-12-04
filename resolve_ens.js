// Replace with your Ethereum RPC URL
const RPC_URL = "https://eth-mainnet.g.alchemy.com/v2/ltuRpzNWMOjavCu-u19Q5SbNUm0GmNou";

// List of ENS names and Ethereum addresses
const inputList = [
  "glitchmarfa.eth",
  "0x55a0730a844727bd694fd8f938a456158be0f8a6",
  "120bpm.eth",
  "0xe44946a036d9c1f8438d4d2a33acd969d8c48706",
  "beaty.eth",
  "memphismantis.eth",
  "0xb6fc90c84b3f3acc84973123c45c93b7db8606a6",
  "0xeda2da451bc3dbb5f4c9a998a50d493b10bdf57e",
  "0x2abb7e01d0644db3e719dca11385b9b1ccde029f",
  "arad.eth",
  "arigreenberg.eth",
  "luckybrick.eth",
  "cutbank.eth",
  "killerart.eth",
  "infohazard.eth",
  "durtis.eth",
  "pyoong-vault.eth",
  "0x7cc235b941bde784d2b3d44e917435eb9602813f",
  "0x5236ab948ff36e8074641e3c63d2a3927d1caf91",
  "hometeleport.eth",
  "0x73ed02129dec10ceda24f06174d093a4342cbc2b",
  "michael.art",
  "zrose.eth",
  "0x2a9f80a74752d3bb5f9139b0617994591be13d4b",
  "0xc8ba8d7e4fe5c7df8c05f06ccce55fcb858989fc",
  "0x7cafe10a6440eca9570c1428582acf6f734cbd36",
  "0x482293e4c21130f069169e5d7e9c99f239c5ee8e",
  "mint.raptornews.eth",
  "bluemchen.eth",
  "0x8dfd7c6e3eed0836f7686f692a0ff11080d9bc69",
  "gazzinho.eth",
  "0x9e174789337b6650fdbb77883f77fd99c2af2f10",
  "0x98ea9be4db559392b155442d3bc91a54c762666a",
  "thothvault.eth",
  "egeisler.eth",
  "0x51360d99966724b2603182cc367ab9621d96eed2",
  "0xe73ceff7770fb27cbd4679711a34f848e95265bd",
  "0x9b3e37ba693c954bba67802c4d17efcd12b38e3c",
  "gnomemvault.eth",
  "snowfro.eth",
  "boomroasted.eth",
  "0xee74258438bcd2882fe907c91a5371dc5dd5b0ee",
  "cosmicblend.eth",
  "jaredpoz.eth",
  "artsuzy.eth",
  "0x5b513d7bb62f7f28bc3aba2d52fe6167a9b3a827",
  "kevinmoy.eth",
  "atley.eth",
  "0x41289653bda82c694ffb9cd4dba2dad215a89bdf",
  "mikevp.eth",
  "stu12.eth",
  "vault.3129.eth",
  "maltefr.eth",
  "jpmex.eth",
  "0x98f74000e47c61a5d6c7c4d8436942b2a3da0d82",
  "0xeli.eth",
  "beersnob.eth",
  "0xe382bb8f13c6338c94bc47babe0c7094a29bbffa",
  "chadwebb.eth",
  "pixelpete.eth",
  "salsadiccion.eth",
  "0x8e4c43c0f2de0abc6c6c004ebb422c6d4a31b0f7",
  "0xc579f518bce44908939a226775129922a0503adc",
  "vault.palmes.eth",
  "rudim3ntal.eth",
  "0x3ee4a408d933953571cea6615a55f2873ec8201d",
  "mpeyfuss.eth",
  "ethspresso.eth",
  "anel.eth",
  "maxorgel.eth",
  "marfamarfamarfa.eth",
  "fantasticmrfox.eth",
  "0xadfa1f34834037c203bf8be4e948e56460d0945e",
  "42ordinarymice.eth",
  "tonydenza.eth",
  "0xa64d2e2d1a4cc1eb935ace0ce32cb2ce969669ac",
  "flashrekt.eth",
  "studiobycj.eth",
  "0x2d20653c0c4e736f653643040312780edbad54f2",
  "0x1da37fcf2e0403057d61aaf0983832f17622a165",
  "0xc6efb28ed3c4aeab4b11fd122670a9e1554a85d1",
  "takeitethy.eth",
  "beijingdou.eth",
  "wermke.eth",
  "davidkibler.eth",
  "pakmanscoop.eth",
  "weston.eth",
  "0x8b7d031fb0d8aab5a985583c6c56c4fffab27ee7",
  "ronan2.eth",
  "mrtrapie.eth",
  "pyroxtremist.eth",
  "0x38b87fa5f96c02db53bb710026d95b5cda20ba70",
  "0xa5327ec0c858d649a5f9a98ba5cd93dcd11ea323",
  "hodl.sparkitysparkz.eth",
  "shruuump.eth",
  "gpunknft.eth",
  "carodebartolo.eth",
  "davidan.eth",
  "vault.smaroo.eth",
  "alwaysmax.eth",
  "lukeylupin.eth",
  "bluewave.eth",
  "0x6a03361252f4894292256bc2173df430ab1fb691",
  "0x6ff9be7783a2795eb8ca78c4f66adfa8079ac26d",
  "0xfaba1e9ed7f667e8c7a851c9ed15aed99aa80289",
  "0x590ef336b0617900bd61201cc34c3cceecd20381",
  "kayunee.eth",
  "0xca68193e07da540a36b9d81fe19670029a50bcda",
  "0x96a0627f560f68d5cf5e5429a713789cc098709c",
  "vault.nix.eth",
  "cdb-main.eth",
  "tarkovsky.eth",
  "blockbirdvault.eth",
  "ohyeahdavid.eth",
  "0x1f24ce8b0b76ac2a8bfded7f77a9a02595797544",
  "thebenmeadows.eth",
  "nicedayjules.eth",
  "0xea96aae59045a4f8af90d0d1c80087b324e081a1",
  "sonoflasgv1.eth",
  "vault.michael.art",
  "0x958aa79844ecbe99258ee1275d305b12da81e07b",
  "0xe2880a450f9c565e01a91e83cbdce2b695b7bc18",
  "panico.eth",
  "jordanlyall-vault.eth",
  "0x2f8caf6b1d29c9bd191edeccea9dd0e0a8374918",
  "0x7ca00a09e3b431d48c30e3e6cceaaeaf6385cc81",
  "sundayfunday.eth",
  "cdb-vault.eth",
  "grimble.eth",
  "vedantin.eth",
  "0x731ac04f9ed847a52eeae3ab8300cf37c50c6e8b",
  "sonoflasgv2.eth",
  "0xd6d5b6700742debb93229636626691e9c2bd088b",
  "0x21f023839e7b6fee67d33e4548791fa388564a02",
  "0x82d2358295a5da458dbe54e147dae2b77b9ef8a9",
  "azurej.eth",
  "0x5f656037e30a003862cf878db24ab5f537177fd9",
  "0xf43917c2cd1c189437a3af4f6dd8afb2746c62f4",
  "0xb01a3058166998c45859e345fe31fd7f2204db5a",
  "0xb8d4651ee9d97d7da426f82648a20d0e0fccd1d0",
  "ape3756.eth",
  "0xc013b04d3242efca0609d38001c12749d7e30f09",
  "lethalamounts.eth",
  "assembly-treasury.eth",
  "0x013bfc799d4e8730dceccc64917cf69308509b92",
  "0xshamrock.eth",
  "antidisiplin.eth",
  "08ird.eth",
  "aperothko.eth",
  "0x92b85e487502e93ea96640aefd4f0dc9140a8e41",
  "notmyjourney.eth",
  "0xd1a5799144c00fccf4001882b78588c8f90277ed",
  "diewiththemostlikes.eth",
  "dollarsandsense.eth",
  "skullgan25.eth",
  "blockytop.eth",
  "0x80a1c9fdc26199a69d190ebc8ad287ef48758977",
  "cdb-vault.eth",
  "vault.djtsoi.eth",
  "0xc8a2ad99a24177a7889b9bfbe00c60cb6400fa6c",
  "amandayoung.eth",
  "zombiedrool.eth"
];

import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

// Initialize viem client
const client = createPublicClient({
  chain: mainnet,
  transport: http(RPC_URL)
});

// Function to resolve ENS names or return Ethereum addresses
async function resolveEns(input) {
  try {
    // Check if input is an ENS name
    if (input.endsWith('.eth') || input.includes('.')) {
      const address = await client.getEnsAddress({
        name: input
      });
      return address || null;
    }
    // If not an ENS name, assume it's an Ethereum address
    return input;
  } catch (error) {
    console.error(`Error resolving ${input}:`, error);
    return null;
  }
}

// Main function to process the list
async function processList() {
  const results = [];

  for (const item of inputList) {
    const resolved = await resolveEns(item);
    if (resolved) {
      results.push(resolved);
    }
  }

  // Output the array of resolved addresses
  console.log('Resolved addresses:');
  console.log(JSON.stringify(results, null, 2));
}

processList().catch(console.error);
