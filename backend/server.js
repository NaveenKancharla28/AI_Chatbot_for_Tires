const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser'); // For raw body in webhook

dotenv.config();

const app = express();
const PORT = 3001;

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`➡️ Incoming request: ${req.method} ${req.url}`);
  next();
});

// Middleware before routes
app.use(cors());

// Webhook endpoint (must be before express.json() for raw body)
app.post('/api/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const Stripe = require('stripe');
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const { saveOrder } = require('./routes/order'); // Import saveOrder from order.js
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET); // Add webhook secret to .env
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Extract metadata (ensure added in stripe.js)
    const { customerName, phone, address, tireName, quantity } = session.metadata || {};
    const orderData = {
      customerName,
      address,
      phone,
      tireId: tireName, // Map tireName to tireId for consistency
      quantity,
      paymentId: session.payment_intent
    };
    const savedOrder = saveOrder(orderData);
    console.log('Order saved after payment:', savedOrder);
  }

  res.json({ received: true });
});

app.use(express.json());

// Route logs
console.log(" chat.js route loaded");

const chatbotRoutes = require('./routes/chat');
const { router: orderRoutes } = require('./routes/order'); // Updated import for router
const stripeRoutes = require('./routes/stripe');

app.use('/api/chatbot', chatbotRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stripe', stripeRoutes);

app.get('/', (req, res) => {
  res.send('🚀 Backend is running');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});