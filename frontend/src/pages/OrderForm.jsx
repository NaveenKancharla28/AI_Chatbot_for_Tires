import React, { useState, useEffect } from "react";
import axios from "axios";

function OrderForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [tireName, setTireName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [tires, setTires] = useState([]);

  // Fetch tire options on component mount
  useEffect(() => {
    axios
      .get("http://localhost:3001/api/chatbot/tires")
      .then((response) => {
        setTires(response.data);
        if (response.data.length > 0) {
          setTireName(response.data[0].name); // Set default tire
          setPrice(response.data[0].price); // Set default price
        }
      })
      .catch((err) => {
        console.error("Error fetching tires:", err);
        setError("Could not load tire options.");
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      const response = await axios.post("http://localhost:3001/api/stripe/create-checkout-session", {
        tireName,
        price,
        quantity,
        customerName: name,
        phone,
        address,
      });

      window.location.href = response.data.url;
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 p-4 flex flex-col items-center">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-6 mt-10">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-4">🛞 Select Your Tire</h1>

        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold mb-4">🚚 Delivery Details</h2>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
            required
          />

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
            required
          />

          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Delivery Address"
            className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
            required
          />

          <select
            value={tireName}
            onChange={(e) => {
              setTireName(e.target.value);
              const selectedTire = tires.find((tire) => tire.name === e.target.value);
              setPrice(selectedTire ? selectedTire.price : 0);
            }}
            className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
            required
          >
            {tires.length === 0 && (
              <option value="" disabled>
                Loading tires...
              </option>
            )}
            {tires.map((tire) => (
              <option key={tire.id} value={tire.name}>
                {tire.name} - ${tire.price.toFixed(2)}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            placeholder="Quantity"
            min="1"
            className="w-full border border-gray-300 rounded px-4 py-2 mb-4"
            required
          />

          {error && <p className="text-red-600 mb-4">{error}</p>}

          <button
            type="submit"
            disabled={isProcessing || tires.length === 0}
            className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            {isProcessing ? "Processing..." : "Place Order & Pay"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default OrderForm;