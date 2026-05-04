import React, { useState, useEffect } from 'react';
import Sparkline from './Sparkline';

const AssetDetailPanel = ({ asset, onClose, currency = 'usd' }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [liveSparkline, setLiveSparkline] = useState(asset ? asset.sparkline : []);

  useEffect(() => {
    if (asset && (!asset.sparkline || asset.sparkline.length === 0)) {
       // Fetch 7D sparkline from Binance
       fetch(`https://api.binance.com/api/v3/klines?symbol=${asset.symbol}USDT&interval=1d&limit=7`)
         .then(res => res.json())
         .then(data => {
            if (Array.isArray(data)) {
               const prices = data.map(candle => parseFloat(candle[4])); // closing price
               setLiveSparkline(prices);
            }
         }).catch(err => {
            console.error("Failed to fetch fallback sparkline", err);
         });
    } else if (asset) {
       setLiveSparkline(asset.sparkline);
    }
  }, [asset]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!asset) return null;

  const getCurrencySymbol = (cur) => {
    switch(cur) {
      case 'eur': return '€';
      case 'inr': return '₹';
      case 'usd': default: return '$';
    }
  };
  const sym = getCurrencySymbol(currency);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to finish
  };

  const locale = currency === 'inr' ? 'en-IN' : 'en-US';

  const formattedPrice = asset.price.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  });

  const formattedMarketCap = asset.marketCap.toLocaleString(locale, { maximumFractionDigits: 0 });
  const formattedVolume = asset.volume.toLocaleString(locale, { maximumFractionDigits: 0 });

  const isBullish = asset.change24h >= 0;
  const arrowColor = isBullish ? 'var(--color-bullish)' : 'var(--accent-red)';

  const mobileStyles = isMobile ? {
    top: 'auto',
    bottom: '0',
    right: '0',
    width: '100%',
    height: 'auto',
    maxHeight: '60vh',
    animation: isClosing ? 'slideDown 0.3s forwards' : 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  } : {};

  return (
    <div style={{ ...styles.panelWrapper, ...mobileStyles, animation: isClosing ? (isMobile ? 'slideDown 0.3s forwards' : 'slideOut 0.3s forwards') : (isMobile ? 'slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : styles.panelWrapper.animation) }}>
      <div style={isMobile ? { display: 'none' } : styles.tape}></div>
      <div className="sketched-box" style={styles.panel}>
        <button style={styles.closeBtn} onClick={handleClose}>X</button>
        
        {isMobile && <div style={styles.grabBar}></div>}

        <div style={styles.header}>
          <div style={styles.tack}></div>
          <div style={styles.titleRow}>
            {asset.image && <img src={asset.image} alt={asset.name} style={styles.logo} />}
            <h2 style={styles.symbol}>{asset.symbol}</h2>
          </div>
          <span style={styles.name}>{asset.name}</span>
        </div>

        <div style={styles.priceSection}>
          <div style={styles.price}>{sym}{formattedPrice}</div>
          <div style={{ ...styles.change, color: arrowColor }}>
            {isBullish ? '↗' : '↘'} {Math.abs(asset.change24h).toFixed(2)}%
          </div>
        </div>

        <div style={styles.chartContainer}>
          <h3 style={styles.sectionTitle}>7D Sketch</h3>
          <div style={styles.sparklineWrapper}>
            <Sparkline data={liveSparkline} width={300} height={100} color={arrowColor} />
          </div>
        </div>

        <div style={styles.metricsContainer}>
          <h3 style={styles.sectionTitle}>Quick Notes:</h3>
          
          <div style={styles.metricRow}>
            <div style={styles.metricLabel}>Market Cap:</div>
            <div style={styles.metricValue}>{sym}{formattedMarketCap}</div>
          </div>
          
          <div style={styles.metricRow}>
            <div style={styles.metricLabel}>24h Volume:</div>
            <div style={styles.metricValue}>{sym}{formattedVolume}</div>
          </div>
          
          <div style={styles.metricRow}>
            <div style={styles.metricLabel}>Circulating Supply:</div>
            <div style={styles.metricValue}>{asset.circulatingSupply.toLocaleString(locale, { maximumFractionDigits: 0 })} {asset.symbol}</div>
          </div>
          
          <div style={styles.metricRow}>
            <div style={styles.metricLabel}>ATH:</div>
            <div style={styles.metricValue}>{sym}{asset.ath.toLocaleString(locale)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  panelWrapper: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '380px',
    height: 'calc(100% - 40px)',
    zIndex: 100,
    animation: 'slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  tape: {
    position: 'absolute',
    top: '-15px',
    width: '100px',
    height: '30px',
    backgroundColor: 'var(--tape-bg)',
    backdropFilter: 'blur(2px)',
    zIndex: 101,
    transform: 'rotate(-2deg)',
  },
  panel: {
    width: '100%',
    height: '100%',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-postit)', // Yellow sticky note
    border: '4px solid var(--fg-pencil)',
    borderRadius: 'var(--border-wobbly)',
    boxShadow: 'var(--shadow-hard-lg)',
    transform: 'rotate(1deg)', // Slight tilt
    position: 'relative',
    overflowY: 'auto',
  },
  tack: {
    position: 'absolute',
    top: '15px',
    right: '40px',
    width: '15px',
    height: '15px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-red)',
    boxShadow: '2px 2px 0px 0px rgba(0,0,0,0.3)',
  },
  closeBtn: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'none',
    border: 'none',
    color: 'var(--fg-pencil)',
    fontFamily: 'var(--font-heading)',
    fontSize: '28px',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.1s',
  },
  header: {
    marginBottom: '24px',
    borderBottom: '2px dashed var(--fg-pencil)',
    paddingBottom: '12px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '4px',
  },
  logo: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '2px solid var(--fg-pencil)',
  },
  symbol: {
    margin: 0,
    fontSize: '48px',
    color: 'var(--fg-pencil)',
    lineHeight: 1,
    fontFamily: 'var(--font-heading)',
  },
  name: {
    color: 'var(--fg-pencil)',
    fontSize: '20px',
    opacity: 0.8,
  },
  priceSection: {
    marginBottom: '24px',
  },
  price: {
    fontFamily: 'var(--font-mono)',
    fontSize: '36px',
    fontWeight: '700',
    color: 'var(--fg-pencil)',
  },
  change: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: 'var(--font-heading)',
    fontSize: '24px',
    fontWeight: '700',
    marginTop: '4px',
  },
  chartContainer: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '24px',
    color: 'var(--accent-blue)',
    marginBottom: '12px',
    fontFamily: 'var(--font-heading)',
    textDecoration: 'underline wavy var(--fg-pencil) 1px',
    textUnderlineOffset: '4px',
  },
  sparklineWrapper: {
    border: '3px solid var(--fg-pencil)',
    borderRadius: 'var(--border-wobbly-alt)',
    padding: '8px',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-paper)',
  },
  metricsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  metricRow: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '8px',
  },
  metricLabel: {
    color: 'var(--fg-pencil)',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  metricValue: {
    fontFamily: 'var(--font-mono)',
    color: 'var(--fg-pencil)',
    fontSize: '16px',
    marginLeft: '8px',
  },
  grabBar: {
    width: '40px',
    height: '6px',
    backgroundColor: 'var(--fg-pencil)',
    borderRadius: '3px',
    margin: '0 auto 20px auto',
    opacity: 0.3,
  }
};

export default AssetDetailPanel;
