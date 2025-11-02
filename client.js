document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatWindow = document.getElementById('chat-window');
    const micBtn = document.getElementById('mic-btn'); // New mic button

    
    // --- NEW: Smart API URL ---
    // This code checks if you are on localhost or a live server
    
    // !! IMPORTANT !!
    // Change this to your REAL backend URL from Render
    const productionApiUrl = 'https://server-ai-3.onrender.com'; 
    const localApiUrl = 'http://localhost:5001';

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE_URL = isLocal ? localApiUrl : productionApiUrl;

    console.log(`API is set to: ${API_BASE_URL}`);
    // --- End of NEW ---

    
    // --- NEW: Voice Recognition Setup ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false; // Stop after one phrase
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        // When the mic button is clicked
        micBtn.addEventListener('click', () => {
            if (micBtn.classList.contains('recording')) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });

        // When recognition starts
        recognition.addEventListener('start', () => {
            micBtn.classList.add('recording');
            micBtn.innerHTML = '...';
            messageInput.placeholder = 'Listening...';
        });

        // When recognition ends
        recognition.addEventListener('end', () => {
            micBtn.classList.remove('recording');
            micBtn.innerHTML = '🎤';
            messageInput.placeholder = 'Type or say something...';
        });

        // When speech is recognized
        recognition.addEventListener('result', (event) => {
            const speechResult = event.results[0][0].transcript;
            messageInput.value = speechResult;
            // Automatically submit the form with the recognized text
            chatForm.requestSubmit();
        });

        // Handle errors
        recognition.addEventListener('error', (event) => {
            console.error('Speech recognition error:', event.error);
            messageInput.placeholder = 'Voice error. Please type.';
        });

    } else {
        // If the browser doesn't support voice
        console.warn('Speech Recognition not supported in this browser.');
        micBtn.style.display = 'none'; // Hide the button
    }
    // --- End of Voice Setup ---


    // Handle form submission (when user clicks 'Send' or presses Enter)
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Stop the page from reloading
        
        const message = messageInput.value.trim();
        if (!message) return; // Don't send empty messages

        displayMessage(message, 'user');
        messageInput.value = ''; // Clear the input
        displayTypingIndicator(true); // Show "AI is typing..."

        try {
            // --- CRITICAL CHANGE ---
            // This simple path works now because the server serves this file.
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // The new server only needs the message.
                body: JSON.stringify({ 
                    message: message 
                }),
            });

            displayTypingIndicator(false); // Hide "AI is typing..."

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const errorMsg = errorData ? errorData.reply : `Network response was not ok (${response.status})`;
                throw new Error(errorMsg);
            }

            const data = await response.json();
            displayMessage(data.reply, 'ai');

        } catch (error) {
            console.error('Fetch Error:', error);
            displayTypingIndicator(false); // Hide typing on error too
            displayMessage(`Sorry, an error occurred: ${error.message}`, 'ai');
        }
    });

    // Function to add a new message to the chat window
    function displayMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
        
        // Use innerText to prevent HTML injection and render newlines
        messageElement.innerText = message; 
        
        chatWindow.appendChild(messageElement);
        chatWindow.scrollTop = chatWindow.scrollHeight; // Auto-scroll
    }

    // --- NEW: Typing Indicator Function ---
    function displayTypingIndicator(isTyping) {
        let indicator = document.getElementById('typing-indicator');
        if (isTyping) {
            if (indicator) return; // Already typing
            indicator = document.createElement('div');
            indicator.id = 'typing-indicator';
            indicator.classList.add('message', 'typing-indicator');
            indicator.innerHTML = '<span></span><span></span><span></span>';
            chatWindow.appendChild(indicator);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        } else {
            if (indicator) {
                indicator.remove();
            }
        }
    }

    // This is the first AI message when the page loads
    // We moved this to the end to make sure all functions are defined
    setTimeout(() => {
        const connectingMsg = document.querySelector('.ai-message');
        if (connectingMsg && connectingMsg.innerText === 'Connecting to your friend... 👋') {
            connectingMsg.innerText = 'Hi there! 👋 I\'m your AI friend. To make our chat perfect, could you let me know if you are a boy or a girl?';
        }
    }, 1000); // 1-second delay
});