import mongoose from 'mongoose';

const analysisSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobTitle: { type: String, required: true },
    company: { type: String, default: '' },
    jobDescription: { type: String, required: true },
    resumeText: { type: String, required: true },
    resumeFileName: { type: String, default: '' },
    descriptionMode: { type: String, enum: ['manual', 'pdf', 'quick'], default: 'manual' },
    analysis: {
      overallMatch: { type: Number, default: 0 },
      matchedSkills: [{
        skill: String,
        proficiency: { type: String, enum: ['strong', 'moderate', 'basic'] },
      }],
      missingSkills: [{
        skill: String,
        importance: { type: String, enum: ['critical', 'important', 'nice-to-have'] },
        suggestion: String,
      }],
      strengthSummary: String,
      gapSummary: String,
      recommendations: [String],
    },
    status: {
      type: String,
      enum: ['pending', 'analyzing', 'completed', 'error'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

analysisSessionSchema.index({ userId: 1, createdAt: -1 });

const AnalysisSession = mongoose.model('AnalysisSession', analysisSessionSchema);
export default AnalysisSession;
