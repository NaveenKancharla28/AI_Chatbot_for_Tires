import React from 'react';
import { Link } from 'react-router-dom';

function Success() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center">
        <h2 className="text-3xl font-bold text-green-700 mb-4">✅ Payment Successful!</h2>
        <p className="text-lg text-gray-600 mb-6">
          Thank you for your order. Your tires are on the way! 🚚🛞
        </p>
        <Link to="/">
          <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
            Back to Chat
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Success;
