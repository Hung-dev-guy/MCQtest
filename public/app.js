const state = { questions: [], index: 0, answers: JSON.parse(localStorage.getItem('compnet-answers') || '{}') };
const $ = selector => document.querySelector(selector);
const letters = ['A', 'B', 'C', 'D'];

function shuffledOptions(question) {
  const options = [question.correct, ...question.distractors];
  let seed = question.id * 9301 + 49297;
  return options.map((text, i) => ({ text, i })).sort(() => ((seed = (seed * 9301 + 49297) % 233280) / 233280) - .5);
}
function saveAnswers() { localStorage.setItem('compnet-answers', JSON.stringify(state.answers)); }
function render() {
  const question = state.questions[state.index];
  const answer = state.answers[question.id];
  const options = shuffledOptions(question);
  $('#question-number').textContent = `Câu ${question.id}`;
  $('#stem').textContent = question.stem;
  $('#choices').innerHTML = options.map((option, index) => `<label class="choice"><input type="radio" name="answer" value="${option.i}" ${answer === option.i ? 'checked' : ''}><span class="letter">${letters[index]}</span><span class="choice-text"></span></label>`).join('');
  [...document.querySelectorAll('#choices .choice-text')].forEach((node, i) => node.textContent = options[i].text);
  $('#progress-copy').textContent = `Câu ${question.id} / ${state.questions.length}`;
  const answered = Object.keys(state.answers).length;
  $('#answered-copy').textContent = `${answered} đã chọn`;
  $('#progress-bar').style.width = `${(answered / state.questions.length) * 100}%`;
  $('#previous').disabled = state.index === 0;
  $('#next').textContent = state.index === state.questions.length - 1 ? 'Câu đầu →' : 'Câu tiếp →';
  $('#jump-to').max = state.questions.length; $('#jump-to').value = question.id;
  $('#save-status').textContent = answer === undefined ? '' : 'Đã lưu trên thiết bị này';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function goTo(index) { state.index = (index + state.questions.length) % state.questions.length; render(); }
function reportText(detail) {
  const question = state.questions[state.index];
  const selected = state.answers[question.id];
  const selectedText = selected === undefined ? 'Chưa chọn' : [question.correct, ...question.distractors][selected];
  return [`Báo lỗi câu ${question.id}`, '', `Câu hỏi: ${question.stem}`, '', `Đáp án đang chọn: ${selectedText}`, `Mô tả: ${detail || 'Không có'}`].join('\n');
}

$('#choices').addEventListener('change', event => {
  state.answers[state.questions[state.index].id] = Number(event.target.value); saveAnswers(); $('#save-status').textContent = 'Đã lưu trên thiết bị này'; render();
});
$('#previous').addEventListener('click', () => goTo(state.index - 1));
$('#next').addEventListener('click', () => goTo(state.index + 1));
$('#jump-button').addEventListener('click', () => { const number = Number($('#jump-to').value); if (number >= 1 && number <= state.questions.length) goTo(number - 1); });
$('#report-button').addEventListener('click', () => { $('#report-question').textContent = state.questions[state.index].id; $('#report-detail').value = ''; $('#report-dialog').showModal(); });
$('#report-form').addEventListener('submit', event => {
  if (event.submitter.value !== 'send') return;
  const body = reportText($('#report-detail').value);
  const email = window.MCQ_CONFIG?.reportEmail || '';
  navigator.clipboard?.writeText(body);
  $('#report-dialog').close();
  window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Báo lỗi câu ${state.questions[state.index].id} — Mạng máy tính`)}&body=${encodeURIComponent(body)}`;
});
$('#submit').addEventListener('click', () => {
  const answered = Object.keys(state.answers).length;
  const correct = state.questions.filter(question => state.answers[question.id] === 0).length;
  $('#result-title').textContent = `${correct} / ${state.questions.length} câu đúng`;
  $('#result-copy').textContent = answered < state.questions.length ? `Bạn mới trả lời ${answered} câu. Bạn vẫn có thể xem và sửa các câu còn lại.` : `Bạn đã trả lời đủ ${answered} câu.`;
  $('#result-dialog').showModal();
});

fetch('/questions.json').then(response => { if (!response.ok) throw new Error(); return response.json(); }).then(questions => { state.questions = questions; $('#loading').hidden = true; $('#app').hidden = false; render(); }).catch(() => { $('#loading').textContent = 'Không tải được câu hỏi. Vui lòng thử lại.'; });
