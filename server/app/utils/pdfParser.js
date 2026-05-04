const { PDFParse } = require("pdf-parse");
const Tesseract = require("tesseract.js");

// PDF MCQ parser
const parseMCQFromPDF = async (buffer) => {
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

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Section detection
            if (/Section\s*A/i.test(line)) currentMarks = 1;
            else if (/Section\s*B/i.test(line)) currentMarks = 2;
            else if (/Section\s*C/i.test(line)) currentMarks = 5;

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
                    marks: currentMarks
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
        return questions.filter(q => q.options.length >= 2);
        
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
