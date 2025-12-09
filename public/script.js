// script.js

document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');

    let conversationHistory = [];
    const CHAT_API_ENDPOINT = '/api/chat';

    // --- Konstanta Pesan Error/Status ---
    const THINKING_MESSAGE = 'typing...'; 
    const ERROR_SERVER = 'Failed to get response from server.';
    const ERROR_NO_RESULT = 'Sorry, no response received.';

    /**
     * Mengambil waktu lokal saat ini dalam format HH:MM.
     */
    const getCurrentTime = () => {
        const now = new Date();
        return now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    /**
     * Menambahkan pesan ke chat box, termasuk waktu.
     */
    const addMessage = (sender, text, isThinking = false) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        
        const textElement = document.createElement('p');
        textElement.textContent = text;
        
        messageElement.appendChild(textElement);

        if (isThinking) {
            messageElement.setAttribute('data-status', 'thinking');
        } else {
            // Tambahkan elemen waktu (timestamp)
            const timeElement = document.createElement('span');
            timeElement.classList.add('message-time');
            timeElement.textContent = getCurrentTime(); 
            
            messageElement.appendChild(timeElement);
        }
        
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
            
            // Tambahkan waktu saat pesan 'typing...' diganti
            if (!isError) {
                const timeElement = document.createElement('span');
                timeElement.classList.add('message-time');
                timeElement.textContent = getCurrentTime();
                element.appendChild(timeElement);
            }
            
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

        // 1. Tambahkan pesan pengguna
        addMessage('user', userMessage);
        conversationHistory.push({ role: 'user', text: userMessage });
        userInput.value = '';

        // 2. Tampilkan pesan "typing..."
        const thinkingMessageElement = addMessage('bot', THINKING_MESSAGE, true);

        try {
            // 3. Kirim permintaan POST
            const response = await fetch(CHAT_API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ conversation: conversationHistory }),
            });

            const currentThinkingElement = document.querySelector('[data-status="thinking"]');

            if (!response.ok) {
                // Hapus pesan user dari history karena server gagal merespons
                conversationHistory.pop(); 
                updateMessage(currentThinkingElement, ERROR_SERVER, true);
                return;
            }

            const data = await response.json();

            // 4. Proses dan tampilkan respons AI
            if (data && data.result) {
                const aiResponse = data.result.trim();
                updateMessage(currentThinkingElement, aiResponse);
                conversationHistory.push({ role: 'model', text: aiResponse });
            } else {
                // Jika respons 200 OK tapi tidak ada hasil
                conversationHistory.pop();
                updateMessage(currentThinkingElement, ERROR_NO_RESULT, true);
            }

        } catch (error) {
            // Error jaringan (misal server mati)
            console.error('Network or Fetch Error:', error);
            const currentThinkingElement = document.querySelector('[data-status="thinking"]');
            conversationHistory.pop();
            updateMessage(currentThinkingElement, ERROR_SERVER, true);
            
        } finally {
            // Aktifkan kembali input dan tombol
            userInput.disabled = false;
            chatForm.querySelector('button[type="submit"]').disabled = false;
            userInput.focus();
        }
    });

    // Pesan selamat datang (ini TIDAK dimasukkan ke conversationHistory)
    addMessage('bot', 'Halo! Saya adalah Gemini Chatbot. Ketik pesan Anda untuk memulai.');
});