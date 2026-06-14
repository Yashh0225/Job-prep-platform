import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = 'gemini-2.5-flash';

// ─── Helpers ────────────────────────────────────────────
const generateJSON = async (prompt, retries = 5) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error. Raw response:', text.slice(0, 500));
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) return JSON.parse(jsonMatch[1].trim());
      throw new Error('Failed to parse AI response as JSON');
    }
  } catch (error) {
    const status = error?.status || error?.code;
    if ((status === 429 || status === 503) && retries > 0) {
      const waitTime = status === 429 ? 8000 : 5000;
      console.log(`API error ${status}. Retrying in ${waitTime / 1000}s... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return generateJSON(prompt, retries - 1);
    }
    console.error(`generateJSON failed [status=${status}]:`, error?.message || error);
    throw error;
  }
};

const generateText = async (prompt, retries = 2) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    if (error?.status === 429 && retries > 0) {
      console.log('Rate limit hit (429). Retrying in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return generateText(prompt, retries - 1);
    }
    throw error;
  }
};

// ═══════════════════════════════════════════════════════
// 1. RESUME ANALYSIS
// ═══════════════════════════════════════════════════════

export const analyzeResumeVsJob = async (resumeText, jobDescription) => {
  const prompt = `You are an expert career advisor and senior recruiter. Perform a thorough skill gap analysis comparing the candidate's resume against the job description.

RESUME:
"""
${resumeText}
"""

JOB DESCRIPTION:
"""
${jobDescription}
"""

Return a JSON object with EXACTLY this structure:
{
  "overallMatch": 75,
  "matchedSkills": [
    { "skill": "Skill name", "proficiency": "strong|moderate|basic" }
  ],
  "missingSkills": [
    { "skill": "Missing skill name", "importance": "critical|important|nice-to-have", "suggestion": "How to learn this skill quickly" }
  ],
  "strengthSummary": "3-4 sentence summary of candidate's strengths for this role",
  "gapSummary": "3-4 sentence summary of skill gaps and areas to improve",
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2", ...]
}

Be thorough and realistic. Consider both hard skills (technical) and soft skills. The overallMatch should be 0-100. List ALL matching and missing skills.`;

  return generateJSON(prompt);
};

// ═══════════════════════════════════════════════════════
// 2. ROADMAP GENERATION
// ═══════════════════════════════════════════════════════

export const generateRoadmap = async (jobTitle, company, jobDescription, resumeText, daysAvailable, analysisResult) => {
  const prompt = `You are an expert career coach. Create a detailed, personalized interview preparation roadmap.

JOB: "${jobTitle}"${company ? ` at "${company}"` : ''}
DAYS AVAILABLE: ${daysAvailable}

${jobDescription ? `JOB DESCRIPTION:\n"""\n${jobDescription}\n"""` : ''}

${analysisResult ? `CANDIDATE SKILL GAP ANALYSIS:\n"""\n${JSON.stringify(analysisResult, null, 2)}\n"""\nUse this analysis to tailor the roadmap. Skip or minimize time spent on skills they are already strong at. Focus heavily on bridging their missing skills and gaps.` : (resumeText ? `CANDIDATE RESUME:\n"""\n${resumeText}\n"""\nTailor the roadmap based on their existing experience.` : '')}

Create a phased study plan that prioritizes the most impactful skills first and allocates time proportionally across ${daysAvailable} days.

Return a JSON object with EXACTLY this structure:
{
  "summary": "Brief overview of the roadmap strategy, explicitly mentioning how it addresses their skill gaps if an analysis was provided.",
  "phases": [
    {
      "name": "Phase name (e.g., Foundation Building)",
      "days": "Day X-Y",
      "focus": "What this phase covers",
      "tasks": [
        {
          "title": "Specific task title",
          "description": "Detailed description of what to do",
          "resources": ["Specific resource name or URL"],
          "estimatedHours": 3,
          "priority": "critical|high|medium|low"
        }
      ]
    }
  ]
}

Create 3-6 phases that logically progress from foundational concepts to advanced interview-specific preparation. The last phase should always be mock practice and review. Make resources specific and actionable.`;

  return generateJSON(prompt);
};

// ═══════════════════════════════════════════════════════
// 3. JOB DESCRIPTION GENERATION
// ═══════════════════════════════════════════════════════

export const generateJobDescription = async (jobTitle, company) => {
  const prompt = `You are an expert recruiter. Generate a realistic, detailed job description for a "${jobTitle}" position${company ? ` at "${company}"` : ''}.

Include: Role Overview, Key Responsibilities, Required Technical Skills & Tools, Preferred Experience, Soft Skills.
Format as clean professional text.`;

  return generateText(prompt);
};

// ═══════════════════════════════════════════════════════
// 4. MOCK INTERVIEW — DSA QUESTIONS
// ═══════════════════════════════════════════════════════

export const generateDSAQuestions = async (companies, jobTitle, experience, count = 3) => {
  const companyStr = companies.length ? companies.join(', ') : 'top tech companies';
  const difficulty = experience === 'fresher' ? 'easy to medium' : 'medium to hard';

  const prompt = `You are an expert competitive programming interviewer at ${companyStr}. Generate EXACTLY ${count} DSA coding problems for a ${jobTitle} interview.

Candidate experience: ${experience}
Difficulty level: ${difficulty}

These problems should resemble real interview questions asked at ${companyStr}. Each problem MUST have starter code in 4 languages.

Return a JSON array with this structure:
[
  {
    "title": "Problem title (e.g., Two Sum)",
    "description": "Full problem statement with clear input/output format",
    "difficulty": "easy|medium|hard",
    "constraints": ["1 <= n <= 10^5", "etc"],
    "examples": [
      { "input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "Because nums[0] + nums[1] == 9" }
    ],
    "testCases": [
      { "input": "[2,7,11,15]\\n9", "expectedOutput": "[0,1]", "isHidden": false },
      { "input": "[3,2,4]\\n6", "expectedOutput": "[1,2]", "isHidden": false },
      { "input": "[3,3]\\n6", "expectedOutput": "[0,1]", "isHidden": true }
    ],
    "starterCode": {
      "cpp": "#include <vector>\\nusing namespace std;\\n\\nclass Solution {\\npublic:\\n    vector<int> solve(vector<int>& nums, int target) {\\n        // Write your code here\\n    }\\n};",
      "java": "import java.util.*;\\n\\nclass Solution {\\n    public int[] solve(int[] nums, int target) {\\n        // Write your code here\\n    }\\n}",
      "javascript": "function solve(nums, target) {\\n    // Write your code here\\n}",
      "python": "def solve(nums, target):\\n    # Write your code here\\n    pass"
    },
    "solutionCode": {
      "cpp": "// Optimal C++ solution code here",
      "java": "// Optimal Java solution code here",
      "javascript": "// Optimal JS solution code here",
      "python": "// Optimal Python solution code here"
    }
  }
]

IMPORTANT: Include 2-3 visible test cases and 3-5 hidden test cases per problem. The 'starterCode' MUST ONLY be empty boilerplate with function signatures (do NOT include the solution in starterCode). Provide the actual optimal solution in 'solutionCode'. Make problems feel like real ${companyStr} interview questions.`;

  return generateJSON(prompt);
};

// ═══════════════════════════════════════════════════════
// 5. MOCK INTERVIEW — TECHNICAL QUESTIONS
// ═══════════════════════════════════════════════════════

export const generateTechnicalQuestions = async (companies, jobTitle, experience, jobDescription, resumeText, count = 5) => {
  const companyStr = companies.length ? companies.join(', ') : 'top tech companies';

  const prompt = `You are a senior technical interviewer at ${companyStr}. Generate EXACTLY ${count} technical interview questions for a ${jobTitle} position.

Candidate experience: ${experience}
${jobDescription ? `Job context: ${jobDescription.slice(0, 800)}\n` : ''}${resumeText ? `Candidate resume context:\n"""\n${resumeText.slice(0, 1500)}\n"""\nIMPORTANT: Tailor the technical questions specifically around the skills, past projects, and technologies mentioned in the candidate's resume.` : ''}

Questions should cover system design, architecture, frameworks, best practices, and technical concepts relevant to the role. These should resemble real technical interview questions from ${companyStr}.

Return a JSON array:
[
  {
    "question": "The technical interview question",
    "expectedTopics": ["Topic 1", "Topic 2"],
    "idealAnswer": "A comprehensive 3-4 sentence ideal response covering the expected topics.",
    "category": "system_design|architecture|frameworks|concepts"
  }
]

Make questions progressively harder. Include a mix of conceptual and practical questions.`;

  return generateJSON(prompt);
};

// ═══════════════════════════════════════════════════════
// 6. MOCK INTERVIEW — HR QUESTIONS
// ═══════════════════════════════════════════════════════

export const generateHRQuestions = async (companies, jobTitle, experience, resumeText, count = 5) => {
  const companyStr = companies.length ? companies.join(', ') : 'top tech companies';

  const prompt = `You are an HR interviewer at ${companyStr}. Generate EXACTLY ${count} HR/behavioral interview questions for a ${jobTitle} position.

Candidate experience: ${experience}
${resumeText ? `Candidate resume context:\n"""\n${resumeText.slice(0, 1500)}\n"""\nIMPORTANT: Tailor the behavioral questions to specifically ask about the experiences, roles, or projects listed in their resume.` : ''}

These should resemble real HR interview questions from ${companyStr}, covering behavioral, situational, and motivational aspects. Use STAR-method style questions where appropriate.

Return a JSON array:
[
  {
    "question": "The HR interview question",
    "idealAnswer": "A comprehensive 3-4 sentence ideal STAR-method response to this question.",
    "category": "behavioral|situational|motivational"
  }
]

Include questions about teamwork, leadership, conflict resolution, career goals, and company culture fit specific to ${companyStr}.`;

  return generateJSON(prompt);
};

// ═══════════════════════════════════════════════════════
// 7. MOCK INTERVIEW — CS FUNDAMENTALS
// ═══════════════════════════════════════════════════════

export const generateCSFundamentalsQuestions = async (companies, jobTitle, experience, resumeText, count = 8) => {
  const companyStr = companies.length ? companies.join(', ') : 'top tech companies';

  const prompt = `You are a technical interviewer at ${companyStr} testing CS fundamentals. Generate EXACTLY ${count} questions covering Operating Systems, DBMS, Computer Networks, and OOP concepts.

Candidate experience: ${experience}
Role: ${jobTitle}
${resumeText ? `Candidate resume context:\n"""\n${resumeText.slice(0, 1500)}\n"""\nTry to relate some of the fundamental questions to the technologies they have used if possible.` : ''}

Mix of MCQ and descriptive questions. MCQ questions must have exactly 4 options with one correct answer.

Return a JSON object:
{
  "mcq": [
    {
      "question": "The MCQ question",
      "topic": "OS|DBMS|Networks|OOP",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this is correct"
    }
  ],
  "descriptive": [
    {
      "question": "The descriptive question",
      "topic": "OS|DBMS|Networks|OOP",
      "expectedTopics": ["Key point 1", "Key point 2"],
      "idealAnswer": "A comprehensive 3-4 sentence ideal response to this question."
    }
  ]
}

Generate ${Math.ceil(count * 0.6)} MCQ questions and ${Math.floor(count * 0.4)} descriptive questions. Cover all 4 CS topics evenly.`;

  return generateJSON(prompt);
};

// ═══════════════════════════════════════════════════════
// 8. CODE EVALUATION (AI-simulated execution)
// ═══════════════════════════════════════════════════════

export const evaluateCode = async (question, code, language, testCases) => {
  if (!code || !code.trim()) {
    return (testCases || []).map((tc, i) => ({
      testCaseIndex: i,
      passed: false,
      actualOutput: '',
      expectedOutput: tc.expectedOutput || '',
      error: 'No code submitted',
    }));
  }

  const safeTestCases = (testCases || []).map((tc, i) => ({
    index: i,
    input: tc.input || '',
    expectedOutput: tc.expectedOutput || '',
  }));

  const prompt = `You are a code execution engine. Analyze this ${language} code and trace through it mentally to determine the output for each test case.

PROBLEM:
"""
${question || 'No problem description provided'}
"""

SUBMITTED CODE:
\`\`\`${language}
${code}
\`\`\`

TEST CASES:
${JSON.stringify(safeTestCases, null, 2)}

For each test case, mentally execute the code and determine if output matches expectedOutput.

Return a JSON array:
[
  {
    "testCaseIndex": 0,
    "passed": true,
    "actualOutput": "the output the code produces",
    "expectedOutput": "the expected output",
    "error": null
  }
]

Be precise. If the code has syntax/runtime errors, set "passed": false and "error": "description".`;

  return generateJSON(prompt);
};

// ═══════════════════════════════════════════════════════
// 9. EVALUATE INTERVIEW RESPONSE
// ═══════════════════════════════════════════════════════

export const evaluateResponse = async (question, userResponse, type, additionalContext = '') => {
  const prompt = `You are evaluating a candidate's answer in a mock interview.

QUESTION: "${question}"
RESPONSE TYPE: ${type}
CANDIDATE'S ANSWER: "${userResponse}"
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}

Evaluate the response on relevance, depth, clarity, and correctness.

Return a JSON object:
{
  "score": 75,
  "feedback": "Detailed 3-5 sentence constructive feedback. Be specific about what was good and what could be improved."
}

Score 0-100. Be fair but rigorous.`;

  return generateJSON(prompt);
};

// ═══════════════════════════════════════════════════════
// 10. EVALUATE CODE SUBMISSION
// ═══════════════════════════════════════════════════════

export const evaluateCodeSubmission = async (question, code, language, testResults) => {
  const passedCount = testResults ? testResults.filter(r => r.passed).length : 0;
  const totalCount = testResults ? testResults.length : 0;

  const prompt = `You are a senior software engineer evaluating a code submission in a mock interview.

PROBLEM: "${question}"

SUBMITTED CODE (${language}):
\`\`\`${language}
${code || '// No code submitted'}
\`\`\`

TEST RESULTS: ${passedCount}/${totalCount} test cases passed.

Evaluate on: correctness, time/space complexity, code quality, edge case handling, approach quality.

Return a JSON object:
{
  "score": 75,
  "feedback": "Detailed 4-6 sentence assessment covering correctness, complexity, code quality, and improvements."
}

Score: 90-100=optimal, 70-89=correct but suboptimal, 50-69=partial, 30-49=wrong approach, 0-29=no solution.`;

  return generateJSON(prompt);
};

// ═══════════════════════════════════════════════════════
// 11. FINAL INTERVIEW EVALUATION
// ═══════════════════════════════════════════════════════

export const evaluateFullInterview = async (interview) => {
  const parts = [];

  if (interview.parts.dsa?.questions?.length) {
    const dsaScores = interview.parts.dsa.questions.filter(q => q.submitted).map(q => q.score);
    parts.push(`DSA: ${dsaScores.length} questions, avg score ${dsaScores.length ? Math.round(dsaScores.reduce((a, b) => a + b, 0) / dsaScores.length) : 0}/100`);
  }
  if (interview.parts.technical?.questions?.length) {
    const techScores = interview.parts.technical.questions.filter(q => q.submitted).map(q => q.score);
    parts.push(`Technical: ${techScores.length} questions, avg score ${techScores.length ? Math.round(techScores.reduce((a, b) => a + b, 0) / techScores.length) : 0}/100`);
  }
  if (interview.parts.hr?.questions?.length) {
    const hrScores = interview.parts.hr.questions.filter(q => q.submitted).map(q => q.score);
    parts.push(`HR: ${hrScores.length} questions, avg score ${hrScores.length ? Math.round(hrScores.reduce((a, b) => a + b, 0) / hrScores.length) : 0}/100`);
  }
  if (interview.parts.cs_fundamentals?.questions?.length || interview.parts.cs_fundamentals?.textQuestions?.length) {
    const mcqScores = (interview.parts.cs_fundamentals.questions || []).filter(q => q.submitted).map(q => q.score);
    const textScores = (interview.parts.cs_fundamentals.textQuestions || []).filter(q => q.submitted).map(q => q.score);
    const allScores = [...mcqScores, ...textScores];
    parts.push(`CS Fundamentals: ${allScores.length} questions, avg score ${allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0}/100`);
  }

  const prompt = `You are a hiring committee evaluating a candidate's mock interview performance for a ${interview.jobTitle} role${interview.companies?.length ? ` at ${interview.companies.join(', ')}` : ''}.

Candidate experience: ${interview.experience} ${interview.yearsOfExperience ? `(${interview.yearsOfExperience} years)` : ''}

PERFORMANCE SUMMARY:
${parts.join('\n')}

Provide a comprehensive evaluation.

Return a JSON object:
{
  "overallScore": 72,
  "partScores": {
    "dsa": 70,
    "technical": 75,
    "hr": 80,
    "cs_fundamentals": 65
  },
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "detailedFeedback": "Comprehensive 5-8 sentence evaluation covering all aspects of the interview performance.",
  "hireRecommendation": "strong_hire|hire|lean_hire|no_hire",
  "improvementAreas": ["Area 1 with specific advice", "Area 2 with specific advice"]
}

Only include scores for parts that were actually taken. Be realistic and constructive.`;

  return generateJSON(prompt);
};
