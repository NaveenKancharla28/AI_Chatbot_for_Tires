// chat.js
const express = require("express");
const router = express.Router();
const { OpenAI } = require("openai");
const tireDataset = require("../dataset.json");

// List of common tire brands (lowercase)
const tireBrands = [
  "michelin", "goodyear", "bridgestone", "pirelli", "continental",
  "hankook", "bfgoodrich", "dunlop", "yokohama", "falken"
];

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GET test route
router.get("/ping", (req, res) => {
  console.log("✅ GET /api/chatbot/ping hit");
  res.send("pong from chatbot");
});

// POST main route
router.post("/", async (req, res) => {
  console.log("✅ POST /api/chatbot hit");
  console.log("📥 Request Body:", req.body);

  try {
    const lastMessage = req.body.messages[req.body.messages.length - 1].content.toLowerCase();

    // Check for any tire model query
    const tireModels = tireDataset.map((tire) => ({
      brand: tire.brand.toLowerCase(),
      model: tire.model.toLowerCase(),
      full: `${tire.brand.toLowerCase()} ${tire.model.toLowerCase()}`,
    }));
    const matchedTire = tireModels.find(
      (tire) => lastMessage.includes(tire.full) || lastMessage.includes(tire.model)
    );

    if (matchedTire) {
      const matchingTires = tireDataset.filter(
        (tire) =>
          tire.brand.toLowerCase() === matchedTire.brand &&
          tire.model.toLowerCase() === matchedTire.model
      );

      if (matchingTires.length > 0) {
        let reply = `Found ${matchingTires.length} matching tires for ${matchedTire.brand} ${matchedTire.model}:`;
        matchingTires.forEach((tire) => {
          reply += `
            <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0; border-radius: 8px;">
              <img src="${tire.image_url}" alt="${tire.brand} ${tire.model}" style="width: 200px; height: auto;" />
              <p><strong>${tire.brand} ${tire.model}</strong> - Size: ${tire.size}</p>
              <p>Price: $${tire.price.toFixed(2)} | Rating: ${tire.rating}</p>
              <p>Stock: ${tire.stock}</p>
              <a href="${tire.product_url}" target="_blank">Buy Now</a>
            </div>
          `;
        });
        console.log("✅ Matched tire:", matchedTire.full);
        return res.json({ reply });
      } else {
        console.log("❌ No matching tires found for:", matchedTire.full);
        return res.json({ reply: `No ${matchedTire.full} tires found in the database.` });
      }
    }

    // Check for specific tire queries or vehicle-specific tire queries (e.g., "tires for nissan pathfinder 215/65r17" or "tires for hankook assurance all season 195/65r15")
    if (!matchedTire && lastMessage.includes("tires for")) {
      const parts = lastMessage.split("for ");
      if (parts[1]) {
        const queryStr = parts[1].trim();
        // Extract potential brand/make, model, and optional size
        const sizeMatch = queryStr.match(/(\d{3}\/\d{2}r\d{2})/i);
        const queryParts = queryStr.replace(sizeMatch ? sizeMatch[0] : "", "").trim().split(" ");
        const potentialBrandOrMake = queryParts[0];

        if (tireBrands.includes(potentialBrandOrMake)) {
          // Treat as tire brand + model + size
          const brand = potentialBrandOrMake;
          const modelStr = queryParts.slice(1).join(" ").toLowerCase();

          let matchingTires = tireDataset.filter(
            (tire) =>
              tire.brand.toLowerCase() === brand &&
              tire.model.toLowerCase().includes(modelStr)
          );

          if (sizeMatch) {
            matchingTires = matchingTires.filter((tire) => tire.size.toLowerCase() === sizeMatch[0].toLowerCase());
          }

          if (matchingTires.length > 0) {
            let reply = `Found ${matchingTires.length} matching tires for ${brand} ${modelStr}${sizeMatch ? ` (${sizeMatch[0]})` : ""}:`;
            matchingTires.forEach((tire) => {
              reply += `
                <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0; border-radius: 8px;">
                  <img src="${tire.image_url}" alt="${tire.brand} ${tire.model}" style="width: 200px; height: auto;" />
                  <p><strong>${tire.brand} ${tire.model}</strong> - Size: ${tire.size}</p>
                  <p>Price: $${tire.price.toFixed(2)} | Rating: ${tire.rating}</p>
                  <p>Stock: ${tire.stock}</p>
                  <a href="${tire.product_url}" target="_blank">Buy Now</a>
                </div>
              `;
            });
            console.log("✅ Matched tire brand/model:", brand, modelStr);
            return res.json({ reply });
          } else {
            console.log("❌ No matching tires for tire brand/model:", brand, modelStr);
            return res.json({ reply: `No ${brand} ${modelStr} tires found.` });
          }
        } else {
          // Treat as vehicle make + model + size
          const make = potentialBrandOrMake;
          const model = queryParts.slice(1).join(" ");

          let matchingTires = tireDataset.filter(
            (tire) =>
              tire.vehicle_make.toLowerCase() === make.toLowerCase() &&
              tire.vehicle_model.toLowerCase() === model.toLowerCase()
          );

          if (sizeMatch) {
            matchingTires = matchingTires.filter((tire) => tire.size.toLowerCase() === sizeMatch[0].toLowerCase());
          }

          if (matchingTires.length > 0) {
            let reply = `Found ${matchingTires.length} matching tires for ${make} ${model}${sizeMatch ? ` (${sizeMatch[0]})` : ""}:`;
            matchingTires.forEach((tire) => {
              reply += `
                <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0; border-radius: 8px;">
                  <img src="${tire.image_url}" alt="${tire.brand} ${tire.model}" style="width: 200px; height: auto;" />
                  <p><strong>${tire.brand} ${tire.model}</strong> - Size: ${tire.size}</p>
                  <p>Price: $${tire.price.toFixed(2)} | Rating: ${tire.rating}</p>
                  <p>Stock: ${tire.stock}</p>
                  <a href="${tire.product_url}" target="_blank">Buy Now</a>
                </div>
              `;
            });
            console.log("✅ Matched vehicle:", make, model);
            return res.json({ reply });
          } else {
            console.log("❌ No matching tires for vehicle:", make, model);
            return res.json({ reply: `No tires found for ${make} ${model}.` });
          }
        }
      }
    }

    // Fallback to OpenAI for other queries
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: req.body.messages,
    });

    const reply = completion.choices[0].message.content;
    console.log("📤 Reply from OpenAI:", reply);
    res.json({ reply });
  } catch (err) {
    console.error("❌ OpenAI API error:", err.message);
    res.status(500).json({ error: "OpenAI API failed" });
  }
});

