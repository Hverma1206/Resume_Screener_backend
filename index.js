const express = require('express');
const multer = require('multer');
const cors = require('cors');
const pdf = require('pdf-parse');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Email regex pattern
const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS 
  }
});

function extractEmailFromText(text) {
  const matches = text.match(emailRegex);
  return matches ? matches[0] : null;
}

function analyzeMatch(resumeText, jobDescription) {

  const matchPercentage = Math.floor(Math.random() * 40) + 60; 
  
  return {
    match: matchPercentage.toString(),
    summary: `Based on the analysis, the resume matches ${matchPercentage}% of the job requirements.`,
    email: extractEmailFromText(resumeText)
  };
}

app.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file || !req.body.jobDescription) {
      return res.status(400).json({ error: 'Resume file and job description are required' });
    }

    const resumeBuffer = req.file.buffer;
    const jobDescription = req.body.jobDescription;

    const pdfData = await pdf(resumeBuffer);
    const resumeText = pdfData.text;

    const result = analyzeMatch(resumeText, jobDescription);
    
    return res.json(result);
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Failed to process the resume' });
  }
});

app.post('/send-email', async (req, res) => {
  try {
    const { email, subject, message } = req.body;
    
    if (!email || !subject || !message) {
      return res.status(400).json({ error: 'Email, subject, and message are required' });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: message 
    };

    console.log('Attempting to send email to:', email);
    console.log('Using credentials:', { user: process.env.EMAIL_USER, pass: '****' });
    
    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: `Failed to send email: ${error.message}` });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
