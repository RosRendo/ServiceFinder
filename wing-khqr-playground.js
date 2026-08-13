const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Default Seeded Wing Bank Sandbox Credentials
const DEFAULT_CLIENT_ID = 'Nt1fvXDfJO9nLfwvEhHyBMG_Nh4a';
const DEFAULT_CLIENT_SECRET = 'h02F_zaRmn6PhFjIolbFcb16BgWGMrcfX93frd13Id8a';
const DEFAULT_STAGE_URL = 'https://stage-partner-gateway.wingbank.com';

// Cryptography Helpers
function deriveKey(clientId) {
  return Buffer.from(clientId.padEnd(32, '0').slice(0, 32), 'utf8');
}

function deriveIV(clientId) {
  return Buffer.from(clientId.slice(0, 12), 'utf8');
}

function aesEncrypt(plaintext, key, iv) {
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return Buffer.concat([encrypted, cipher.getAuthTag()]).toString('base64');
}

// Request Handler for the Local Server
async function handleRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve Single Page Playground UI
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getHtmlContent());
    return;
  }

  // API Route: Encryption Helper (Calculate parameters locally for debugging)
  if (req.method === 'POST' && req.url === '/api/playground/encrypt') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const clientId = data.clientId || DEFAULT_CLIENT_ID;
        const key = deriveKey(clientId);
        const iv = deriveIV(clientId);

        const amount = Number(data.amount).toFixed(2);
        const currency = data.currency || 'USD';
        const orderRef = data.orderRef || `ORDER_${Date.now()}`;
        const returnUrl = data.returnUrl || 'https://stage-openapi.wingbank.com/playground';
        const cancelUrl = data.cancelUrl || 'https://stage-openapi.wingbank.com/playground';
        const timestamp = data.timestamp || String(Math.floor(Date.now() / 1000));
        const merchantName = data.merchantName || 'Service Finder';

        // 1. Raw signature string to Base64 encode
        const rawSigStr = `${clientId}#${amount}#${currency}#${orderRef}#${returnUrl}#${cancelUrl}#${timestamp}`;
        const sigB64 = Buffer.from(rawSigStr, 'utf8').toString('base64');
        
        // 2. Encrypt base64 signature to calculate x-payload-hash
        const sigEncrypted = aesEncrypt(sigB64, key, iv);
        const xPayloadHash = crypto.createHash('sha256').update(sigEncrypted).digest('hex');

        // 3. Encrypt payload object containing payment details
        const payloadObj = {
          amount,
          currency,
          order_reference_no: orderRef,
          return_url: returnUrl,
          cancel_url: cancelUrl,
          merchant_name: merchantName,
          timestamp,
          additional_data: data.additionalData || '{}'
        };
        const payloadEncrypted = aesEncrypt(JSON.stringify(payloadObj), key, iv);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          derivedKeyHex: key.toString('hex'),
          derivedIvHex: iv.toString('hex'),
          rawSigStr,
          sigB64,
          sigEncrypted,
          xPayloadHash,
          payloadObj,
          payloadEncrypted
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // API Route: Generate actual KHQR by calling Wing OpenAPI
  if (req.method === 'POST' && req.url === '/api/playground/generate') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const clientId = data.clientId || DEFAULT_CLIENT_ID;
        const clientSecret = data.clientSecret || DEFAULT_CLIENT_SECRET;
        const baseUrl = data.baseUrl || DEFAULT_STAGE_URL;

        // 1. First, fetch OAuth token from Wing Token server
        // Wing OpenApi token URL could be on openapi.wingbank.com or gateway.wingbank.com.
        // We attempt token fetch dynamically.
        const tokenParams = new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'partner:standard'
        });

        // Resolve token URL. In openapi sandbox it's /idp/v1/token.
        const tokenUrl = `${baseUrl}/idp/v1/token`;
        console.log(`\nFetching Token from: ${tokenUrl}`);
        
        const tokenRes = await fetch(tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: tokenParams.toString()
        });

        if (!tokenRes.ok) {
          const errMsg = await tokenRes.text();
          throw new Error(`Token fetch failed [${tokenRes.status}]: ${errMsg}`);
        }

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        // 2. Perform local cryptographic calculation for KHQR payload
        const key = deriveKey(clientId);
        const iv = deriveIV(clientId);

        const amount = Number(data.amount).toFixed(2);
        const currency = data.currency || 'USD';
        const orderRef = data.orderRef || `ORDER_${Date.now()}`;
        const returnUrl = data.returnUrl || 'https://stage-openapi.wingbank.com/playground';
        const cancelUrl = data.cancelUrl || 'https://stage-openapi.wingbank.com/playground';
        const timestamp = String(Math.floor(Date.now() / 1000));
        const merchantName = data.merchantName || 'Service Finder';

        const rawSigStr = `${clientId}#${amount}#${currency}#${orderRef}#${returnUrl}#${cancelUrl}#${timestamp}`;
        const sigB64 = Buffer.from(rawSigStr, 'utf8').toString('base64');
        const sigEncrypted = aesEncrypt(sigB64, key, iv);
        const xPayloadHash = crypto.createHash('sha256').update(sigEncrypted).digest('hex');

        const payloadObj = {
          amount,
          currency,
          order_reference_no: orderRef,
          return_url: returnUrl,
          cancel_url: cancelUrl,
          merchant_name: merchantName,
          timestamp,
          additional_data: data.additionalData || '{}'
        };
        const payloadEncrypted = aesEncrypt(JSON.stringify(payloadObj), key, iv);

        // 3. Post to Wing KHQR Endpoint
        const khqrUrl = `${baseUrl}/generate/khqr`;
        console.log(`Posting KHQR Request to: ${khqrUrl}`);

        const khqrRes = await fetch(khqrUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'x-payload-hash': xPayloadHash
          },
          body: JSON.stringify({ payload: payloadEncrypted })
        });

        const khqrBodyText = await khqrRes.text();
        console.log(`Wing Gateway Status: ${khqrRes.status}`);

        let responseBodyParsed;
        try {
          responseBodyParsed = JSON.parse(khqrBodyText);
        } catch {
          responseBodyParsed = khqrBodyText;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: khqrRes.ok,
          statusCode: khqrRes.status,
          response: responseBodyParsed,
          debug: {
            xPayloadHash,
            payloadObj,
            accessTokenTruncated: accessToken.slice(0, 30) + '...',
            rawSigStr
          }
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Not Found
  res.writeHead(404);
  res.end('Not Found');
}

