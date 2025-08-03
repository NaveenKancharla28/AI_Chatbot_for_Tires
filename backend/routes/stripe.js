const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
require('dotenv').config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout-session', async (req, res) => {
  const { tireName, price, quantity, customerName, phone, address } = req.body; // Add customer details

  try {
    // Parse price if it's a string like "$120"
    const parsedPrice = typeof price === 'string' ? parseFloat(price.replace('$', '')) : price;
    if (isNaN(parsedPrice)) {
      throw new Error('Invalid price format');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: tireName
            },
            unit_amount: Math.round(parsedPrice * 100) // Ensure integer cents
          },
          quantity: quantity
        }
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/cancel',
      metadata: { customerName, phone, address, tireName, quantity } // Add for webhook
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error.message, error.stack);
    res.status(500).json({ error: 'Stripe failed. Check server logs.' });
  }
});

module.exports = router;