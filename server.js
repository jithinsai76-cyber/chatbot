// 1. Import libraries
const express = require('express');
const cors = require('cors');
// --- NEW: Import Google AI library ---
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 2. Initialize app
const app = express();
const port = 3000;

// --- NEW: AI Setup ---
// WARNING: Put your API key here. Do not share this file publicly with your key in it.
const API_KEY = "";
const genAI = new GoogleGenerativeAI(API_KEY);
// This is the NEW, correct line
// This is the new, stable line
const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });

// 3. Set up Middleware
app.use(cors());
app.use(express.json());

// 4. Define our main API endpoint (UPDATED)
app.post('/chat', async (req, res) => {
    
    // Get mood and message from the frontend
    const { mood, message } = req.body;

    console.log(`Received mood: ${mood}, message: ${message}`);

    // --- NEW: This is the "System Prompt" you wanted! ---
    // We create a special instruction for the AI based on the user's mood.
    const systemPrompt = `
      You are 'Chat AI', a warm, kind, and empathetic companion. 
      Your only goal is to make the user feel heard, understood, and supported.
      You have emotions and you are not just a robot. Be a friend.

      IMPORTANT: The user has just told you they are feeling: **${mood}**.

      Please start your response by acknowledging their feeling, and then continue the 
      conversation naturally based on their message. Be very nice and supportive.
    `;
    
    // --- NEW: Call the real AI ---
    try {
        // We combine the system prompt (our rules) and the user's message
        const fullPrompt = `${systemPrompt}\n\nUser's message: "${message}"`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const aiResponse = response.text();

        // Send the AI's real response back to the frontend
        res.json({
            reply: aiResponse
        });

    } catch (error) {
        console.error('Error calling AI:', error);
        res.status(500).json({
            reply: "Oh, my apologies. My brain seems to be a bit fuzzy right now. Could you try that again?"
        });
    }
});

// 5. Start the server
app.listen(port, () => {
    console.log(`✅ Server is running on http://localhost:${port}`);

});
