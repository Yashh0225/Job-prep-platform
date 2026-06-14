import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import pdf from 'pdf-parse';
import { protect } from '../middleware/auth.js';
import MockInterview from '../models/MockInterview.js';
import {
  generateDSAQuestions,
  generateTechnicalQuestions,
  generateHRQuestions,
  generateCSFundamentalsQuestions,
  evaluateCode,
  evaluateResponse,
  evaluateCodeSubmission,
  evaluateFullInterview,
  generateJobDescription,
} from '../services/gemini.js';

const router = Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Start Interview ────────────────────────────────────
router.post('/start', protect, upload.single('resume'), async (req, res) => {
  try {
    const { companies, jobTitle, jobDescription, experience, yearsOfExperience, interviewParts, inputMode } = req.body;
    const parsedCompanies = typeof companies === 'string' ? companies.split(',').map(c => c.trim()) : (companies || []);
    const parsedParts = typeof interviewParts === 'string' ? interviewParts.split(',') : (interviewParts || []);

    if (!jobTitle) return res.status(400).json({ message: 'Job title is required' });
    if (!parsedParts || !parsedParts.length) return res.status(400).json({ message: 'Select at least one interview part' });
    if (!parsedCompanies || !parsedCompanies.length) return res.status(400).json({ message: 'Select at least one company' });

    let resumeText = '';
    if (req.file) {
      const resumeBuffer = fs.readFileSync(req.file.path);
      const resumeData = await pdf(resumeBuffer);
      resumeText = resumeData.text;
      fs.unlinkSync(req.file.path);
    }

    // Generate JD if needed
    let finalJD = jobDescription || '';
    if (inputMode === 'ai_generated' && parsedCompanies.length) {
      finalJD = await generateJobDescription(jobTitle, parsedCompanies[0]);
    }

    // Create interview
    const interview = await MockInterview.create({
      userId: req.user._id,
      companies: parsedCompanies,
      jobTitle,
      jobDescription: finalJD,
      experience: experience || 'fresher',
      yearsOfExperience: parseInt(yearsOfExperience) || 0,
      interviewParts: parsedParts,
      inputMode: inputMode || 'company_name',
      status: 'in_progress',
      currentPart: parsedParts[0],
      currentQuestionIndex: 0,
      startedAt: new Date(),
    });

    // Generate questions for each selected part sequentially to avoid rate limits
    if (parsedParts.includes('dsa')) {
      try {
        const qs = await generateDSAQuestions(parsedCompanies, jobTitle, experience || 'fresher', 3);
        const arr = Array.isArray(qs) ? qs : (qs.questions || qs.data || qs.items || Object.values(qs)[0] || []);
        interview.parts.dsa.questions = arr;
      } catch (e) {
        console.error('DSA gen error:', e);
        interview.parts.dsa.questions = [];
      }
    }

    if (parsedParts.includes('technical')) {
      try {
        const qs = await generateTechnicalQuestions(parsedCompanies, jobTitle, experience || 'fresher', finalJD, resumeText, 5);
        const arr = Array.isArray(qs) ? qs : (qs.questions || qs.data || qs.items || Object.values(qs)[0] || []);
        interview.parts.technical.questions = arr.map(q => ({ ...q, responseType: 'text' }));
      } catch (e) {
        console.error('Technical gen error:', e);
        interview.parts.technical.questions = [];
      }
    }

    if (parsedParts.includes('hr')) {
      try {
        const qs = await generateHRQuestions(parsedCompanies, jobTitle, experience || 'fresher', resumeText, 5);
        const arr = Array.isArray(qs) ? qs : (qs.questions || qs.data || qs.items || Object.values(qs)[0] || []);
        interview.parts.hr.questions = arr.map(q => ({ ...q, responseType: 'text' }));
      } catch (e) {
        console.error('HR gen error:', e);
        interview.parts.hr.questions = [];
      }
    }

    if (parsedParts.includes('cs_fundamentals')) {
      try {
        const result = await generateCSFundamentalsQuestions(parsedCompanies, jobTitle, experience || 'fresher', resumeText, 8);
        const mcq = result && result.mcq ? result.mcq : [];
        const descriptive = result && result.descriptive ? result.descriptive : [];
        interview.parts.cs_fundamentals.questions = mcq.map(q => ({ ...q, _type: 'mcq', responseType: 'mcq', submitted: false }));
        interview.parts.cs_fundamentals.textQuestions = descriptive.map(q => ({ ...q, _type: 'text', responseType: 'text', submitted: false }));
      } catch (e) {
        console.error('CS gen error:', e);
        interview.parts.cs_fundamentals.questions = [];
        interview.parts.cs_fundamentals.textQuestions = [];
      }
    }

    await interview.save();

    res.json({ interview });
  } catch (error) {
    console.error('Start interview error:', error);
    res.status(500).json({ message: 'Server error starting interview' });
  }
});

