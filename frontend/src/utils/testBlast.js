// Test file - run this to verify webhook connection
export const testMakeWebhook = async () => {
  const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_URL;
  
  console.log('🧪 Testing webhook:', webhookUrl);

  if (!webhookUrl) {
    console.error('❌ No webhook URL found!');
    return;
  }

  try {
    const testData = {
      test: true,
      message: 'Test from ResumeBlast',
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('📥 Response status:', response.status);
    const result = await response.text();
    console.log('📥 Response body:', result);

    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.error('❌ Webhook test failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Webhook test error:', error);
  }
};