const state = { questions: [], index: 0, answers: JSON.parse(localStorage.getItem('compnet-answers') || '{}') };
const $ = selector => document.querySelector(selector);
const letters = ['A', 'B', 'C', 'D'];

function shuffledOptions(question) {
  const options = [question.correct, ...question.distractors];
  let seed = question.id * 9301 + 49297;
  return options.map((text, i) => ({ text, i })).sort(() => ((seed = (seed * 9301 + 49297) % 233280) / 233280) - .5);
}
function saveAnswers() { localStorage.setItem('compnet-answers', JSON.stringify(state.answers)); }
function answerText(question, answer) { return [question.correct, ...question.distractors][answer]; }
function render() {
  const question = state.questions[state.index];
  const answer = state.answers[question.id];
  const options = shuffledOptions(question);
  $('#question-number').textContent = `Câu ${question.id}`;
  $('#stem').textContent = question.stem;
  $('#choices').innerHTML = options.map((option, index) => {
    const resultClass = answer === undefined ? '' : option.i === 0 ? 'is-correct' : answer === option.i ? 'is-wrong' : '';
    return `<label class="choice ${resultClass}"><input type="radio" name="answer" value="${option.i}" ${answer === option.i ? 'checked' : ''} ${answer === undefined ? '' : 'disabled'}><span class="letter">${letters[index]}</span><span class="choice-text"></span></label>`;
  }).join('');
  [...document.querySelectorAll('#choices .choice-text')].forEach((node, i) => node.textContent = options[i].text);
  $('#progress-copy').textContent = `Câu ${question.id} / ${state.questions.length}`;
  const answered = Object.keys(state.answers).length;
  $('#answered-copy').textContent = `${answered} đã chọn`;
  $('#progress-bar').style.width = `${(answered / state.questions.length) * 100}%`;
  $('#previous').disabled = state.index === 0;
  $('#next').textContent = state.index === state.questions.length - 1 ? 'Câu đầu →' : 'Câu tiếp →';
  $('#jump-to').max = state.questions.length; $('#jump-to').value = question.id;
  $('#save-status').textContent = answer === undefined ? '' : 'Đã lưu trên thiết bị này';
  const feedback = $('#answer-feedback');
  if (answer === undefined) {
    feedback.hidden = true;
  } else {
    const isCorrect = answer === 0;
    feedback.hidden = false;
    feedback.className = `answer-feedback ${isCorrect ? 'correct' : 'wrong'}`;
    feedback.textContent = isCorrect ? 'Đúng. Bạn đã chọn đáp án chính xác.' : `Chưa đúng. Đáp án đúng là: ${question.correct}`;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function goTo(index) { state.index = (index + state.questions.length) % state.questions.length; render(); }
function reportText(detail) {
  const question = state.questions[state.index];
  const selected = state.answers[question.id];
  const selectedText = selected === undefined ? 'Chưa chọn' : answerText(question, selected);
  return [`Báo lỗi câu ${question.id}`, '', `Câu hỏi: ${question.stem}`, '', `Đáp án đang chọn: ${selectedText}`, `Mô tả: ${detail || 'Không có'}`].join('\n');
}

$('#choices').addEventListener('change', event => {
  state.answers[state.questions[state.index].id] = Number(event.target.value); saveAnswers(); $('#save-status').textContent = 'Đã lưu trên thiết bị này'; render();
});
$('#previous').addEventListener('click', () => goTo(state.index - 1));
$('#next').addEventListener('click', () => goTo(state.index + 1));
$('#jump-button').addEventListener('click', () => { const number = Number($('#jump-to').value); if (number >= 1 && number <= state.questions.length) goTo(number - 1); });
$('#report-button').addEventListener('click', () => { $('#report-question').textContent = state.questions[state.index].id; $('#report-detail').value = ''; $('#report-dialog').showModal(); });
$('#close-report').addEventListener('click', () => $('#report-dialog').close());
$('#report-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (event.submitter.value !== 'send') return;
  const question = state.questions[state.index];
  const button = $('#send-report');
  button.disabled = true; button.textContent = 'Đang gửi…';
  try {
    const response = await fetch('/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId: question.id, stem: question.stem, selectedAnswer: state.answers[question.id] === undefined ? null : answerText(question, state.answers[question.id]), correctAnswer: question.correct, detail: $('#report-detail').value }) });
    if (!response.ok) throw new Error();
    $('#report-dialog').close(); $('#save-status').textContent = 'Đã gửi báo lỗi. Cảm ơn bạn.';
  } catch {
    $('#report-detail').setCustomValidity('Chưa gửi được báo lỗi. Vui lòng thử lại sau.'); $('#report-detail').reportValidity();
  } finally {
    button.disabled = false; button.textContent = 'Gửi báo lỗi';
  }
});
$('#submit').addEventListener('click', () => {
  const answered = Object.keys(state.answers).length;
  const correct = state.questions.filter(question => state.answers[question.id] === 0).length;
  $('#result-title').textContent = `${correct} / ${state.questions.length} câu đúng`;
  $('#result-copy').textContent = answered < state.questions.length ? `Bạn mới trả lời ${answered} câu. Bạn vẫn có thể xem và sửa các câu còn lại.` : `Bạn đã trả lời đủ ${answered} câu.`;
  $('#result-dialog').showModal();
});
function openReview() {
  if ($('#result-dialog').open) $('#result-dialog').close();
  const answered = Object.keys(state.answers).length;
  const correct = state.questions.filter(question => state.answers[question.id] === 0).length;
  $('#review-summary').textContent = `${answered} câu đã trả lời, ${correct} câu đúng. Màu xanh: đúng; màu đỏ: chưa đúng.`;
  $('#review-grid').innerHTML = state.questions.map(question => {
    const answer = state.answers[question.id];
    const result = answer === undefined ? '' : answer === 0 ? 'correct' : 'wrong';
    return `<button class="${result}" type="button" data-question="${question.id}" aria-label="Xem lại câu ${question.id}">${question.id}</button>`;
  }).join('');
  $('#review-dialog').showModal();
}
$('#review-button').addEventListener('click', openReview);
$('#result-review').addEventListener('click', openReview);
$('#review-grid').addEventListener('click', event => {
  const button = event.target.closest('[data-question]');
  if (!button) return;
  $('#review-dialog').close(); goTo(Number(button.dataset.question) - 1);
});

fetch('/questions.json').then(response => { if (!response.ok) throw new Error(); return response.json(); }).then(questions => { state.questions = questions; const requested = Number(new URLSearchParams(location.search).get('q')); if (requested >= 1 && requested <= questions.length) state.index = requested - 1; $('#loading').hidden = true; $('#app').hidden = false; render(); }).catch(() => { $('#loading').textContent = 'Không tải được câu hỏi. Vui lòng thử lại.'; });
