# 🚀 ResumeSeek — AI Resume Scanner

An AI-powered resume analyzer that gives you an **ATS (Applicant Tracking System) score**, identifies your skills, recommends job roles, and suggests improvements — all using Google's Gemini AI.

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML, CSS, JavaScript | User interface (upload, display results) |
| **Backend** | Python + Flask | Server & API logic |
| **AI Engine** | Google Gemini API | Resume analysis |
| **Styling** | Vanilla CSS + Google Fonts | Modern glassmorphism design |

## 📁 Project Structure

```
ResumeSeek/
├── public/              ← Frontend (what the user sees)
│   ├── index.html       ← Main HTML page
│   ├── style.css        ← All the styling (colors, layout, animations)
│   └── script.js        ← Frontend logic (file upload, API calls, display results)
│
├── app.py               ← Backend server (Python/Flask) — handles API requests
├── requirements.txt     ← Python dependencies (like package.json for Node)
├── .env                 ← Your secret API key (not shared on Git)
├── .gitignore           ← Files to exclude from Git
├── LICENSE              ← Project license
└── README.md            ← You are here!
```

## 🚀 How to Run

### Prerequisites
- **Python 3.8+** installed ([Download](https://www.python.org/downloads/))
- A **Google Gemini API Key** ([Get one free](https://aistudio.google.com/apikey))

### Step-by-Step

```bash
# 1. Clone the repository
git clone https://github.com/Vikasbit/ResumeSeek.git
cd ResumeSeek

# 2. Create a virtual environment (keeps dependencies isolated)
python -m venv venv

# 3. Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create your .env file with your API key
# Create a file called .env in the root folder with:
GEMINI_API_KEY=your_api_key_here

# 6. Run the server
python app.py
```

### 🌐 Open in Browser

Visit: **http://localhost:3000**

## 📖 How It Works

1. **Upload** your resume (PDF, DOCX, or TXT)
2. The frontend **extracts text** from the file using JavaScript libraries
3. The text is sent to the **Flask backend** (`POST /api/analyze`)
4. Flask forwards it to **Google Gemini AI** with a structured prompt
5. The AI returns an analysis with ATS score, skills, job recommendations, and improvements
6. The frontend **displays the results** in beautiful glass-morphism cards

## 🔑 Understanding the Code

### Backend (`app.py`)
- **Flask** creates the web server (like Express in Node.js)
- **`@app.route('/api/analyze')`** defines the API endpoint
- **`requests.post()`** calls the Gemini AI API
- **`jsonify()`** sends JSON responses back to the frontend

### Frontend (`public/`)
- **`index.html`** — The page structure (navigation, upload area, results cards)
- **`style.css`** — Modern design with glassmorphism, gradients, and animations
- **`script.js`** — Handles file upload, text extraction, API calls, and result display

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file.

## 👤 Author

**Vikas** — [GitHub](https://github.com/Vikasbit) · [LinkedIn](https://www.linkedin.com/in/vikaskp034/)
