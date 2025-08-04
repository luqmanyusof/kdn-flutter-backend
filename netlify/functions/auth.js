exports.handler = async function(event, context) {
  // Get username and password from query string
  const params = event.queryStringParameters || {};
  // Always return auth: success
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ auth: 'success' })
  };
};
