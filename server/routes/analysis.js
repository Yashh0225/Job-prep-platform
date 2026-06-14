import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import pdf from 'pdf-parse';
import { protect } from '../middleware/auth.js';
import AnalysisSession from '../models/AnalysisSession.js';
import { analyzeResumeVsJob, generateJobDescription } from '../services/gemini.js';

const router = Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

const cpUpload = upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'jobDescriptionFile', maxCount: 1 },
]);

// ─── Analyze Resume vs Job Description ──────────────────
router.post('/analyze', protect, cpUpload, async (req, res) => {
  try {
    const { jobTitle, company, jobDescription, descriptionMode } = req.body;
    if (!jobTitle) return res.status(400).json({ message: 'Job title is required' });

    // Parse resume PDF
    const resumeFile = req.files?.resume?.[0];
    if (!resumeFile) return res.status(400).json({ message: 'Resume PDF is required' });
    
    const resumeBuffer = fs.readFileSync(resumeFile.path);
    const resumeData = await pdf(resumeBuffer);
    const resumeText = resumeData.text;
    fs.unlinkSync(resumeFile.path);

    // Get job description based on mode
    let finalJD = jobDescription || '';
    if (descriptionMode === 'pdf' && req.files?.jobDescriptionFile?.[0]) {
      const jdBuffer = fs.readFileSync(req.files.jobDescriptionFile[0].path);
      const jdData = await pdf(jdBuffer);
      finalJD = jdData.text;
      fs.unlinkSync(req.files.jobDescriptionFile[0].path);
    } else if (descriptionMode === 'quick') {
      finalJD = await generateJobDescription(jobTitle, company);
    }

    if (!finalJD) return res.status(400).json({ message: 'Job description is required' });

    // Create session
    const session = await AnalysisSession.create({
      userId: req.user._id,
      jobTitle,
      company: company || '',
      jobDescription: finalJD,
      resumeText,
      resumeFileName: resumeFile.originalname,
      descriptionMode: descriptionMode || 'manual',
      status: 'analyzing',
    });

    // Run AI analysis
    try {
      const analysis = await analyzeResumeVsJob(resumeText, finalJD);
      session.analysis = analysis;
      session.status = 'completed';
      await session.save();
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      session.status = 'error';
      await session.save();
      return res.status(500).json({ message: 'AI analysis failed. Please try again.' });
    }

    res.json({ session });
  } catch (error) {
    // Cleanup uploaded files on error
    if (req.files) {
      Object.values(req.files).flat().forEach(f => {
        try { fs.unlinkSync(f.path); } catch {}
      });
    }
    console.error('Analysis error:', error);
    res.status(500).json({ message: 'Server error during analysis' });
  }
});

// ─── List Sessions ──────────────────────────────────────
router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = await AnalysisSession.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-resumeText -jobDescription');
    res.json({ sessions });
  } catch (error) {
    console.error('List sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Get Session Detail ─────────────────────────────────
router.get('/sessions/:id', protect, async (req, res) => {
  try {
    const session = await AnalysisSession.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ session });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Delete Session ─────────────────────────────────────
router.delete('/sessions/:id', protect, async (req, res) => {
  try {
    const session = await AnalysisSession.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ message: 'Session deleted' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
