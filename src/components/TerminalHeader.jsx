import React, { useState, useEffect } from 'react';

const TerminalHeader = ({ coins, globeStyle, setGlobeStyle, currency, setCurrency, theme, setTheme }) => {
  const tickerCoins = coins.slice(0, 10);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const getCurrencySymbol = (cur) => {
    switch(cur) {
      case 'eur': return '€';
      case 'inr': return '₹';
      case 'usd': default: return '$';
    }
  };

  const headerStyle = {
    ...styles.header,
    padding: isMobile ? '0 10px' : '0 24px',
  };

  return (
    <header style={styles.headerWrapper}>
      <div style={headerStyle}>
        <div style={isMobile ? styles.logoContainerMobile : styles.logoContainer}>
          <div 
            style={{...styles.logoMark, cursor: 'pointer', width: isMobile ? '40px' : '32px', height: isMobile ? '40px' : '32px'}} 
            onClick={() => window.location.reload()}
            title="Refresh Web App"
          >
            ₿
          </div>
          <h1 style={{...styles.title, fontSize: isMobile ? '20px' : '28px'}}>KryptoStalk</h1>
        </div>
        
        {!isMobile && (
          <div style={styles.tickerContainer}>
            <div style={styles.tickerWrapper}>
              {tickerCoins.map(coin => (
                <div key={coin.id} style={styles.tickerItem}>
                  <span style={styles.tickerSymbol}>{coin.symbol}</span>
                  <span style={styles.tickerPrice}>{getCurrencySymbol(currency)}{coin.price.toLocaleString(currency === 'inr' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                  <span className={coin.change24h >= 0 ? 'text-bullish' : 'text-bearish'} style={styles.tickerChange}>
                    {coin.change24h >= 0 ? '↗' : '↘'} {Math.abs(coin.change24h).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div style={styles.controlsContainer}>
          <div style={styles.tapeStrip}></div>
          <select 
            style={styles.styleSelect} 
            value={currency} 
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="usd">USD ($)</option>
            <option value="eur">EUR (€)</option>
            <option value="inr">INR (₹)</option>
          </select>
          <div style={{...styles.styleSelect, color: 'var(--fg-pencil)'}}>|</div>
          <div style={{...styles.styleSelect, color: 'var(--fg-pencil)'}}>|</div>
          <select 
            style={styles.styleSelect} 
            value={globeStyle} 
            onChange={(e) => setGlobeStyle(e.target.value)}
          >
            <option value="default">Default</option>
            <option value="origami">Origami</option>
          </select>
          <div style={{...styles.styleSelect, color: 'var(--fg-pencil)'}}>|</div>
          <button 
            style={styles.themeToggle} 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            title="Toggle Dark Mode"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </header>
  );
};

const styles = {
  headerWrapper: {
    padding: '16px 16px 0 16px',
    zIndex: 10,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: '70px',
    backgroundColor: 'var(--bg-paper)',
    border: '4px solid var(--fg-pencil)',
    borderRadius: 'var(--border-wobbly-alt)',
    boxShadow: 'var(--shadow-hard)',
    transform: 'rotate(-1deg)', // Playful rotation
    position: 'relative',
    transition: 'background-color 0.3s',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },
  logoContainerMobile: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: {
    width: '32px',
    height: '32px',
    backgroundColor: 'var(--accent-red)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-heading)',
    fontSize: '24px',
    fontWeight: 'bold',
    borderRadius: 'var(--border-wobbly)',
    border: '2px solid var(--fg-pencil)',
    transform: 'rotate(5deg)',
  },
  title: {
    fontSize: '28px',
    color: 'var(--fg-pencil)',
    margin: 0,
    textDecoration: 'underline wavy var(--accent-blue) 2px',
    textUnderlineOffset: '6px',
  },
  tickerContainer: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    borderLeft: '3px dashed var(--fg-pencil)',
    borderRight: '3px dashed var(--fg-pencil)',
    margin: '0 24px',
    height: '80%',
    position: 'relative',
    whiteSpace: 'nowrap',
    maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
    WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
  },
  tickerWrapper: {
    display: 'flex',
    gap: '32px',
    animation: 'ticker 30s linear infinite',
  },
  tickerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'var(--font-body)',
    fontSize: '20px', // Larger handwriting
  },
  tickerSymbol: {
    color: 'var(--fg-pencil)',
    fontWeight: 'bold',
    textDecoration: 'underline solid 2px',
  },
  tickerPrice: {
    fontFamily: 'var(--font-mono)',
    fontSize: '16px',
  },
  tickerChange: {
    fontSize: '18px',
  },
  controlsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: '40px',
    padding: '0 8px',
    backgroundColor: 'var(--bg-postit)',
    border: '2px solid var(--fg-pencil)',
    borderRadius: 'var(--border-wobbly)',
    transform: 'rotate(2deg)',
    flexShrink: 0,
    gap: '4px',
  },
  tapeStrip: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%) rotate(-4deg)',
    width: '40px',
    height: '15px',
    backgroundColor: 'var(--tape-bg)',
    backdropFilter: 'blur(2px)',
    zIndex: 2,
  },
  styleSelect: {
    fontFamily: 'var(--font-heading)',
    fontSize: '18px',
    color: 'var(--accent-red)',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    paddingRight: '10px',
    fontWeight: 'bold',
  },
  themeToggle: {
    background: 'none',
    border: 'none',
    fontSize: '22px',
    cursor: 'pointer',
    padding: '0 5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s',
  }
};

export default TerminalHeader;
