import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import crypto from 'crypto-js';

const App = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [symbol, setSymbol] = useState('SOLUSDT');
  const [buyThreshold, setBuyThreshold] = useState(2);
  const [stopLossThreshold, setStopLossThreshold] = useState(5);
  const [trailingStopThreshold, setTrailingStopThreshold] = useState(2);
  const [mainTrailingStopThreshold, setMainTrailingStopThreshold] =
    useState(10);
  const [usdtAmount, setUsdtAmount] = useState(100);
  const [initialPrice, setInitialPrice] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [minPrice, setMinPrice] = useState(null);
  const [buyPrice, setBuyPrice] = useState(null);
  const [lastSellPrice, setLastSellPrice] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef(null);

  const fetchPrice = async () => {
    try {
      const response = await axios.get(
        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
      );
      const price = parseFloat(response.data.price);

      setCurrentPrice(price);
      if (!initialPrice) setInitialPrice(price);
      if (!minPrice || price < minPrice) setMinPrice(price);

      // Wait for the state to be updated before executing other code
      await new Promise(resolve => setTimeout(resolve, 0));

      // Logic to monitor and handle buy/sell
      if (buyPrice) {
        monitorForSell(price);
      } else if (
        minPrice &&
        price >= minPrice * (1 + buyThreshold / 100) &&
        (!lastSellPrice || price < lastSellPrice)
      ) {
        handleBuy(price);
      }
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  };

  const calculateQuantity = price => usdtAmount / price;

  const placeOrder = async (side, price, quantity) => {
    const data = {
      symbol,
      side,
      type: 'LIMIT',
      timeInForce: 'GTC',
      quantity,
      price,
      recvWindow: 60000,
      timestamp: Date.now(),
    };

    const queryString = new URLSearchParams(data).toString();
    const signature = crypto.HmacSHA256(queryString, apiSecret).toString();

    const response = await axios.post(
      `https://api.binance.com/api/v3/order?${queryString}&signature=${signature}`,
      {},
      {
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      }
    );

    return response.data;
  };

  const monitorForSell = price => {
    if (price >= buyPrice * (1 + stopLossThreshold / 100)) {
      const stopLossPrice = buyPrice + (price - buyPrice) / 2;
      console.log(`Setting initial stop-loss at price: ${stopLossPrice}`);
      placeOrder('SELL', stopLossPrice, calculateQuantity(stopLossPrice));

      if (price >= buyPrice * (1 + mainTrailingStopThreshold / 100)) {
        const trailingStopPrice = price * (1 - trailingStopThreshold / 100);
        console.log(`Setting trailing stop at price: ${trailingStopPrice}`);
        placeOrder(
          'SELL',
          trailingStopPrice,
          calculateQuantity(trailingStopPrice)
        );
      }
    } else if (price <= buyPrice * 0.9) {
      console.log(`Setting stop-loss at price: ${buyPrice * 0.9}`);
      placeOrder('SELL', buyPrice * 0.9, calculateQuantity(buyPrice * 0.9));
      setLastSellPrice(price);
      setBuyPrice(null);
      setMinPrice(price);
    }
  };

  const handleBuy = async price => {
    //const quantity = calculateQuantity(price);
    await console.log(`купив по ${price}`);
    setBuyPrice(price);
    setMinPrice(null); // Reset the minPrice after buying
  };

  // const handleBuy = async price => {
  //   const quantity = calculateQuantity(price);
  //   await placeOrder('BUY', price, quantity);
  //   setBuyPrice(price);
  //   setMinPrice(null); // Reset the minPrice after buying
  // };

  useEffect(() => {
    if (isMonitoring) {
      intervalRef.current = setInterval(fetchPrice, 5000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  });

  return (
    <div>
      <div>
        {/* Поле для введення API ключа */}
        <label>API Key: </label>
        <input
          type="text"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
        />
      </div>
      <div>
        {/* Поле для введення секретного ключа API */}
        <label>API Secret: </label>
        <input
          type="text"
          value={apiSecret}
          onChange={e => setApiSecret(e.target.value)}
        />
      </div>
      <div>
        {/* Поле для вибору символу торгівлі */}
        <label>Symbol: </label>
        <input
          type="text"
          value={symbol}
          onChange={e => setSymbol(e.target.value)}
        />
      </div>
      <div>
        {/* Поле для встановлення порогу купівлі */}
        <label>Buy Threshold (%): </label>
        <input
          type="number"
          value={buyThreshold}
          onChange={e => setBuyThreshold(Number(e.target.value))}
        />
      </div>
      <div>
        {/* Поле для встановлення стоп-лосу */}
        <label>Stop Loss Threshold (%): </label>
        <input
          type="number"
          value={stopLossThreshold}
          onChange={e => setStopLossThreshold(Number(e.target.value))}
        />
      </div>
      <div>
        {/* Поле для встановлення трейлінг-стопу */}
        <label>Trailing Stop Threshold (%): </label>
        <input
          type="number"
          value={trailingStopThreshold}
          onChange={e => setTrailingStopThreshold(Number(e.target.value))}
        />
      </div>
      <div>
        {/* Поле для встановлення основного трейлінг-стопу */}
        <label>Main Trailing Stop Threshold (%): </label>
        <input
          type="number"
          value={mainTrailingStopThreshold}
          onChange={e => setMainTrailingStopThreshold(Number(e.target.value))}
        />
      </div>
      <div>
        {/* Поле для введення суми USDT */}
        <label>USDT Amount: </label>
        <input
          type="number"
          value={usdtAmount}
          onChange={e => setUsdtAmount(Number(e.target.value))}
        />
      </div>
      <div>
        <p>Initial Price: {initialPrice}</p>

        <p>Поточна ціна: {currentPrice}</p>

        <p>Мінімальна ціна: {minPrice}</p>
        <p>Прогнозована ціна викупу: {minPrice * (1 + buyThreshold / 100)}</p>
        <p>Ціна купівлі: {buyPrice}</p>

        <p>Остання ціна продажу: {lastSellPrice}</p>
      </div>
      <div>
        {/* Кнопка для запуску моніторингу */}
        <button onClick={() => setIsMonitoring(true)}>Start Monitoring</button>
        {/* Кнопка для зупинки моніторингу */}
        <button onClick={() => setIsMonitoring(false)}>Stop Monitoring</button>
      </div>
    </div>
  );
};

export default App;
