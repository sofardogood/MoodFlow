// Native fetch is available in Node 18+

const BASE_URL = 'http://localhost:3000';
const SESSION_ID = 'test-session-' + Date.now();

async function testFlow() {
    console.log(`Testing with Session ID: ${SESSION_ID}`);

    // 1. Submit Mood
    console.log('Submitting mood...');
    const submitRes = await fetch(`${BASE_URL}/api/submit-mood`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sessionId: SESSION_ID,
            nickname: 'Tester',
            moodScore: 5,
            comment: 'Testing persistence',
            emoticon: '🚀'
        })
    });

    if (!submitRes.ok) {
        console.error('Submit Failed:', await submitRes.text());
        return;
    }
    console.log('Submit Success');

    // 2. Fetch Visual Data
    console.log('Fetching visual data...');
    const getRes = await fetch(`${BASE_URL}/api/get-visual-data?sessionId=${SESSION_ID}`);
    if (!getRes.ok) {
        console.error('Fetch Failed:', await getRes.text());
        return;
    }

    const data = await getRes.json();
    console.log('Fetched Data:', JSON.stringify(data, null, 2));

    const found = data.moods.find(m => m.comment === 'Testing persistence');
    if (found) {
        console.log('✅ PASS: Mood found in response.');
    } else {
        console.error('❌ FAIL: Mood NOT found in response.');
    }
}

testFlow();
