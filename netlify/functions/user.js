const { get } = require('@netlify/blobs');

exports.handler = async function(event, context) {
  const key = 'users.json';
  const existing = await get(key);
  const users = existing ? JSON.parse(existing) : [];
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(users)
  };
};