// ─── Get Interview ──────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const interview = await MockInterview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    res.json({ interview });
  } catch (error) {
    console.error('Get interview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Submit DSA Code (Run Tests) ────────────────────────
router.post('/:id/run-code', protect, async (req, res) => {
  try {
    const { questionIndex, code, language } = req.body;
    const interview = await MockInterview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    const question = interview.parts.dsa.questions[questionIndex];
    if (!question) return res.status(404).json({ message: 'Question not found' });

    // Save user's code
    question.userCode = code;
    question.selectedLanguage = language;

    // Convert testCases to plain objects for the AI prompt
    const plainTestCases = (question.testCases || []).map(tc => ({
      input: tc.input || '',
      expectedOutput: tc.expectedOutput || '',
      isHidden: tc.isHidden || false,
    }));

    // Run code against test cases using AI
    let resultsArray = [];
    try {
      const results = await evaluateCode(question.description || '', code || '', language, plainTestCases);
      if (Array.isArray(results)) {
        resultsArray = results;
      } else if (results && Array.isArray(results.results)) {
        resultsArray = results.results;
      } else if (results) {
        resultsArray = [results];
      }
    } catch (aiError) {
      console.error('AI evaluateCode error:', aiError?.message || aiError);
      // Return empty results instead of crashing
      resultsArray = plainTestCases.map((tc) => ({
        passed: false,
        actualOutput: 'AI evaluation unavailable — please try again.',
        error: aiError?.message || 'AI service error',
      }));
    }

    question.testResults = resultsArray.map((r, i) => ({
      passed: r?.passed || false,
      input: plainTestCases[i]?.input || '',
      expected: plainTestCases[i]?.expectedOutput || '',
      actual: r?.actualOutput || (r?.error ? String(r.error) : 'Execution error'),
    }));

    await interview.save();
    res.json({ results: question.testResults, visibleResults: question.testResults.filter((_, i) => !plainTestCases[i]?.isHidden) });
  } catch (error) {
    console.error('Run code error:', error?.message || error);
    res.status(500).json({ message: error?.message || 'Server error running code' });
  }
});

// ─── Submit DSA Solution ────────────────────────────────
router.post('/:id/submit-code', protect, async (req, res) => {
  try {
    const { questionIndex, code, language } = req.body;
    const interview = await MockInterview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    const question = interview.parts.dsa.questions[questionIndex];
    if (!question) return res.status(404).json({ message: 'Question not found' });

    question.userCode = code;
    question.selectedLanguage = language;

    // Convert testCases to plain objects for the AI prompt
    const plainTestCases = (question.testCases || []).map(tc => ({
      input: tc.input || '',
      expectedOutput: tc.expectedOutput || '',
      isHidden: tc.isHidden || false,
    }));

    // Run all test cases
    let resultsArray = [];
    try {
      const results = await evaluateCode(question.description || '', code || '', language, plainTestCases);
      if (Array.isArray(results)) {
        resultsArray = results;
      } else if (results && Array.isArray(results.results)) {
        resultsArray = results.results;
      } else if (results) {
        resultsArray = [results];
      }
    } catch (aiError) {
      console.error('AI evaluateCode error in submit:', aiError?.message || aiError);
      resultsArray = plainTestCases.map(() => ({
        passed: false,
        actualOutput: 'AI evaluation unavailable — please try again.',
        error: aiError?.message || 'AI service error',
      }));
    }

    question.testResults = resultsArray.map((r, i) => ({
      passed: r?.passed || false,
      input: plainTestCases[i]?.input || '',
      expected: plainTestCases[i]?.expectedOutput || '',
      actual: r?.actualOutput || (r?.error ? String(r.error) : 'Execution error'),
    }));

    // Get AI evaluation
    try {
      const evaluation = await evaluateCodeSubmission(question.description || '', code || '', language, question.testResults);
      question.aiEvaluation = evaluation?.feedback || 'Evaluation unavailable.';
      question.score = evaluation?.score || 0;
    } catch (evalError) {
      console.error('AI evaluateCodeSubmission error:', evalError?.message || evalError);
      question.aiEvaluation = 'AI evaluation is temporarily unavailable due to rate limits. Please try again later.';
      question.score = 0;
    }
    question.submitted = true;

    await interview.save();
    res.json({ question });
  } catch (error) {
    console.error('Submit code error:', error?.message || error);
    res.status(500).json({ message: error?.message || 'Server error submitting code' });
  }
});

// ─── Submit Text/Audio Response ─────────────────────────
router.post('/:id/respond', protect, async (req, res) => {
  try {
    const { part, questionIndex, response, responseType } = req.body;
    const interview = await MockInterview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    let question;
    if (part === 'cs_fundamentals' && req.body.isMCQ) {
      // MCQ answer
      question = interview.parts.cs_fundamentals.questions[questionIndex];
      if (!question) return res.status(404).json({ message: 'Question not found' });
      question.userAnswer = response;
      question.score = response === question.correctAnswer ? 100 : 0;
      question.submitted = true;
      await interview.save();
      return res.json({ question });
    }

    if (part === 'cs_fundamentals') {
      question = interview.parts.cs_fundamentals.textQuestions[questionIndex];
    } else {
      question = interview.parts[part]?.questions[questionIndex];
    }
    if (!question) return res.status(404).json({ message: 'Question not found' });

    question.userResponse = response;
    question.responseType = responseType || 'text';
    question.submitted = true;

    await interview.save();
    res.json({ question });
  } catch (error) {
    console.error('Respond error:', error);
    res.status(500).json({ message: 'Server error submitting response' });
  }
});

// ─── Update Interview State ─────────────────────────────
router.patch('/:id/state', protect, async (req, res) => {
  try {
    const { currentPart, currentQuestionIndex } = req.body;
    const interview = await MockInterview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    if (currentPart !== undefined) interview.currentPart = currentPart;
    if (currentQuestionIndex !== undefined) interview.currentQuestionIndex = currentQuestionIndex;
    
    await interview.save();
    res.json({ interview });
  } catch (error) {
    console.error('Update state error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Complete Part ──────────────────────────────────────
router.post('/:id/complete-part', protect, async (req, res) => {
  try {
    const { part } = req.body;
    const interview = await MockInterview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    if (interview.parts[part]) {
      interview.parts[part].completed = true;
    }

    await interview.save();
    res.json({ interview });
  } catch (error) {
    console.error('Complete part error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── End Interview (Final Evaluation) ───────────────────
router.post('/:id/end', protect, async (req, res) => {
  try {
    const interview = await MockInterview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    // Mark all parts as completed
    interview.interviewParts.forEach(part => {
      if (interview.parts[part]) interview.parts[part].completed = true;
    });

    // Process evaluations sequentially to avoid rate limits
    for (const part of ['technical', 'hr']) {
      if (interview.parts[part]?.questions) {
        for (const q of interview.parts[part].questions) {
          if (q.submitted && !q.aiEvaluation) {
            try {
              const res = await evaluateResponse(q.question, q.userResponse, q.responseType);
              q.aiEvaluation = res.feedback;
              q.score = res.score;
              q.evaluated = true;
            } catch (e) {
              console.error(`Eval error ${part}:`, e);
            }
          }
        }
      }
    }

    if (interview.parts.cs_fundamentals?.textQuestions) {
      for (const q of interview.parts.cs_fundamentals.textQuestions) {
        if (q.submitted && !q.aiEvaluation) {
          try {
            const res = await evaluateResponse(q.question, q.userResponse, q.responseType);
            q.aiEvaluation = res.feedback;
            q.score = res.score;
            q.evaluated = true;
          } catch (e) {
            console.error('Eval error cs text:', e);
          }
        }
      }
    }

    // Generate final evaluation
    let evaluation = null;
    try {
      evaluation = await evaluateFullInterview(interview);
    } catch (evalError) {
      console.error('Final evaluation error (non-fatal):', evalError?.message || evalError);
      evaluation = {
        overallScore: 0,
        partScores: {},
        strengths: [],
        weaknesses: [],
        detailedFeedback: 'AI evaluation was unavailable. Review your individual question scores and expected answers for feedback.',
        hireRecommendation: '',
        improvementAreas: [],
      };
    }
    interview.evaluation = evaluation;
    interview.status = 'completed';
    interview.completedAt = new Date();

    await interview.save();
    res.json({ interview });
  } catch (error) {
    // Even if something goes wrong, try to mark interview as completed
    try {
      const fallback = await MockInterview.findOne({ _id: req.params.id, userId: req.user._id });
      if (fallback && fallback.status !== 'completed') {
        fallback.status = 'completed';
        fallback.completedAt = new Date();
        await fallback.save();
      }
    } catch (saveErr) {
      console.error('Fallback save error:', saveErr?.message);
    }
    console.error('End interview error:', error?.message || error);
    res.status(500).json({ message: error?.message || 'Server error ending interview' });
  }
});

// ─── History ────────────────────────────────────────────
router.get('/history/list', protect, async (req, res) => {
  try {
    const interviews = await MockInterview.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('companies jobTitle experience interviewParts status evaluation.overallScore evaluation.hireRecommendation startedAt completedAt createdAt');
    res.json({ interviews });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Delete Interview ───────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const interview = await MockInterview.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    res.json({ message: 'Interview deleted' });
  } catch (error) {
    console.error('Delete interview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
