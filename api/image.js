const https = require('https');
const Jimp = require('jimp');

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
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Use Jimp to pad the image to 1200x630 (1.91:1 ratio) to prevent cropping on Facebook
        const potImage = await Jimp.read(buffer);
        
        // 1200x630 card background (using dark slate brand color #111625)
        const bg = new Jimp(1200, 630, 0x111625FF);
        
        // Scale pot image down to fit comfortably with a small border
        potImage.scaleToFit(1140, 570);
        
        // Composite centered
        const x = (1200 - potImage.bitmap.width) / 2;
        const y = (630 - potImage.bitmap.height) / 2;
        bg.composite(potImage, x, y);
        
        const outputBuffer = await bg.getBufferAsync(Jimp.MIME_JPEG);
        
        // Cache the image on the CDN edge for 1 day
        res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
        res.setHeader('Content-Type', 'image/jpeg');
        return res.status(200).send(outputBuffer);
      }
    } catch (e) {
      console.error('Error parsing base64 image:', e);
    }
  }

  // Fallback to a default placeholder image redirect if not found or not base64
  return res.redirect(302, 'https://www.spirittreeceramics.com/images/hero.png');
};
