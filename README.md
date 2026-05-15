# ResumeSeek 🔍
### AI-Powered Resume Analyzer for ATS Optimization
 
ResumeSeek analyzes your resume like a recruiter would — and tells you exactly why it's getting filtered out by ATS systems. Upload your resume, get a full AI-generated career report in seconds.
 
---
 
## 🚀 Live Demo

 👉 **[Try ResumeSeek Live](https://resume-seek.vercel.app/)**
 
## ✨ Features
 
- 📄 **Resume Upload** — Supports PDF, DOCX, and TXT formats
- 🤖 **AI Analysis** — Powered by Google Gemini 1.5 Flash with an "Elite Career Consultant" prompt
- 📊 **ATS Match Score** — Animated progress ring showing how optimized your resume is
- 📝 **Professional Summary** — High-impact value proposition rewrite
- 🛠️ **Skills Extraction** — Identifies 10+ key technical and soft skills
- 💼 **Job Recommendations** — Personalized role suggestions based on your experience
- 📈 **Improvement Roadmap** — Specific, actionable suggestions to boost your ATS ranking
- 🔒 **Privacy-Friendly** — File parsing happens entirely client-side; only extracted text hits the server
---
 
## 🛠️ Tech Stack
 
| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| File Parsing | PDF.js, Mammoth.js |
| Markdown Rendering | marked.js |
| Backend | Node.js, Express |
| AI Engine | Google Gemini 1.5 Flash API |
| Deployment | Vercel |
 
---
 
## 🎨 Design
 
Luxury Tech aesthetic featuring:
- Dark mode with vibrant **orange & chocolate accents**
- **Glassmorphism** UI cards
- **Mesh gradient** backgrounds
- Smooth micro-animations
- Fully responsive (desktop, tablet, mobile)
---
 
## 📂 Project Structure
 
```
resumeseek/
├── public/
│   ├── index.html       # Main frontend
│   ├── style.css        # Styling & animations
│   └── script.js        # File handling & API calls
├── server.js            # Express backend & Gemini API integration
├── .env                 # API credentials (not committed)
├── vercel.json          # Vercel deployment config
└── package.json
```
 
---
 
## ⚙️ Getting Started
 
### Prerequisites
 
- Node.js v18+
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey)
### Installation
 
```bash
# Clone the repo
git clone https://github.com/your-username/resumeseek.git
cd resumeseek
 
# Install dependencies
npm install
 
# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env
 
# Start the server
node server.js
```
 
Open `http://localhost:3000` in your browser.
 
---
 
## 🌐 Deployment (Vercel)
 
```bash
# Install Vercel CLI
npm i -g vercel
 
# Deploy
vercel
```
 
Add `GEMINI_API_KEY` as an environment variable in your Vercel project settings.
 
---
 
## 📸 How It Works
 
1. User uploads a resume (PDF / DOCX / TXT)
2. Client-side libraries extract raw text from the file
3. Extracted text is sent to the Express backend
4. Backend calls Gemini 1.5 Flash with a structured career consultant prompt
5. AI returns a full report — score, summary, skills, recommendations, roadmap
6. Results are rendered beautifully in the UI
---
 
## 🤝 Contributing
 
Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.
 
---
 
## 📄 License
 
[MIT](LICENSE)
 
---
 
<p align="center">Built with 💻 by <a href="https://github.com/your-username">Vikas</a> — with a little help from Claude & Gemini along the way.</p>
