const COLLECTION_ADDRESS = "0x6b8f34e0559aa9a5507e74ad93374d9745cdbf09"
const API_KEY = "58f04118d4b74b22b5d56bc6b4dd7e45"
const START_ID = 308558
const END_ID = 340633

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const refreshTokens = async () => {
    let id = START_ID

    while (id <= END_ID) {
        try {
            const response = await fetch(`https://api.opensea.io/api/v2/chain/base/contract/${COLLECTION_ADDRESS}/nfts/${id}/refresh`, {
                "headers": {
                    "accept": "*/*",
                    "x-api-key": API_KEY
                },
                "method": "POST",
            });

            if (response.ok) {
                console.log(`Refresh token #${id}`);
            } else {
                console.log(`Error refreshing token #${id}`);
            }
        } catch (error) {
            console.log(`Error refreshing token #${id}`);
        }
        await delay(300);
        id++;
    }
};

refreshTokens();