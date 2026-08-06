const https = require('https');
const querystring = require('querystring');

function sendSms(to, from, body, accountSid, authToken) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      To: to,
      From: from,
      Body: body
    });
    
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const options = {
      hostname: 'api.twilio.com',
      port: 443,
      path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    };
    
    const req = https.request(options, (res) => {
      let resData = '';
      res.on('data', (chunk) => { resData += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(resData));
          } catch (e) {
            resolve(resData);
          }
        } else {
          reject(new Error(`Twilio returned HTTP ${res.statusCode}: ${resData}`));
        }
      });
    });
    
    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, details } = req.body || {};

  if (!type || !details) {
    return res.status(400).json({ error: 'Missing type or details' });
  }

  // Retrieve environment variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const toNumber = process.env.JOHN_PHONE_NUMBER;

  // Fail-safe: if credentials are not configured, log warning but respond with 200
  // so the client-side UI doesn't crash or show an error to the customer.
  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    console.warn('Twilio SMS credentials are not fully configured in Vercel environment variables.');
    return res.status(200).json({ 
      success: false, 
      message: 'SMS skipped: Credentials not configured.' 
    });
  }

  // Construct message body
  let messageBody = '';
  const adminUrl = 'https://www.spirittreeceramics.com/admin.html';

  if (type === 'inquiry') {
    messageBody = `🏺 New Pottery Inquiry!\n\n` +
      `Item: ${details.title} ($${details.price})\n` +
      `Name: ${details.name}\n` +
      `Email: ${details.email}\n` +
      `Phone: ${details.phone || 'N/A'}\n` +
      `Message: ${details.notes || 'None'}\n\n` +
      `Manage: ${adminUrl}`;
  } else if (type === 'booking') {
    messageBody = `📅 New Class Booking!\n\n` +
      `Class: ${details.experience}\n` +
      `Name: ${details.name}\n` +
      `Email: ${details.email}\n` +
      `Phone: ${details.phone || 'N/A'}\n` +
      `Date/Time: ${details.date} at ${details.time}\n` +
      `Guests: ${details.guests || 1}\n` +
      `Message: ${details.notes || 'None'}\n\n` +
      `Manage: ${adminUrl}`;
  } else if (type === 'message') {
    messageBody = `✉️ New Contact Message!\n\n` +
      `Name: ${details.name}\n` +
      `Email: ${details.email}\n` +
      `Message: ${details.message || 'None'}\n\n` +
      `Manage: ${adminUrl}`;
  } else {
    return res.status(400).json({ error: 'Invalid notification type' });
  }

  try {
    await sendSms(toNumber, fromNumber, messageBody, accountSid, authToken);
    return res.status(200).json({ success: true, message: 'SMS sent successfully.' });
  } catch (err) {
    console.error('Failed to send SMS via Twilio:', err.message);
    // Return 200 success: false so the client doesn't throw a user-facing error
    return res.status(200).json({ success: false, error: err.message });
  }
};
