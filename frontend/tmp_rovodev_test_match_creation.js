// Test script to verify match creation with correct status
const testMatchCreation = async () => {
  const baseUrl = 'http://localhost:3000'; // Adjust if your app runs on a different port
  
  // Test 1: Create a match in the past (should be COMPLETED)
  const pastMatch = {
    title: "Test Past Match",
    location: "Test Court",
    courtNumber: "1",
    date: "2024-01-01", // Past date
    time: "16:00-18:00", // Past time
    fee: 300000,
    description: "Test match in the past"
  };
  
  // Test 2: Create a match in the future (should be UPCOMING)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7); // One week from now
  const futureDateStr = futureDate.toISOString().split('T')[0];
  
  const futureMatch = {
    title: "Test Future Match",
    location: "Test Court",
    courtNumber: "2", 
    date: futureDateStr,
    time: "16:00-18:00",
    fee: 300000,
    description: "Test match in the future"
  };
  
  console.log('Testing match creation...');
  console.log('Past match data:', pastMatch);
  console.log('Future match data:', futureMatch);
  
  try {
    // Create past match
    const pastResponse = await fetch(`${baseUrl}/api/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pastMatch)
    });
    
    if (pastResponse.ok) {
      const pastResult = await pastResponse.json();
      console.log('Past match created with status:', pastResult.status);
    } else {
      console.error('Failed to create past match:', await pastResponse.text());
    }
    
    // Create future match
    const futureResponse = await fetch(`${baseUrl}/api/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(futureMatch)
    });
    
    if (futureResponse.ok) {
      const futureResult = await futureResponse.json();
      console.log('Future match created with status:', futureResult.status);
    } else {
      console.error('Failed to create future match:', await futureResponse.text());
    }
    
  } catch (error) {
    console.error('Error testing match creation:', error);
  }
};

// Export for use in browser console or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testMatchCreation;
} else {
  // For browser console usage
  window.testMatchCreation = testMatchCreation;
}