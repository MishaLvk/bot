const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3001; // Можна змінити порт, якщо потрібно

app.use(cors());
app.use(bodyParser.json());

app.post('/api/order', async (req, res) => {
  const { apiKey, apiSecret, symbol, side, quantity, price } = req.body;

  // Додаємо перевірки на наявність усіх параметрів
  if (!apiKey || !apiSecret || !symbol || !side || !quantity || !price) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const params = {
      symbol,
      side,
      type: 'LIMIT',
      timeInForce: 'GTC',
      quantity,
      price,
      timestamp: Date.now(),
    };

    const queryString = new URLSearchParams(params).toString();
    console.log('queryString:', queryString); // Додаємо лог для перевірки queryString
    console.log('apiSecret:', apiSecret); // Додаємо лог для перевірки apiSecret

    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(queryString)
      .digest('hex');

    const config = {
      method: 'post',
      url: `https://api.binance.com/api/v3/order?${queryString}&signature=${signature}`,
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/json',
      },
    };

    const response = await axios.request(config);
    res.json(response.data);
  } catch (error) {
    console.error(
      'Error placing order:',
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.post('/api/balance', async (req, res) => {
  const { apiKey, apiSecret, asset } = req.body;

  if (!apiKey || !apiSecret || !asset) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const params = {
      timestamp: Date.now(),
    };

    const queryString = new URLSearchParams(params).toString();
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(queryString)
      .digest('hex');

    const config = {
      method: 'get',
      url: `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`,
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
    };

    const response = await axios.request(config);
    const balance = response.data.balances.find(b => b.asset === asset);

    if (!balance) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ balance: balance.free });
  } catch (error) {
    console.error(
      'Error fetching balance:',
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

// статус ордера
app.post('/api/order/status', async (req, res) => {
  const { apiKey, apiSecret, symbol, orderId } = req.body;

  // Перевірка наявності всіх необхідних параметрів
  if (!apiKey || !apiSecret || !symbol || !orderId) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const params = {
      symbol,
      orderId,
      timestamp: Date.now(),
    };

    const queryString = new URLSearchParams(params).toString();
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(queryString)
      .digest('hex');

    const config = {
      method: 'get',
      url: `https://api.binance.com/api/v3/order?${queryString}&signature=${signature}`,
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
    };

    const response = await axios.request(config);
    res.json(response.data);
  } catch (error) {
    console.error(
      'Error fetching order status:',
      error.response?.data || error.message
    );
    res.status(500).json({ error: error.response?.data || error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
