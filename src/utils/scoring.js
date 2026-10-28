/**
 * THUẬT TOÁN CHẤM ĐIỂM CHUẨN CẤU TRÚC ĐỀ THI TỐT NGHIỆP THPT BỘ GD&ĐT (ÁP DỤNG TỪ 2025)
 * Hỗ trợ chuẩn xác 3 dạng thức:
 * - Dạng 1 (single_choice): Nhiều lựa chọn (chọn 1 phương án đúng A/B/C/D)
 * - Dạng 2 (true_false): Đúng / Sai 4 ý a, b, c, d (chấm điểm bậc thang 0.1 -> 0.25 -> 0.5 -> 1.0 điểm)
 * - Dạng 3 (short_answer): Trả lời ngắn (chuẩn hóa số, dấu thập phân, ký tự trắng)
 */

/**
 * Chuẩn hóa chuỗi trả lời ngắn (xóa khoảng trắng thừa, đồng nhất dấu phẩy thập phân thành dấu chấm)
 */
export function normalizeShortAnswer(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .trim()
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .toLowerCase();
}

/**
 * Kiểm tra đáp án Dạng 1: Trắc nghiệm 4 lựa chọn
 */
export function gradeSingleChoice(studentAnswer, correctAnswer, pointWeight = 0.25) {
  if (!studentAnswer) {
    return { isCorrect: false, earnedScore: 0, details: null };
  }

  // correctAnswer có thể là "A" hoặc { answer: "A" }
  const correctChoice = typeof correctAnswer === 'object' && correctAnswer !== null 
    ? (correctAnswer.answer || correctAnswer.value) 
    : correctAnswer;

  const studentChoice = typeof studentAnswer === 'object' && studentAnswer !== null
    ? (studentAnswer.answer || studentAnswer.value)
    : studentAnswer;

  const isCorrect = String(studentChoice).trim().toUpperCase() === String(correctChoice).trim().toUpperCase();
  const earnedScore = isCorrect ? Number(pointWeight) : 0;

  return {
    isCorrect,
    earnedScore: Number(earnedScore.toFixed(2)),
    details: {
      studentChoice,
      correctChoice
    }
  };
}

/**
 * Kiểm tra đáp án Dạng 2: Đúng / Sai 4 ý theo bậc thang Bộ GD&ĐT
 * Đúng 1 ý: 0.10 điểm
 * Đúng 2 ý: 0.25 điểm
 * Đúng 3 ý: 0.50 điểm
 * Đúng 4 ý: 1.00 điểm
 */
export function gradeTrueFalse(studentAnswer, correctAnswer, pointWeight = 1.0) {
  if (!studentAnswer || typeof studentAnswer !== 'object') {
    return { isCorrect: false, earnedScore: 0, correctCount: 0, details: {} };
  }

  const items = ['a', 'b', 'c', 'd'];
  let correctCount = 0;
  const itemResults = {};

  items.forEach((item) => {
    const studentVal = studentAnswer[item];
    const correctVal = correctAnswer[item];

    const isItemCorrect = studentVal !== undefined && studentVal !== null && Boolean(studentVal) === Boolean(correctVal);
    if (isItemCorrect) {
      correctCount += 1;
    }
    itemResults[item] = {
      student: studentVal,
      correct: correctVal,
      isCorrect: isItemCorrect
    };
  });

  // Bảng điểm bậc thang chuẩn quy chế Bộ GD&ĐT
  let baseScore = 0;
  if (correctCount === 1) baseScore = 0.1;
  else if (correctCount === 2) baseScore = 0.25;
  else if (correctCount === 3) baseScore = 0.5;
  else if (correctCount === 4) baseScore = 1.0;

  // Tính theo tỷ lệ nếu câu có trọng số khác 1.0
  const earnedScore = Number((baseScore * (pointWeight / 1.0)).toFixed(2));
  const isCorrect = correctCount === 4;

  return {
    isCorrect,
    earnedScore,
    correctCount,
    details: itemResults
  };
}

/**
 * Kiểm tra đáp án Dạng 3: Trả lời ngắn
 */
