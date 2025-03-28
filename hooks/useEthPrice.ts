import { useState, useEffect } from 'react';

export function useEthPrice() {
  const [ethPrice, setEthPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        setEthPrice(data.ethereum.usd);
      } catch (error) {
        console.error('Error fetching ETH price:', error);
      }
    };

    fetchEthPrice();
    // Refresh price every minute
    const interval = setInterval(fetchEthPrice, 60000);

    return () => clearInterval(interval);
  }, []);

  return { ethPrice };
}
