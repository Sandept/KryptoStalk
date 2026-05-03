import { useState, useEffect } from 'react'
import './App.css'
import TerminalHeader from './components/TerminalHeader'
import Heatmap from './components/Heatmap'
import AssetDetailPanel from './components/AssetDetailPanel'
import { fetchMarketData } from './services/crypto'

function App() {
  const [coins, setCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globeStyle, setGlobeStyle] = useState('default');
  const [currency, setCurrency] = useState('usd');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [theme, setTheme] = useState('light');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch exchange rate whenever currency changes
  useEffect(() => {
    if (currency === 'usd') {
      setExchangeRate(1);
      return;
    }
    
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(res => res.json())
      .then(data => {
         const rate = data.rates[currency.toUpperCase()] || 1;
         setExchangeRate(rate);
      })
      .catch(err => {
         console.error('Failed to fetch exchange rate:', err);
         setExchangeRate(1); // fallback
      });
  }, [currency]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchMarketData(currency);
        setCoins(data);
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
  }, [currency]);

  // Live WebSocket Integration for Real-Time Prices
  useEffect(() => {
    if (coins.length === 0) return;
    
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      setCoins(prevCoins => {
        // Create a fast lookup map for updates
        const priceUpdates = {};
        let hasChanges = false;
        
        data.forEach(ticker => {
          if (ticker.s.endsWith('USDT')) {
            const sym = ticker.s.replace('USDT', '');
            
            // ticker.c is USD price. Multiply by exchangeRate to get selected currency live price!
            priceUpdates[sym] = {
              price: parseFloat(ticker.c) * exchangeRate,
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
  }, [coins.length, exchangeRate]); // Only re-run if the number of coins changes or exchange rate changes

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
            <Heatmap coins={coins} onSelectCoin={setSelectedCoin} globeStyle={globeStyle} />
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
