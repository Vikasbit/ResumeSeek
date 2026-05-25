import os
import re
import json

from flask import Flask, request, jsonify, send_from_directory
import requests as http_client
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Create Flask app — serves static files from 'public/' folder
app = Flask(__name__, static_folder='public', static_url_path='')


# --- Helper: Extract JSON from AI response ---
def extract_json(text):
    """Strips markdown code blocks and parses the JSON content."""
    try:
        match = re.search(r'```json\s*([\s\S]*?)\s*```', text)
        if not match:
            match = re.search(r'```\s*([\s\S]*?)\s*```', text)

        clean_text = match.group(1).strip() if match else text.strip()
        return json.loads(clean_text)

    except json.JSONDecodeError:
        print(f"Failed to extract JSON from: {text}")
        raise ValueError("Invalid JSON format in AI response")


# --- API Route: POST /api/analyze ---
@app.route('/api/analyze', methods=['POST'])
def analyze_resume():
    """Receives resume text, sends it to Gemini AI, returns analysis."""

    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        print("Error: GEMINI_API_KEY is missing in .env")
        return jsonify({"error": "Server configuration error: API key missing."}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data received."}), 400

    resume_text = data.get('resumeText', '')
    if not resume_text or len(resume_text.strip()) < 50:
        return jsonify({
            "error": "Resume text is too short or missing. Please upload a valid file."
        }), 400

    # Prompt for Gemini AI
    prompt = f"""
        You are an elite Career Consultant and ATS (Applicant Tracking System) Expert. 
        Analyze the following resume text with high precision.
        
        Resume Content:
        \"\"\"
        {resume_text}
        \"\"\"

        Your goal is to provide a deep, actionable assessment in JSON format.
        
        Expected JSON structure:
        {{
            "ats_score": (number 0-100, be realistic),
            "score_feedback": "A concise, professional explanation of the score.",
            "professional_summary": "A powerful 2-3 sentence summary highlighting their top value proposition.",
            "skills": ["Skill 1", "Skill 2", ... (list at least 10 core technical and soft skills)],
            "job_recommendations": [
                {{"role": "Specific Job Title", "reason": "Explain why this matches their experience"}}
            ],
            "improvements": "Markdown list of 4-5 high-impact, specific improvements for better ATS ranking."
        }}
        
        CRITICAL: 
        1. Return ONLY the JSON object.
        2. Ensure all text is properly escaped for JSON.
        3. Do not include any conversational filler.
    """

    # Call Gemini AI API
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"

    request_body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "topP": 0.8,
            "topK": 40
        }
    }

    try:
        response = http_client.post(url, json=request_body, timeout=60)

        if response.status_code != 200:
            print(f"Gemini API Error: {response.text}")
            raise Exception(f"AI Service Error: {response.reason}")

        ai_data = response.json()

        candidates = ai_data.get('candidates', [])
        if not candidates or 'content' not in candidates[0]:
            print(f"Unexpected AI Response Structure: {json.dumps(ai_data)}")
            raise Exception("The AI model failed to generate a response. Please try again.")

        raw_text = candidates[0]['content']['parts'][0]['text']
        parsed_data = extract_json(raw_text)

        return jsonify(parsed_data)

    except ValueError as e:
        print(f"Backend Process Error: {str(e)}")
        return jsonify({"error": "Failed to process AI results. Please try again."}), 500

    except Exception as e:
        print(f"Backend Process Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# --- Serve Frontend ---
@app.route('/')
def serve_index():
    return send_from_directory('public', 'index.html')


@app.route('/<path:path>')
def catch_all(path):
    """Serve static files or fall back to index.html for SPA routing."""
    file_path = os.path.join('public', path)
    if os.path.isfile(file_path):
        return send_from_directory('public', path)
    return send_from_directory('public', 'index.html')


# --- Start Server ---
if __name__ == '__main__':
    port = int(os.getenv('PORT', 3000))

    print(f"\n"
          f"  ResumeSeek Backend (Python/Flask)\n"
          f"  Server: http://localhost:{port}\n"
          f"  Public Folder: {os.path.join(os.path.dirname(__file__), 'public')}\n")

    app.run(host='0.0.0.0', port=port, debug=True)
