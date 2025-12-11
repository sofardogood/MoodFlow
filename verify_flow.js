const BASE_URL = 'http://localhost:3000/api';

async function test() {
    console.log('--- Starting Verification ---');

    // 1. Create Session (via my-sessions, though we need a user ID. Let's assume user ID 1 exists from previous steps)
    // Actually, create session needs user ID header.
    // Let's create a temporary user first? Or just use existing.
    // We can use the 'auth' endpoint to get a user.

    let userId;
    try {
        const authRes = await fetch(BASE_URL + '/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'login',
                email: 'demo@example.com',
                password: 'demo'
            })
        });
        const authData = await authRes.json();
        if (!authData.success) throw new Error('Auth failed: ' + authData.error);
        userId = authData.user.id;
        console.log('✅ Auth successful. User ID:', userId);
    } catch (e) {
        console.error('❌ Auth Error:', e.message);
        return;
    }

    // 2. Create Session
    let sessionId;
    try {
        const createRes = await fetch(BASE_URL + '/my-sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId
            },
            body: JSON.stringify({ name: 'Test Session ' + Date.now() })
        });
        const createData = await createRes.json();
        if (!createData.success) throw new Error('Create Session failed: ' + createData.error);
        sessionId = createData.session.id;
        console.log('✅ Session Created:', sessionId);
    } catch (e) {
        console.error('❌ Create Session Error:', e.message);
        return;
    }

    // 3. Submit Mood
    try {
        const moodRes = await fetch(BASE_URL + '/submit-mood', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: sessionId,
                nickname: 'Tester',
                moodScore: 5,
                emoticon: '😊',
                comment: 'Hello World'
            })
        });
        const moodData = await moodRes.json();
        if (!moodData.success) throw new Error('Submit Mood failed');
        console.log('✅ Mood Submitted');
    } catch (e) {
        console.error('❌ Submit Mood Error:', e.message);
    }

    // 4. Submit Transcript
    try {
        const transRes = await fetch(BASE_URL + '/submit-transcript', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId: sessionId,
                text: 'Testing transcript 123',
                speaker: 'Presenter'
            })
        });
        const transData = await transRes.json();
        if (!transData.success) throw new Error('Submit Transcript failed');
        console.log('✅ Transcript Submitted');
    } catch (e) {
        console.error('❌ Submit Transcript Error:', e.message);
    }

    // 5. Get Visual Data
    try {
        const getRes = await fetch(BASE_URL + `/get-visual-data?sessionId=${sessionId}`);
        const getData = await getRes.json();

        console.log('--- Fetch Results ---');
        console.log('Moods count:', getData.moods.length);
        console.log('Transcripts count:', getData.transcripts.length);

        if (getData.moods.length > 0 && getData.transcripts.length > 0) {
            console.log('✅ Data Retrieval Verified!');
        } else {
            console.error('❌ Data missing in retrieval');
        }

    } catch (e) {
        console.error('❌ Get Data Error:', e.message);
    }
}

test();