// Start Server on Port 8080 (or customize)
const PORT = 8080;
const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Wing Bank KHQR Payment Test Playground is Running!`);
  console.log(`🔗 Access locally at: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});

// HTML Interface Template
function getHtmlContent() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wing Bank KHQR Playground</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0A0E17;
      --surface: rgba(16, 22, 35, 0.7);
      --surface-border: rgba(255, 255, 255, 0.08);
      --primary: #00F0FF;
      --primary-hover: #00D8E6;
      --accent: #8A2BE2;
      --text: #F1F5F9;
      --text-muted: #94A3B8;
      --success: #10B981;
      --error: #EF4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', sans-serif;
      background: var(--bg);
      color: var(--text);
      overflow-x: hidden;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: rgba(10, 14, 23, 0.9);
      border-bottom: 1px solid var(--surface-border);
      padding: 18px 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      backdrop-filter: blur(12px);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .logo-row { display: flex; align-items: center; gap: 12px; }
    .logo-icon { width: 32px; height: 32px; background: linear-gradient(135deg, var(--primary), var(--accent)); border-radius: 8px; }
    .logo-text { font-size: 20px; font-weight: 700; background: linear-gradient(to right, #FFF, #A3E635); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .badge { background: rgba(0, 240, 255, 0.1); border: 1px solid var(--primary); color: var(--primary); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .container {
      display: flex;
      flex: 1;
      max-width: 1600px;
      width: 100%;
      margin: 0 auto;
      padding: 24px;
      gap: 24px;
    }
    .sidebar {
      width: 420px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .main-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .glass-card {
      background: var(--surface);
      border: 1px solid var(--surface-border);
      border-radius: 16px;
      padding: 24px;
      backdrop-filter: blur(16px);
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    }
    .card-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #FFF;
      border-left: 3px solid var(--primary);
      padding-left: 10px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    label {
      display: block;
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 6px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    input, select, textarea {
      width: 100%;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      padding: 10px 14px;
      color: #FFF;
      font-family: inherit;
      font-size: 14px;
      transition: all 0.3s;
    }
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(0, 240, 255, 0.15);
    }
    .btn {
      width: 100%;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      border: none;
      color: #0A0E17;
      font-weight: 700;
      padding: 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 240, 255, 0.3);
    }
    .btn-secondary {
      background: transparent;
      border: 1px solid var(--surface-border);
      color: var(--text);
      margin-top: 10px;
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.05);
      transform: none;
      box-shadow: none;
    }
    .row { display: flex; gap: 12px; }
    .col { flex: 1; }

    /* Playground Panels */
    .tabs-row { display: flex; border-bottom: 1px solid var(--surface-border); margin-bottom: 20px; }
    .tab-btn { background: none; border: none; color: var(--text-muted); padding: 12px 24px; font-size: 15px; cursor: pointer; border-bottom: 2px solid transparent; font-weight: 600; }
    .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }

    /* Code Block styling */
    pre {
      font-family: 'Fira Code', monospace;
      font-size: 13px;
      background: rgba(5, 8, 15, 0.95);
      padding: 16px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      overflow-x: auto;
      color: #A7F3D0;
      margin-bottom: 16px;
      max-height: 400px;
    }
    .code-comment { color: #6B7280; }
    .code-keyword { color: #F472B6; }
    .code-string { color: #34D399; }
    
    /* Result Display */
    .result-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px;
      border: 2px dashed var(--surface-border);
      border-radius: 12px;
      min-height: 250px;
      text-align: center;
    }
    .qr-container {
      background: white;
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 16px;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 13px;
      margin-top: 10px;
    }
    .status-success { background: rgba(16, 185, 129, 0.1); color: var(--success); border: 1px solid var(--success); }
    .status-failed { background: rgba(239, 68, 68, 0.1); color: var(--error); border: 1px solid var(--error); }
  </style>
</head>
<body>
  <header>
    <div class="logo-row">
      <div class="logo-icon"></div>
      <div class="logo-text">Wing Bank KHQR Playground</div>
      <div class="badge">SANDBOX ENVIRONMENT</div>
    </div>
    <div style="font-size: 14px; color: var(--text-muted)">Port: 8080</div>
  </header>

  <div class="container">
    <!-- Configuration & Parameters Panel -->
    <div class="sidebar">
      <div class="glass-card">
        <div class="card-title">Wing Credentials</div>
        <div class="form-group">
          <label>Base Server URL</label>
          <input type="text" id="baseUrl" value="${DEFAULT_STAGE_URL}">
        </div>
        <div class="form-group">
          <label>Client ID</label>
          <input type="text" id="clientId" value="${DEFAULT_CLIENT_ID}">
        </div>
        <div class="form-group">
          <label>Client Secret</label>
          <input type="text" id="clientSecret" value="${DEFAULT_CLIENT_SECRET}">
        </div>
      </div>

      <div class="glass-card">
        <div class="card-title">Payment Info</div>
        <div class="row">
          <div class="col">
            <div class="form-group">
              <label>Amount</label>
              <input type="number" id="amount" value="10.00" step="0.01">
            </div>
          </div>
          <div class="col">
            <div class="form-group">
              <label>Currency</label>
              <select id="currency">
                <option value="USD">USD</option>
                <option value="KHR">KHR</option>
              </select>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label>Order Reference No</label>
          <div class="row">
            <input type="text" id="orderRef" style="flex:1">
            <button class="btn" style="width: auto; padding: 10px 14px" onclick="generateOrderRef()">🔄</button>
          </div>
        </div>
        <div class="form-group">
          <label>Merchant Name</label>
          <input type="text" id="merchantName" value="Service Finder">
        </div>
        <div class="form-group">
          <label>Additional Data (JSON)</label>
          <textarea id="additionalData" rows="2">{"serviceId":"45"}</textarea>
        </div>
      </div>
    </div>

    <!-- Playground Panels -->
    <div class="main-panel">
      <div class="glass-card" style="flex: 1">
        <div class="tabs-row">
          <button class="tab-btn active" onclick="switchTab('crypto')">🔐 Local Cryptography</button>
          <button class="tab-btn" onclick="switchTab('api')">⚡ Send Request & Response</button>
        </div>

        <!-- Local Cryptography tab -->
        <div id="tab-crypto" class="tab-content">
          <button class="btn" onclick="runEncryption()" style="margin-bottom: 20px">Calculate Signature Hash & Payload</button>
          
          <label>1. Plaintext Payload Object (To Encrypt)</label>
          <pre id="crypto-payload-obj">// Calculated payload will display here...</pre>

          <label>2. Base64 Encrypted Payload ('payload' parameter)</label>
          <pre id="crypto-payload-enc" style="word-break: break-all; white-space: pre-wrap;">// Encrypted Base64 string will display here...</pre>

          <div class="row">
            <div class="col">
              <label>3. raw x-payload-hash string</label>
              <pre id="crypto-raw-sig" style="white-space: pre-wrap;">// Raw signature string...</pre>
            </div>
            <div class="col">
              <label>4. generated x-payload-hash</label>
              <pre id="crypto-xhash" style="color: #60A5FA;">// SHA256 Hash of signature...</pre>
            </div>
          </div>
        </div>

        <!-- API tab -->
        <div id="tab-api" class="tab-content" style="display: none">
          <div class="row" style="gap: 24px">
            <div class="col" style="flex: 1.2">
              <button class="btn" onclick="sendKhqrRequest()">🚀 Send POST /generate/khqr</button>
              
              <div style="margin-top: 20px">
                <label>HTTP Headers Sent</label>
                <pre id="api-headers" style="color: #F87171;">// Headers info...</pre>

                <label>HTTP Body Sent</label>
                <pre id="api-body">// JSON request body...</pre>
              </div>
            </div>
            
            <div class="col" style="flex: 0.8">
              <label>Response Result</label>
              <div class="result-wrapper" id="result-wrapper">
                <div style="color: var(--text-muted)">Click "Send POST /generate/khqr" to fetch a real KHQR code from Wing Bank sandbox gateway.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    function generateOrderRef() {
      document.getElementById('orderRef').value = 'SF_' + Date.now();
    }
    generateOrderRef();

    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      event.target.classList.add('active');
      document.getElementById('tab-' + tab).style.display = 'block';
    }

    async function runEncryption() {
      const payload = {
        clientId: document.getElementById('clientId').value,
        clientSecret: document.getElementById('clientSecret').value,
        amount: document.getElementById('amount').value,
        currency: document.getElementById('currency').value,
        orderRef: document.getElementById('orderRef').value,
        merchantName: document.getElementById('merchantName').value,
        additionalData: document.getElementById('additionalData').value
      };

      try {
        const res = await fetch('/api/playground/encrypt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        document.getElementById('crypto-payload-obj').textContent = JSON.stringify(data.payloadObj, null, 2);
        document.getElementById('crypto-payload-enc').textContent = data.payloadEncrypted;
        document.getElementById('crypto-raw-sig').textContent = data.rawSigStr;
        document.getElementById('crypto-xhash').textContent = data.xPayloadHash;
      } catch (err) {
        alert("Encryption failed: " + err.message);
      }
    }

    async function sendKhqrRequest() {
      const payload = {
        baseUrl: document.getElementById('baseUrl').value,
        clientId: document.getElementById('clientId').value,
        clientSecret: document.getElementById('clientSecret').value,
        amount: document.getElementById('amount').value,
        currency: document.getElementById('currency').value,
        orderRef: document.getElementById('orderRef').value,
        merchantName: document.getElementById('merchantName').value,
        additionalData: document.getElementById('additionalData').value
      };

      const resultWrapper = document.getElementById('result-wrapper');
      resultWrapper.innerHTML = '<div>⌛ Loading Token & Generating KHQR...</div>';

      try {
        const res = await fetch('/api/playground/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();

        // Populate Headers and Request displays
        document.getElementById('api-headers').textContent = data.debug ? JSON.stringify({
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + data.debug.accessTokenTruncated,
          'x-payload-hash': data.debug.xPayloadHash
        }, null, 2) : '// No headers generated (Connection failed)';

        document.getElementById('api-body').textContent = data.debug ? JSON.stringify({
          payload: data.debug.payloadEncrypted
        }, null, 2) : '// No request body generated';

        if (data.success) {
          const qrCodeEmv = data.response?.data?.qrCode || data.response?.qrCode;
          const qrImageSource = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(qrCodeEmv);
          
          resultWrapper.innerHTML = \`
            <div class="status-badge status-success">✅ Success [Code \${data.statusCode}]</div>
            <div class="qr-container" style="margin-top: 15px">
              <img src="\${qrImageSource}" alt="Generated KHQR" style="display: block">
            </div>
            <div style="font-size: 12px; color: var(--text-muted); word-break: break-all; margin-top: 10px">
              <strong>EMV Format:</strong><br>\${qrCodeEmv}
            </div>
          \`;
        } else {
          resultWrapper.innerHTML = \`
            <div class="status-badge status-failed">❌ Request Failed [Code \${data.statusCode || 500}]</div>
            <div style="font-size: 13px; color: var(--error); margin-top: 15px; text-align: left; background: rgba(0,0,0,0.4); padding: 12px; border-radius: 8px">
              <pre style="background: none; border: none; color: inherit; padding: 0; margin: 0; max-height: none;">\${JSON.stringify(data.response || data.error || data, null, 2)}</pre>
            </div>
          \`;
        }
      } catch (err) {
        resultWrapper.innerHTML = \`
          <div class="status-badge status-failed">❌ Local Server Connection Error</div>
          <div style="margin-top: 10px; color: var(--text-muted)">\${err.message}</div>
        \`;
      }
    }
  </script>
</body>
</html>
  `;
}
