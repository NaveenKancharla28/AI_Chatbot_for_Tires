// Chatbot.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { BsMic, BsMicMute } from "react-icons/bs";
import { useNavigate } from "react-router-dom";

function DiscountTireChatbot() {
  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        "You are a helpful Noah Tires assistant. Provide information about tires, wheels, deals, appointments, and more from noah Tires.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [lastTireModel, setLastTireModel] = useState(null); // Track last mentioned tire model
  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");
        setInput(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn("Speech Recognition not supported in this browser.");
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start(); 
      setIsListening(true);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const lowerInput = input.toLowerCase();
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    // Handle "show me the tires" after a specific tire query
    if (lowerInput.includes("show me the tires") && lastTireModel) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Fetching images for ${lastTireModel} tires...` },
      ]);

      try {
        const response = await axios.post("http://localhost:3001/api/chatbot/recommend", {
          tireModel: lastTireModel,
        });
        const { tires } = response.data;

        let updatedMessages = [...newMessages];

        if (tires.length > 0) {
          updatedMessages.push({
            role: "assistant",
            content: `Found ${tires.length} matching tires for ${lastTireModel}:`,
          });
          tires.forEach((tire) => {
            updatedMessages.push({
              role: "assistant",
              content: `
                <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0; border-radius: 8px;">
                  <img src="${tire.image_url}" alt="${tire.brand} ${tire.model}" style="width: 200px; height: auto;" onerror="this.src='https://via.placeholder.com/200?text=Image+Not+Found';" />
                  <p><strong>${tire.brand} ${tire.model}</strong> - Size: ${tire.size}</p>
                  <p>Price: $${tire.price.toFixed(2)} | Rating: ${tire.rating}</p>
                  <p>Stock: ${tire.stock}</p>
                  <a href="${tire.product_url}" target="_blank" style="color: blue; text-decoration: underline;">Buy Now</a>
                </div>
              `,
            });
          });
        } else {
          updatedMessages.push({
            role: "assistant",
            content: `No matching tires found for ${lastTireModel}.`,
          });
        }

        setMessages(updatedMessages);
        return;
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Sorry, could not fetch tire information: ${err.message}` },
        ]);
      }
      return;
    }

    // Handle requests for images/pictures/photos of tires/wheels
    if (
      lowerInput.includes("show") &&
      (lowerInput.includes("pictures") ||
        lowerInput.includes("images") ||
        lowerInput.includes("photos")) &&
      (lowerInput.includes("tires") ||
        lowerInput.includes("wheels") ||
        lowerInput.includes("tire") ||
        lowerInput.includes("wheel"))
    ) {
      let updatedMessages = [
        ...newMessages,
        { role: "assistant", content: "Fetching tire images from the database..." },
      ];

      try {
        // Dynamically extract tireModel, brand, or vehicle from input
        let tireModel = null;
        let brand = null;
        let make = null;
        let model = null;

        // Check for vehicle (e.g., "pictures of tires for nissan pathfinder")
        if (lowerInput.includes("for")) {
          const parts = lowerInput.split("for ");
          if (parts[1]) {
            const partsStr = parts[1].trim();
            const vehicleParts = partsStr.split(" ");
            make = vehicleParts[0];
            model = vehicleParts.slice(1).join(" "); // Handle multi-word models
          }
        }

        // Check for tire model or brand (e.g., "pictures of pirelli scorpion" or "pictures of michelin assurance")
        if (!tireModel) {
          // Simple regex to grab potential model after "of " (e.g., "michelin assurance")
          const modelMatch = lowerInput.match(/of\s+([\w\s]+)/i);
          if (modelMatch && modelMatch[1]) {
            const modelStr = modelMatch[1].trim().replace(/tires?|wheels?/, "").trim(); // Remove "tires" suffix
            const modelParts = modelStr.split(" ");
            brand = modelParts[0].toLowerCase();
            tireModel = modelParts.slice(1).join(" ").toLowerCase();
          }
        }

        setLastTireModel(tireModel || model); // Store for follow-ups

        const payload = {};
        if (brand && tireModel) {
          payload.tireModel = tireModel;
          payload.brand = brand; // If backend supports brand filter, add it; otherwise, adjust backend
        } else if (make && model) {
          payload.make = make;
          payload.model = model;
        } else if (tireModel) {
          payload.tireModel = tireModel;
        }

        const response = await axios.post("http://localhost:3001/api/chatbot/recommend", payload);
        const { tires } = response.data;

        if (tires.length > 0) {
          // For generic (no filters), limit to 5 random tires
          const displayTires = Object.keys(payload).length === 0 ? tires.sort(() => 0.5 - Math.random()).slice(0, 5) : tires;

          updatedMessages.push({
            role: "assistant",
            content: `Found ${displayTires.length} matching tires${tireModel ? ` for ${brand ? brand + ' ' : ''}${tireModel}` : make ? ` for ${make} ${model}` : ""}:`,
          });
          displayTires.forEach((tire) => {
            updatedMessages.push({
              role: "assistant",
              content: `
                <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0; border-radius: 8px;">
                  <img src="${tire.image_url}" alt="${tire.brand} ${tire.model}" style="width: 200px; height: auto;" onerror="this.src='https://via.placeholder.com/200?text=Image+Not+Found';" />
                  <p><strong>${tire.brand} ${tire.model}</strong> - Size: ${tire.size}</p>
                  <p>Price: $${tire.price.toFixed(2)} | Rating: ${tire.rating}</p>
                  <p>Stock: ${tire.stock}</p>
                  <a href="${tire.product_url}" target="_blank" style="color: blue; text-decoration: underline;">Buy Now</a>
                </div>
              `,
            });
          });
        } else {
          updatedMessages.push({
            role: "assistant",
            content: "No tire images found. Try specifying a model or vehicle!",
          });
        }

        updatedMessages.push({
          role: "assistant",
          content:
            'Here are the tire images. If you\'d like to order, say "redirect to order form" or "show me order form".',
        });

        setMessages(updatedMessages);
      } catch (err) {
        console.error("Error fetching images:", err);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Sorry, could not fetch images: ${err.message}` },
        ]);
      }
      return;
    }

    // Detect recommendation prompt like "show me tires for a [make] [model]"
    if (lowerInput.includes("show me tires for a")|| lowerInput.includes("find tires for a")|| lowerInput.includes("want to but tires for a")) {
      const parts = lowerInput.split("for a ");
      if (parts[1]) {
        const vehicleParts = parts[1].trim().split(" ");
        const make = vehicleParts[0];
        const model = vehicleParts[1];

        if (make && model) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Searching for tires for ${make} ${model}...` },
          ]);

          try {
            const response = await axios.post("http://localhost:3001/api/chatbot/recommend", {
              make,
              model,
            });
            const { tires } = response.data;

            let updatedMessages = [...newMessages];

            if (tires.length > 0) {
              updatedMessages.push({
                role: "assistant",
                content: `Found ${tires.length} matching tires:`,
              });
              tires.forEach((tire) => {
                updatedMessages.push({
                  role: "assistant",
                  content: `
                    <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0; border-radius: 8px;">
                      <img src="${tire.image_url}" alt="${tire.brand} ${tire.model}" style="width: 200px; height: auto;" onerror="this.src='https://via.placeholder.com/200?text=Image+Not+Found';" />
                    <p><strong>${tire.brand} ${tire.model}</strong> - Size: ${tire.size}</p>
                      <p>Price: $${tire.price.toFixed(2)} | Rating: ${tire.rating}</p>
                      <p>Stock: ${tire.stock}</p>
                      <a href="${tire.product_url}" target="_blank" style="color: blue; text-decoration: underline;">Buy Now</a>
                    </div>
                  `,
                });
              });
            } else {
              updatedMessages.push({
                role: "assistant",
                content: "No matching tires found. Try another vehicle!",
              });
            }

            setMessages(updatedMessages);
            return;
          } catch (err) {
            console.error("Error fetching recommendations:", err);
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: `Sorry, could not fetch recommendations: ${err.message}` },
            ]);
          }
        }
      }
    }

    // Local handling for order form redirect
    if (
      lowerInput.includes("order form") ||
      (lowerInput.includes("order") && lowerInput.includes("tire")) ||
      lowerInput.includes("redirect to order") ||
      lowerInput.includes("show me order form") ||
      lowerInput.includes("buy this tire") ||
      lowerInput.includes("i want to order") ||
      lowerInput.includes("i want to buy") ||
      lowerInput.includes("i want to purchase")

    ) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Redirecting you to the order form..." },
      ]);
      setTimeout(() => {
        navigate("/order");
      }, 1000);
      return;
    }

    // Handle zip code-based queries
    if (lowerInput.match(/^\d{5}$/)) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I don't have location-specific pricing or availability data. Please visit the Noah Tires website or contact a local store with your zip code (e.g., 85383) for the most accurate information.",
        },
      ]);
      return;
    }

    // Fallback to OpenAI for general queries
    try {
      const res = await axios.post("http://localhost:3001/api/chatbot", {
        messages: newMessages,
      });

      const botReply = {
        role: "assistant",
        content: res.data.reply,
      };

      // Update lastTireModel if the query mentions a tire model
      const tireModels = [
        "destination le3",
        "assurance all-season",
        "p zero",
        // Add other tire models as needed
      ];
      const matchedModel = tireModels.find((model) => lowerInput.includes(model));
      if (matchedModel) {
        setLastTireModel(matchedModel);
      }

      setMessages([...newMessages, botReply]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, something went wrong: ${err.message}` },
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-4xl font-bold text-red-600 tracking-wide">
            NOAH <span className="text-black">TIRE</span>
          </h1>
        </div>
        <nav className="hidden md:flex space-x-6 text-gray-700 font-medium">
          <a href="/tires" className="hover:text-red-600">Tires</a>
          <a href="/wheels" className="hover:text-red-600">Wheels</a>
          <a href="/accessories" className="hover:text-red-600">Accessories</a>
          <a href="/appointments" className="hover:text-red-600">Appointments</a>
          <a href="/tips" className="hover:text-red-600">Tips & Guides</a>
          <a href="/financing" className="hover:text-red-600">Financing</a>
          <a href="/fleet" className="hover:text-red-600">Fleet</a>
          <a href="/deals" className="hover:text-red-600">Deals</a>
        </nav>
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="What can we help you find?"
            className="border border-gray-300 rounded px-4 py-2"
          />
          <a href="/order" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Cart (0)
          </a>
        </div>
      </header>

      <div className="bg-gray-100 p-8 text-center">
        <h2 className="text-5xl font-bold text-black mb-4">WHEEL DEALS</h2>
        <p className="text-3xl text-red-600">$80 Instant Savings on Select Wheels</p>
        <button className="mt-4 bg-black text-white px-6 py-2 rounded uppercase hover:bg-gray-800">
          View Offers
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center p-4">
        <div className="w-full max-w-2xl bg-white shadow-xl rounded-xl p-6 flex flex-col h-[60vh]">
          <h1 className="text-3xl font-bold text-center text-red-600 mb-4">
            Noah Tires Chatbot
          </h1>

          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {messages.slice(1).map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-2xl ${
                    msg.role === "user" ? "bg-red-500 text-white" : "bg-gray-200 text-gray-800"
                  } relative`}
                >
                  {msg.role !== "user" && (
                    <div className="absolute -left-2 top-2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-gray-200 border-b-8 border-b-transparent"></div>
                  )}
                  {msg.role === "user" && (
                    <div className="absolute -right-2 top-2 w-0 h-0 border-t-8 border-t-transparent border-l-8 border-l-red-500 border-b-8 border-b-transparent"></div>
                  )}
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{msg.role === "user" ? "👤" : "🛞"}</span>
                    <b className="text-sm">{msg.role === "user" ? "You" : "Bot"}</b>
                  </div>
                  <span className="block text-sm">
                    {msg.content.startsWith("<img") ||
                    msg.content.includes("<a") ||
                    msg.content.includes("<div") ? (
                      <span dangerouslySetInnerHTML={{ __html: msg.content }} />
                    ) : (
                      msg.content
                    )}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-grow border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Ask about tires, wheels, deals, or speak into the mic..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={toggleListening}
              className={`p-2 rounded-full ${isListening ? "bg-red-600" : "bg-black"} text-white hover:opacity-90`}
              disabled={!recognitionRef.current}
            >
              {isListening ? <BsMicMute size={20} /> : <BsMic size={20} />}
            </button>
            <button
              onClick={sendMessage}
              className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 uppercase"
            >
              Send
            </button>
          </div>

          <div className="mt-6 text-center">
            <a
              href="/order"
              className="inline-block px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-full shadow-md uppercase"
            >
              Shop Products 🛞
            </a>
            <a
              href="/appointments"
              className="inline-block ml-4 px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-full shadow-md uppercase"
            >
              Schedule Service
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiscountTireChatbot;