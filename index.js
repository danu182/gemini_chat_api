// index.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// PASTIKAN API KEY ADA:
console.log('API Key Status:', process.env.GEMINI_API_KEY ? 'Loaded' : '⚠️ MISSING! Check your .env file!');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = "gemini-2.5-flash"; // Model yang Anda gunakan

app.use(cors());
app.use(express.json());

// Asumsi frontend (index.html, script.js) ada di folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

const PORT = 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

// --- ENDPOINT CHAT API ---
app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;
    try {
        // 1. Validasi input
        if(!Array.isArray(conversation) || conversation.length === 0) {
            return res.status(400).json({ error: 'Conversation array is empty or invalid.' });
        }

        // 2. Mapping format role untuk Gemini (pastikan hanya 'user' dan 'model')
        const contents = conversation.map(({ role, text }) => ({
            // Jika frontend mengirim 'bot', kita mapping ke 'model'
            role: role === 'bot' ? 'model' : role, 
            parts: [{ text }]
        }));

        // 3. Panggil Gemini API
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents
        });

        // 4. Kirim respons berhasil
        res.status(200).json({ result: response.text });
        
    } catch (e) {
        // 5. Penanganan Error (Mengembalikan 500)
        // Log error ke konsol server untuk debugging
        console.error("--- GEMINI API ERROR (Status 500) ---");
        console.error("Pesan Error:", e.message); 
        console.error("Objek Error Lengkap:", e); 
        console.error("Payload yang dikirim (DEBUG):", req.body);
        console.error("--------------------------------------");
        
        // Kirim error ke frontend
        res.status(500).json({ error: 'Failed to process chat request.' });
    }
});