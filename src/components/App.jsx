import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

import {
  Fon,
  Info,
  Control,
  Input,
  Header,
  Monitor,
  CurrentPrice,
  TradeInfo,
  InfoConteiner,
  Gallery,
  GalleryElement,
  Value,
  Title,
  Limits,
  InputLimit,
} from './app.styled';

const App = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [symbol, setSymbol] = useState('SOLUSDT');
  const [buyThreshold, setBuyThreshold] = useState(0.1);
  const [stopLossThreshold, setStopLossThreshold] = useState(5);
  const [trailingStopThreshold, setTrailingStopThreshold] = useState(0.1);
  const [mainTrailingStopThreshold, setMainTrailingStopThreshold] = useState(5);
  const [usdtAmount, setUsdtAmount] = useState(10);
  const [initialPrice, setInitialPrice] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [buyPrice, setBuyPrice] = useState(null);
  const [lastSellPrice, setLastSellPrice] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [mode, setMode] = useState('buy');
  const [botStartTime, setBotStartTime] = useState(null);
  const [operationStartTime, setOperationStartTime] = useState(null);
  const [mainTrailingStopActivated, setMainTrailingStopActivated] =
    useState(false);
  const [mainTrailingStopPrice, setMainTrailingStopPrice] = useState(null);

  const [initialTrailingStopActivated, setInitialTrailingStopActivated] =
    useState(false);
  // const [initialTrailingStopPrice, setInitialTrailingStopPrice] =
  //   useState(null);

  const [botBalance, setBotBalance] = useState(usdtAmount);
  const [coinBalance, setCoinBalance] = useState(0); // Новий стан для збереження балансу купленої монети

  const intervalRef = useRef(null);

  useEffect(() => {
    setBotBalance(usdtAmount);
  }, [usdtAmount]);

  const calculateQuantity = useCallback(
    price => Math.floor((botBalance / price) * 0.99987 * 1000) / 1000,
    [botBalance]
  );

  // Перевірка статусу ордера з повторною спробою
  const checkOrderStatusWithRetry = useCallback(
    async (orderId, maxRetries = 999, delay = 10000) => {
      let attempt = 0;
      let orderStatus = 'NEW';

      while (attempt < maxRetries) {
        try {
          const response = await axios.post(
            'http://localhost:3001/api/order/status',
            { apiKey, apiSecret, symbol, orderId }
          );
          orderStatus = response.data.status;

          console.log(`Order ${orderId} status: ${orderStatus}`);
          if (orderStatus === 'FILLED') {
            console.log(`Order ${orderId} filled.`);
            return orderStatus;
          }
        } catch (error) {
          console.error(
            'Error checking order status:',
            error.response?.data || error.message
          );
        }

        attempt++;
        console.log(`очікування ордера ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      console.error(
        `Order ${orderId} not filled after ${maxRetries} attempts.`
      );
      return orderStatus;
    },
    [apiKey, apiSecret, symbol]
  );

  // перевірка балансу
  const getBalance = useCallback(
    async asset => {
      try {
        const params = {
          apiKey,
          apiSecret,
          asset,
        };

        const response = await axios.post(
          'http://localhost:3001/api/balance',
          params
        );
        return parseFloat(response.data.balance);
      } catch (error) {
        console.error(
          'Error fetching balance:',
          error.response?.data || error.message
        );
        throw error;
      }
    },
    [apiKey, apiSecret]
  );

  const placeOrder = useCallback(
    async (side, quantity, price = null) => {
      try {
        const params = {
          apiKey,
          apiSecret,
          symbol,
          side,
          quantity,
          ...(price !== null && { price: parseFloat(price).toFixed(2) }),
        };

        if (
          !params.apiKey ||
          !params.apiSecret ||
          !params.symbol ||
          !params.side ||
          !params.quantity
        ) {
          throw new Error('Missing required parameters');
        }

        const response = await axios.post(
          'http://localhost:3001/api/order',
          params
        );
        console.log(response.data.fills);
        console.log(`мабуть розрахований коін баланс ${coinBalance}`);
        let totalQty = 0;

        response.data.fills.forEach(fill => {
          const qty = parseFloat(fill.qty);
          totalQty += qty;
        });
        console.log(totalQty);
        setCoinBalance(totalQty * 0.99987);
        console.log(`новий коін баланс з qty ${coinBalance}`);

        console.log('ордер:', response.data.orderId);

        const orderStatus = await checkOrderStatusWithRetry(
          response.data.orderId
        );
        if (orderStatus === 'FILLED') {
          return response.data;
        } else {
          console.error('Order not filled.');
          throw new Error('Order not filled.');
        }
      } catch (error) {
        console.error(
          'Error placing order:',
          error.response?.data || error.message
        );
        throw error;
      }
    },
    [apiKey, apiSecret, symbol, checkOrderStatusWithRetry, coinBalance]
  );
  const handleBuy = useCallback(
    async price => {
      // Перевірка, чи ціна покупки нижча за початкову ціну запуску бота
      console.log(`start bot prise: ${initialPrice}`);
      if (initialPrice <= (minPrice * (1 + buyThreshold / 100))?.toFixed(2)) {
        console.log(
          `Ціна покупки (${price}) не нижча за початкову ціну (${initialPrice}).`
        );
        return;
      }

      // Перевірка, чи ціна покупки нижча за останню ціну продажу
      if (
        lastSellPrice &&
        lastSellPrice <= (minPrice * (1 + buyThreshold / 100))?.toFixed(2)
      ) {
        console.log(
          `Ціна покупки (${price}) не нижча за останню ціну продажу (${lastSellPrice}).`
        );
        return;
      }

      const quantity = calculateQuantity(price);
      await placeOrder('BUY', quantity, price);
      setBuyPrice(price);
      setMinPrice(null);
      setMaxPrice(price);
      setCoinBalance(quantity * 0.99987); // Зберігаємо куплену кількість монет
      setBotBalance(0);
      setOperationStartTime(new Date());
      setMode('sell');
    },
    [
      calculateQuantity,
      placeOrder,

      initialPrice,
      lastSellPrice,
      buyThreshold,
      minPrice,
    ] // Додано initialPrice та lastSellPrice до залежностей
  );

  const handleSell = useCallback(
    async price => {
      const quantity = Math.floor(coinBalance * 1000) / 1000;
      await placeOrder('SELL', quantity, price);
      setLastSellPrice(price);
      setBuyPrice(null);
      setMaxPrice(null);

      setInitialTrailingStopActivated(false);
      //setInitialTrailingStopPrice(null);
      setBotBalance(prevBalance => prevBalance + quantity * price);
      setCoinBalance(0); // Очищаємо баланс монети після продажу

      setMinPrice(null); // Очищаємо мінімальну ціну для нової покупки
      setInitialPrice(price); // Очищаємо початкову ціну для нової покупки
      setOperationStartTime(new Date());
      setMode('buy');
    },
    [placeOrder, coinBalance]
  );

  const monitorForSell = useCallback(
    async price => {
      if (price > maxPrice) setMaxPrice(price);
      const trailingStopPrice =
        Math.floor((buyPrice + (maxPrice - buyPrice) * 0.6) * 1000) / 1000;
      //const trailingStopPrice = maxPrice * (1 - trailingStopThreshold / 100);
      const stopLossPrice = buyPrice * (1 - stopLossThreshold / 100);

      console.log(
        `maxPrice: ${maxPrice}, trailingStopPrice: ${trailingStopPrice}, price: ${price}, stopLossPrice: ${stopLossPrice}`
      );

      if (
        !initialTrailingStopActivated &&
        price >= buyPrice * (1 + trailingStopThreshold / 100)
      ) {
        setInitialTrailingStopActivated(true);
        // const calculatedInitialTrailingStopPrice =
        //   Math.floor((buyPrice + (maxPrice - buyPrice) * 0.6) * 1000) / 1000;
        // setInitialTrailingStopPrice(calculatedInitialTrailingStopPrice);
        // console.log(
        //   `Initial trailing stop activated at price: ${calculatedInitialTrailingStopPrice}`
        // );
      }

      if (
        initialTrailingStopActivated &&
        price >= buyPrice * (1 + mainTrailingStopThreshold / 100)
      ) {
        setMainTrailingStopActivated(true);
        const calculatedMainTrailingStopPrice =
          Math.floor((buyPrice + (maxPrice - buyPrice) * 0, 9) * 1000) / 1000;
        setMainTrailingStopPrice(calculatedMainTrailingStopPrice);
        console.log(
          `Main trailing stop activated at price: ${calculatedMainTrailingStopPrice}`
        );
      }

      const executeSellOrder = async sellPrice => {
        console.log(`Selling at price: ${sellPrice}`);
        console.log(`[lastSellPrice at price: ${lastSellPrice}`);
        console.log('Params for selling:', {
          side: 'SELL',
          quantity: coinBalance,
          price: sellPrice,
        });

        try {
          await handleSell(sellPrice);
          console.log('Sell order executed successfully.');
        } catch (error) {
          console.error('Error executing sell order:', error);
        }
      };

      const sufficientBalance =
        Math.floor(coinBalance * 0.99987 * 1000) / 1000 <=
        (await getBalance(symbol.replace('USDT', '')));
      console.log(`чи переписало: ${coinBalance}`);
      console.log(
        `бінанс баланс ${await getBalance(symbol.replace('USDT', ''))}`
      );
      if (!sufficientBalance) {
        console.log('Insufficient balance for selling.');
        return;
      }

      if (price <= stopLossPrice) {
        await executeSellOrder(stopLossPrice);
      } else if (initialTrailingStopActivated && price <= trailingStopPrice) {
        await executeSellOrder(trailingStopPrice);
      } else if (mainTrailingStopActivated && price <= mainTrailingStopPrice) {
        await executeSellOrder(mainTrailingStopPrice);
      }
    },
    [
      maxPrice,
      trailingStopThreshold,
      mainTrailingStopThreshold,
      stopLossThreshold,

      initialTrailingStopActivated,
      mainTrailingStopPrice,
      mainTrailingStopActivated,
      handleSell,
      buyPrice,
      coinBalance,

      getBalance,
      symbol,
      lastSellPrice,
    ]
  );

  const fetchPrice = useCallback(async () => {
    try {
      const response = await axios.get(
        `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
      );
      const price = parseFloat(response.data.price);

      setCurrentPrice(price);
      if (!initialPrice) setInitialPrice(price);
      if (!minPrice || price < minPrice) setMinPrice(price);

      await new Promise(resolve => setTimeout(resolve, 0));

      if (buyPrice) {
        await monitorForSell(price);
      } else if (
        minPrice &&
        price >= minPrice * (1 + buyThreshold / 100) &&
        (!lastSellPrice || price < lastSellPrice)
      ) {
        await handleBuy(price);
      }
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  }, [
    symbol,
    initialPrice,
    minPrice,
    buyThreshold,
    buyPrice,
    lastSellPrice,
    monitorForSell,
    handleBuy,
  ]);

  useEffect(() => {
    const fetchWithRateLimit = async () => {
      if (isMonitoring) {
        try {
          console.log(botBalance);
          await fetchPrice();
        } catch (error) {
          console.error('Error in fetchWithRateLimit:', error);
        }
      }
    };

    if (isMonitoring && !botStartTime) {
      setBotStartTime(new Date());
    }

    intervalRef.current = setInterval(fetchWithRateLimit, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isMonitoring, fetchPrice, botStartTime, botBalance]);

  const formatTime = date => {
    if (!date) return '00:00';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const calculateTimeDifference = startTime => {
    if (!startTime) return '00:00';
    const now = new Date();
    const diffMs = now - startTime;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHrs}h ${diffMins}m`;
  };

  return (
    <Fon>
      <Header>B_T_Bot</Header>
      <Monitor>
        <CurrentPrice>
          {currentPrice ? currentPrice.toFixed(2) : '00,00'}
        </CurrentPrice>
        <TradeInfo>
          <div>{mode === 'buy' ? 'Купівля' : 'Продаж'}</div>
        </TradeInfo>
      </Monitor>

      <Info>
        <InfoConteiner>
          {mode === 'buy' && (
            <Gallery>
              <GalleryElement>
                <Value>
                  {' '}
                  {lastSellPrice
                    ? lastSellPrice.toFixed(2)
                    : initialPrice?.toFixed(2)}
                </Value>
                <Title>Ціна відліку</Title>
              </GalleryElement>
              <GalleryElement>
                <Value>{minPrice?.toFixed(2)}</Value>
                <Title>Мінімальна ціна</Title>
              </GalleryElement>
              <GalleryElement>
                <Value>
                  {(minPrice * (1 + buyThreshold / 100))?.toFixed(2)}
                </Value>
                <Title>Прогнозована ціна викупу</Title>
              </GalleryElement>
              <GalleryElement>
                <Value>{botBalance}</Value>
                <Title>Торгова сума USDT</Title>
              </GalleryElement>
            </Gallery>
          )}
          {mode === 'sell' && (
            <Gallery>
              <GalleryElement>
                <Value>{buyPrice}</Value>
                <Title>Куплено за</Title>
              </GalleryElement>
              <GalleryElement>
                <Value>{maxPrice?.toFixed(2)}</Value>
                <Title>Максимальна ціна</Title>
              </GalleryElement>
              {initialTrailingStopActivated ? (
                <GalleryElement>
                  <Value>
                    {Math.floor(
                      (buyPrice + (maxPrice - buyPrice) * 0.6) * 1000
                    ) / 1000}
                  </Value>
                  <Title>фіксація позиції</Title>
                </GalleryElement>
              ) : (
                <GalleryElement>
                  <Value>
                    {(buyPrice * (1 + trailingStopThreshold / 100)).toFixed(2)}
                  </Value>
                  <Title>рівень безпеки</Title>
                </GalleryElement>
              )}

              <GalleryElement>
                <Value>{coinBalance}</Value>
                <Title>Кількість монети</Title>
              </GalleryElement>
            </Gallery>
          )}
          <Gallery>
            <GalleryElement>
              <Value>{formatTime(botStartTime)}</Value>
              <Title>Час запуску бота</Title>
            </GalleryElement>
            <GalleryElement>
              <Value>{calculateTimeDifference(botStartTime)}</Value>
              <Title>Тривалість роботи бота</Title>
            </GalleryElement>
            <GalleryElement>
              <Value>{formatTime(operationStartTime)}</Value>
              <Title>Час початку операції</Title>
            </GalleryElement>
            <GalleryElement>
              <Value>{calculateTimeDifference(operationStartTime)}</Value>
              <Title>Тривалість поточної операції</Title>
            </GalleryElement>
          </Gallery>
        </InfoConteiner>
      </Info>
      <Control>
        <Input
          type="text"
          placeholder="API Key"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
        />
        <Input
          type="text"
          placeholder="API Secret"
          value={apiSecret}
          onChange={e => setApiSecret(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Symbol"
          value={symbol}
          onChange={e => setSymbol(e.target.value)}
        />
        <Input
          type="number"
          placeholder="USDT Amount"
          value={usdtAmount}
          onChange={e => setUsdtAmount(parseFloat(e.target.value))}
        />
        <Limits>
          <InputLimit>
            <Title>Поріг купівлі (%)</Title>
            <Input
              type="number"
              placeholder="Buy Threshold (%)"
              value={buyThreshold}
              onChange={e => setBuyThreshold(parseFloat(e.target.value))}
            />
          </InputLimit>
          <InputLimit>
            <Title>Стоп-лосс (%)</Title>
            <Input
              type="number"
              placeholder="Stop Loss Threshold (%)"
              value={stopLossThreshold}
              onChange={e => setStopLossThreshold(parseFloat(e.target.value))}
            />
          </InputLimit>
          <InputLimit>
            <Title>рівень безпеки (%)</Title>
            <Input
              type="number"
              placeholder="Trailing Stop Threshold (%)"
              value={trailingStopThreshold}
              onChange={e =>
                setTrailingStopThreshold(parseFloat(e.target.value))
              }
            />
          </InputLimit>
          <InputLimit>
            <Title>трейлінг-стоп (%)</Title>
            <Input
              type="number"
              placeholder="Main Trailing Stop Threshold (%)"
              value={mainTrailingStopThreshold}
              onChange={e =>
                setMainTrailingStopThreshold(parseFloat(e.target.value))
              }
            />
          </InputLimit>
        </Limits>
        <button onClick={() => setIsMonitoring(!isMonitoring)}>
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </button>
      </Control>
    </Fon>
  );
};

export default App;
