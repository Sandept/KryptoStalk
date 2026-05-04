import React, { useState } from 'react';

const CoinSidebar = ({ coins, onFocusCoin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCoins = coins.filter(coin => 
    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    coin.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <button 
        className="sketched-box"
        style={styles.button}
        onClick={() => setIsOpen(!isOpen)}
      >
        Krypto {isOpen ? '↑' : '↓'}
      </button>

      {isOpen && (
        <div className="sketched-box" style={styles.listContainer}>
          <input 
            type="text" 
            placeholder="Search coin..." 
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div style={styles.scrollArea}>
            {filteredCoins.map((coin) => (
              <div 
                key={coin.id} 
                style={styles.listItem}
                onClick={() => {
                  onFocusCoin(coin);
                  // Optional: Close list on selection
                  // setIsOpen(false);
                }}
              >
                <img src={coin.image} alt={coin.name} style={styles.icon} />
                <div style={styles.coinInfo}>
                  <span style={styles.symbol}>{coin.symbol.toUpperCase()}</span>
                  <span className={coin.change24h >= 0 ? 'text-bullish' : 'text-bearish'} style={styles.change}>
                    {coin.change24h > 0 ? '+' : ''}{coin.change24h.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'absolute',
    top: '15px',
    left: '15px',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  button: {
    padding: '8px 16px',
    fontFamily: 'var(--font-heading)',
    fontSize: '20px',
    fontWeight: 'bold',
    cursor: 'pointer',
    background: 'var(--bg-postit)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '120px',
  },
  listContainer: {
    background: 'var(--bg-paper)',
    width: '200px',
    maxHeight: '400px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  searchInput: {
    margin: '8px',
    padding: '8px',
    fontFamily: 'var(--font-body)',
    fontSize: '16px',
    border: '2px dashed var(--fg-pencil)',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-postit)',
    color: 'var(--fg-pencil)',
    outline: 'none',
  },
  scrollArea: {
    overflowY: 'auto',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxHeight: '100%',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 8px', // Increased vertical padding for mobile
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
    gap: '12px',
    borderBottom: '1px dashed var(--fg-muted)',
  },
  icon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
  },
  coinInfo: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  symbol: {
    fontFamily: 'var(--font-heading)',
    fontWeight: 'bold',
    fontSize: '16px',
    lineHeight: '1',
  },
  change: {
    fontFamily: 'var(--font-mono)',
    fontSize: '12px',
    lineHeight: '1',
    marginTop: '4px',
  }
};

export default CoinSidebar;
