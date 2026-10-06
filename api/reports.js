const { neon } = require('@neondatabase/serverless');

const storageError = response => response.status(503).json({ error: 'Cơ sở dữ liệu báo lỗi chưa sẵn sàng. Vui lòng kết nối Neon Postgres và đặt DATABASE_URL trên Vercel.' });
const reportRow = report => ({ id: Number(report.id), questionId: report.question_id, stem: report.stem, selectedAnswer: report.selected_answer, correctAnswer: report.correct_answer, detail: report.detail, status: report.status, reviewNote: report.review_note, reportedAt: report.reported_at, updatedAt: report.updated_at });

async function database() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing');
  const sql = neon(process.env.DATABASE_URL);
  await sql("CREATE TABLE IF NOT EXISTS mcq_reports (id BIGSERIAL PRIMARY KEY, question_id INTEGER NOT NULL, stem TEXT NOT NULL, selected_answer TEXT, correct_answer TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')), review_note TEXT NOT NULL DEFAULT '', reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())");
  return sql;
}

const isAdmin = request => process.env.REPORTS_ADMIN_KEY && request.headers.authorization === `Bearer ${process.env.REPORTS_ADMIN_KEY}`;

module.exports = async (request, response) => {
  if (request.method === 'POST') {
    const { questionId, stem, selectedAnswer, correctAnswer, detail = '' } = request.body || {};
    if (!Number.isInteger(questionId) || typeof stem !== 'string' || typeof correctAnswer !== 'string' || typeof detail !== 'string' || detail.length > 2000) return response.status(400).json({ error: 'Dữ liệu báo lỗi không hợp lệ.' });
    try {
      const sql = await database();
      const [report] = await sql`INSERT INTO mcq_reports (question_id, stem, selected_answer, correct_answer, detail) VALUES (${questionId}, ${stem}, ${selectedAnswer || null}, ${correctAnswer}, ${detail}) RETURNING *`;
      return response.status(201).json(reportRow(report));
    } catch { return storageError(response); }
  }

  if (request.method === 'GET') {
    if (!isAdmin(request)) return response.status(401).json({ error: 'Không được phép.' });
    try {
      const sql = await database();
      return response.status(200).json((await sql('SELECT * FROM mcq_reports ORDER BY reported_at DESC')).map(reportRow));
    } catch { return storageError(response); }
  }

  if (request.method === 'PATCH') {
    if (!isAdmin(request)) return response.status(401).json({ error: 'Không được phép.' });
    const { id, status, reviewNote = '' } = request.body || {};
    if (!Number.isInteger(id) || !['open', 'resolved'].includes(status) || typeof reviewNote !== 'string' || reviewNote.length > 2000) return response.status(400).json({ error: 'Dữ liệu rà soát không hợp lệ.' });
    try {
      const sql = await database();
      const [report] = await sql`UPDATE mcq_reports SET status = ${status}, review_note = ${reviewNote}, updated_at = NOW() WHERE id = ${id} RETURNING *`;
      return report ? response.status(200).json(reportRow(report)) : response.status(404).json({ error: 'Không tìm thấy báo lỗi.' });
    } catch { return storageError(response); }
  }

  response.setHeader('Allow', 'GET, POST, PATCH');
  return response.status(405).end();
};
