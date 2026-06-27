const { PDFParse } = require("pdf-parse");
const Tesseract = require("tesseract.js");

// PDF MCQ parser
const parseMCQFromPDF = async (buffer, uiSections = []) => {
    let parser = null;
    try {
        parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        let text = data.text;
        
        // Handle scanned PDFs
        if (!text || text.trim().length < 50) {
            console.log("Empty text, OCR needed");
        }

        const questions = [];
        let currentQuestion = null;

        // Regex patterns
        const questionRegex = /^(\d+[\.\)]|\?)\s*(.+)/i;
        const optionRegex = /^([A-E][\.\)])\s*(.+)/i; 
        const answerRegex = /^(Answer|Ans|Correct|Correct Answer):\s*([A-E])\b/im;

        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        let currentMarks = 1;
        let currentSection = "General";
        let isStrictSectionMode = false;
        const sectionDurations = [];

        // Strict Section Header Regex: [Section: Name | Time: Minutes]
        const strictSectionRegex = /\[Section:\s*(.+?)\s*\|\s*Time:\s*(\d+)\]/i;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // UI-defined section detection
            let matchedUiSection = false;
            if (uiSections.length > 0) {
                const normalizedLine = line.toLowerCase().replace(/\[|\]/g, '').trim();
                const matchedSec = uiSections.find(s => normalizedLine.includes(s.name.toLowerCase()));
                if (matchedSec) {
                    currentSection = matchedSec.name;
                    matchedUiSection = true;
                    // We don't skip the line if it might contain a question immediately, but usually section headers are isolated.
                    if (normalizedLine === matchedSec.name.toLowerCase() || normalizedLine.startsWith('section')) {
                        continue;
                    }
                }
            }

            // Strict Section Header Regex: [Section: Name | Time: Minutes]
            const strictMatch = line.match(strictSectionRegex);
            if (!matchedUiSection && strictMatch) {
                isStrictSectionMode = true;
                currentSection = strictMatch[1].trim();
                const duration = parseInt(strictMatch[2], 10);
                if (!sectionDurations.find(s => s.name === currentSection)) {
                    sectionDurations.push({ name: currentSection, duration });
                }
                continue; // skip this line for question parsing
            } else if (!matchedUiSection && /(.+?)\s+Section/i.test(line)) {
                currentSection = line.match(/(.+?)\s+Section/i)[1].trim();
            } else if (!matchedUiSection && /Section\s+(.+)/i.test(line)) {
                currentSection = line.match(/Section\s+(.+)/i)[1].trim();
            } else if (!matchedUiSection && /Section\s*A/i.test(line)) {
                currentMarks = 1;
                currentSection = "Section A";
            } else if (/Section\s*B/i.test(line)) {
                currentMarks = 2;
                currentSection = "Section B";
            } else if (/Section\s*C/i.test(line)) {
                currentMarks = 5;
                currentSection = "Section C";
            }

            const qMatch = line.match(questionRegex);
            const oMatch = line.match(optionRegex);
            const aMatch = line.match(answerRegex);

            if (qMatch) {
                if (currentQuestion) questions.push(currentQuestion);
                
                // Fallback marks
                const qCount = questions.length + 1;
                if (qCount <= 60) currentMarks = 1;
                else if (qCount <= 80) currentMarks = 2;
                else currentMarks = 5;

                currentQuestion = {
                    questionText: qMatch[2],
                    options: [],
                    correctAnswer: "",
                    marks: currentMarks,
                    section: currentSection
                };
            } else if (oMatch && currentQuestion) {
                currentQuestion.options.push(oMatch[2]);
            } else if (currentQuestion && !oMatch && !aMatch && !qMatch) {
                // Multi-line text
                if (currentQuestion.options.length === 0) {
                    currentQuestion.questionText += " " + line;
                } else {
                    const lastIdx = currentQuestion.options.length - 1;
                    currentQuestion.options[lastIdx] += " " + line;
                }
            }
            
            // Extract answers
            if (aMatch && currentQuestion) {
                currentQuestion.correctAnswer = (aMatch[2] || aMatch[3]).toUpperCase();
            }
        }

        if (currentQuestion) questions.push(currentQuestion);

        // Filter valid questions
        const validQuestions = questions.filter(q => q.options.length >= 2);
        
        return {
            questions: validQuestions,
            isStrictSectionMode,
            sectionDurations
        };
        
    } catch (error) {
        console.error("PDF Parsing Error:", error);
        throw new Error("Failed to parse PDF: " + error.message);
    } finally {
        if (parser) await parser.destroy();
    }
};

// OCR Fallback
const performOCR = async (imageBuffer) => {
    const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
    return text;
};

module.exports = { parseMCQFromPDF };
