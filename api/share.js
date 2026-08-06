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

module.exports = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.redirect(302, '/');
  }

  let potData = null;
  const projectId = 'spirit-tree-ceramics';

  try {
    // 1. Try to fetch direct document by ID (fallback/older doc ID case)
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
    console.error('Error fetching pot details:', err);
  }

  // Fallback defaults if pot not found or error
  let title = 'Spirit Tree Ceramics';
  if (potData) {
    title = potData.shareTitle ? potData.shareTitle : `Spirit Tree Ceramics - ${potData.title}`;
  }

  let desc = 'Handmade functional art and stoneware fired in Dallas, TX.';
  if (potData) {
    desc = potData.shareDesc ? potData.shareDesc : `${potData.description} - $${potData.price}`;
  }
  let image = potData && potData.imageUrl ? potData.imageUrl : '';
  if (image && image.startsWith('data:image/')) {
    image = `https://www.spirittreeceramics.com/api/image?id=${id}`;
  } else if (!image || !image.startsWith('http')) {
    const type = (potData && potData.type ? potData.type.toLowerCase().trim() : 'other');
    const banners = {
      mug: 'https://www.spirittreeceramics.com/images/shop_mugs_banner.jpg',
      vase: 'https://www.spirittreeceramics.com/images/shop_vases_banner.jpg',
      bowl: 'https://www.spirittreeceramics.com/images/shop_bowls_banner.jpg',
      plate: 'https://www.spirittreeceramics.com/images/shop_plates_banner.jpg',
      platter: 'https://www.spirittreeceramics.com/images/shop_platters_banner.jpg',
      other: 'https://www.spirittreeceramics.com/images/hero.png'
    };
    image = banners[type] || banners['other'];
  }

  // Return HTML with Open Graph tags and JS redirect
  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="800">
  <meta property="og:image:height" content="800">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://www.spirittreeceramics.com/pot/${id}">
  <meta property="og:site_name" content="Spirit Tree Ceramics">
  <meta property="fb:pages" content="61559072458774">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(desc)}">
  <meta name="twitter:image" content="${image}">
  
  <script>
    // Redirect to index page with hash fragment to open lightbox
    window.location.replace("/#inquire-${id}");
  </script>
</head>
<body>
  Redirecting to Spirit Tree Ceramics...
</body>
</html>
  `);
};

// Helper to parse Firestore REST fields into flat javascript object
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

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
