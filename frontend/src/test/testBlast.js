import { triggerEmailBlast } from '../services/blastService';

// Test data structure that matches Make.com expectations
const testBlastData = {
  // User/Candidate Information
  candidate_name: "John Doe",
  candidate_email: "john.doe@example.com",
  candidate_phone: "+1-555-0123",
  job_role: "Senior Software Engineer",
  years_experience: "5",
  location: "San Francisco, CA",
  key_skills: "React, Node.js, Python, AWS, Docker",
  education_level: "Bachelor's in Computer Science",
  linkedin_url: "https://linkedin.com/in/johndoe",
  resume_url: "https://resumeblast.ai/resumes/john-doe-resume.pdf",
  
  // List of recruiters to send to
  recruiters: [
    {
      recruiter_name: "Sarah Smith",
      recruiter_email: "sarah@techcorp.com",
      company_name: "TechCorp Inc"
    },
    {
      recruiter_name: "Mike Johnson",
      recruiter_email: "mike@innovate.com",
      company_name: "Innovate Solutions"
    }
  ]
};

// Run test
console.log('🧪 Testing blast with data:', testBlastData);
triggerEmailBlast(testBlastData)
  .then(result => {
    console.log('✅ Test successful:', result);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
  });
