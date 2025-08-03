import React from 'react';
import { Link } from 'react-router-dom';

function Success() {
  return (
    <div style={{ textAlign: 'center', marginTop: 50 }}>
      <h2>✅ Payment Successful!</h2>
      <p>Thank you for ordering with us. Your tires will be delivered soon 🚚</p>
      <Link to="/">
        <button>Return to Chat</button>
      </Link>
    </div>
  );
}

export default Success;
