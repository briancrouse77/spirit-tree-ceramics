const https = require('https');

// Helper to make https requests using Node built-in
function fetchUrl(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function parseFields(fields) {
  const result = {};
  for (const key in fields) {
    const valObj = fields[key];
    if ('stringValue' in valObj) {
      result[key] = valObj.stringValue;
    } else if ('integerValue' in valObj) {
      result[key] = parseInt(valObj.integerValue, 10);
    } else if ('doubleValue' in valObj) {
      result[key] = parseFloat(valObj.doubleValue);
    } else if ('booleanValue' in valObj) {
      result[key] = valObj.booleanValue;
    }
  }
  return result;
}

module.exports = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).send('Missing pot id');
  }

  let potData = null;
  const projectId = 'spirit-tree-ceramics';

  try {
    // 1. Try to fetch direct document by ID
    const directUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/pots/${id}`;
    const directRes = await fetchUrl(directUrl);

    if (directRes.status === 200 && directRes.body && directRes.body.fields) {
      potData = parseFields(directRes.body.fields);
    } else {
      // 2. Try structured query where id == potId (custom ID case)
      const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
      const queryBody = {
        structuredQuery: {
          from: [{ collectionId: 'pots' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'id' },
              op: 'EQUAL',
              value: { stringValue: id }
            }
          },
          limit: 1
        }
      };
      const queryRes = await fetchUrl(queryUrl, 'POST', queryBody);
      if (
        queryRes.status === 200 &&
        Array.isArray(queryRes.body) &&
        queryRes.body.length > 0 &&
        queryRes.body[0].document &&
        queryRes.body[0].document.fields
      ) {
        potData = parseFields(queryRes.body[0].document.fields);
      }
    }
  } catch (err) {
    console.error('Error fetching image data:', err);
  }

  if (potData && potData.imageUrl && potData.imageUrl.startsWith('data:image/')) {
    try {
      const match = potData.imageUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
      if (match) {
        const mimeType = `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}`;
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Cache the image on the CDN edge for 1 day
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
        res.setHeader('Content-Type', mimeType);
        return res.status(200).send(buffer);
      }
    } catch (e) {
      console.error('Error parsing base64 image:', e);
    }
  }

  // Fallback to a default placeholder image redirect if not found or not base64
  return res.redirect(302, 'https://www.spirittreeceramics.com/images/hero.png');
};
