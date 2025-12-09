// script.js

document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');

    // Riwayat percakapan yang dikirim ke backend
    let conversationHistory = [];

    // --- Konstanta Pesan Error/Status ---
    const THINKING_MESSAGE = 'typing...'; // Mengubah menjadi 'typing...' agar mirip WA
    const ERROR_SERVER = 'Failed to get response from server.';
    const ERROR_NO_RESULT = 'Sorry, no response received.';

    /**
     * Menambahkan pesan ke chat box dan menangani scroll.
     */
    const addMessage = (sender, text, isThinking = false) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        
        const textElement = document.createElement('p');
        textElement.textContent = text;
        
        if (isThinking) {
            messageElement.setAttribute('data-status', 'thinking');
        }
        
        messageElement.appendChild(textElement);
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageElement;
    };

    /**
     * Mengupdate konten dan status pesan yang sudah ada.
     */
    const updateMessage = (element, newText, isError = false) => {
        if (element) {
            element.querySelector('p').textContent = newText;
            element.removeAttribute('data-status');
            if (isError) {
                element.classList.add('error-message');
            }
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    };

    // --- Handler Submit Chat ---
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userMessage = userInput.value.trim();

        if (!userMessage) return;

        // Nonaktifkan input dan tombol
        userInput.disabled = true;
        chatForm.querySelector('button[type="submit"]').disabled = true;

        // 1. Tambahkan pesan pengguna ke chat box & history
        addMessage('user', userMessage);
        conversationHistory.push({ role: 'user', text: userMessage });
        userInput.value = '';

        // 2. Tampilkan pesan "typing..."
        const thinkingMessageElement = addMessage('bot', THINKING_MESSAGE, true);

        try {
            // 3. Kirim permintaan POST ke backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ conversation: conversationHistory }),
            });

            const currentThinkingElement = document.querySelector('[data-status="thinking"]');

            if (!response.ok) {
                // Jika status HTTP adalah 4xx atau 5xx
                updateMessage(currentThinkingElement, ERROR_SERVER, true);
                conversationHistory.pop(); // Hapus pesan user dari history
                return;
            }

            const data = await response.json();

            // 4. Proses dan tampilkan respons AI
            if (data && data.result) {
                const aiResponse = data.result.trim();
                updateMessage(currentThinkingElement, aiResponse);
                
                // Tambahkan respons AI ke history dengan role 'model'
                conversationHistory.push({ role: 'model', text: aiResponse });
            } else {
                updateMessage(currentThinkingElement, ERROR_NO_RESULT, true);
                conversationHistory.pop();
            }

        } catch (error) {
            console.error('Network or Fetch Error:', error);
            const currentThinkingElement = document.querySelector('[data-status="thinking"]');
            updateMessage(currentThinkingElement, ERROR_SERVER, true);
            conversationHistory.pop();
            
        } finally {
            // Aktifkan kembali input dan tombol
            userInput.disabled = false;
            chatForm.querySelector('button[type="submit"]').disabled = false;
            userInput.focus();
        }
    });

    // Optional: Pesan selamat datang
    addMessage('bot', 'Halo! Saya adalah Gemini Chatbot. Ketik pesan Anda untuk memulai.');
});