export function gradeShortAnswer(studentAnswer, correctAnswer, pointWeight = 0.5) {
  const normStudent = normalizeShortAnswer(studentAnswer?.value !== undefined ? studentAnswer.value : studentAnswer);
  
  if (!normStudent) {
    return { isCorrect: false, earnedScore: 0, details: { student: '', expected: '' } };
  }

  // Danh sách các giá trị được chấp nhận
  let accepted = [];
  if (typeof correctAnswer === 'object' && correctAnswer !== null) {
    if (correctAnswer.value) accepted.push(normalizeShortAnswer(correctAnswer.value));
    if (Array.isArray(correctAnswer.accepted_values)) {
      accepted.push(...correctAnswer.accepted_values.map(v => normalizeShortAnswer(v)));
    }
  } else {
    accepted.push(normalizeShortAnswer(correctAnswer));
  }

  // So sánh chuỗi trực tiếp
  let isCorrect = accepted.includes(normStudent);

  // Thử so sánh dưới dạng số thực nếu cả 2 bên đều là số
  if (!isCorrect && !isNaN(Number(normStudent))) {
    const studentNum = Number(normStudent);
    for (const val of accepted) {
      if (!isNaN(Number(val)) && Math.abs(studentNum - Number(val)) < 0.0001) {
        isCorrect = true;
        break;
      }
    }
  }

  const earnedScore = isCorrect ? Number(pointWeight) : 0;

  return {
    isCorrect,
    earnedScore: Number(earnedScore.toFixed(2)),
    details: {
      student: normStudent,
      expected: accepted[0] || ''
    }
  };
}

/**
 * Chấm điểm toàn diện cho một câu hỏi dựa trên Type
 */
export function gradeQuestion(question, studentAnswer, pointWeight = 1.0) {
  const type = question.type;
  const correct = question.correct_answer;

  switch (type) {
    case 'single_choice':
      return gradeSingleChoice(studentAnswer, correct, pointWeight);
    case 'true_false':
      return gradeTrueFalse(studentAnswer, correct, pointWeight);
    case 'short_answer':
      return gradeShortAnswer(studentAnswer, correct, pointWeight);
    default:
      return { isCorrect: false, earnedScore: 0, details: null };
  }
}

/**
 * Chấm điểm toàn bộ bài thi và phân tích ma trận nhận thức
 */
export function calculateExamScore(questions, studentAnswers) {
  let totalScore = 0;
  let maxPossibleScore = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;

  // Thống kê theo 4 mức độ nhận thức
  const difficultyStats = {
    nhan_biet: { total: 0, correct: 0, earned: 0, max: 0 },
    thong_hieu: { total: 0, correct: 0, earned: 0, max: 0 },
    van_dung: { total: 0, correct: 0, earned: 0, max: 0 },
    van_dung_cao: { total: 0, correct: 0, earned: 0, max: 0 },
  };

  const gradedResults = questions.map((q) => {
    const weight = q.point_weight || (q.type === 'true_false' ? 1.0 : q.type === 'short_answer' ? 0.5 : 0.25);
    maxPossibleScore += weight;

    const answer = studentAnswers[q.id];
    const isAnswered = answer !== undefined && answer !== null && 
      (typeof answer === 'object' ? Object.keys(answer).length > 0 : String(answer).trim() !== '');

    const gradeResult = gradeQuestion(q, answer, weight);
    totalScore += gradeResult.earnedScore;

    if (!isAnswered) {
      unattemptedCount += 1;
    } else if (gradeResult.isCorrect) {
      correctCount += 1;
    } else {
      wrongCount += 1;
    }

    // Cập nhật ma trận độ khó
    const diff = q.difficulty || 'nhan_biet';
    if (difficultyStats[diff]) {
      difficultyStats[diff].total += 1;
      difficultyStats[diff].max += weight;
      difficultyStats[diff].earned += gradeResult.earnedScore;
      if (gradeResult.isCorrect) {
        difficultyStats[diff].correct += 1;
      }
    }

    return {
      questionId: q.id,
      question: q,
      studentAnswer: answer,
      isAnswered,
      ...gradeResult
    };
  });

  // Quy chuẩn làm tròn 2 chữ số thập phân
  const finalScore = Number(totalScore.toFixed(2));
  const maxScore = Number(maxPossibleScore.toFixed(2));

  return {
    totalScore: finalScore,
    maxPossibleScore: maxScore,
    percentage: maxScore > 0 ? Number(((finalScore / maxScore) * 100).toFixed(1)) : 0,
    correctCount,
    wrongCount,
    unattemptedCount,
    totalQuestions: questions.length,
    difficultyStats,
    gradedResults
  };
}
