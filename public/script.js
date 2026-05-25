window.addEventListener('error', (e) => console.error('Global Error:', e.error));
const API_URL = '/api/analyze';

// App State
const state = {
    selectedFile: null,
    extractedText: '',
    isAnalyzing: false
};

// DOM Elements
const elements = {
    dropZone: document.getElementById('dropZone'),
    resumeUpload: document.getElementById('resumeUpload'),
    fileInfo: document.getElementById('fileInfo'),
    fileName: document.getElementById('fileName'),
    removeFile: document.getElementById('removeFile'),
    processSection: document.getElementById('processSection'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    resultsSection: document.getElementById('resultsSection'),
    atsScore: document.getElementById('atsScore'),
    scoreCircle: document.getElementById('scoreCircle'),
    scoreFeedback: document.getElementById('scoreFeedback'),
    summaryContent: document.getElementById('summaryContent'),
    skillsList: document.getElementById('skillsList'),
    jobsList: document.getElementById('jobsList'),
    improvementContent: document.getElementById('improvementContent'),
    loader: document.querySelector('.loader'),
    btnText: document.querySelector('.btn-text'),
    heroSection: document.getElementById('heroSection')
};

// Initialize PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// --- File Handling ---
elements.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    elements.dropZone.classList.add('dragover');
});

elements.dropZone.addEventListener('dragleave', () => {
    elements.dropZone.classList.remove('dragover');
});

elements.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    elements.dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    handleFile(file);
});

elements.resumeUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleFile(file);
});

function handleFile(file) {
    if (!file) return;

    const allowedTypes = [
        'application/pdf', 
        'text/plain', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const isDocx = file.name.toLowerCase().endsWith('.docx');
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const isTxt = file.name.toLowerCase().endsWith('.txt');

    if (!allowedTypes.includes(file.type) && !isDocx && !isPdf && !isTxt) {
        console.log('File type rejected:', file.type, file.name);
        alert('Please upload a PDF, DOCX or TXT file.');
        return;
    }

    console.log('File accepted:', file.name, file.type);

    state.selectedFile = file;
    elements.fileName.textContent = file.name;
    elements.fileInfo.classList.remove('hidden');
    elements.processSection.classList.remove('hidden');
    document.querySelector('.upload-content').classList.add('hidden');
}

elements.removeFile.addEventListener('click', (e) => {
    e.stopPropagation();
    state.selectedFile = null;
    state.extractedText = '';
    elements.fileInfo.classList.add('hidden');
    elements.processSection.classList.add('hidden');
    document.querySelector('.upload-content').classList.remove('hidden');
    elements.resumeUpload.value = '';
});

// --- Text Extraction ---
async function extractText(file) {
    if (file.type === 'text/plain') {
        return await file.text();
    } else if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ') + '\n';
        }
        return text;
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        return result.value;
    }
    return '';
}

// --- Analysis Logic ---
elements.analyzeBtn.addEventListener('click', async () => {
    if (!state.selectedFile) return;

    try {
        setLoading(true);
        state.extractedText = await extractText(state.selectedFile);

        if (!state.extractedText.trim()) {
            throw new Error('Could not extract text from the file.');
        }

        const response = await callBackend(state.extractedText);
        displayResults(response);

        // Smooth transition to results
        elements.heroSection.style.opacity = '0';
        document.getElementById('howItWorks').style.display = 'none';
        document.getElementById('features').style.display = 'none';
        
        setTimeout(() => {
            elements.heroSection.classList.add('hidden');
            elements.resultsSection.classList.remove('hidden');
            elements.resultsSection.style.opacity = '0';
            setTimeout(() => {
                elements.resultsSection.style.opacity = '1';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 50);
        }, 400);

    } catch (error) {
        console.error(error);
        alert('Error analyzing resume: ' + error.message);
    } finally {
        setLoading(false);
    }
});

function setLoading(isLoading) {
    state.isAnalyzing = isLoading;
    elements.analyzeBtn.disabled = isLoading;
    elements.loader.classList.toggle('hidden', !isLoading);
    elements.btnText.textContent = isLoading ? 'Analyzing...' : 'Analyze Resume';
}

async function callBackend(resumeText) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze resume');
    }

    return await response.json();
}

function displayResults(data) {
    // ATS Score
    const score = data.ats_score || 0;
    elements.atsScore.textContent = score;
    elements.scoreFeedback.textContent = data.score_feedback || 'Based on your experience and skills.';

    // Animate Ring
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    elements.scoreCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    elements.scoreCircle.style.strokeDashoffset = circumference; // Start empty

    setTimeout(() => {
        const offset = circumference - (score / 100) * circumference;
        elements.scoreCircle.style.strokeDashoffset = offset;
    }, 600);

    // Summary
    elements.summaryContent.innerHTML = marked.parse(data.professional_summary || '');

    // Skills
    elements.skillsList.innerHTML = (data.skills || []).map(skill => `<span class="tag">${skill}</span>`).join('');

    // Jobs
    elements.jobsList.innerHTML = (data.job_recommendations || []).map(job => `
        <div class="job-item">
            <h4>${job.role}</h4>
            <p>${job.reason}</p>
        </div>
    `).join('');

    // Improvements
    elements.improvementContent.innerHTML = marked.parse(data.improvements || '');
}

// --- Reset App ---
function resetApp() {
    state.selectedFile = null;
    state.extractedText = '';
    
    // Reset UI
    elements.heroSection.classList.remove('hidden');
    elements.heroSection.style.opacity = '1';
    document.getElementById('howItWorks').style.display = 'block';
    document.getElementById('features').style.display = 'block';
    elements.resultsSection.classList.add('hidden');
    elements.fileInfo.classList.add('hidden');
    elements.processSection.classList.add('hidden');
    document.querySelector('.upload-content').classList.remove('hidden');
    elements.resumeUpload.value = '';
    
    // Reset Score
    elements.atsScore.textContent = '0';
    elements.scoreCircle.style.strokeDashoffset = '326.7';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.resetApp = resetApp;

// --- Mobile Menu Toggle ---
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navLinks = document.getElementById('navLinks');

if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = navLinks.classList.toggle('open');
        const icon = mobileMenuBtn.querySelector('i');
        if (icon) {
            if (isOpen) {
                icon.className = 'fas fa-times';
                mobileMenuBtn.setAttribute('aria-expanded', 'true');
            } else {
                icon.className = 'fas fa-bars';
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
        }
    });

    // Close menu when clicking any nav link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) icon.className = 'fas fa-bars';
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            if (navLinks.classList.contains('open')) {
                navLinks.classList.remove('open');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) icon.className = 'fas fa-bars';
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
        }
    });
}

console.log("ResumeSeek initialized.");

