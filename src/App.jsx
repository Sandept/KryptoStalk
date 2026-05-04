import { useState, useEffect } from 'react'
import './App.css'
import TerminalHeader from './components/TerminalHeader'
import Heatmap from './components/Heatmap'
import AssetDetailPanel from './components/AssetDetailPanel'
import CoinSidebar from './components/CoinSidebar'
import { fetchMarketData } from './services/crypto'

function App() {
  const [rawCoins, setRawCoins] = useState([]);
  const [coins, setCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [focusCoin, setFocusCoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globeStyle, setGlobeStyle] = useState('default');
  const [currency, setCurrency] = useState('inr'); // Set default to 'inr'
  const [exchangeRate, setExchangeRate] = useState(83); // Temporary default for INR
  const [theme, setTheme] = useState('light');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [rates, setRates] = useState({ USD: 1, EUR: 0.85, INR: 83 });

  // Fetch exchange rates ONCE on mount
  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(res => res.json())
      .then(data => {
         if (data && data.rates) {
           setRates(data.rates);
           setExchangeRate(data.rates[currency.toUpperCase()] || 1);
         }
      })
      .catch(err => console.error('Failed to fetch rates:', err));
  }, []);

  // Update exchangeRate synchronously when currency changes
  useEffect(() => {
    setExchangeRate(rates[currency.toUpperCase()] || 1);
  }, [currency, rates]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchMarketData('usd'); // ALWAYS fetch in USD
        setRawCoins(data);
        setError(null);
      } catch (err) {
        setError('Failed to load market data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Refresh data every 2 minutes for new coins/sparklines (REST fallback)
    const interval = setInterval(loadData, 120000);
    return () => clearInterval(interval);
  }, []); // Only run on mount!

  // Live WebSocket Integration for Real-Time Prices
  useEffect(() => {
    if (rawCoins.length === 0) return;
    
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      setRawCoins(prevCoins => {
        // Create a fast lookup map for updates
        const priceUpdates = {};
        let hasChanges = false;
        
        data.forEach(ticker => {
          if (ticker.s.endsWith('USDT')) {
            const sym = ticker.s.replace('USDT', '');
            
            priceUpdates[sym] = {
              price: parseFloat(ticker.c), // Update USD price
              change24h: parseFloat(ticker.P)
            };
          }
        });
        
        const newCoins = prevCoins.map(coin => {
          const update = priceUpdates[coin.symbol];
          if (update && (coin.price !== update.price || coin.change24h !== update.change24h)) {
             hasChanges = true;
             return { ...coin, price: update.price, change24h: update.change24h };
          }
          return coin;
        });
        
        return hasChanges ? newCoins : prevCoins;
      });
    };
    
    return () => {
      ws.close();
    };
  }, [rawCoins.length]); // Re-run only if the number of coins changes

  // Update display coins when rawCoins or exchangeRate changes
  useEffect(() => {
    if (rawCoins.length > 0) {
      const displayCoins = rawCoins.map(coin => ({
        ...coin,
        price: coin.price * exchangeRate,
        marketCap: coin.marketCap * exchangeRate,
        volume: coin.volume * exchangeRate,
        ath: coin.ath * exchangeRate,
        sparkline: coin.sparkline ? coin.sparkline.map(p => p * exchangeRate) : []
      }));
      setCoins(displayCoins);
    }
  }, [rawCoins, exchangeRate]);

  // Sync selectedCoin when coins data updates (e.g., currency change or live price update)
  useEffect(() => {
    if (selectedCoin && coins.length > 0) {
      const updatedCoin = coins.find(c => c.id === selectedCoin.id);
      if (updatedCoin && (updatedCoin.price !== selectedCoin.price || updatedCoin.change24h !== selectedCoin.change24h)) {
        setSelectedCoin(updatedCoin);
      }
    }
  }, [coins, selectedCoin]);

  // Animations are now managed in index.css

  return (
    <div className="app-container">
      <TerminalHeader 
         coins={coins} 
         globeStyle={globeStyle} 
         setGlobeStyle={setGlobeStyle} 
         currency={currency}
         setCurrency={setCurrency}
         theme={theme}
         setTheme={setTheme}
      />
      
      <main className="main-content">
        <div className="heatmap-container">
          {loading && coins.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              INITIALIZING TERMINAL... FETCHING MARKET DATA
            </div>
          ) : error && coins.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--color-bearish)' }}>
              {error}
            </div>
          ) : (
            <>
              <Heatmap coins={coins} onSelectCoin={setSelectedCoin} globeStyle={globeStyle} focusCoin={focusCoin} />
              <CoinSidebar coins={coins} onFocusCoin={setFocusCoin} />
            </>
          )}
        </div>
        
        {selectedCoin && (
          <AssetDetailPanel 
            asset={selectedCoin} 
            onClose={() => setSelectedCoin(null)} 
            currency={currency}
          />
        )}
      </main>
    </div>
  )
}

export default App
