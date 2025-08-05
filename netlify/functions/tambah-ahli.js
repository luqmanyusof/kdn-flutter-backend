const { set, get } = require('@netlify/blobs');

exports.handler = async function(event, context) {
  const key = 'users.json';

  if (event.httpMethod === 'POST') {
    const data = JSON.parse(event.body);

    // Get existing users
    let users = [];
    const existing = await get(key);
    if (existing) {
      users = JSON.parse(existing);
    }

    // Add new user
    users.push(data);

    // Save back to blob storage
    await set(key, JSON.stringify(users));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, users })
    };
  }

  if (event.httpMethod === 'GET') {
    const existing = await get(key);
    const users = existing ? JSON.parse(existing) : [];
    return {
      statusCode: 200,
      body: JSON.stringify(users)
    };
  }

  return { statusCode: 405, body: 'Method Not Allowed' };
};