// POST /image route
router.post("/image", (req, res) => {
  console.log("✅ POST /api/chatbot/image hit", req.body);
  const { brand, size, model } = req.body;

  const match = tireDataset.find(
    (t) =>
      (!brand || t.brand.toLowerCase() === brand.toLowerCase()) &&
      (!size || t.size === size) &&
      (!model || t.model.toLowerCase() === model.toLowerCase())
  );

  if (match) {
    console.log("✅ Image found:", match.image_url);
    res.json({ image: match.image_url });
  } else {
    console.log("❌ No image found for:", { brand, size, model });
    res.status(404).json({ error: "Image not found" });
  }
});

// Updated /recommend route to return all tires when no filters are provided
router.post("/recommend", (req, res) => {
  console.log("✅ POST /api/chatbot/recommend hit", req.body);
  const { make, model, tireModel } = req.body;

  let matchingTires = tireDataset;

  if (tireModel) {
    matchingTires = matchingTires.filter(
      (tire) => tire.model.toLowerCase() === tireModel.toLowerCase()
    );
  } else if (make && model) {
    matchingTires = matchingTires.filter(
      (tire) =>
        tire.vehicle_make.toLowerCase() === make.toLowerCase() &&
        tire.vehicle_model.toLowerCase() === model.toLowerCase()
    );
  }

  // Always return tires, even if no filters are applied
  console.log("✅ Found tires:", matchingTires.length);
  res.json({ tires: matchingTires, message: matchingTires.length === 0 ? "No matching tires found." : undefined });
});

// GET /tires route
router.get("/tires", (req, res) => {
  console.log("✅ GET /api/chatbot/tires hit");
  const tires = tireDataset.map((tire) => ({
    id: tire.id,
    name: `${tire.brand} ${tire.model} ${tire.size}`,
    price: tire.price,
  }));
  res.json(tires);
});

module.exports = router;