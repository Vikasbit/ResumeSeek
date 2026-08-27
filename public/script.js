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

// ============================================================
// Scroll Reveal Animation System
// ============================================================
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const delay = parseInt(entry.target.dataset.delay || '0', 10);
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, delay);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ============================================================
// Animated Stat Counter
// ============================================================
function animateCounter(el, target, duration = 1800) {
    let start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);
        
        el.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.count, 10);
            if (target) {
                animateCounter(el, target);
            }
            statObserver.unobserve(el);
        }
    });
}, { threshold: 0.3 });

document.querySelectorAll('.stat-number[data-count]').forEach(el => statObserver.observe(el));

// ============================================================
// Nav Scroll Effect
// ============================================================
const mainNav = document.getElementById('mainNav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (mainNav) {
        mainNav.classList.toggle('scrolled', scrollY > 20);
    }
    lastScroll = scrollY;
}, { passive: true });

// ============================================================
// Hero "Get Started" button scrolls to upload
// ============================================================
const heroGetStarted = document.getElementById('heroGetStarted');
if (heroGetStarted) {
    heroGetStarted.addEventListener('click', () => {
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            dropZone.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Flash the upload container
            setTimeout(() => {
                dropZone.style.borderColor = 'var(--accent-2)';
                dropZone.style.boxShadow = '0 0 0 4px rgba(232, 116, 12, 0.08), var(--shadow-lg)';
                setTimeout(() => {
                    dropZone.style.borderColor = '';
                    dropZone.style.boxShadow = '';
                }, 1200);
            }, 600);
        }
    });
}

// ============================================================
// File Handling
// ============================================================
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

// ============================================================
// Text Extraction
// ============================================================
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

// ============================================================
// Analysis Logic
// ============================================================
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
        const sectionsToHide = [
            elements.heroSection,
            document.getElementById('howItWorks'),
            document.getElementById('features'),
            document.querySelector('.hero-bg'),
            document.querySelector('.hero-upload-wrap')
        ];

        // Fade out
        elements.heroSection.style.transition = 'opacity 0.4s ease';
        elements.heroSection.style.opacity = '0';
        
        setTimeout(() => {
            sectionsToHide.forEach(el => {
                if (el) el.style.display = 'none';
            });
            elements.heroSection.classList.add('hidden');
            elements.resultsSection.classList.remove('hidden');
            elements.resultsSection.style.opacity = '0';
            elements.resultsSection.style.transition = 'opacity 0.5s ease';
            
            requestAnimationFrame(() => {
                elements.resultsSection.style.opacity = '1';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
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

    // Animate Ring (updated radius to 60 for larger ring)
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    elements.scoreCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    elements.scoreCircle.style.strokeDashoffset = circumference;

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

// ============================================================
// Reset App
// ============================================================
function resetApp() {
    state.selectedFile = null;
    state.extractedText = '';
    
    // Reset UI — restore all hidden sections
    const sectionsToRestore = [
        elements.heroSection,
        document.getElementById('howItWorks'),
        document.getElementById('features'),
        document.querySelector('.hero-bg'),
        document.querySelector('.hero-upload-wrap')
    ];

    sectionsToRestore.forEach(el => {
        if (el) el.style.display = '';
    });

    elements.heroSection.classList.remove('hidden');
    elements.heroSection.style.opacity = '1';
    elements.resultsSection.classList.add('hidden');
    elements.fileInfo.classList.add('hidden');
    elements.processSection.classList.add('hidden');
    document.querySelector('.upload-content').classList.remove('hidden');
    elements.resumeUpload.value = '';
    
    // Reset Score
    elements.atsScore.textContent = '0';
    const circumference = 2 * Math.PI * 60;
    elements.scoreCircle.style.strokeDashoffset = String(circumference);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.resetApp = resetApp;

// ============================================================
// Mobile Menu Toggle
// ============================================================
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
