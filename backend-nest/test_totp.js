const { authenticator } = require('otplib');

const secret = 'PNYRMKSXJUGQSASG';
const code = '119251';


authenticator.options = { window: 20 }; // Huge window to check if it's a time issue
const isValid = authenticator.verify({ token: code, secret });


const expectedCode = authenticator.generate(secret);
