export const jobKeywords = {
  "software engineer": {
    technical: ["JavaScript", "Python", "React", "Node.js", "AWS", "Docker", "CI/CD", "REST APIs", "Microservices", "Git"],
    soft: ["problem-solving", "collaboration", "agile", "code review", "mentorship"],
    ats: ["full-stack", "backend", "frontend", "DevOps", "cloud computing"]
  },
  "data scientist": {
    technical: ["Python", "R", "SQL", "Machine Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Tableau", "Power BI"],
    soft: ["analytical thinking", "communication", "stakeholder management", "presentation"],
    ats: ["predictive modeling", "data visualization", "statistical analysis", "big data", "A/B testing"]
  },
  "product manager": {
    technical: ["Jira", "Confluence", "Figma", "SQL", "Google Analytics", "A/B testing", "roadmap planning"],
    soft: ["leadership", "stakeholder management", "strategic thinking", "cross-functional collaboration"],
    ats: ["product strategy", "market research", "user stories", "agile methodologies", "KPI tracking"]
  },
  "marketing manager": {
    technical: ["Google Ads", "SEO", "SEM", "HubSpot", "Salesforce", "Google Analytics", "email marketing", "social media"],
    soft: ["creativity", "communication", "team leadership", "budget management"],
    ats: ["campaign management", "brand strategy", "content marketing", "lead generation", "ROI analysis"]
  },
  "sales representative": {
    technical: ["Salesforce", "CRM", "cold calling", "email outreach", "LinkedIn Sales Navigator"],
    soft: ["negotiation", "relationship building", "active listening", "resilience"],
    ats: ["quota attainment", "pipeline management", "B2B sales", "consultative selling", "client retention"]
  },
  "default": {
    technical: ["Microsoft Office", "Google Workspace", "project management", "communication tools"],
    soft: ["teamwork", "time management", "adaptability", "problem-solving"],
    ats: ["professional experience", "achievement-oriented", "results-driven"]
  }
};

export const getKeywordsForJob = (jobTitle) => {
  const normalizedTitle = jobTitle.toLowerCase().trim();
  return jobKeywords[normalizedTitle] || jobKeywords["default"];
};