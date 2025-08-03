# 🚘 AI Chatbot for Tire Shopping

This is a full-stack AI-powered chatbot application for tire discovery and ordering, built with **React**, **Express**, **OpenAI**, and **Stripe**. It allows users to search for tires using natural language, view product info, and seamlessly place an order with online payment support.

---

## 🧠 Features

### 💬 1. AI-Powered Chat with OpenAI
- Uses the **OpenAI API** to provide intelligent and conversational replies to tire-related queries.
- Users can ask questions like:
  - "Do you have Michelin Pilot Sport 4?"
  - "Tires for Honda Civic 2018"
  - "Tires with size 275/65R18"

### 🎤 2. Voice Interaction (Speech Recognition)
- Integrated **Web Speech API** for real-time voice-to-text.
- Users can speak to the chatbot for a hands-free experience.

### 💳 3. Stripe Payment Integration
- Secure checkout using **Stripe API**.
- Users can:
  - Select tire quantity and shipping details.
  - Checkout via card payment.
  - See success screen upon payment.

### 🌐 4. React Frontend
- Clean UI built with **React + Tailwind CSS**
- Components:
  - Chat UI
  - Tire listing cards
  - Order form with validation
  - Payment success screen

### 🔧 5. Express Backend
- **API routes:**
  - `POST /api/chatbot` → handles AI responses and tire matching from JSON dataset.
  - `POST /api/stripe/create-checkout-session` → starts Stripe payment.
  - `POST /api/order/place` → stores order data (in-memory for now).
- Dataset-driven response from `dataset.json`

---

## 🗂️ Folder Structure

tire-chatbot/
├── frontend/ # React app with chatbot UI & voice input
├── backend/ # Express server with routes
│ ├── chat.js # AI query + dataset logic
│ ├── stripe.js # Stripe payment session
│ ├── order.js # In-memory order storage
│ └── dataset.json # Tire listings
└── .env # OpenAI + Stripe keys (not committed)

yaml
Copy
Edit
