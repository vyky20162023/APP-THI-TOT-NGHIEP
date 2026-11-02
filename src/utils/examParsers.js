import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

/**
 * Tải thư viện pdf.js từ CDN khi cần phân tích file PDF
 */
async function loadPdfJs() {
  if (typeof window !== 'undefined' && window.pdfjsLib) {
    return window.pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('Không thể khởi tạo thư viện đọc file PDF'));
      }
    };
    script.onerror = () => reject(new Error('Lỗi nạp thư viện đọc PDF từ CDN'));
    document.head.appendChild(script);
  });
}

/**
 * Chuẩn hóa mức độ nhận thức
 */
function normalizeDifficulty(val) {
  if (!val) return 'thong_hieu';
  const str = String(val).toLowerCase().trim();
  if (str.includes('nhan_biet') || str.includes('nhận biết') || str.includes('nb')) return 'nhan_biet';
  if (str.includes('van_dung_cao') || str.includes('vận dụng cao') || str.includes('vdc')) return 'van_dung_cao';
  if (str.includes('van_dung') || str.includes('vận dụng') || str.includes('vd')) return 'van_dung';
  return 'thong_hieu';
}

/**
 * 1. Phân tích đề thi từ file Excel (.xlsx, .xls)
 */
export async function parseExcelExam(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rows || rows.length === 0) {
          throw new Error('File Excel rỗng hoặc không có dữ liệu ở Sheet đầu tiên.');
        }

        const parsedQuestions = [];

        rows.forEach((row, index) => {
          // Lấy các trường dữ liệu linh hoạt (hỗ trợ nhiều tên cột khác nhau)
          const typeRaw = (row['Dạng câu hỏi'] || row['Dạng'] || row['Loại'] || row['Type'] || 'single_choice').toString().toLowerCase().trim();
          const content = (row['Nội dung câu hỏi'] || row['Nội dung'] || row['Câu hỏi'] || row['Content'] || '').toString().trim();
          
          if (!content) return; // Bỏ qua dòng trống

          const explanation = (row['Lời giải'] || row['Lời giải chi tiết'] || row['Hướng dẫn giải'] || row['Explanation'] || '').toString().trim();
          const difficulty = normalizeDifficulty(row['Mức độ'] || row['Độ khó'] || row['Difficulty']);
          const rawAns = (row['Đáp án đúng'] || row['Đáp án'] || row['Answer'] || '').toString().trim();

          // DẠNG 1: Nhiều lựa chọn
          if (typeRaw.includes('single') || typeRaw.includes('1') || typeRaw.includes('lựa chọn') || typeRaw.includes('trắc nghiệm')) {
            const optA = (row['Phương án A'] || row['A'] || '').toString().trim();
            const optB = (row['Phương án B'] || row['B'] || '').toString().trim();
            const optC = (row['Phương án C'] || row['C'] || '').toString().trim();
            const optD = (row['Phương án D'] || row['D'] || '').toString().trim();

            let ans = rawAns.toUpperCase();
            if (!['A', 'B', 'C', 'D'].includes(ans)) {
              ans = 'A';
            }

            parsedQuestions.push({
              id: `import_q_${Date.now()}_${index}`,
              type: 'single_choice',
              content: content,
              options: [
                { id: 'A', text: optA },
                { id: 'B', text: optB },
                { id: 'C', text: optC },
                { id: 'D', text: optD }
              ],
              correct_answer: { answer: ans },
              explanation: explanation,
              difficulty: difficulty,
              point_weight: 0.25
            });
          }
          // DẠNG 2: Đúng / Sai bậc thang
          else if (typeRaw.includes('true') || typeRaw.includes('2') || typeRaw.includes('đúng sai') || typeRaw.includes('tf')) {
            const optA = (row['Ý a'] || row['a'] || row['Phương án A'] || row['A'] || '').toString().trim();
            const optB = (row['Ý b'] || row['b'] || row['Phương án B'] || row['B'] || '').toString().trim();
            const optC = (row['Ý c'] || row['c'] || row['Phương án C'] || row['C'] || '').toString().trim();
            const optD = (row['Ý d'] || row['d'] || row['Phương án D'] || row['D'] || '').toString().trim();

            // Phân tích đáp án đúng/sai (ví dụ "Đ, S, Đ, Đ" hoặc "T, F, T, T" hoặc "a:Đ, b:S...")
            const ansLower = rawAns.toLowerCase();
            const parseTfBool = (char) => ['đ', 'd', 't', '1', 'true', 'đúng'].includes(char);

            let tfAns = { a: true, b: false, c: true, d: false };
            const parts = ansLower.split(/[,;|/\s]+/).filter(Boolean);
            if (parts.length >= 4) {
              tfAns = {
                a: parseTfBool(parts[0]),
                b: parseTfBool(parts[1]),
                c: parseTfBool(parts[2]),
                d: parseTfBool(parts[3])
              };
            }

            parsedQuestions.push({
              id: `import_q_${Date.now()}_${index}`,
              type: 'true_false',
              content: content,
              options: [
                { id: 'a', text: optA },
                { id: 'b', text: optB },
                { id: 'c', text: optC },
                { id: 'd', text: optD }
              ],
              correct_answer: tfAns,
              explanation: explanation,
              difficulty: difficulty,
              point_weight: 1.00
            });
          }
          // DẠNG 3: Trả lời ngắn
          else {
            const cleanVal = rawAns.replace(/['"]/g, '').trim();
            parsedQuestions.push({
              id: `import_q_${Date.now()}_${index}`,
              type: 'short_answer',
              content: content,
              options: [],
              correct_answer: { 
                value: cleanVal || '0', 
                accepted_values: cleanVal ? [cleanVal, cleanVal.replace('.', ','), cleanVal.replace(',', '.')] : ['0'] 
              },
              explanation: explanation,
              difficulty: difficulty,
              point_weight: 0.50
            });
          }
        });

        resolve(parsedQuestions);
      } catch (err) {
        reject(new Error(`Lỗi đọc file Excel: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Không thể đọc file Excel.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 2. Phân tích đề thi từ file Word (.docx)
 */
export async function parseDocxExam(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const result = await mammoth.extractRawText({ arrayBuffer });
        const rawText = result.value;

        if (!rawText || rawText.trim().length === 0) {
          throw new Error('File Word rỗng hoặc không chứa nội dung văn bản.');
        }

        const questions = parseRawTextExam(rawText);
        resolve(questions);
      } catch (err) {
        reject(new Error(`Lỗi đọc file Word: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Không thể đọc file Word.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 3. Phân tích đề thi từ file PDF (.pdf)
 */
export async function parsePdfExam(file) {
  try {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;

    let fullText = '';
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    if (!fullText.trim()) {
      throw new Error('Không thể trích xuất văn bản từ file PDF (file có thể là dạng scan/ảnh chụp).');
    }

    return parseRawTextExam(fullText);
  } catch (err) {
    throw new Error(`Lỗi đọc file PDF: ${err.message}`);
  }
}

/**
 * 4. Trình phân tích văn bản thô thông minh theo chuẩn Bộ GD&ĐT 2025 (Section-Aware Parser Engine)
 * Tự động phân chia đề thi thành từng phần chuẩn xác:
 * - PHẦN I: Câu trắc nghiệm nhiều phương án lựa chọn (A, B, C, D)
 * - PHẦN II: Câu trắc nghiệm đúng sai (4 ý a, b, c, d chấm bậc thang)
 * - PHẦN III: Câu trắc nghiệm trả lời ngắn (điền số / từ)
 * Bảo toàn 100% thứ tự câu hỏi và công thức KaTeX
 */
export function parseRawTextExam(text) {
  if (!text) return [];

  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Regex nhận diện các mốc phân chia Phần của Bộ GD&ĐT
  const part1Regex = /(?:^|\n)\s*(?:PHẦN|Phần|PART)\s*(?:I|1|THỨ NHẤT)[\s.:\-–—]*([^\n]*)/i;
  const part2Regex = /(?:^|\n)\s*(?:PHẦN|Phần|PART)\s*(?:II|2|THỨ HAI)[\s.:\-–—]*([^\n]*)/i;
  const part3Regex = /(?:^|\n)\s*(?:PHẦN|Phần|PART)\s*(?:III|3|THỨ BA)[\s.:\-–—]*([^\n]*)/i;

  const matchP1 = normalized.search(part1Regex);
  const matchP2 = normalized.search(part2Regex);
  const matchP3 = normalized.search(part3Regex);

  const hasExplicitParts = matchP1 !== -1 || matchP2 !== -1 || matchP3 !== -1;

  if (hasExplicitParts) {
    return parseExamWithSections(normalized, matchP1, matchP2, matchP3);
  }

  // Trường hợp không có tiêu đề Phần I, II, III rõ ràng: phân tích từng khối rồi tự động nhóm
  return parseExamWithoutSections(normalized);
}

/**
 * Phân tích đề thi khi có tiêu đề rõ ràng PHẦN I, PHẦN II, PHẦN III
 */
function parseExamWithSections(text, idxP1, idxP2, idxP3) {
  const sections = [];

  // Tạo danh sách các vị trí phần
  const indices = [
    { part: 1, index: idxP1 },
    { part: 2, index: idxP2 },
    { part: 3, index: idxP3 }
  ].filter(p => p.index !== -1).sort((a, b) => a.index - b.index);

  for (let i = 0; i < indices.length; i++) {
    const cur = indices[i];
    const startIdx = cur.index;
    const endIdx = i + 1 < indices.length ? indices[i + 1].index : text.length;
    const sectionText = text.substring(startIdx, endIdx);

    sections.push({
      partId: cur.part,
      text: sectionText
    });
  }

  const allQuestions = [];
  let globalOrder = 1;

  sections.forEach((sec) => {
    const rawBlocks = splitIntoQuestionBlocks(sec.text);

    rawBlocks.forEach((block, qIdx) => {
      const q = parseSingleBlockByPart(block, sec.partId, qIdx + 1, globalOrder);
      if (q) {
        allQuestions.push(q);
        globalOrder++;
      }
    });
  });

  return allQuestions;
}

/**
 * Tách một đoạn văn bản thành các khối câu hỏi riêng biệt
 */
function splitIntoQuestionBlocks(rawText) {
  // Loại bỏ dòng tiêu đề phần ở đầu
  const lines = rawText.split('\n');
  let content = rawText;
  if (lines.length > 0 && /(?:PHẦN|Phần|PART)/i.test(lines[0])) {
    content = lines.slice(1).join('\n');
  }

  const questionPattern = /(?:^|\n)\s*(?:Câu|Bài|\d+)[\s.]*(\d+)[\s.:-]+\s*/gi;
  const matches = [];
  let match;
  while ((match = questionPattern.exec(content)) !== null) {
    matches.push({
      index: match.index,
      number: match[1],
      fullLength: match[0].length
    });
  }

  const blocks = [];
  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index + matches[i].fullLength;
      const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
      const block = content.substring(start, end).trim();
      if (block) blocks.push(block);
    }
  } else {
    // Nếu không có chữ "Câu X", tách theo 2 dòng trống
    blocks.push(...content.split(/\n\s*\n/).map(b => b.trim()).filter(b => b.length > 25));
  }

  return blocks;
}

/**
 * Phân tích một câu hỏi dựa trên Phần định sẵn
 */
function parseSingleBlockByPart(block, partId, partQuestionNumber, globalOrder) {
  let contentBlock = block;
  let explanation = '';

  // 1. Tách lời giải nếu có
  const expMatch = block.match(/(?:Lời giải|Hướng dẫn giải|Giải chi tiết|Explanation)[:\s]*([\s\S]*)$/i);
  if (expMatch) {
    explanation = expMatch[1].trim();
    contentBlock = block.substring(0, expMatch.index).trim();
  }

  // 2. Tách đáp án khai báo
  let correctAnsStr = '';
  const ansMatch = contentBlock.match(/(?:Đáp án|Đáp án đúng|Key|Ans)[:\s]*([^\n]+)/i);
  if (ansMatch) {
    correctAnsStr = ansMatch[1].trim();
    contentBlock = contentBlock.substring(0, ansMatch.index).trim();
  }

  // 3. Mức độ nhận thức
  let difficulty = 'thong_hieu';
  const diffMatch = contentBlock.match(/\[(Nhận biết|Thông hiểu|Vận dụng cao|Vận dụng|NB|TH|VD|VDC)\]/i);
  if (diffMatch) {
    difficulty = normalizeDifficulty(diffMatch[1]);
    contentBlock = contentBlock.replace(diffMatch[0], '').trim();
  }

  // ===== XỬ LÝ THEO TỪNG PHẦN =====
  if (partId === 1) {
    // PHẦN I: Nhiều lựa chọn A, B, C, D
    const choiceRegex = /(?:^|\n)\s*([A-D])[\.\)]\s*([\s\S]*?)(?=(?:\n\s*[A-D][\.\)]|$))/g;
    const choiceMatches = [...contentBlock.matchAll(choiceRegex)];

    let questionPrompt = contentBlock;
    const options = [];
    let chosenCorrect = 'A';

    if (choiceMatches.length >= 2) {
      const firstChoiceIndex = contentBlock.search(/(?:^|\n)\s*[A-D][\.\)]/);
      if (firstChoiceIndex > 0) {
        questionPrompt = contentBlock.substring(0, firstChoiceIndex).trim();
      }

      choiceMatches.forEach((m) => {
        const optLetter = m[1].toUpperCase();
        let optText = m[2].trim();
        if (optText.startsWith('*') || m[0].includes('*')) {
          chosenCorrect = optLetter;
          optText = optText.replace(/^\*\s*/, '');
        }
        options.push({ id: optLetter, text: optText });
      });

      if (correctAnsStr) {
        const directLetter = correctAnsStr.match(/[A-D]/i);
        if (directLetter) chosenCorrect = directLetter[0].toUpperCase();
      }
    } else {
      // Dự phòng nếu không tách được A B C D
      options.push(
        { id: 'A', text: 'Phương án A' },
        { id: 'B', text: 'Phương án B' },
        { id: 'C', text: 'Phương án C' },
        { id: 'D', text: 'Phương án D' }
      );
    }

    return {
      id: `raw_q_${Date.now()}_${globalOrder}`,
      type: 'single_choice',
      part_id: 1,
      part_name: 'Phần I: Câu trắc nghiệm nhiều phương án lựa chọn',
      part_question_number: partQuestionNumber,
      global_order: globalOrder,
      content: questionPrompt,
      options,
      correct_answer: { answer: chosenCorrect },
      explanation,
      difficulty,
      point_weight: 0.25
    };
  }

  if (partId === 2) {
    // PHẦN II: Đúng / Sai 4 ý (a, b, c, d hoặc A, B, C, D)
    // Hỗ trợ cả a), b), c), d) lẫn A., B., C., D.
    let tfMatches = [...contentBlock.matchAll(/(?:^|\n)\s*([a-d])[\)\.]\s*([\s\S]*?)(?=(?:\n\s*[a-d][\)\.]|$))/gi)];
    let isUpperCaseItem = false;

    if (tfMatches.length < 3) {
      // Thử tìm theo A., B., C., D. trong Phần II
      tfMatches = [...contentBlock.matchAll(/(?:^|\n)\s*([A-D])[\.\)]\s*([\s\S]*?)(?=(?:\n\s*[A-D][\.\)]|$))/g)];
      isUpperCaseItem = true;
    }

    let questionPrompt = contentBlock;
    const tfOptions = [];
    const tfCorrect = { a: true, b: false, c: true, d: false };

    if (tfMatches.length >= 2) {
      const firstItemIdx = isUpperCaseItem 
        ? contentBlock.search(/(?:^|\n)\s*[A-D][\.\)]/)
        : contentBlock.search(/(?:^|\n)\s*[a-d][\)\.]/i);

      if (firstItemIdx > 0) {
        questionPrompt = contentBlock.substring(0, firstItemIdx).trim();
      }

      tfMatches.forEach((m, idx) => {
        const letter = ['a', 'b', 'c', 'd'][idx] || m[1].toLowerCase();
        let optText = m[2].trim();

        let isTrue = true;
        if (/\((?:S|Sai|False|F)\)\s*$/i.test(optText)) {
          isTrue = false;
          optText = optText.replace(/\((?:S|Sai|False|F)\)\s*$/i, '').trim();
        } else if (/\((?:Đ|Đúng|True|T)\)\s*$/i.test(optText)) {
          isTrue = true;
          optText = optText.replace(/\((?:Đ|Đúng|True|T)\)\s*$/i, '').trim();
        }

        tfOptions.push({ id: letter, text: optText });
        tfCorrect[letter] = isTrue;
      });

      // Nếu có đáp án dạng: "a-Đ, b-S, c-Đ, d-Đ" hoặc "Đ, S, Đ, S"
      if (correctAnsStr) {
        const parts = correctAnsStr.split(/[,;\s]+/);
        parts.forEach((p, idx) => {
          const subMatch = p.match(/([a-d])\s*[-:.]*\s*([đdstf])/i);
          if (subMatch) {
            const l = subMatch[1].toLowerCase();
            const val = ['đ', 'd', 't'].includes(subMatch[2].toLowerCase());
            tfCorrect[l] = val;
          } else if (['đ', 's', 'd', 't', 'f'].includes(p.toLowerCase())) {
            const l = ['a', 'b', 'c', 'd'][idx];
            if (l) tfCorrect[l] = ['đ', 'd', 't'].includes(p.toLowerCase());
          }
        });
      }
    } else {
      tfOptions.push(
        { id: 'a', text: 'Mệnh đề a' },
        { id: 'b', text: 'Mệnh đề b' },
        { id: 'c', text: 'Mệnh đề c' },
        { id: 'd', text: 'Mệnh đề d' }
      );
    }

    return {
      id: `raw_q_${Date.now()}_${globalOrder}`,
      type: 'true_false',
      part_id: 2,
      part_name: 'Phần II: Câu trắc nghiệm đúng sai',
      part_question_number: partQuestionNumber,
      global_order: globalOrder,
      content: questionPrompt,
      options: tfOptions,
      correct_answer: tfCorrect,
      explanation,
      difficulty,
      point_weight: 1.00
    };
  }

  // PHẦN III: Trả lời ngắn
  const shortVal = correctAnsStr || '0';
  return {
    id: `raw_q_${Date.now()}_${globalOrder}`,
    type: 'short_answer',
    part_id: 3,
    part_name: 'Phần III: Câu trắc nghiệm trả lời ngắn',
    part_question_number: partQuestionNumber,
    global_order: globalOrder,
    content: contentBlock,
    options: [],
    correct_answer: {
      value: shortVal,
      accepted_values: [shortVal, shortVal.replace('.', ','), shortVal.replace(',', '.')]
    },
    explanation,
    difficulty,
    point_weight: 0.50
  };
}

