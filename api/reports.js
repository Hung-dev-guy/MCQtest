const { get, list, put } = require('@vercel/blob');

const readStream = async stream => {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

module.exports = async (request, response) => {
  if (request.method === 'POST') {
    const { questionId, stem, selectedAnswer, correctAnswer, detail = '' } = request.body || {};
    if (!Number.isInteger(questionId) || typeof stem !== 'string' || typeof correctAnswer !== 'string' || typeof detail !== 'string' || detail.length > 2000) {
      return response.status(400).json({ error: 'Dữ liệu báo lỗi không hợp lệ.' });
    }
    const report = { questionId, stem, selectedAnswer: selectedAnswer || null, correctAnswer, detail, reportedAt: new Date().toISOString() };
    await put(`mcq-reports/${Date.now()}-${crypto.randomUUID()}.json`, JSON.stringify(report), { access: 'private', addRandomSuffix: false, contentType: 'application/json' });
    return response.status(201).json({ ok: true });
  }

  if (request.method === 'GET') {
    if (!process.env.REPORTS_ADMIN_KEY || request.headers.authorization !== `Bearer ${process.env.REPORTS_ADMIN_KEY}`) return response.status(401).json({ error: 'Không được phép.' });
    const { blobs } = await list({ prefix: 'mcq-reports/', limit: 1000 });
    const reports = await Promise.all(blobs.map(async blob => {
      const result = await get(blob.pathname, { access: 'private' });
      return result?.stream ? readStream(result.stream) : null;
    }));
    return response.status(200).json(reports.filter(Boolean).sort((a, b) => b.reportedAt.localeCompare(a.reportedAt)));
  }

  response.setHeader('Allow', 'GET, POST');
  return response.status(405).end();
};
