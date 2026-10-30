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
 * 4. Trình phân tích văn bản thô thông minh (Smart Regex Parser Engine)
 * Bóc tách tự động:
 * - Dạng 1: A. B. C. D.
 * - Dạng 2: a) b) c) d)
 * - Dạng 3: Trả lời ngắn
 * - KaTeX: $...$
 */
export function parseRawTextExam(text) {
  if (!text) return [];

  // Chuẩn hóa ngắt dòng
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Tìm các vị trí bắt đầu câu hỏi: "Câu 1:", "Câu 1.", "Bài 1:", "1."
  const questionPattern = /(?:^|\n)(?:Câu|Bài|\d+)[\s.]*(\d+)[\s.:-]+\s*/gi;
  
  const matches = [];
  let match;
  while ((match = questionPattern.exec(normalized)) !== null) {
    matches.push({
      index: match.index,
      number: match[1],
      fullLength: match[0].length
    });
  }

  // Nếu không tìm thấy tiền tố "Câu X", thử tách theo từng đoạn văn bản cách nhau bởi 2 dòng trống
  let questionBlocks = [];
  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index + matches[i].fullLength;
      const end = i + 1 < matches.length ? matches[i + 1].index : normalized.length;
      const block = normalized.substring(start, end).trim();
      if (block) questionBlocks.push(block);
    }
  } else {
    questionBlocks = normalized
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter((b) => b.length > 20);
  }

  const parsedQuestions = [];

  questionBlocks.forEach((block, idx) => {
    try {
      // 1. Tách phần Lời giải (Explanation) nếu có
      let contentBlock = block;
      let explanation = '';
      const expMatch = block.match(/(?:Lời giải|Hướng dẫn giải|Giải chi tiết|Explanation)[:\s]*([\s\S]*)$/i);
      if (expMatch) {
        explanation = expMatch[1].trim();
        contentBlock = block.substring(0, expMatch.index).trim();
      }

      // 2. Tìm đáp án khai báo ở cuối câu: "Đáp án: A", "Đáp án: a-Đ, b-S...", "Đáp án: 4"
      let correctAnsStr = '';
      const ansMatch = contentBlock.match(/(?:Đáp án|Đáp án đúng|Key|Ans)[:\s]*([^\n]+)/i);
      if (ansMatch) {
        correctAnsStr = ansMatch[1].trim();
        contentBlock = contentBlock.substring(0, ansMatch.index).trim();
      }

      // 3. Nhận diện mức độ nhận thức nếu có gắn thẻ: [Nhận biết], [Thông hiểu]...
      let difficulty = 'thong_hieu';
      const diffMatch = contentBlock.match(/\[(Nhận biết|Thông hiểu|Vận dụng cao|Vận dụng|NB|TH|VD|VDC)\]/i);
      if (diffMatch) {
        difficulty = normalizeDifficulty(diffMatch[1]);
        contentBlock = contentBlock.replace(diffMatch[0], '').trim();
      }

      // 4. Phân loại dạng thức:
      // A. KIỂM TRA DẠNG 2: Đúng / Sai 4 ý (a, b, c, d)
      const tfRegex = /(?:^|\n)\s*([a-d])[\)\.]\s*([\s\S]*?)(?=(?:\n\s*[a-d][\)\.]|$))/gi;
      const tfMatches = [...contentBlock.matchAll(tfRegex)];

      if (tfMatches.length >= 3) {
        // Lấy phần đề bài trước ý a)
        const firstTfIndex = contentBlock.search(/(?:^|\n)\s*[a-d][\)\.]/i);
        const questionPrompt = firstTfIndex > 0 ? contentBlock.substring(0, firstTfIndex).trim() : 'Xét tính đúng/sai của các mệnh đề sau:';

        const tfOptions = [];
        const tfCorrect = { a: true, b: false, c: true, d: false };

        tfMatches.forEach((m) => {
          const id = m[1].toLowerCase();
          let optText = m[2].trim();

          // Kiểm tra xem trong nội dung ý có đính kèm (Đúng), (Sai), (Đ), (S) không
          let isTrue = true;
          if (/\((?:S|Sai|False|F)\)\s*$/i.test(optText)) {
            isTrue = false;
            optText = optText.replace(/\((?:S|Sai|False|F)\)\s*$/i, '').trim();
          } else if (/\((?:Đ|Đúng|True|T)\)\s*$/i.test(optText)) {
            isTrue = true;
            optText = optText.replace(/\((?:Đ|Đúng|True|T)\)\s*$/i, '').trim();
          }

          tfOptions.push({ id, text: optText });
          tfCorrect[id] = isTrue;
        });

        // Nếu có dòng "Đáp án: a-Đ, b-S, c-Đ, d-Đ"
        if (correctAnsStr) {
          const pairs = correctAnsStr.split(/[,;\s]+/);
          pairs.forEach((p) => {
            const subMatch = p.match(/([a-d])\s*[-:.]*\s*([đdstf])/i);
            if (subMatch) {
              const letter = subMatch[1].toLowerCase();
              const val = ['đ', 'd', 't'].includes(subMatch[2].toLowerCase());
              tfCorrect[letter] = val;
            }
          });
        }

        parsedQuestions.push({
          id: `raw_q_${Date.now()}_${idx}`,
          type: 'true_false',
          content: questionPrompt,
          options: tfOptions,
          correct_answer: tfCorrect,
          explanation,
          difficulty,
          point_weight: 1.00
        });
        return;
      }

      // B. KIỂM TRA DẠNG 1: Nhiều lựa chọn (A, B, C, D)
      const choiceRegex = /(?:^|\n)\s*([A-D])[\.\)]\s*([\s\S]*?)(?=(?:\n\s*[A-D][\.\)]|$))/g;
      const choiceMatches = [...contentBlock.matchAll(choiceRegex)];

      if (choiceMatches.length >= 3) {
        // Lấy nội dung câu hỏi trước phương án A
        const firstChoiceIndex = contentBlock.search(/(?:^|\n)\s*[A-D][\.\)]/);
        const questionPrompt = firstChoiceIndex > 0 ? contentBlock.substring(0, firstChoiceIndex).trim() : contentBlock;

        const options = [];
        let chosenCorrect = 'A';

        choiceMatches.forEach((m) => {
          const optLetter = m[1].toUpperCase();
          let optText = m[2].trim();

          // Kiểm tra xem phương án có đánh dấu sao (*) là đáp án đúng không (ví dụ "*A. 12")
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

        parsedQuestions.push({
          id: `raw_q_${Date.now()}_${idx}`,
          type: 'single_choice',
          content: questionPrompt,
          options,
          correct_answer: { answer: chosenCorrect },
          explanation,
          difficulty,
          point_weight: 0.25
        });
        return;
      }

      // C. DẠNG 3: Trả lời ngắn
      const shortAnswerVal = correctAnsStr || '0';
      parsedQuestions.push({
        id: `raw_q_${Date.now()}_${idx}`,
        type: 'short_answer',
        content: contentBlock,
        options: [],
        correct_answer: {
          value: shortAnswerVal,
          accepted_values: [shortAnswerVal, shortAnswerVal.replace('.', ','), shortAnswerVal.replace(',', '.')]
        },
        explanation,
        difficulty,
        point_weight: 0.50
      });
    } catch (e) {
      console.warn(`Lỗi phân tích block câu hỏi thứ ${idx + 1}:`, e);
    }
  });

  return parsedQuestions;
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
