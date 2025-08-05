exports.handler = async function(event, context) {
  // Get username and password from query string
  const params = event.queryStringParameters || {};
  const { username, password } = params;

  let authResult = 'failed';
  if (username === 'userkdn' && password === 'pwd123') {
    authResult = 'success';
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ auth: authResult })
  };
};
