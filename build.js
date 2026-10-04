const fs = require('node:fs');
const path = require('node:path');

const source = path.join(__dirname, '..', 'DPO_inputs', 'compnet_dpo_input_result_v2.json');
const output = path.join(__dirname, 'public', 'questions.json');
const records = JSON.parse(fs.readFileSync(source, 'utf8'));

const questions = records.map(({ chosen }, index) => {
  if (!chosen || !chosen.stem || !chosen.correct_answer || !chosen.distractor_1 || !chosen.distractor_2 || !chosen.distractor_3) {
    throw new Error(`Câu ${index + 1} thiếu dữ liệu chosen`);
  }
  return {
    id: index + 1,
    stem: chosen.stem,
    correct: chosen.correct_answer,
    distractors: [chosen.distractor_1, chosen.distractor_2, chosen.distractor_3]
  };
});

if (questions.length !== records.length || questions.some(question => Object.keys(question).some(key => key === 'rejected' || key === 'context'))) {
  throw new Error('Bản xuất câu hỏi không hợp lệ');
}

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(questions));
console.log(`Đã tạo ${questions.length} câu chosen tại public/questions.json`);
