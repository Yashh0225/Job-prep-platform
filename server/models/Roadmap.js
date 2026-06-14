import mongoose from 'mongoose';

const roadmapSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    analysisSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'AnalysisSession', default: null },
    jobTitle: { type: String, required: true },
    company: { type: String, default: '' },
    jobDescription: { type: String, default: '' },
    resumeText: { type: String, default: '' },
    daysAvailable: { type: Number, required: true, min: 1, max: 365 },
    inputMode: { type: String, enum: ['title_only', 'title_company', 'job_description', 'analysis_session'], default: 'title_only' },
    roadmap: {
      summary: String,
      phases: [{
        name: String,
        days: String,
        focus: String,
        tasks: [{
          title: String,
          description: String,
          resources: [String],
          estimatedHours: Number,
          priority: { type: String, enum: ['critical', 'high', 'medium', 'low'] },
          completed: { type: Boolean, default: false },
        }],
      }],
    },
    status: {
      type: String,
      enum: ['pending', 'generating', 'completed', 'error'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

roadmapSchema.index({ userId: 1, createdAt: -1 });

const Roadmap = mongoose.model('Roadmap', roadmapSchema);
export default Roadmap;
