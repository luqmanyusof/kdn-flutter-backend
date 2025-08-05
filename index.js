const http = require('http');
const url = require('url');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

// Initialize SQLite database
const db = new sqlite3.Database('./ahli.db', (err) => {
  if (err) {
    console.error('Error opening database', err);
    return;
  }
  console.log('Connected to SQLite database');
  
  // Create ahli table if not exists
  db.run(`CREATE TABLE IF NOT EXISTS ahli (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    telefon TEXT,
    email TEXT,
    jawatan TEXT,
    nombor_ic TEXT,
    no_keahlian TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
});

const PORT = 3000;

// Hardcoded credentials for authentication
const AUTH_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Helper function to parse request body
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
  });
}

// Helper function to send JSON response
function sendResponse(res, statusCode, data) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
}

// Authentication middleware
function authenticate(req, res, callback) {
  const reqUrl = url.parse(req.url, true);
  const { username, password } = reqUrl.query;
  
  if (username === AUTH_CREDENTIALS.username && password === AUTH_CREDENTIALS.password) {
    callback();
  } else {
    sendResponse(res, 401, { error: 'Authentication failed' });
  }
}

const server = http.createServer(async (req, res) => {
  const reqUrl = url.parse(req.url, true);
  
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Authentication endpoint
  if (reqUrl.pathname === '/auth') {
    const { username, password } = reqUrl.query;
    const isAuthenticated = username === AUTH_CREDENTIALS.username && 
                          password === AUTH_CREDENTIALS.password;
    
    sendResponse(res, 200, { 
      auth: isAuthenticated ? 'success' : 'failed',
      token: isAuthenticated ? 'dummy-jwt-token' : null
    });
  }
  // Get all ahli
  else if (reqUrl.pathname === '/ahli' && req.method === 'GET') {
    db.all('SELECT * FROM ahli', [], (err, rows) => {
      if (err) {
        sendResponse(res, 500, { error: err.message });
        return;
      }
      sendResponse(res, 200, rows);
    });
  }
  // Add new ahli
  else if (reqUrl.pathname === '/ahli' && req.method === 'POST') {
    authenticate(req, res, async () => {
      try {
        const data = await parseBody(req);
        const id = uuidv4();
        const { nama, telefon, email, jawatan, nombor_ic, no_keahlian } = data;
        
        db.run(
          'INSERT INTO ahli (id, nama, telefon, email, jawatan, nombor_ic, no_keahlian) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, nama, telefon, email, jawatan, nombor_ic, no_keahlian],
          function(err) {
            if (err) {
              sendResponse(res, 400, { error: err.message });
              return;
            }
            sendResponse(res, 201, { 
              id,
              message: 'Ahli berjaya ditambah',
              ...data 
            });
          }
        );
      } catch (error) {
        sendResponse(res, 400, { error: 'Invalid JSON data' });
      }
    });
  }
  // Update ahli
  else if (reqUrl.pathname.startsWith('/ahli/') && req.method === 'PUT') {
    authenticate(req, res, async () => {
      try {
        const id = reqUrl.pathname.split('/')[2];
        const data = await parseBody(req);
        const { nama, telefon, email, jawatan, nombor_ic, no_keahlian } = data;
        
        db.run(
          `UPDATE ahli 
           SET nama = ?, telefon = ?, email = ?, jawatan = ?, 
               nombor_ic = ?, no_keahlian = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [nama, telefon, email, jawatan, nombor_ic, no_keahlian, id],
          function(err) {
            if (err) {
              sendResponse(res, 400, { error: err.message });
              return;
            }
            if (this.changes === 0) {
              sendResponse(res, 404, { error: 'Ahli tidak dijumpai' });
              return;
            }
            sendResponse(res, 200, { 
              id,
              message: 'Ahli berjaya dikemaskini',
              ...data 
            });
          }
        );
      } catch (error) {
        sendResponse(res, 400, { error: 'Invalid JSON data' });
      }
    });
  }
  // View all ahli in HTML table
  else if (reqUrl.pathname === '/ahli-html' && req.method === 'GET') {
    db.all('SELECT * FROM ahli', [], (err, rows) => {
      if (err) {
        sendResponse(res, 500, { error: err.message });
        return;
      }
      
      // Generate HTML table
      let html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Senarai Ahli</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #2c3e50; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f2f2f2; position: sticky; top: 0; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          tr:hover { background-color: #f1f1f1; }
          .container { max-width: 1200px; margin: 0 auto; }\n          .last-updated { margin-top: 20px; color: #666; font-size: 0.9em; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Senarai Ahli</h1>
          <p>Jumlah ahli: ${rows.length}</p>
          <div style="overflow-x:auto;">
            <table>
              <thead>
                <tr>
                  <th>No. Keahlian</th>
                  <th>Nama</th>
                  <th>No. IC</th>
                  <th>Jawatan</th>
                  <th>Telefon</th>
                  <th>Email</th>
                  <th>Tarikh Daftar</th>
                </tr>
              </thead>
              <tbody>`;
      
      // Add table rows
      rows.forEach(ahli => {
        const date = new Date(ahli.created_at).toLocaleDateString('ms-MY');
        html += `
                <tr>
                  <td>${ahli.no_keahlian || '-'}</td>
                  <td>${ahli.nama || '-'}</td>
                  <td>${ahli.nombor_ic || '-'}</td>
                  <td>${ahli.jawatan || '-'}</td>
                  <td>${ahli.telefon || '-'}</td>
                  <td>${ahli.email || '-'}</td>
                  <td>${date}</td>
                </tr>`;
      });
      
      // Close HTML
      html += `
              </tbody>
            </table>
          </div>
          <div class="last-updated">
            Kemaskini terakhir: ${new Date().toLocaleString('ms-MY')}
          </div>
        </div>
      </body>
      </html>`;
      
      // Send HTML response
      res.setHeader('Content-Type', 'text/html');
      res.statusCode = 200;
      res.end(html);
    });
  }
  // Handle 404
  else {
    sendResponse(res, 404, { error: 'Endpoint not found' });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`- GET  /ahli - Get all ahli`);
  console.log(`- POST /ahli - Add new ahli (requires auth)`);
  console.log(`- PUT  /ahli/:id - Update ahli (requires auth)`);
  console.log(`- GET  /auth?username=admin&password=admin123 - Authenticate`);
});
