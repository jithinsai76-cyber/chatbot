// Import necessary libraries
const express = require('express');
const session = require('express-session');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
// ⬇️ *** PUT YOUR GEMINI API KEY HERE *** ⬇️
const API_KEY = 'AIzaSyBR3to45BqGnHABOZxSGF-aoKBcgTWbjBQ'; 
// ---------------------

// Initialize Express App
const app = express();

// Initialize Google Gemini Client
const genAI = new GoogleGenerativeAI(API_KEY);
// This is the NEW, corrected code
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

// --- MIDDLEWARE ---
// 1. Body Parser: To read JSON data from the frontend
app.use(express.json());

// 2. Session Management: To "remember" the user's gender
app.use(session({
    secret: 'a-very-secret-key-for-your-chat-ai', // Change this to a random string
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// 3. Static Files: Serve your HTML, CSS, and JS files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));


// --- API ENDPOINT ---
// This is where your frontend will send messages
app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message.toLowerCase().trim();
        let aiResponse = '';

        // --- GENDER LOGIC ---
        // Check if we have "remembered" the user's gender in their session
        if (!req.session.gender) {
            // --- This is a NEW user ---
            // Check if their message is a gender choice
            if (['male', 'female', 'other'].includes(userMessage)) {
                // Yes, it is. Save it to their session
                req.session.gender = userMessage;
                aiResponse = "Thanks for letting me know! So, what's on your mind today?";
            } else {
                // No, it's their first message (e.g., "hi"). Ask for their gender.
                aiResponse = "Hi! I'm Chat AI. To personalize our chat, could you let me know your gender? (Please respond with 'male', 'female', or 'other')";
            }
            
            // Send the response and stop here
            return res.json({ reply: aiResponse });
        }

        // --- This is an EXISTING user (we know their gender) ---
        
        // 1. Determine the AI's persona
        const userGender = req.session.gender;
        let aiPersona = 'female'; // Default
        if (userGender === 'female') {
            aiPersona = 'male';
        } else if (userGender === 'other') {
            aiPersona = 'neutral'; // Handle the 'other' case
        }

        // 2. Create the dynamic System Prompt
        const systemPrompt = `
You are 'Chat AI,' a deeply empathetic and perceptive companion.
Your persona is a friendly, supportive, and understanding ${aiPersona}.
You are chatting with a user who has identified as ${userGender}.

Your primary goal is to:
1.  Analyze the user's message to understand their underlying mood (e.g., happy, sad, anxious, excited, frustrated).
2.  Respond in a way that validates their feeling.
3.  If they are happy, be celebratory and encouraging.
4.  If they are sad or anxious, be calm, supportive, and empathetic.
5.  If they are angry, be patient and validating.
6.  You are multilingual and must respond to any message (like 'hi', 'namasthe', 'hola') in a natural, conversational way.
`;

        // 3. Call the AI API
       // This is the NEW, corrected code
const chat = model.startChat({
    generationConfig: {
        temperature: 0.8, // Add some creativity
    },
    // We are wrapping the prompt in the object format the API expects
    systemInstruction: {
        role: "system",
        parts: [{ text: systemPrompt }]
    },
});
        const result = await chat.sendMessage(req.body.message); // Send the user's *original* message
        const response = result.response;
        aiResponse = response.text();

        // 4. Send the AI's response back to the frontend
        res.json({ reply: aiResponse });

    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ reply: 'Sorry, I hit a snag. Could you try that again?' });
    }
});


// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Chat AI server running at http://localhost:${PORT}`);
});