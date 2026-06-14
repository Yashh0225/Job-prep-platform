import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import pdf from 'pdf-parse';
import { protect } from '../middleware/auth.js';
import Roadmap from '../models/Roadmap.js';
import AnalysisSession from '../models/AnalysisSession.js';
import { generateRoadmap, generateJobDescription, analyzeResumeVsJob } from '../services/gemini.js';

const router = Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Generate Roadmap ───────────────────────────────────
router.post('/generate', protect, upload.single('resume'), async (req, res) => {
  try {
    const { jobTitle, company, jobDescription, daysAvailable, inputMode, analysisSessionId } = req.body;
    if (!daysAvailable || daysAvailable < 1) return res.status(400).json({ message: 'Days available is required' });

    let finalJobTitle = jobTitle;
    let finalCompany = company;
    let finalJD = jobDescription || '';
    let resumeText = '';
    let analysisResult = null;

    if (analysisSessionId) {
      const session = await AnalysisSession.findOne({ _id: analysisSessionId, userId: req.user._id });
      if (!session) return res.status(404).json({ message: 'Analysis session not found' });
      finalJobTitle = session.jobTitle;
      finalCompany = session.company;
      finalJD = session.jobDescription;
      resumeText = session.resumeText;
      analysisResult = session.analysis;
    } else {
      if (!finalJobTitle) return res.status(400).json({ message: 'Job title is required' });
      // Parse optional resume
      if (req.file) {
        const buffer = fs.readFileSync(req.file.path);
        const data = await pdf(buffer);
        resumeText = data.text;
        fs.unlinkSync(req.file.path);
      }
    }

    // Get JD based on mode (if not loaded from session)
    if (!analysisSessionId && inputMode === 'title_company' && !finalJD && finalCompany) {
      finalJD = await generateJobDescription(finalJobTitle, finalCompany);
    }

    // Create roadmap record
    const roadmapDoc = await Roadmap.create({
      userId: req.user._id,
      analysisSessionId: analysisSessionId || null,
      jobTitle: finalJobTitle,
      company: finalCompany || '',
      jobDescription: finalJD,
      resumeText,
      daysAvailable: parseInt(daysAvailable),
      inputMode: analysisSessionId ? 'analysis_session' : (inputMode || 'title_only'),
      status: 'generating',
    });

    // Generate with AI
    try {
      if (!analysisSessionId && resumeText) {
        analysisResult = await analyzeResumeVsJob(resumeText, finalJD || finalJobTitle);
      }
      const roadmap = await generateRoadmap(finalJobTitle, finalCompany, finalJD, resumeText, parseInt(daysAvailable), analysisResult);

      // Sanitize AI priority outputs to match Mongoose enum
      const validPriorities = ['critical', 'high', 'medium', 'low'];
      if (roadmap && roadmap.phases) {
        roadmap.phases.forEach(phase => {
          if (phase.tasks) {
            phase.tasks.forEach(task => {
              if (task.priority) {
                const normalized = task.priority.toLowerCase().trim();
                if (normalized === 'important') task.priority = 'high';
                else if (normalized === 'essential') task.priority = 'critical';
                else if (!validPriorities.includes(normalized)) task.priority = 'medium';
                else task.priority = normalized;
              } else {
                task.priority = 'medium';
              }
            });
          }
        });
      }

      roadmapDoc.roadmap = roadmap;
      roadmapDoc.status = 'completed';
      await roadmapDoc.save();
    } catch (aiError) {
      console.error('AI roadmap error:', aiError);
      roadmapDoc.status = 'error';
      await roadmapDoc.save();
      return res.status(500).json({ message: 'AI roadmap generation failed. Please try again.' });
    }

    res.json({ roadmap: roadmapDoc });
  } catch (error) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch {}
    console.error('Roadmap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── List Roadmaps ──────────────────────────────────────
router.get('/list', protect, async (req, res) => {
  try {
    const roadmaps = await Roadmap.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-resumeText -jobDescription -roadmap.phases.tasks.description');
    res.json({ roadmaps });
  } catch (error) {
    console.error('List roadmaps error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Get Roadmap ────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.user._id });
    if (!roadmap) return res.status(404).json({ message: 'Roadmap not found' });
    res.json({ roadmap });
  } catch (error) {
    console.error('Get roadmap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Toggle Task Completion ─────────────────────────────
router.patch('/:id/task', protect, async (req, res) => {
  try {
    const { phaseIndex, taskIndex, completed } = req.body;
    const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.user._id });
    if (!roadmap) return res.status(404).json({ message: 'Roadmap not found' });

    if (roadmap.roadmap.phases[phaseIndex]?.tasks[taskIndex] !== undefined) {
      roadmap.roadmap.phases[phaseIndex].tasks[taskIndex].completed = completed;
      await roadmap.save();
    }

    res.json({ roadmap });
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Delete Roadmap ─────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!roadmap) return res.status(404).json({ message: 'Roadmap not found' });
    res.json({ message: 'Roadmap deleted' });
  } catch (error) {
    console.error('Delete roadmap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
