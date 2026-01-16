import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import BlastConfig from './BlastConfig';

/**
 * PaymentBlastTrigger Component
 * 
 * This component runs on every page load and checks if the user just completed
 * a payment (by checking URL params). If so, it loads the resume data from
 * localStorage and the database, then automatically shows the BlastConfig modal
 * with paymentVerified=true to trigger the blast.
 * 
 * This solves the issue where ResumeAnalysis isn't mounted after Stripe redirect.
 */
function PaymentBlastTrigger() {
  const [showBlast, setShowBlast] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    checkForPaymentSuccess();
  }, []);

  const checkForPaymentSuccess = async () => {
    try {
      // 1. Check URL for payment success
      const params = new URLSearchParams(window.location.search);
      const paymentSuccess = params.get('payment') === 'success';
      const sessionId = params.get('session_id');

      if (!paymentSuccess || !sessionId) {
        console.log('⏭️  No payment success detected in URL');
        return;
      }

      console.log('');
      console.log('=== 💳 PAYMENT BLAST TRIGGER ACTIVATED ===');
      console.log('Session ID:', sessionId);

      // 2. Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ No user found for payment blast trigger');
        return;
      }

      console.log('✅ User found:', user.email);

      // 3. Get resume data from localStorage
      const savedResumeData = localStorage.getItem('pending_blast_resume_data');
      if (!savedResumeData) {
        console.error('❌ No resume data found in localStorage');
        alert('Resume data not found. Please upload your resume again to proceed with blast.');
        
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }

      const parsedResumeData = JSON.parse(savedResumeData);
      console.log('✅ Resume data loaded from localStorage:', parsedResumeData.id);

      // 4. Fetch the complete resume record from database
      const { data: resumeRecord, error: resumeError } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', parsedResumeData.id)
        .single();

      if (resumeError || !resumeRecord) {
        console.error('❌ Could not fetch resume from database:', resumeError);
        alert('Resume not found in database. Please upload again.');
        
        // Clean up
        localStorage.removeItem('pending_blast_resume_data');
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }

      console.log('✅ Resume fetched from database');
      console.log('Resume details:', {
        id: resumeRecord.id,
        fileName: resumeRecord.file_name,
        detectedRole: resumeRecord.detected_role
      });

      // 5. Prepare data for BlastConfig
      const preparedResumeData = {
        id: resumeRecord.id,
        url: resumeRecord.file_url || parsedResumeData.url,
        text: resumeRecord.extracted_text
      };

      const preparedUserData = {
        id: user.id,
        name: resumeRecord.candidate_name || 
              user.user_metadata?.full_name || 
              user.email.split('@')[0],
        email: resumeRecord.candidate_email || user.email,
        phone: resumeRecord.candidate_phone || user.user_metadata?.phone || '',
        targetRole: resumeRecord.detected_role || 'Professional',
        skills: Array.isArray(resumeRecord.top_skills) 
          ? resumeRecord.top_skills.join(', ') 
          : 'Professional Skills',
        years_experience: resumeRecord.seniority_level || 
                         resumeRecord.total_experience || 
                         'Mid-Level'
      };

      console.log('✅ Data prepared for blast:');
      console.log('User:', preparedUserData.name, preparedUserData.email);
      console.log('Role:', preparedUserData.targetRole);

      // 6. Set state to show BlastConfig
      setResumeData(preparedResumeData);
      setUserData(preparedUserData);
      setShowBlast(true);

      console.log('✅ BlastConfig will now mount with paymentVerified=true');
      console.log('=== ✅ PAYMENT BLAST TRIGGER COMPLETE ===');
      console.log('');

    } catch (error) {
      console.error('');
      console.error('=== ❌ ERROR IN PAYMENT BLAST TRIGGER ===');
      console.error('Error:', error);
      console.error('Stack:', error.stack);
      console.error('');
      
      alert('Error preparing blast data. Please try again or contact support.');
      
      // Clean up on error
      localStorage.removeItem('pending_blast_resume_data');
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  // Don't render anything if blast shouldn't be shown
  if (!showBlast || !resumeData || !userData) {
    return null;
  }

  return (
    <BlastConfig
      resumeId={resumeData.id}
      resumeUrl={resumeData.url}
      paymentVerified={true}
      userData={userData}
      onBlastComplete={(result) => {
        console.log('🎉 Blast completed successfully:', result);
        setShowBlast(false);
        
        // Clean up
        localStorage.removeItem('pending_blast_resume_data');
        localStorage.removeItem('pending_blast_config');
        
        // Show success message
        alert('✅ Blast Successful!\n\nYour resume has been sent to recruiters. Check your email for responses!');
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      }}
      onCancel={() => {
        console.log('❌ Blast cancelled by user');
        setShowBlast(false);
        
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
        
        // Optionally redirect to home
        // window.location.href = '/';
      }}
    />
  );
}

export default PaymentBlastTrigger;