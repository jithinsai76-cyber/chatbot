document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatWindow = document.getElementById('chat-window');

    // Handle form submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Stop the page from reloading
        
        const message = messageInput.value.trim();
        if (!message) return; // Don't send empty messages

        // 1. Display the user's message immediately
        displayMessage(message, 'user');

        // 2. Clear the input
        messageInput.value = '';

        // 3. Send the message to the backend and get a response
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            
            // 4. Display the AI's response
            displayMessage(data.reply, 'ai');

        } catch (error) {
            console.error('Fetch Error:', error);
            displayMessage('Sorry, I couldn\'t connect to the server. Please try again.', 'ai');
        }
    });

    // Function to add a new message to the chat window
    function displayMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
        messageElement.textContent = message;
        
        chatWindow.appendChild(messageElement);
        
        // Auto-scroll to the bottom
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
});