import mongoose from 'mongoose';

const dsaQuestionSchema = new mongoose.Schema({
  title: String,
  description: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  constraints: [String],
  examples: [{ input: String, output: String, explanation: String }],
  testCases: [{ input: String, expectedOutput: String, isHidden: { type: Boolean, default: false } }],
  starterCode: {
    cpp: String,
    java: String,
    javascript: String,
    python: String,
  },
  solutionCode: {
    cpp: String,
    java: String,
    javascript: String,
    python: String,
  },
  userCode: { type: String, default: '' },
  selectedLanguage: { type: String, default: 'javascript' },
  testResults: [{ passed: Boolean, input: String, expected: String, actual: String }],
  aiEvaluation: String,
  score: { type: Number, default: 0 },
  submitted: { type: Boolean, default: false },
}, { _id: true });

const conceptualQuestionSchema = new mongoose.Schema({
  question: String,
  expectedTopics: [String],
  idealAnswer: String,
  category: String,
  topic: String,
  responseType: { type: String, enum: ['text', 'audio'], default: 'text' },
  userResponse: { type: String, default: '' },
  aiEvaluation: String,
  score: { type: Number, default: 0 },
  submitted: { type: Boolean, default: false },
}, { _id: true });

const mcqQuestionSchema = new mongoose.Schema({
  question: String,
  topic: String,
  options: [String],
  correctAnswer: String,
  explanation: String,
  userAnswer: { type: String, default: '' },
  score: { type: Number, default: 0 },
  submitted: { type: Boolean, default: false },
}, { _id: true });

const mockInterviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companies: [String],
    jobTitle: { type: String, required: true },
    jobDescription: { type: String, default: '' },
    experience: { type: String, enum: ['fresher', 'experienced'], default: 'fresher' },
    yearsOfExperience: { type: Number, default: 0 },
    interviewParts: [{ type: String, enum: ['dsa', 'technical', 'hr', 'cs_fundamentals'] }],
    inputMode: { type: String, enum: ['company_name', 'job_description', 'ai_generated'], default: 'company_name' },
    
    status: { type: String, enum: ['setup', 'in_progress', 'completed', 'abandoned'], default: 'setup' },
    currentPart: { type: String, default: '' },
    currentQuestionIndex: { type: Number, default: 0 },

    parts: {
      dsa: {
        questions: [dsaQuestionSchema],
        completed: { type: Boolean, default: false },
      },
      technical: {
        questions: [conceptualQuestionSchema],
        completed: { type: Boolean, default: false },
      },
      hr: {
        questions: [conceptualQuestionSchema],
        completed: { type: Boolean, default: false },
      },
      cs_fundamentals: {
        questions: [mcqQuestionSchema],
        textQuestions: [conceptualQuestionSchema],
        completed: { type: Boolean, default: false },
      },
    },

    evaluation: {
      overallScore: { type: Number, default: 0 },
      partScores: {
        dsa: { type: Number, default: 0 },
        technical: { type: Number, default: 0 },
        hr: { type: Number, default: 0 },
        cs_fundamentals: { type: Number, default: 0 },
      },
      strengths: [String],
      weaknesses: [String],
      detailedFeedback: String,
      hireRecommendation: { type: String, enum: ['strong_hire', 'hire', 'lean_hire', 'no_hire', ''], default: '' },
      improvementAreas: [String],
    },

    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

mockInterviewSchema.index({ userId: 1, createdAt: -1 });

const MockInterview = mongoose.model('MockInterview', mockInterviewSchema);
export default MockInterview;
