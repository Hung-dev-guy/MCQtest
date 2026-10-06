const $ = selector => document.querySelector(selector);
const state = { key: '', reports: [] };

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function formatDate(value) { return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
function groupedReports() {
  const filter = $('#report-filter').value.trim().toLocaleLowerCase('vi');
  const groups = new Map();
  state.reports.forEach(report => {
    const searchable = `${report.questionId} ${report.stem} ${report.detail}`.toLocaleLowerCase('vi');
    if (filter && !searchable.includes(filter)) return;
    const group = groups.get(report.questionId) || [];
    group.push(report); groups.set(report.questionId, group);
  });
  return [...groups.entries()].sort((a, b) => b[1][0].reportedAt.localeCompare(a[1][0].reportedAt));
}
function renderReports() {
  const groups = groupedReports();
  $('#reports-list').replaceChildren();
  $('#reports-summary').textContent = groups.length ? `${groups.length} câu có báo lỗi · ${groups.reduce((sum, [, reports]) => sum + reports.length, 0)} lượt gửi` : 'Chưa có báo lỗi phù hợp.';
  groups.forEach(([questionId, reports]) => {
    const latest = reports[0];
    const card = node('article', '', 'report-card');
    const heading = node('div', '', 'report-heading');
    const title = node('h2', `Câu ${questionId}`);
    const count = node('span', `${reports.length} báo lỗi`, 'report-count');
    heading.append(title, count); card.append(heading, node('p', latest.stem, 'report-stem'));
    const details = node('div', '', 'report-details');
    reports.forEach(report => {
      const item = node('div', '', 'report-detail');
      item.append(node('strong', formatDate(report.reportedAt)), node('p', report.detail || 'Không có mô tả.'), node('p', `Đáp án sinh viên chọn: ${report.selectedAnswer || 'Chưa chọn'}`, 'muted-copy'));
      details.append(item);
    });
    const link = node('a', 'Mở câu để rà soát →', 'report-link');
    link.href = `/?q=${questionId}`;
    card.append(details, link); $('#reports-list').append(card);
  });
}
async function loadReports() {
  $('#refresh-reports').disabled = true;
  try {
    const response = await fetch('/api/reports', { headers: { Authorization: `Bearer ${state.key}` } });
    if (response.status === 401) throw new Error('Khóa quản trị không đúng.');
    if (!response.ok) throw new Error('Chưa tải được báo lỗi. Vui lòng thử lại.');
    state.reports = await response.json(); $('#access-status').textContent = ''; renderReports(); return true;
  } catch (error) {
    $('#access-status').textContent = error.message;
    $('#reports-panel').hidden = true; $('#access-card').hidden = false;
  } finally { $('#refresh-reports').disabled = false; }
}

$('#access-form').addEventListener('submit', async event => {
  event.preventDefault(); state.key = $('#admin-key').value;
  $('#access-status').textContent = 'Đang kiểm tra khóa…';
  if (await loadReports()) { $('#access-card').hidden = true; $('#reports-panel').hidden = false; }
});
$('#refresh-reports').addEventListener('click', loadReports);
$('#report-filter').addEventListener('input', renderReports);
