const express = require('express');
const router = express.Router();

let orders = []; // in-memory orders. Replace with Firebase/DB in future.

router.post('/place', (req, res) => {
  const { customerName, address, tireId, quantity, phone } = req.body;

  if (!customerName || !address || !tireId || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newOrder = {
    id: Date.now().toString(),
    customerName,
    address,
    phone,
    tireId,
    quantity,
    status: 'Pending'
  };

  orders.push(newOrder);

  res.status(200).json({
    message: 'Order placed!',
    order: newOrder
  });
});

router.get('/all', (req, res) => {
  res.json(orders);
});

// New: Function to save order after payment (called from webhook)
function saveOrder(orderData) {
  const newOrder = {
    id: Date.now().toString(),
    ...orderData,
    status: 'Paid'
  };
  orders.push(newOrder);
  return newOrder;
}

module.exports = { router, saveOrder }; // Export router and saveOrder