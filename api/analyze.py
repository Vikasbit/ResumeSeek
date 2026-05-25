from http.server import BaseHTTPRequestHandler
import json
import os
import re
import requests as http_client
from dotenv import load_dotenv

load_dotenv()


def extract_json(text):
    try:
        match = re.search(r'```json\s*([\s\S]*?)\s*```', text)
        if not match:
            match = re.search(r'```\s*([\s\S]*?)\s*```', text)
        clean_text = match.group(1).strip() if match else text.strip()
        return json.loads(clean_text)
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON format in AI response")


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        data = json.loads(body)

        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            self._send(500, {"error": "Server configuration error: API key missing."})
            return

        resume_text = data.get('resumeText', '')
        if not resume_text or len(resume_text.strip()) < 50:
            self._send(400, {"error": "Resume text is too short or missing."})
            return

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

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={api_key}"
        request_body = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "topP": 0.8, "topK": 40}
        }

        try:
            response = http_client.post(url, json=request_body, timeout=60)
            if response.status_code != 200:
                raise Exception(f"AI Service Error: {response.reason}")

            ai_data = response.json()
            candidates = ai_data.get('candidates', [])
            if not candidates or 'content' not in candidates[0]:
                raise Exception("The AI model failed to generate a response.")

            raw_text = candidates[0]['content']['parts'][0]['text']
            parsed_data = extract_json(raw_text)
            self._send(200, parsed_data)

        except ValueError:
            self._send(500, {"error": "Failed to process AI results. Please try again."})
        except Exception as e:
            self._send(500, {"error": str(e)})

    def _send(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
