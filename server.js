const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for large resume text

/**
 * Utility to extract JSON from AI response
 * Handles markdown code blocks and extra text
 */
function extractJSON(text) {
    try {
        // Try to find JSON block in markdown
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                          text.match(/```([\s\S]*?)```/) ||
                          [null, text];
        
        const cleanText = jsonMatch[1] ? jsonMatch[1].trim() : text.trim();
        return JSON.parse(cleanText);
    } catch (e) {
        console.error('Failed to extract JSON from:', text);
        throw new Error('Invalid JSON format in AI response');
    }
}

// 1. AI BACKEND - Analyze Resume
app.post('/api/analyze', async (req, res) => {
    const { resumeText } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('Error: GEMINI_API_KEY is missing in .env');
        return res.status(500).json({ error: 'Server configuration error: API key missing.' });
    }

    if (!resumeText || resumeText.trim().length < 50) {
        return res.status(400).json({ error: 'Resume text is too short or missing. Please upload a valid file.' });
    }

    const prompt = `
        You are an elite Career Consultant and ATS (Applicant Tracking System) Expert. 
        Analyze the following resume text with high precision.
        
        Resume Content:
        """
        ${resumeText}
        """

        Your goal is to provide a deep, actionable assessment in JSON format.
        
        Expected JSON structure:
        {
            "ats_score": (number 0-100, be realistic),
            "score_feedback": "A concise, professional explanation of the score.",
            "professional_summary": "A powerful 2-3 sentence summary highlighting their top value proposition.",
            "skills": ["Skill 1", "Skill 2", ... (list at least 10 core technical and soft skills)],
            "job_recommendations": [
                {"role": "Specific Job Title", "reason": "Explain why this matches their experience"}
            ],
            "improvements": "Markdown list of 4-5 high-impact, specific improvements for better ATS ranking."
        }
        
        CRITICAL: 
        1. Return ONLY the JSON object.
        2. Ensure all text is properly escaped for JSON.
        3. Do not include any conversational filler.
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2, // Lower temperature for more consistent JSON
                    topP: 0.8,
                    topK: 40
                }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Gemini API Error:', errorBody);
            throw new Error(`AI Service Error: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('Unexpected AI Response Structure:', JSON.stringify(data));
            throw new Error('The AI model failed to generate a response. Please try again.');
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const parsedData = extractJSON(rawText);
        
        res.json(parsedData);

    } catch (error) {
        console.error('Backend Process Error:', error.message);
        res.status(500).json({ 
            error: error.message.includes('JSON') 
                ? 'Failed to process AI results. Please try again.' 
                : error.message 
        });
    }
});

// 2. SERVE STATIC FILES
// Only serve files from the 'public' directory for security
app.use(express.static(path.join(__dirname, 'public')));

// 3. SPA ROUTING
// Catch-all to serve index.html for any frontend route
app.get('*path', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`
🚀 ResumeSeek Backend Finalized
📡 Server: http://localhost:${PORT}
📁 Public Folder: ${path.join(__dirname, 'public')}
    `);
});

module.exports = app;

