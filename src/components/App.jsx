import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
//import crypto from 'crypto-js';

const App = () => {
  const [currentPrice, setCurrentPrice] = useState(null);
  const [initialPrice, setInitialPrice] = useState(null);
  const [minPrice, setMinPrice] = useState(null);
  // const [buyPrice, setBuyPrice] = useState(null);
  const intervalRef = useRef(null);

  const fetchPrice = async () => {
    try {
      const response = await axios.get(
        `https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT`
      );
      const price = parseFloat(response.data.price);

      setCurrentPrice(price);
      console.log(`pered ${initialPrice}`);
      if (!initialPrice) {
        setInitialPrice(price);
      }
      if (!minPrice || price < minPrice) setMinPrice(price);

      // Wait for the state to be updated before executing other code
      await new Promise(resolve => setTimeout(resolve, 0));

      // Your logic here
      // if (buyPrice) {
      //   // monitorForSell(price);
      // } else if (minPrice && price >= minPrice * 1.02) {
      //   // Example condition
      //   // handleBuy(price);
      // }
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  };
  console.log(`1 ${initialPrice}`);

  useEffect(() => {
    intervalRef.current = setInterval(fetchPrice, 5000);
    console.log('use');
    return () => clearInterval(intervalRef.current);
  });

  return (
    <div>
      <p>Initial Price: {initialPrice}</p>
      <p>Current Price: {currentPrice}</p>
      <p>Min Price: {minPrice}</p>
    </div>
  );
};
// const App = () => {
//   const [apiKey, setApiKey] = useState('');
//   const [apiSecret, setApiSecret] = useState('');
//   const [symbol, setSymbol] = useState('SOLUSDT');
//   const [buyThreshold, setBuyThreshold] = useState(2);
//   const [stopLossThreshold, setStopLossThreshold] = useState(5);
//   const [trailingStopThreshold, setTrailingStopThreshold] = useState(2);
//   const [mainTrailingStopThreshold, setMainTrailingStopThreshold] =
//     useState(10);
//   const [usdtAmount, setUsdtAmount] = useState(100);
//   const [initialPrice, setInitialPrice] = useState(null);
//   const [currentPrice, setCurrentPrice] = useState(null);
//   const [minPrice, setMinPrice] = useState(null);
//   const [buyPrice, setBuyPrice] = useState(null);
//   const [lastSellPrice, setLastSellPrice] = useState(null);
//   const [isMonitoring, setIsMonitoring] = useState(false);
//   const intervalRef = useRef(null);

//   const fetchPrice = async () => {
//     try {
//       const response = await axios.get(
//         `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
//       );
//       const price = parseFloat(response.data.price);

//       setCurrentPrice(price);
//       if (!initialPrice) setInitialPrice(price);
//       if (!minPrice || price < minPrice) setMinPrice(price);

//       if (buyPrice) {
//         monitorForSell(price);
//       } else if (
//         minPrice &&
//         price >= minPrice * (1 + buyThreshold / 100) &&
//         (!lastSellPrice || price < lastSellPrice)
//       ) {
//         handleBuy(price);
//       }
//     } catch (error) {
//       console.error('Error fetching price:', error);
//     }
//   };

//   const calculateQuantity = price => usdtAmount / price;

//   const placeOrder = async (side, price, quantity) => {
//     const data = {
//       symbol,
//       side,
//       type: 'LIMIT',
//       timeInForce: 'GTC',
//       quantity,
//       price,
//       recvWindow: 60000,
//       timestamp: Date.now(),
//     };

//     const queryString = new URLSearchParams(data).toString();
//     const signature = crypto.HmacSHA256(queryString, apiSecret).toString();

//     const response = await axios.post(
//       `https://api.binance.com/api/v3/order?${queryString}&signature=${signature}`,
//       {},
//       {
//         headers: {
//           'X-MBX-APIKEY': apiKey,
//         },
//       }
//     );

//     return response.data;
//   };

//   const monitorForSell = price => {
//     if (price >= buyPrice * (1 + stopLossThreshold / 100)) {
//       const stopLossPrice = buyPrice + (price - buyPrice) / 2;
//       console.log(`Setting initial stop-loss at price: ${stopLossPrice}`);
//       placeOrder('SELL', stopLossPrice, calculateQuantity(stopLossPrice));

//       if (price >= buyPrice * (1 + mainTrailingStopThreshold / 100)) {
//         const trailingStopPrice = price * (1 - trailingStopThreshold / 100);
//         console.log(`Setting trailing stop at price: ${trailingStopPrice}`);
//         placeOrder(
//           'SELL',
//           trailingStopPrice,
//           calculateQuantity(trailingStopPrice)
//         );
//       }
//     } else if (price <= buyPrice * 0.9) {
//       console.log(`Setting stop-loss at price: ${buyPrice * 0.9}`);
//       placeOrder('SELL', buyPrice * 0.9, calculateQuantity(buyPrice * 0.9));
//     }
//   };

//   const handleBuy = async price => {
//     try {
//       const quantity = calculateQuantity(price);
//       await placeOrder('BUY', price, quantity);
//       setBuyPrice(price);
//       setMinPrice(null); // Reset minimum price after buy
//     } catch (error) {
//       console.error('Error placing buy order:', error);
//     }
//   };

//   const handleSell = async price => {
//     try {
//       const quantity = calculateQuantity(price);
//       await placeOrder('SELL', price, quantity);
//       setLastSellPrice(price); // Запам'ятовування останньої ціни продажу
//       setBuyPrice(null);
//       setMinPrice(null);
//     } catch (error) {
//       console.error('Error placing sell order:', error);
//     }
//   };

//   const startMonitoring = () => {
//     setIsMonitoring(true);
//     intervalRef.current = setInterval(fetchPrice, 5000); // Fetch price every 5 seconds
//   };

//   const stopMonitoring = () => {
//     setIsMonitoring(false);
//     clearInterval(intervalRef.current);
//   };

//   useEffect(() => {
//     if (isMonitoring) {
//       fetchPrice();
//     } else {
//       clearInterval(intervalRef.current);
//     }
//     return () => clearInterval(intervalRef.current);
//   }, [isMonitoring]);

//   return (
//     <div className="App">
//       <h1>Binance Trading Bot</h1>
//       <input
//         type="text"
//         placeholder="API Key"
//         value={apiKey}
//         onChange={e => setApiKey(e.target.value)}
//       />
//       <input
//         type="text"
//         placeholder="API Secret"
//         value={apiSecret}
//         onChange={e => setApiSecret(e.target.value)}
//       />
//       <input
//         type="text"
//         placeholder="Symbol"
//         value={symbol}
//         onChange={e => setSymbol(e.target.value)}
//       />
//       <input
//         type="number"
//         placeholder="Buy Threshold (%)"
//         value={buyThreshold}
//         onChange={e => setBuyThreshold(Number(e.target.value))}
//       />
//       <input
//         type="number"
//         placeholder="Initial Stop-Loss Threshold (%)"
//         value={stopLossThreshold}
//         onChange={e => setStopLossThreshold(Number(e.target.value))}
//       />
//       <input
//         type="number"
//         placeholder="Trailing Stop Threshold (%)"
//         value={trailingStopThreshold}
//         onChange={e => setTrailingStopThreshold(Number(e.target.value))}
//       />
//       <input
//         type="number"
//         placeholder="Main Trailing Stop Threshold (%)"
//         value={mainTrailingStopThreshold}
//         onChange={e => setMainTrailingStopThreshold(Number(e.target.value))}
//       />
//       <input
//         type="number"
//         placeholder="USDT Amount"
//         value={usdtAmount}
//         onChange={e => setUsdtAmount(Number(e.target.value))}
//       />
//       <button onClick={startMonitoring}>Start Monitoring</button>
//       <button onClick={stopMonitoring}>Stop Monitoring</button>
//       <div>
//         <p>Initial Price: {initialPrice}</p>
//         <p>Current Price: {currentPrice}</p>
//         <p>Minimum Price: {minPrice}</p>
//         <p>Buy Price: {buyPrice}</p>
//         <p>Last Sell Price: {lastSellPrice}</p>
//       </div>
//     </div>
//   );
// };
export default App;
