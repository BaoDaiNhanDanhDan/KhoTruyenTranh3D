// Netlify Serverless Function - Pixeldrain API Proxy

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { action, id } = event.queryStringParameters || {};
  const API_KEY = process.env.PIXELDRAIN_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: '⚠ API key chưa được cấu hình. Vui lòng thêm PIXELDRAIN_API_KEY vào Netlify Environment Variables.'
      })
    };
  }

  const authHeader = 'Basic ' + Buffer.from(':' + API_KEY).toString('base64');

  try {
    // ── Lấy danh sách toàn bộ file của user ──────────────────────────────────
    if (action === 'list') {
      const resp = await fetch('https://pixeldrain.com/api/user/files', {
        headers: { Authorization: authHeader }
      });
      const data = await resp.json();
      return {
        statusCode: resp.status,
        headers,
        body: JSON.stringify(data)
      };

      // ── Lấy thông tin chi tiết 1 file ───────────────────────────────────────
    } else if (action === 'info' && id) {
      const resp = await fetch(`https://pixeldrain.com/api/file/${id}/info`, {
        headers: { Authorization: authHeader }
      });
      const data = await resp.json();
      return {
        statusCode: resp.status,
        headers,
        body: JSON.stringify(data)
      };

      // ── Proxy thumbnail (để tránh CORS và ẩn auth) ──────────────────────────
    } else if (action === 'thumbnail' && id) {
      const resp = await fetch(
        `https://pixeldrain.com/api/file/${id}/thumbnail?width=200&height=260`,
        { headers: { Authorization: authHeader } }
      );
      if (!resp.ok) {
        return { statusCode: 404, headers, body: '' };
      }

      const arrayBuffer = await resp.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': resp.headers.get('content-type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=7200'
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true
      };

    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Tham số action không hợp lệ' })
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: err.message })
    };
  }
};
