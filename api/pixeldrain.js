// Vercel Serverless Function - Pixeldrain API Proxy
// Giấu API key, frontend chỉ cần fetch /api/pixeldrain

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { action, id } = req.query;
  const API_KEY = process.env.PIXELDRAIN_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      success: false,
      message: '⚠ API key chưa được cấu hình. Vui lòng thêm PIXELDRAIN_API_KEY vào Vercel Environment Variables.'
    });
  }

  const authHeader = 'Basic ' + Buffer.from(':' + API_KEY).toString('base64');

  try {
    // ── Lấy danh sách toàn bộ file của user ──────────────────────────────────
    if (action === 'list') {
      const resp = await fetch('https://pixeldrain.com/api/user/files', {
        headers: { Authorization: authHeader }
      });
      const data = await resp.json();
      return res.status(resp.status).json(data);

    // ── Lấy thông tin chi tiết 1 file ───────────────────────────────────────
    } else if (action === 'info' && id) {
      const resp = await fetch(`https://pixeldrain.com/api/file/${id}/info`, {
        headers: { Authorization: authHeader }
      });
      const data = await resp.json();
      return res.status(resp.status).json(data);

    // ── Proxy thumbnail (để tránh CORS và ẩn auth) ──────────────────────────
    } else if (action === 'thumbnail' && id) {
      const resp = await fetch(
        `https://pixeldrain.com/api/file/${id}/thumbnail?width=200&height=260`,
        { headers: { Authorization: authHeader } }
      );
      if (!resp.ok) return res.status(404).end();
      const buf = Buffer.from(await resp.arrayBuffer());
      res.setHeader('Content-Type', resp.headers.get('content-type') || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=7200');
      return res.end(buf);

    } else {
      return res.status(400).json({ success: false, message: 'Tham số action không hợp lệ' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
