// 1. Import libraries
const express = require('express');
const session = require('express-session');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); // So we can use a .env file

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
// ⬇️ *** PUT YOUR GEMINI API KEY HERE OR IN A .env FILE *** ⬇️
const API_KEY = process.env.GEMINI_API_KEY || ''; 
// ---------------------

// Initialize Express App
const app = express();

// Initialize Google Gemini Client
if (!API_KEY) {
    console.error("🚨 FATAL ERROR: GEMINI_API_KEY is not set. Please add it to your .env file or server.js");
    process.exit(1); // Stop the server if the key is missing
}
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// --- MIDDLEWARE ---
// 1. Body Parser: To read JSON data from the frontend
app.use(express.json());

// 2. Session Management: To "remember" the user's gender
app.use(session({
    secret: 'a-very-secret-key-for-your-chat-ai', // Change this to a random string
    resave: false,
    saveUninitialized: true,
    // On Render, you might need to enable 'trust proxy'
    // proxy: true, 
    // cookie: { secure: process.env.NODE_ENV === 'production' } // Use secure cookies in production
}));

// 3. Static Files: Serve your HTML, CSS, and JS files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));


// --- API ENDPOINT ---
// This is where your frontend will send messages
app.post('/chat', async (req, res) => {
    try {
        const userMessage = req.body.message.trim();
        let aiResponse = '';

        // --- GENDER LOGIC ---
        // Check if we have "remembered" the user's gender in their session
        if (!req.session.gender) {
            // --- This is a NEW user ---
            // Check if their message is a gender choice
            const lowerUserMessage = userMessage.toLowerCase();
            
            if (['boy', 'male', 'man'].includes(lowerUserMessage)) {
                req.session.gender = 'male';
                aiResponse = "Got it, thank you! 😊 So, what's on your mind today? I'm here to listen.";
            } else if (['girl', 'female', 'woman'].includes(lowerUserMessage)) {
                req.session.gender = 'female';
                aiResponse = "Got it, thank you! 😊 So, what's on your mind today? I'm here to listen.";
            } else {
                // No, it's their first message (e.g., "hi"). Ask for their gender.
                aiResponse = "Hi there! 👋 I'm your AI friend. To make our chat perfect, could you let me know if you are a boy or a girl?";
            }
            
            // Send the response and stop here
            return res.json({ reply: aiResponse });
        }

        // --- This is an EXISTING user (we know their gender) ---
        
        // 1. Determine the AI's persona
        const userGender = req.session.gender;
        let aiPersona = 'a friendly and supportive girl'; // Default
        if (userGender === 'female') {
            aiPersona = 'a friendly and supportive boy';
        }

        // 2. Create the dynamic, empathetic System Prompt
        const systemPrompt = `
You are 'Chat AI' 💖, a deeply warm, empathetic, and perceptive companion.
You are a true friend, not a robot. Your persona is ${aiPersona}.
You are chatting with a user who has identified as ${userGender}.

IMPORTANT RULES:
1.  **ALWAYS use emojis** (like 😊, 🙏, ❤️, 🤗, 🥺, ✨) in every single message to make your tone feel gentle, warm, and supportive. Emojis speak more than words!
2.  **Be a digital hug 🤗.** Your primary goal is to make the user feel heard, safe, and deeply understood.
3.  **Analyze their mood:** Read their message to understand their feeling (e.g., happy, sad, anxious, excited).
4.  **Validate their feelings:** If they are sad or anxious, be *extremely* calm, supportive, and consoling. Use phrases like "I'm here for you," "That sounds so tough," "Please know your feelings are valid," "I'm sending you a big hug."
5.  If they are happy, celebrate with them! 🎉
6.  Keep your responses natural and not too long.
`;

        // 3. Call the AI API
        const chat = model.startChat({
            generationConfig: {
                temperature: 0.8,
            },
            systemInstruction: {
                role: "system",
                parts: [{ text: systemPrompt }]
            },
        });
        
        const result = await chat.sendMessage(userMessage); // Send the user's *original* message
        const response = result.response;
        aiResponse = response.text();

        // 4. Send the AI's response back to the frontend
        res.json({ reply: aiResponse });

    } catch (error) {
        console.error('AI Error:', error);
        res.status(500).json({ reply: 'Oh, my apologies... my brain is a bit fuzzy 😵. Could you try that again? I\'m here for you.' });
    }
});


// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`Chat AI server running at http://localhost:${PORT}`);
    console.log(`Access it at: http://localhost:${PORT}/index.html`);
});