/**
 * Phân tích đề thi khi không có tiêu đề Phần (Tự động nhóm)
 */
function parseExamWithoutSections(text) {
  const blocks = splitIntoQuestionBlocks(text);
  const questions = [];

  blocks.forEach((block, idx) => {
    // Đoán dạng thức
    let type = 'single_choice';
    if (/(?:^|\n)\s*[a-d]\)\s*/i.test(block) && (block.match(/(?:^|\n)\s*[a-d]\)/gi) || []).length >= 3) {
      type = 'true_false';
    } else if (/(?:^|\n)\s*[A-D][\.\)]/g.test(block) && (block.match(/(?:^|\n)\s*[A-D][\.\)]/g) || []).length >= 3) {
      type = 'single_choice';
    } else if (/(?:trả lời ngắn|đáp số|điền số|kết quả)/i.test(block) || !/[A-D][\.\)]/g.test(block)) {
      type = 'short_answer';
    }

    const partId = type === 'single_choice' ? 1 : type === 'true_false' ? 2 : 3;
    const q = parseSingleBlockByPart(block, partId, idx + 1, idx + 1);
    if (q) questions.push(q);
  });

  return questions;
}

/**
 * 5. Tự động sinh file mẫu Excel chuẩn để giáo viên tải về
 */
export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      'Dạng câu hỏi': 'single_choice',
      'Nội dung câu hỏi': 'Đạo hàm của hàm số $y = x^3 - 3x + 1$ tại điểm $x_0 = 2$ là bao nhiêu?',
      'Phương án A': '$y\'(2) = 9$',
      'Phương án B': '$y\'(2) = 6$',
      'Phương án C': '$y\'(2) = 3$',
      'Phương án D': '$y\'(2) = 0$',
      'Đáp án đúng': 'A',
      'Lời giải': 'Ta có $y\' = 3x^2 - 3$. Khi $x = 2$, suy ra $y\'(2) = 3(4) - 3 = 9$.',
      'Mức độ': 'Nhận biết'
    },
    {
      'Dạng câu hỏi': 'single_choice',
      'Nội dung câu hỏi': 'Chất nào sau đây làm quỳ tím chuyển sang màu đỏ?',
      'Phương án A': '$CH_3COOH$',
      'Phương án B': '$NaCl$',
      'Phương án C': '$NaOH$',
      'Phương án D': '$C_2H_5OH$',
      'Đáp án đúng': 'A',
      'Lời giải': 'Axit axetic ($CH_3COOH$) có tính axit yếu, làm quỳ tím hóa đỏ.',
      'Mức độ': 'Thông hiểu'
    },
    {
      'Dạng câu hỏi': 'true_false',
      'Nội dung câu hỏi': 'Cho hàm số $y = f(x) = x^3 - 3x^2 + 2$. Xét tính đúng/sai của các khẳng định sau:',
      'Phương án A': 'Hàm số đồng biến trên khoảng $(2; +\\infty)$.',
      'Phương án B': 'Hàm số đạt cực đại tại điểm $x = 0$.',
      'Phương án C': 'Giá trị cực tiểu của hàm số bằng $2$.',
      'Phương án D': 'Đồ thị hàm số đi qua gốc tọa độ $O(0; 0)$.',
      'Đáp án đúng': 'a:Đ, b:Đ, c:S, d:S',
      'Lời giải': 'Đạo hàm: $y\' = 3x^2 - 6x = 3x(x - 2)$. Nghiệm $x=0, x=2$. Ý a đúng, ý b đúng, ý c sai (y_CT = -2), ý d sai vì f(0)=2.',
      'Mức độ': 'Vận dụng'
    },
    {
      'Dạng câu hỏi': 'short_answer',
      'Nội dung câu hỏi': 'Tìm giá trị lớn nhất của hàm số $f(x) = -x^2 + 4x + 1$ trên đoạn $[0; 3]$?',
      'Phương án A': '',
      'Phương án B': '',
      'Phương án C': '',
      'Phương án D': '',
      'Đáp án đúng': '5',
      'Lời giải': 'Hàm số đạt giá trị lớn nhất tại đỉnh parabol $x = 2 \\in [0; 3]$. Giá trị lớn nhất là $f(2) = -4 + 8 + 1 = 5$.',
      'Mức độ': 'Vận dụng'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  // Chỉnh độ rộng các cột cho đẹp mắt
  worksheet['!cols'] = [
    { wch: 15 }, // Dạng câu hỏi
    { wch: 45 }, // Nội dung
    { wch: 25 }, // A
    { wch: 25 }, // B
    { wch: 25 }, // C
    { wch: 25 }, // D
    { wch: 15 }, // Đáp án đúng
    { wch: 40 }, // Lời giải
    { wch: 15 }, // Mức độ
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau_De_Thi_THPT_2025');

  XLSX.writeFile(workbook, 'Mau_De_Thi_THPT_2025_NguyenThaiBinh.xlsx');
}

/**
 * 6. Tự động sinh file Word / Text hướng dẫn định dạng mẫu
 */
export function downloadSampleWordTemplate() {
  const content = `TRƯỜNG THCS & THPT NGUYỄN THÁI BÌNH - BẮC KHÁNH VĨNH, KHÁNH HÒA
HƯỚNG DẪN ĐỊNH DẠNG ĐỀ THI TỐT NGHIỆP THPT (CHUẨN 3 DẠNG THỨC MỚI)
(Thầy/Cô có thể sao chép cấu trúc này vào file Word .docx rồi tải trực tiếp lên hệ thống)
================================================================================

Câu 1: Cho hàm số $y = x^3 - 3x + 1$. Đạo hàm của hàm số tại $x_0 = 2$ bằng:
A. 9
B. 6
C. 3
D. 0
Lời giải: $y' = 3x^2 - 3 \\Rightarrow y'(2) = 3(4) - 3 = 9$.
Đáp án: A

Câu 2: Xét tính đúng hoặc sai của các mệnh đề sau về hàm số $y = x^3 - 3x^2 + 2$:
a) Hàm số đồng biến trên khoảng $(2; +\\infty)$. (Đ)
b) Hàm số có hai điểm cực trị là $x = 0$ và $x = 2$. (Đ)
c) Giá trị cực tiểu của hàm số bằng 2. (S)
d) Đồ thị hàm số đi qua điểm $A(1; 1)$. (S)
Lời giải: Khảo sát đạo hàm và vẽ bảng biến thiên để kết luận.
Đáp án: a-Đ, b-Đ, c-S, d-S

Câu 3: Tìm giá trị lớn nhất của hàm số $f(x) = -x^2 + 4x + 1$ trên đoạn $[0; 3]$?
Lời giải: Parabol đạt đỉnh tại $x = 2$. $f(2) = 5$.
Đáp án: 5
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Mau_De_Thi_Word_Chuan_NguyenThaiBinh.txt';
  a.click();
  URL.revokeObjectURL(url);
}
