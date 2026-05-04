const COINLORE_URL = 'https://api.coinlore.net/api/tickers/';
const BINANCE_URL = 'https://api.binance.com/api/v3/ticker/price';

export const fetchMarketData = async (currency = 'usd') => {
  const COINGECKO_URL = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=100&page=1&sparkline=true`;
  
  try {
    const cgResponse = await fetch(COINGECKO_URL);
    
    let data = [];

    if (!cgResponse.ok) {
      if (cgResponse.status === 429) {
         console.warn('CoinGecko rate limit exceeded, falling back to Coinlore.');
         data = await fetchFallbackData();
      } else {
         throw new Error(`CoinGecko HTTP error! status: ${cgResponse.status}`);
      }
    } else {
      const cgJson = await cgResponse.json();
      data = formatCoinGeckoData(cgJson);
    }

    return data;

  } catch (error) {
    console.error('Error fetching from CoinGecko:', error);
    console.warn('Falling back to Coinlore API.');
    return await fetchFallbackData();
  }
};

const fetchFallbackData = async () => {
  try {
    const response = await fetch(COINLORE_URL);
    if (!response.ok) {
       throw new Error(`Coinlore HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return formatCoinloreData(json.data);
  } catch (error) {
    console.error('Error fetching fallback data:', error);
    return [];
  }
}

const formatCoinGeckoData = (data) => {
  return data.map(coin => ({
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    price: coin.current_price,
    marketCap: coin.market_cap,
    change24h: coin.price_change_percentage_24h || 0,
    sparkline: coin.sparkline_in_7d?.price || [],
    volume: coin.total_volume || 0,
    circulatingSupply: coin.circulating_supply || 0,
    ath: coin.ath || 0,
    image: coin.image || `https://api.dicebear.com/7.x/initials/svg?seed=${coin.symbol}`
  }));
};

const formatCoinloreData = (data) => {
  return data.map(coin => ({
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    price: parseFloat(coin.price_usd),
    marketCap: parseFloat(coin.market_cap_usd),
    change24h: parseFloat(coin.percent_change_24h) || 0,
    sparkline: [], // Coinlore doesn't provide sparkline in this endpoint
    volume: parseFloat(coin.volume24) || 0,
    circulatingSupply: parseFloat(coin.csupply) || 0,
    ath: 0,
    image: `https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`
  }));
};
