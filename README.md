# 🌍 KryptoStalk

![KryptoStalk Banner](https://img.shields.io/badge/Status-Active-success) ![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB) ![D3.js](https://img.shields.io/badge/d3%20js-F9A03C?style=flat&logo=d3.js&logoColor=white) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)

**KryptoStalk** is a real-time, highly interactive 3D cryptocurrency visualization dashboard. It replaces boring, traditional tables with a stunning **3D interactive globe**, allowing you to monitor the crypto market through a unique, hand-drawn "sketchbook" aesthetic.

## ✨ Features

- 🔄 **Interactive 3D Globe**: Spin, drag, and explore the top cryptocurrencies mapped onto a geodesic sphere using D3-Geo-Voronoi.
- ⚡ **Real-Time Market Data**: Watch prices flash green and red with sub-second, live market updates.
- 🎨 **Unique Sketchbook Aesthetic**: Built entirely from scratch with wobbly borders, paper textures, and sticky-note detail panels to feel like a living notebook.
- 🌓 **Dynamic Themes**: Instantly toggle between a classic Light paper mode and a sleek, charcoal Dark mode.
- 💱 **Multi-Currency Support**: View live market data in USD ($), EUR (€), and INR (₹).
- 📱 **Fully Responsive**: Elegantly scales to work perfectly on both giant desktop monitors and smartphone screens with mobile-friendly bottom sheets.

## 🛠️ Tools & Technologies Used

- **React 19** & **Vite**: For lightning-fast development and optimized production builds.
- **D3.js** (`d3-geo`, `d3-geo-voronoi`, `d3-drag`): Powering the complex math behind the spherical projection, Voronoi cell tessellation, and interactive dragging.
- **Vanilla CSS**: Custom implementation of dynamic CSS variables to manage the complex Light/Dark mode transitions without bloated frameworks.

## 📡 Free APIs Integration

This project is built entirely on free, public APIs without requiring any paid subscriptions:

1. **[Binance WebSocket Stream](https://github.com/binance/binance-spot-api-docs)** (`wss://stream.binance.com:9443`): Provides the raw, real-time ticker stream for instant sub-second price updates.
2. **[CoinGecko API](https://www.coingecko.com/en/api)**: Used to fetch the initial top-ranking coins, historical sparkline chart data, and market capitalization.
3. **[ExchangeRate-API](https://www.exchangerate-api.com/)**: Fetches live fiat conversion rates to translate the base Binance USD prices into Euros and Indian Rupees seamlessly.

## 🚀 Getting Started

To run KryptoStalk locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/KryptoStalk.git
   cd KryptoStalk
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser to see the live globe.

4. **Deploy to GitHub Pages:**
   ```bash
   npm run deploy
   ```

## 🤖 Acknowledgments

This project was built collaboratively with **Antigravity**, an advanced agentic coding AI developed by the Google DeepMind team, assisting with complex D3.js geometry, real-time WebSocket state management, and custom CSS aesthetic architecture.
