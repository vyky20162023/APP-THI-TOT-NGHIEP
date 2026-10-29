import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vvlzcmqzskshvilwcyfg.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bHpjbXF6c2tzaHZpbHdjeWZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzE5MDczNiwiZXhwIjoyMTA4NzY2NzM2fQ.7BJK8JNTw4JDD1T2e5hw1bftUemsZDUc9GT5ZNGZwmk';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

const examsData = [
  // 1. Ngữ văn
  {
    exam: {
      id: 'e1000000-0000-0000-0000-000000000002',
      subject_id: 'b1000000-0000-0000-0000-000000000002',
      title: 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Ngữ văn (Đề Đọc hiểu & Trắc nghiệm Chuẩn 01)',
      description: 'Đề thi trắc nghiệm đọc hiểu văn bản và kiến thức tiếng Việt bám sát cấu trúc GDPT 2018 Bộ GD&ĐT.',
      duration_minutes: 50,
      total_questions: 5,
      passing_score: 5.0,
      is_published: true,
    },
    questions: [
      {
        id: 'c2000000-0000-0000-0000-000000000001',
        subject_id: 'b1000000-0000-0000-0000-000000000002',
        type: 'single_choice',
        content: 'Trong đoạn thơ trích từ trường ca "Mặt đường khát vọng" của Nguyễn Khoa Điềm: "Đất Nước lớn lên khi dân mình biết trồng tre mà đánh giặc / Tóc mẹ thì bới sau đầu / Cha mẹ thương nhau bằng gừng cay muối mặn...", tác giả sử dụng chủ yếu chất liệu nghệ thuật nào?',
        options: [
          { id: 'A', text: 'Chất liệu văn hóa, văn học dân gian sâu sắc' },
          { id: 'B', text: 'Chất liệu thần thoại phương Tây cổ điển' },
          { id: 'C', text: 'Chất liệu từ các điển tích, điển cố Trung Hoa' },
          { id: 'D', text: 'Chất liệu ngôn ngữ mang tính hàn lâm khoa học' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Nguyễn Khoa Điềm đã vận dụng nhuần nhuyễn thi liệu, tục ngữ, ca dao và phong tục tập quán dân gian (ăn trầu, bới tóc, trồng tre, gừng cay muối mặn) để định nghĩa Đất Nước gần gũi và thiêng liêng.',
        difficulty: 'nhan_biet',
        point_weight: 0.25
      },
      {
        id: 'c2000000-0000-0000-0000-000000000002',
        subject_id: 'b1000000-0000-0000-0000-000000000002',
        type: 'single_choice',
        content: 'Biện pháp tu từ nào được sử dụng nổi bật trong câu văn: "Sự kiên trì là chiếc chìa khóa vạn năng mở ra những cánh cửa cơ hội tưởng chừng đã khép kín"?',
        options: [
          { id: 'A', text: 'Ẩn dụ' },
          { id: 'B', text: 'Hoán dụ' },
          { id: 'C', text: 'Nhân hóa' },
          { id: 'D', text: 'Nói giảm nói tránh' }
        ],
        correct_answer: { answer: 'A' },
        explanation: '"Sự kiên trì" được so sánh ngầm với "chiếc chìa khóa vạn năng" (ẩn dụ phẩm chất / chức năng).',
        difficulty: 'thong_hieu',
        point_weight: 0.25
      },
      {
        id: 'c2000000-0000-0000-0000-000000000003',
        subject_id: 'b1000000-0000-0000-0000-000000000002',
        type: 'single_choice',
        content: 'Đọc văn bản thông tin giới thiệu về di sản văn hóa Vịnh Hạ Long, phong cách ngôn ngữ chủ đạo của văn bản là gì?',
        options: [
          { id: 'A', text: 'Phong cách ngôn ngữ báo chí / thông tin khoa học' },
          { id: 'B', text: 'Phong cách ngôn ngữ sinh hoạt thường ngày' },
          { id: 'C', text: 'Phong cách ngôn ngữ hành chính công vụ' },
          { id: 'D', text: 'Phong cách ngôn ngữ kịch nói sân khấu' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Văn bản thông tin giới thiệu danh lam thắng cảnh mang tính thời sự, chính xác và cung cấp dữ liệu là phong cách báo chí kết hợp thông tin khoa học.',
        difficulty: 'nhan_biet',
        point_weight: 0.25
      },
      {
        id: 'c2000000-0000-0000-0000-000000000004',
        subject_id: 'b1000000-0000-0000-0000-000000000002',
        type: 'true_false',
        content: 'Đọc đoạn trích: "Hạnh phúc không phải là đích đến, mà là một hành trình...". Xét tính đúng/sai của các nhận định sau theo cấu trúc bậc thang:',
        options: [
          { id: 'a', text: 'Mục đích chính của đoạn trích là khuyên con người biết trân trọng từng khoảnh khắc hiện tại.' },
          { id: 'b', text: 'Tác giả phủ nhận hoàn toàn vai trò của các mục tiêu dài hạn trong tương lai.' },
          { id: 'c', text: 'Thao tác lập luận chủ yếu trong đoạn trích là giải thích kết hợp bình luận.' },
          { id: 'd', text: 'Thông điệp của văn bản mang ý nghĩa định hướng lối sống tích cực, lạc quan cho giới trẻ.' }
        ],
        correct_answer: { a: true, b: false, c: true, d: true },
        explanation: 'Ý a đúng; ý b sai vì tác giả chỉ nhấn mạnh giá trị của hành trình chứ không phủ nhận mục tiêu tương lai; ý c và d đúng.',
        difficulty: 'van_dung',
        point_weight: 1.00
      },
      {
        id: 'c2000000-0000-0000-0000-000000000005',
        subject_id: 'b1000000-0000-0000-0000-000000000002',
        type: 'short_answer',
        content: 'Xác định phương thức biểu đạt chính của một bài báo phân tích thực trạng ô nhiễm rác thải nhựa tại các đô thị lớn? (Nhập đáp án: Nghị luận hoặc Thuyết minh)',
        options: [],
        correct_answer: { value: 'Nghị luận', accepted_values: ['Nghị luận', 'nghi luan', 'Nghi luan', 'Nghị Luận'] },
        explanation: 'Bàn luận, phân tích thực trạng và đề xuất giải pháp là phương thức biểu đạt chính: Nghị luận.',
        difficulty: 'van_dung',
        point_weight: 0.50
      }
    ]
  },

  // 2. Tiếng Anh
  {
    exam: {
      id: 'e1000000-0000-0000-0000-000000000003',
      subject_id: 'b1000000-0000-0000-0000-000000000003',
      title: 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Tiếng Anh (Đề Chuẩn Số 01)',
      description: 'Đề thi trắc nghiệm đánh giá năng lực ngôn ngữ theo khung tham chiếu B1-B2 chuẩn Bộ GD&ĐT.',
      duration_minutes: 50,
      total_questions: 5,
      passing_score: 5.0,
      is_published: true,
    },
    questions: [
      {
        id: 'c3000000-0000-0000-0000-000000000001',
        subject_id: 'b1000000-0000-0000-0000-000000000003',
        type: 'single_choice',
        content: 'Mark the letter A, B, C, or D to indicate the word whose underlined part differs from the other three in pronunciation:',
        options: [
          { id: 'A', text: 'worked (/t/)' },
          { id: 'B', text: 'stopped (/t/)' },
          { id: 'C', text: 'cleaned (/d/)' },
          { id: 'D', text: 'watched (/t/)' }
        ],
        correct_answer: { answer: 'C' },
        explanation: 'Cleaned được phát âm đuôi -ed là /d/, trong khi worked, stopped, watched có đuôi -ed phát âm là /t/.',
        difficulty: 'nhan_biet',
        point_weight: 0.25
      },
      {
        id: 'c3000000-0000-0000-0000-000000000002',
        subject_id: 'b1000000-0000-0000-0000-000000000003',
        type: 'single_choice',
        content: 'If the weather ________ fine tomorrow, our class will go on a picnic to Ba Na Hills.',
        options: [
          { id: 'A', text: 'is' },
          { id: 'B', text: 'was' },
          { id: 'C', text: 'will be' },
          { id: 'D', text: 'had been' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Câu điều kiện loại 1 diễn tả sự việc có thể xảy ra ở hiện tại hoặc tương lai: If + S + V(hiện tại đơn), S + will + V(nguyên mẫu).',
        difficulty: 'thong_hieu',
        point_weight: 0.25
      },
      {
        id: 'c3000000-0000-0000-0000-000000000003',
        subject_id: 'b1000000-0000-0000-0000-000000000003',
        type: 'single_choice',
        content: 'Solar energy and wind power are examples of ________ energy sources that help combat climate change.',
        options: [
          { id: 'A', text: 'renewable' },
          { id: 'B', text: 'exhaustible' },
          { id: 'C', text: 'polluted' },
          { id: 'D', text: 'harmful' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Renewable energy (năng lượng tái tạo) như năng lượng mặt trời và gió.',
        difficulty: 'thong_hieu',
        point_weight: 0.25
      },
      {
        id: 'c3000000-0000-0000-0000-000000000004',
        subject_id: 'b1000000-0000-0000-0000-000000000003',
        type: 'true_false',
        content: 'Read the statement about Artificial Intelligence (AI) in education: "AI-powered platforms can assess student progress in real-time, generate customized exercises, and support teachers in administrative tasks." Determine True or False for each statement:',
        options: [
          { id: 'a', text: 'AI can provide instant assessment of students\' performance.' },
          { id: 'b', text: 'The text suggests that human teachers are completely unnecessary.' },
          { id: 'c', text: 'AI is capable of tailoring exercises to individual learning needs.' },
          { id: 'd', text: 'Teachers can save time by letting AI assist with routine paperwork.' }
        ],
        correct_answer: { a: true, b: false, c: true, d: true },
        explanation: 'a, c, d đúng theo ngữ cảnh bài đọc. b sai vì AI chỉ hỗ trợ (support) giáo viên chứ không thay thế.',
        difficulty: 'van_dung',
        point_weight: 1.00
      },
      {
        id: 'c3000000-0000-0000-0000-000000000005',
        subject_id: 'b1000000-0000-0000-0000-000000000003',
        type: 'short_answer',
        content: 'Give the correct form of the word in brackets: "Deforestation poses a major [ENVIRONMENT] threat to our planet." (Điền tính từ thích hợp)',
        options: [],
        correct_answer: { value: 'environmental', accepted_values: ['environmental', 'Environmental'] },
        explanation: 'Trước danh từ threat cần một tính từ: environmental (thuộc về môi trường).',
        difficulty: 'van_dung',
        point_weight: 0.50
      }
    ]
  },

  // 3. Vật lí
  {
    exam: {
      id: 'e1000000-0000-0000-0000-000000000004',
      subject_id: 'b1000000-0000-0000-0000-000000000004',
      title: 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Vật lí (Đề Chuẩn Số 01)',
      description: 'Chương trình Vật lí 12 mới: Nhiệt học, Khí lý tưởng, Từ trường, Sóng cơ và Hạt nhân nguyên tử.',
      duration_minutes: 50,
      total_questions: 5,
      passing_score: 5.0,
      is_published: true,
    },
    questions: [
      {
        id: 'c4000000-0000-0000-0000-000000000001',
        subject_id: 'b1000000-0000-0000-0000-000000000004',
        type: 'single_choice',
        content: 'Một vật dao động điều hòa dọc theo trục $Ox$ với phương trình $x = 5\\cos(4\\pi t + \\frac{\\pi}{3})$ (cm). Tần số dao động của vật là:',
        options: [
          { id: 'A', text: '$f = 2\\text{ Hz}$' },
          { id: 'B', text: '$f = 4\\text{ Hz}$' },
          { id: 'C', text: '$f = 0.5\\text{ Hz}$' },
          { id: 'D', text: '$f = 4\\pi\\text{ Hz}$' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Ta có $\\omega = 4\\pi \\text{ rad/s} \\Rightarrow f = \\frac{\\omega}{2\\pi} = \\frac{4\\pi}{2\\pi} = 2\\text{ Hz}$.',
        difficulty: 'nhan_biet',
        point_weight: 0.25
      },
      {
        id: 'c4000000-0000-0000-0000-000000000002',
        subject_id: 'b1000000-0000-0000-0000-000000000004',
        type: 'single_choice',
        content: 'Đơn vị đo nhiệt dung riêng của một chất trong hệ đo lường quốc tế (SI) là:',
        options: [
          { id: 'A', text: '$\\text{J/(kg}\\cdot\\text{K)}$' },
          { id: 'B', text: '$\\text{J/kg}$' },
          { id: 'C', text: '$\\text{cal/g}$' },
          { id: 'D', text: '$\\text{W/(m}\\cdot\\text{K)}$' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Từ công thức $Q = m c \\Delta T \\Rightarrow c = \\frac{Q}{m \\Delta T}$, đơn vị chuẩn SI là $\\text{J/(kg}\\cdot\\text{K)}$.',
        difficulty: 'nhan_biet',
        point_weight: 0.25
      },
      {
        id: 'c4000000-0000-0000-0000-000000000003',
        subject_id: 'b1000000-0000-0000-0000-000000000004',
        type: 'single_choice',
        content: 'Trên một sợi dây đàn hồi dài $L$ có hai đầu cố định đang xảy ra hiện tượng sóng dừng ổn định với 4 bụng sóng. Bước sóng $\\lambda$ liên hệ với chiều dài dây qua công thức:',
        options: [
          { id: 'A', text: '$\\lambda = \\frac{L}{2}$' },
          { id: 'B', text: '$\\lambda = 2L$' },
          { id: 'C', text: '$\\lambda = 4L$' },
          { id: 'D', text: '$\\lambda = \\frac{L}{4}$' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Với hai đầu cố định: $L = k\\frac{\\lambda}{2}$. Với $k = 4$ bụng sóng $\\Rightarrow L = 4\\frac{\\lambda}{2} = 2\\lambda \\Rightarrow \\lambda = \\frac{L}{2}$.',
        difficulty: 'thong_hieu',
        point_weight: 0.25
      },
      {
        id: 'c4000000-0000-0000-0000-000000000004',
        subject_id: 'b1000000-0000-0000-0000-000000000004',
        type: 'true_false',
        content: 'Một khối khí lý tưởng đơn nguyên tử thực hiện chu trình biến đổi nhiệt động học. Xét tính đúng/sai của các phát biểu sau:',
        options: [
          { id: 'a', text: 'Nội năng của một lượng khí lý tưởng chỉ phụ thuộc vào nhiệt độ tuyệt đối $T$.' },
          { id: 'b', text: 'Trong quá trình biến đổi đẳng nhiệt, độ biến thiên nội năng $\\Delta U = 0$.' },
          { id: 'c', text: 'Trong quá trình đoạn nhiệt, lượng nhiệt trao đổi giữa hệ với môi trường là $Q = 0$.' },
          { id: 'd', text: 'Khi khối khí nhận công từ ngoại lực nén thì theo quy ước dấu $A < 0$.' }
        ],
        correct_answer: { a: true, b: true, c: true, d: false },
        explanation: 'Theo quy ước nhiệt động học: Hệ nhận công thì $A > 0$, hệ sinh công thì $A < 0$. Vì vậy phát biểu d sai.',
        difficulty: 'van_dung',
        point_weight: 1.00
      },
      {
        id: 'c4000000-0000-0000-0000-000000000005',
        subject_id: 'b1000000-0000-0000-0000-000000000004',
        type: 'short_answer',
        content: 'Một sóng cơ có tần số $f = 50\\text{ Hz}$ lan truyền trong môi trường đàn hồi với tốc độ $v = 150\\text{ m/s}$. Tính bước sóng $\\lambda$ theo đơn vị mét (m)?',
        options: [],
        correct_answer: { value: '3', accepted_values: ['3', '3.0', '3,0'] },
        explanation: 'Bước sóng $\\lambda = \\frac{v}{f} = \\frac{150}{50} = 3\\text{ m}$.',
        difficulty: 'van_dung',
        point_weight: 0.50
      }
    ]
  },

  // 4. Hóa học
  {
    exam: {
      id: 'e1000000-0000-0000-0000-000000000005',
      subject_id: 'b1000000-0000-0000-0000-000000000005',
      title: 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Hóa học (Đề Chuẩn Số 01)',
      description: 'Đề thi trắc nghiệm Hóa học 12 mới: Este - Lipit, Cacbohiđrat, Amin - Peptit, Pin điện hóa và Phức chất.',
      duration_minutes: 50,
      total_questions: 5,
      passing_score: 5.0,
      is_published: true,
    },
    questions: [
      {
        id: 'c5000000-0000-0000-0000-000000000001',
        subject_id: 'b1000000-0000-0000-0000-000000000005',
        type: 'single_choice',
        content: 'Chất nào sau đây là este no, đơn chức, mạch hở có mùi chuối chín đặc trưng thường dùng làm hương liệu thực phẩm?',
        options: [
          { id: 'A', text: 'Isoamyl axetat' },
          { id: 'B', text: 'Metyl fomat' },
          { id: 'C', text: 'Etyl butirat' },
          { id: 'D', text: 'Benzyl axetat' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Isoamyl axetat ($CH_3COOCH_2CH_2CH(CH_3)_2$) có mùi chuối chín đặc trưng.',
        difficulty: 'nhan_biet',
        point_weight: 0.25
      },
      {
        id: 'c5000000-0000-0000-0000-000000000002',
        subject_id: 'b1000000-0000-0000-0000-000000000005',
        type: 'single_choice',
        content: 'Cặp kim loại nào sau đây khi tiếp xúc trực tiếp trong không khí ẩm sẽ làm cho sắt ($Fe$) bị ăn mòn điện hóa nhanh nhất?',
        options: [
          { id: 'A', text: '$Fe$ tiếp xúc với $Cu$' },
          { id: 'B', text: '$Fe$ tiếp xúc với $Zn$' },
          { id: 'C', text: '$Fe$ tiếp xúc với $Mg$' },
          { id: 'D', text: '$Fe$ tiếp xúc với $Al$' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Vì Fe có tính khử mạnh hơn Cu nên Fe đóng vai trò cực âm (anot) và bị oxi hóa trước (bị ăn mòn điện hóa). Với Zn, Mg, Al có tính khử mạnh hơn Fe thì Fe được bảo vệ.',
        difficulty: 'thong_hieu',
        point_weight: 0.25
      },
      {
        id: 'c5000000-0000-0000-0000-000000000003',
        subject_id: 'b1000000-0000-0000-0000-000000000005',
        type: 'single_choice',
        content: 'Chất nào sau đây trong phân tử chứa liên kết peptit và tham gia phản ứng màu biure với $Cu(OH)_2$ cho màu tím đặc trưng?',
        options: [
          { id: 'A', text: 'Lòng trắng trứng (Anbumin)' },
          { id: 'B', text: 'Glucozơ' },
          { id: 'C', text: 'Glixerol' },
          { id: 'D', text: 'Axit axetic' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Protein (lòng trắng trứng - anbumin) có nhiều liên kết peptit phản ứng màu biure cho dung dịch màu tím đặc trưng.',
        difficulty: 'nhan_biet',
        point_weight: 0.25
      },
      {
        id: 'c5000000-0000-0000-0000-000000000004',
        subject_id: 'b1000000-0000-0000-0000-000000000005',
        type: 'true_false',
        content: 'Tiến hành thí nghiệm xà phòng hóa chất béo triolein bằng dung dịch $NaOH$ 40%, đun sôi nhẹ trong 30 phút. Xét tính đúng/sai của các mệnh đề sau:',
        options: [
          { id: 'a', text: 'Sau phản ứng thu được hỗn hợp chứa muối natri oleat và glixerol.' },
          { id: 'b', text: 'Thêm dung dịch $NaCl$ bão hòa nóng để làm giảm độ tan và tách xà phòng nổi lên trên.' },
          { id: 'c', text: 'Có thể thay thế dung dịch $NaOH$ bằng dung dịch axit $H_2SO_4$ loãng mà vẫn thu được xà phòng.' },
          { id: 'd', text: 'Triolein là chất béo không no ở trạng thái lỏng ở điều kiện thường.' }
        ],
        correct_answer: { a: true, b: true, c: false, d: true },
        explanation: 'Thủy phân chất béo trong môi trường axit thu được axit béo tự do chứ không thu được muối của axit béo (xà phòng), do đó ý c sai.',
        difficulty: 'van_dung',
        point_weight: 1.00
      },
      {
        id: 'c5000000-0000-0000-0000-000000000005',
        subject_id: 'b1000000-0000-0000-0000-000000000005',
        type: 'short_answer',
        content: 'Cho $18\\text{ gam}$ glucozơ ($C_6H_{12}O_6$, $M=180$) phản ứng hoàn toàn với dung dịch $AgNO_3$ dư trong $NH_3$, đun nóng. Tính khối lượng bạc ($Ag$, $M=108$) sinh ra theo gam (g)?',
        options: [],
        correct_answer: { value: '21.6', accepted_values: ['21.6', '21,6'] },
        explanation: '$n_{\\text{glucozo}} = \\frac{18}{180} = 0.1\\text{ mol}$. Phản ứng tráng bạc: $1\\text{ glucozo} \\rightarrow 2Ag \\Rightarrow n_{Ag} = 0.2\\text{ mol} \\Rightarrow m_{Ag} = 0.2 \\times 108 = 21.6\\text{ g}$.',
        difficulty: 'van_dung',
        point_weight: 0.50
      }
    ]
  },

  // 5. Sinh học
  {
    exam: {
      id: 'e1000000-0000-0000-0000-000000000006',
      subject_id: 'b1000000-0000-0000-0000-000000000006',
      title: 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Sinh học (Đề Chuẩn Số 01)',
      description: 'Đề thi trắc nghiệm Sinh học: Di truyền phân tử, Tế bào, Quy luật di truyền và Sinh thái học hiện đại.',
      duration_minutes: 50,
      total_questions: 5,
      passing_score: 5.0,
      is_published: true,
    },
    questions: [
      {
        id: 'c6000000-0000-0000-0000-000000000001',
        subject_id: 'b1000000-0000-0000-0000-000000000006',
        type: 'single_choice',
        content: 'Loại nuclêôtit nào sau đây không có trong cấu trúc phân tử của axit nuclêic ARN?',
        options: [
          { id: 'A', text: 'Timin (T)' },
          { id: 'B', text: 'Uraxin (U)' },
          { id: 'C', text: 'Ađênin (A)' },
          { id: 'D', text: 'Guanin (G)' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Phân tử ARN được cấu tạo từ 4 loại nuclêôtit: A, U, G, X (không có T).',
        difficulty: 'nhan_biet',
        point_weight: 0.25
      },
      {
        id: 'c6000000-0000-0000-0000-000000000002',
        subject_id: 'b1000000-0000-0000-0000-000000000006',
        type: 'single_choice',
        content: 'Ở đậu Hà Lan, alen $A$ quy định hạt vàng trội hoàn toàn so với alen $a$ quy định hạt xanh. Phép lai giữa hai cây dị hợp $Aa \\times Aa$ cho tỉ lệ kiểu hình ở đời con $F_1$ là:',
        options: [
          { id: 'A', text: '3 hạt vàng : 1 hạt xanh' },
          { id: 'B', text: '1 hạt vàng : 1 hạt xanh' },
          { id: 'C', text: '100% hạt vàng' },
          { id: 'D', text: '1 hạt vàng : 2 hạt đốm : 1 hạt xanh' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Phép lai $Aa \\times Aa \\rightarrow 1 AA : 2 Aa : 1 aa$, tỉ lệ kiểu hình là 3 vàng : 1 xanh.',
        difficulty: 'thong_hieu',
        point_weight: 0.25
      },
      {
        id: 'c6000000-0000-0000-0000-000000000003',
        subject_id: 'b1000000-0000-0000-0000-000000000006',
        type: 'single_choice',
        content: 'Trong một chuỗi thức ăn trên cạn: Cỏ $\\rightarrow$ Cào cào $\\rightarrow$ Ếch đồng $\\rightarrow$ Rắn nước, sinh vật tiêu thụ bậc 2 là:',
        options: [
          { id: 'A', text: 'Ếch đồng' },
          { id: 'B', text: 'Cào cào' },
          { id: 'C', text: 'Rắn nước' },
          { id: 'D', text: 'Cỏ' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Cỏ (SV sản xuất) $\\rightarrow$ Cào cào (SV tiêu thụ bậc 1) $\\rightarrow$ Ếch đồng (SV tiêu thụ bậc 2).',
        difficulty: 'thong_hieu',
        point_weight: 0.25
      },
      {
        id: 'c6000000-0000-0000-0000-000000000004',
        subject_id: 'b1000000-0000-0000-0000-000000000006',
        type: 'true_false',
        content: 'Khi nghiên cứu về đột biến gen và công nghệ gen, các nhận định sau đây đúng hay sai theo thang bậc:',
        options: [
          { id: 'a', text: 'Đột biến điểm là những biến đổi chỉ liên quan đến một cặp nuclêôtit trong gen.' },
          { id: 'b', text: 'Đột biến thay thế một cặp nuclêôtit không bao giờ làm thay đổi trình tự axit amin của chuỗi pôlipeptit.' },
          { id: 'c', text: 'Kĩ thuật chuyển gen sử dụng enzim cắt giới hạn (Restricstaza) và enzim nối (Ligaza).' },
          { id: 'd', text: 'Đột biến gen là nguồn nguyên liệu sơ cấp của quá trình tiến hóa và chọn giống.' }
        ],
        correct_answer: { a: true, b: false, c: true, d: true },
        explanation: 'Ý b sai vì đột biến thay thế có thể biến bộ ba mã hóa thành bộ ba mã hóa axit amin khác (đột biến sai nghĩa) hoặc bộ ba kết thúc (đột biến vô nghĩa).',
        difficulty: 'van_dung',
        point_weight: 1.00
      },
      {
        id: 'c6000000-0000-0000-0000-000000000005',
        subject_id: 'b1000000-0000-0000-0000-000000000006',
        type: 'short_answer',
        content: 'Một đoạn phân tử ADN xoắn kép có chiều dài $L = 5100$ Å. Tính tổng số nuclêôtit của đoạn ADN này? (Biết mỗi nuclêôtit dài 3.4 Å)',
        options: [],
        correct_answer: { value: '3000', accepted_values: ['3000'] },
        explanation: '$N = \\frac{2L}{3.4} = \\frac{2 \\times 5100}{3.4} = 3000$ nuclêôtit.',
        difficulty: 'van_dung',
        point_weight: 0.50
      }
    ]
  },

  // 6. Lịch sử
  {
    exam: {
      id: 'e1000000-0000-0000-0000-000000000007',
      subject_id: 'b1000000-0000-0000-0000-000000000007',
      title: 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Lịch sử (Đề Chuẩn Số 01)',
      description: 'Lịch sử Việt Nam và Lịch sử Thế giới hiện đại từ 1919 đến nay chuẩn chương trình GDPT 2018.',
      duration_minutes: 50,
      total_questions: 5,
      passing_score: 5.0,
      is_published: true,
    },
    questions: [
      {
        id: 'c7000000-0000-0000-0000-000000000001',
        subject_id: 'b1000000-0000-0000-0000-000000000007',
        type: 'single_choice',
        content: 'Chiến thắng nào của quân và dân ta đã đập tan tập đoàn cứ điểm mạnh nhất Đông Dương của thực dân Pháp, đưa tới việc ký kết Hiệp định Giơnevơ năm 1954?',
        options: [
          { id: 'A', text: 'Chiến dịch Điện Biên Phủ' },
          { id: 'B', text: 'Chiến dịch Biên giới Thu - Đông 1950' },
          { id: 'C', text: 'Chiến dịch Việt Bắc Thu - Đông 1947' },
          { id: 'D', text: 'Chiến dịch Tây Bắc 1952' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Chiến dịch Điện Biên Phủ "lừng lẫy năm châu, chấn động địa cầu" buộc Pháp ký Hiệp định Giơnevơ chấm dứt chiến tranh.',
        difficulty: 'nhan_biet',
        point_weight: 0.25
      },
      {
        id: 'c7000000-0000-0000-0000-000000000002',
        subject_id: 'b1000000-0000-0000-0000-000000000007',
        type: 'single_choice',
        content: 'Hiệp hội các quốc gia Đông Nam Á (ASEAN) được thành lập vào ngày 8/8/1967 tại thủ đô của quốc gia nào?',
        options: [
          { id: 'A', text: 'Băng Cốc (Thái Lan)' },
          { id: 'B', text: 'Gia-các-ta (In-đô-nê-xi-a)' },
          { id: 'C', text: 'Kua-la Lăm-pơ (Ma-lai-xi-a)' },
          { id: 'D', text: 'Ma-ni-la (Phi-líp-pin)' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'ASEAN được thành lập ngày 8/8/1967 với việc ký kết Tuyên bố Băng Cốc tại Thái Lan.',
        difficulty: 'nhan_biet',
        point_weight: 0.25
      },
      {
        id: 'c7000000-0000-0000-0000-000000000003',
        subject_id: 'b1000000-0000-0000-0000-000000000007',
        type: 'single_choice',
        content: 'Đại hội toàn quốc lần thứ VI của Đảng Cộng sản Việt Nam (12/1986) đã đề ra quyết sách lịch sử nào?',
        options: [
          { id: 'A', text: 'Khởi xướng đường lối đổi mới toàn diện đất nước' },
          { id: 'B', text: 'Đề ra kế hoạch giải phóng hoàn toàn miền Nam' },
          { id: 'C', text: 'Hoàn thành công cuộc cải cách ruộng đất' },
          { id: 'D', text: 'Gia nhập Tổ chức Thương mại Thế giới (WTO)' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Đại hội VI (12/1986) mở ra bước ngoặt đổi mới đất nước, trọng tâm là đổi mới kinh tế gắn liền với đổi mới chính trị.',
        difficulty: 'thong_hieu',
        point_weight: 0.25
      },
      {
        id: 'c7000000-0000-0000-0000-000000000004',
        subject_id: 'b1000000-0000-0000-0000-000000000007',
        type: 'true_false',
        content: 'Về cuộc Tổng tiến công và nổi dậy mùa Xuân năm 1975 giải phóng hoàn toàn miền Nam, xét tính đúng/sai của các nhận định:',
        options: [
          { id: 'a', text: 'Chiến dịch Tây Nguyên đã tạo ra bước ngoặt chuyển hẳn sang thế tổng tiến công chiến lược.' },
          { id: 'b', text: 'Chiến dịch Huế - Đà Nẵng đập tan hệ thống phòng ngự liên hoàn kiên cố của địch ở miền Trung.' },
          { id: 'c', text: 'Chiến dịch Hồ Chí Minh là chiến dịch lịch sử mang tính chất quyết chiến chiến lược giải phóng Sài Gòn.' },
          { id: 'd', text: 'Thời gian diễn ra toàn bộ cuộc Tổng tiến công và nổi dậy kéo dài ròng rã suốt 1 năm.' }
        ],
        correct_answer: { a: true, b: true, c: true, d: false },
        explanation: 'Ý d sai vì toàn bộ cuộc Tổng tiến công và nổi dậy chỉ diễn ra trong vòng gần 2 tháng (từ 4/3/1975 đến 30/4/1975).',
        difficulty: 'van_dung',
        point_weight: 1.00
      },
      {
        id: 'c7000000-0000-0000-0000-000000000005',
        subject_id: 'b1000000-0000-0000-0000-000000000007',
        type: 'short_answer',
        content: 'Việt Nam chính thức trở thành thành viên thứ 149 của Liên hợp quốc (LHQ - UN) vào năm nào?',
        options: [],
        correct_answer: { value: '1977', accepted_values: ['1977'] },
        explanation: 'Việt Nam gia nhập Liên hợp quốc vào ngày 20/9/1977.',
        difficulty: 'van_dung',
        point_weight: 0.50
      }
    ]
  },

  // 7. Địa lí
  {
    exam: {
      id: 'e1000000-0000-0000-0000-000000000008',
      subject_id: 'b1000000-0000-0000-0000-000000000008',
      title: 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Địa lí (Đề Chuẩn Số 01)',
      description: 'Địa lí tự nhiên, Địa lí các vùng kinh tế trọng điểm và phát triển kinh tế biển Việt Nam.',
      duration_minutes: 50,
      total_questions: 5,
      passing_score: 5.0,
      is_published: true,
    },
    questions: [
      {
        id: 'c8000000-0000-0000-0000-000000000001',
        subject_id: 'b1000000-0000-0000-0000-000000000008',
        type: 'single_choice',
        content: 'Vùng biển Việt Nam có diện tích khoảng bao nhiêu triệu kilômét vuông trên Biển Đông?',
        options: [
          { id: 'A', text: 'Khoảng 1.0 triệu km²' },
          { id: 'B', text: 'Khoảng 2.0 triệu km²' },
          { id: 'C', text: 'Khoảng 0.5 triệu km²' },
          { id: 'D', text: 'Khoảng 3.4 triệu km²' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Vùng biển thuộc chủ quyền và quyền chủ quyền của Việt Nam rộng khoảng 1 triệu km² trên Biển Đông.',
        difficulty: 'nhan_biet',
        point_weight: 0.25
      },
      {
        id: 'c8000000-0000-0000-0000-000000000002',
        subject_id: 'b1000000-0000-0000-0000-000000000008',
        type: 'single_choice',
        content: 'Vùng kinh tế nào ở nước ta dẫn đầu cả nước về diện tích và sản lượng cây công nghiệp lâu năm như cà phê, hồ tiêu, cao su?',
        options: [
          { id: 'A', text: 'Tây Nguyên' },
          { id: 'B', text: 'Đồng bằng sông Hồng' },
          { id: 'C', text: 'Bắc Trung Bộ' },
          { id: 'D', text: 'Đồng bằng sông Cửu Long' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Tây Nguyên sở hữu đất đỏ bazan màu mỡ trên các cao nguyên xếp tầng, là thủ phủ cà phê, hồ tiêu của cả nước.',
        difficulty: 'thong_hieu',
        point_weight: 0.25
      },
      {
        id: 'c8000000-0000-0000-0000-000000000003',
        subject_id: 'b1000000-0000-0000-0000-000000000008',
        type: 'single_choice',
        content: 'Khó khăn lớn nhất về mặt tự nhiên đối với sản xuất nông nghiệp ở vùng Đồng bằng sông Cửu Long vào mùa khô là:',
        options: [
          { id: 'A', text: 'Thiếu nước ngọt và hiện tượng xâm nhập mặn sâu vào đất liền' },
          { id: 'B', text: 'Bão lũ nhiệt đới dồn dập kèm theo sạt lở đồi núi' },
          { id: 'C', text: 'Hiện tượng rét đậm, rét hại và sương muối' },
          { id: 'D', text: 'Động đất và sóng thần từ ngoài khơi' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Vào mùa khô, lưu lượng nước sông Mê Kông đổ về thấp khiến tình trạng hạn hán và xâm nhập mặn diễn biến gay gắt.',
        difficulty: 'thong_hieu',
        point_weight: 0.25
      },
      {
        id: 'c8000000-0000-0000-0000-000000000004',
        subject_id: 'b1000000-0000-0000-0000-000000000008',
        type: 'true_false',
        content: 'Xét các đặc điểm về vị trí địa lí và lãnh thổ của nước ta, xác định tính đúng/sai của các nhận định:',
        options: [
          { id: 'a', text: 'Nước ta nằm hoàn toàn trong vùng nội chí tuyến bán cầu Bắc.' },
          { id: 'b', text: 'Khí hậu nước ta mang tính chất nhiệt đới ẩm gió mùa do nằm tiếp giáp Biển Đông rộng lớn.' },
          { id: 'c', text: 'Đường bờ biển nước ta dài 3260 km chạy cong hình chữ S từ Móng Cái đến Hà Tiên.' },
          { id: 'd', text: 'Lãnh thổ nước ta nằm hoàn toàn trong vùng khí hậu ôn đới lục địa khô hạn.' }
        ],
        correct_answer: { a: true, b: true, c: true, d: false },
        explanation: 'Ý d sai vì Việt Nam thuộc đới khí hậu nhiệt đới ẩm gió mùa, không phải ôn đới lục địa khô hạn.',
        difficulty: 'van_dung',
        point_weight: 1.00
      },
      {
        id: 'c8000000-0000-0000-0000-000000000005',
        subject_id: 'b1000000-0000-0000-0000-000000000008',
        type: 'short_answer',
        content: 'Chiều dài đường bờ biển của nước ta (không tính các đảo) dài bao nhiêu kilômét (km)? (Nhập số nguyên)',
        options: [],
        correct_answer: { value: '3260', accepted_values: ['3260', '3260 km'] },
        explanation: 'Đường bờ biển Việt Nam dài 3260 km.',
        difficulty: 'nhan_biet',
        point_weight: 0.50
      }
    ]
  },

  // 8. Giáo dục Kinh tế & Pháp luật
  {
    exam: {
      id: 'e1000000-0000-0000-0000-000000000009',
      subject_id: 'b1000000-0000-0000-0000-000000000009',
      title: 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn GD KT&PL (Đề Chuẩn Số 01)',
      description: 'Kinh tế thị trường, Cơ chế giá, Pháp luật và Quyền tự do dân chủ của công dân theo Hiến pháp 2013.',
      duration_minutes: 50,
      total_questions: 5,
      passing_score: 5.0,
      is_published: true,
    },
    questions: [
      {
        id: 'c9000000-0000-0000-0000-000000000001',
        subject_id: 'b1000000-0000-0000-0000-000000000009',
        type: 'single_choice',
        content: 'Trong nền kinh tế thị trường, khi cung lớn hơn cầu (Cung > Cầu) thì giá cả hàng hóa thường có xu hướng biến động như thế nào?',
        options: [
          { id: 'A', text: 'Giá cả giảm xuống dưới mức giá trị' },
          { id: 'B', text: 'Giá cả tăng vọt không kiểm soát' },
          { id: 'C', text: 'Giá cả luôn giữ nguyên không đổi' },
          { id: 'D', text: 'Hàng hóa bị tiêu hủy ngay lập tức' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Quy luật cung cầu: Khi cung vượt cầu, lượng hàng dồi dào, người bán cạnh tranh giảm giá để tiêu thụ sản phẩm.',
        difficulty: 'nhan_biet',
        point_weight: 0.25
      },
      {
        id: 'c9000000-0000-0000-0000-000000000002',
        subject_id: 'b1000000-0000-0000-0000-000000000009',
        type: 'single_choice',
        content: 'Văn bản quy phạm pháp luật nào sau đây có giá trị pháp lý cao nhất trong hệ thống pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam?',
        options: [
          { id: 'A', text: 'Hiến pháp' },
          { id: 'B', text: 'Luật Giáo dục' },
          { id: 'C', text: 'Nghị định của Chính phủ' },
          { id: 'D', text: 'Thông tư của Bộ trưởng' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Hiến pháp là đạo luật cơ bản của Nhà nước, có hiệu lực pháp lý cao nhất; mọi văn bản quy phạm pháp luật khác phải phù hợp với Hiến pháp.',
        difficulty: 'nhan_biet',
        point_weight: 0.25
      },
      {
        id: 'c9000000-0000-0000-0000-000000000003',
        subject_id: 'b1000000-0000-0000-0000-000000000009',
        type: 'single_choice',
        content: 'Công dân bình đẳng về quyền và nghĩa vụ trước pháp luật nghĩa là:',
        options: [
          { id: 'A', text: 'Mọi công dân đều được hưởng quyền và thực hiện nghĩa vụ theo quy định pháp luật không bị phân biệt đối xử' },
          { id: 'B', text: 'Mọi công dân đều có mức thu nhập và tài sản bằng nhau tuyệt đối' },
          { id: 'C', text: 'Mọi công dân đều phải làm cùng một ngành nghề giống nhau' },
          { id: 'D', text: 'Chỉ có những người trên 50 tuổi mới có đầy đủ quyền công dân' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Quyền bình đẳng của công dân thể hiện ở việc bình đẳng trước pháp luật, không bị phân biệt bởi giới tính, dân tộc, tôn giáo hay địa vị xã hội.',
        difficulty: 'thong_hieu',
        point_weight: 0.25
      },
      {
        id: 'c9000000-0000-0000-0000-000000000004',
        subject_id: 'b1000000-0000-0000-0000-000000000009',
        type: 'true_false',
        content: 'Về quản lý kinh tế vĩ mô và kiềm chế lạm phát của Nhà nước, xét tính đúng/sai của các nhận định:',
        options: [
          { id: 'a', text: 'Lạm phát là sự tăng mức giá chung một cách liên tục của hàng hóa và dịch vụ theo thời gian.' },
          { id: 'b', text: 'Lạm phát phi mã và siêu lạm phát làm đồng tiền mất giá nghiêm trọng và gây bất ổn xã hội.' },
          { id: 'c', text: 'Để kiềm chế lạm phát, Ngân hàng Nhà nước có thể áp dụng chính sách tiền tệ thắt chặt.' },
          { id: 'd', text: 'Nhà nước giải quyết lạm phát bằng cách in thêm thật nhiều tiền giấy và phát cho người dân.' }
        ],
        correct_answer: { a: true, b: true, c: true, d: false },
        explanation: 'In thêm nhiều tiền sẽ càng làm tăng lượng cung tiền trong lưu thông, khiến lạm phát bùng nổ trầm trọng hơn, do đó ý d sai.',
        difficulty: 'van_dung',
        point_weight: 1.00
      },
      {
        id: 'c9000000-0000-0000-0000-000000000005',
        subject_id: 'b1000000-0000-0000-0000-000000000009',
        type: 'short_answer',
        content: 'Theo Hiến pháp năm 2013, công dân nước CHXHCN Việt Nam đủ bao nhiêu tuổi trở lên thì có quyền bầu cử đại biểu Quốc hội và Hội đồng nhân dân? (Nhập số tuổi)',
        options: [],
        correct_answer: { value: '18', accepted_values: ['18', '18 tuổi'] },
        explanation: 'Điều 27 Hiến pháp 2013 quy định: Công dân đủ mười tám tuổi trở lên có quyền bầu cử.',
        difficulty: 'nhan_biet',
        point_weight: 0.50
      }
    ]
  },

  // 9. Tin học
  {
    exam: {
      id: 'e1000000-0000-0000-0000-000000000010',
      subject_id: 'b1000000-0000-0000-0000-000000000010',
      title: 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Tin học (Đề Chuẩn Số 01)',
      description: 'Lập trình Python, CSDL quan hệ SQL, Mạng máy tính và Đạo đức an toàn thông tin kỷ nguyên AI.',
      duration_minutes: 50,
      total_questions: 5,
      passing_score: 5.0,
      is_published: true,
    },
    questions: [
      {
        id: 'ca000000-0000-0000-0000-000000000001',
        subject_id: 'b1000000-0000-0000-0000-000000000010',
        type: 'single_choice',
        content: 'Trong cơ sở dữ liệu quan hệ (RDBMS), trường (thuộc tính) được chọn làm Khóa chính (Primary Key) phải thỏa mãn điều kiện bắt buộc nào?',
        options: [
          { id: 'A', text: 'Giá trị không được trùng lặp và không được mang giá trị NULL' },
          { id: 'B', text: 'Bắt buộc phải là kiểu dữ liệu số nguyên dương' },
          { id: 'C', text: 'Phải chứa ít nhất 10 ký tự chữ cái viết hoa' },
          { id: 'D', text: 'Có thể để trống hoặc trùng lặp tùy ý' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Khóa chính dùng để định danh duy nhất mỗi bản ghi trong bảng quan hệ, do đó không được chứa giá trị NULL và không được trùng lặp.',
        difficulty: 'nhan_biet',
        point_weight: 0.25
      },
      {
        id: 'ca000000-0000-0000-0000-000000000002',
        subject_id: 'b1000000-0000-0000-0000-000000000010',
        type: 'single_choice',
        content: 'Cho đoạn mã Python sau:\n```python\na = [1, 2, 3, 4, 5]\nres = [x * 2 for x in a if x % 2 != 0]\nprint(res)\n```\nKết quả in ra màn hình console là:',
        options: [
          { id: 'A', text: '[2, 6, 10]' },
          { id: 'B', text: '[4, 8]' },
          { id: 'C', text: '[1, 3, 5]' },
          { id: 'D', text: '[2, 4, 6, 8, 10]' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Các phần tử thỏa điều kiện lẻ ($x \\% 2 \\ne 0$) là 1, 3, 5. Nhân đôi thu được [2, 6, 10].',
        difficulty: 'thong_hieu',
        point_weight: 0.25
      },
      {
        id: 'ca000000-0000-0000-0000-000000000003',
        subject_id: 'b1000000-0000-0000-0000-000000000010',
        type: 'single_choice',
        content: 'Giao thức mạng nào sau đây được sử dụng để duyệt web có mã hóa bảo mật dữ liệu giữa trình duyệt và máy chủ thông qua chứng chỉ SSL/TLS?',
        options: [
          { id: 'A', text: 'HTTPS' },
          { id: 'B', text: 'HTTP' },
          { id: 'C', text: 'FTP' },
          { id: 'D', text: 'SMTP' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'HTTPS (Hypertext Transfer Protocol Secure) truyền tải dữ liệu web qua kênh mã hóa an toàn.',
        difficulty: 'nhan_biet',
        point_weight: 0.25
      },
      {
        id: 'ca000000-0000-0000-0000-000000000004',
        subject_id: 'b1000000-0000-0000-0000-000000000010',
        type: 'true_false',
        content: 'Xét tính đúng/sai của các nhận định sau về an toàn thông tin mạng và ứng dụng Trí tuệ nhân tạo (AI):',
        options: [
          { id: 'a', text: 'Tấn công lừa đảo (Phishing) thường giả mạo email hoặc trang web ngân hàng để đánh cắp mật khẩu.' },
          { id: 'b', text: 'Bật tính năng xác thực hai yếu tố (2FA) giúp bảo vệ tài khoản ngay cả khi mật khẩu bị lộ.' },
          { id: 'c', text: 'Mã độc tống tiền (Ransomware) có thể mã hóa dữ liệu người dùng và yêu cầu tiền chuộc.' },
          { id: 'd', text: 'Người dùng nên sử dụng một mật khẩu đơn giản duy nhất như "123456" cho tất cả các tài khoản.' }
        ],
        correct_answer: { a: true, b: true, c: true, d: false },
        explanation: 'Dùng một mật khẩu đơn giản cho mọi tài khoản là hành vi rủi ro nghiêm trọng về bảo mật, do đó ý d sai.',
        difficulty: 'van_dung',
        point_weight: 1.00
      },
      {
        id: 'ca000000-0000-0000-0000-000000000005',
        subject_id: 'b1000000-0000-0000-0000-000000000010',
        type: 'short_answer',
        content: 'Chuyển đổi số thập phân 13 sang hệ đếm nhị phân (cơ số 2)? (Nhập chuỗi các chữ số 0 và 1)',
        options: [],
        correct_answer: { value: '1101', accepted_values: ['1101'] },
        explanation: '$13 = 8 + 4 + 1 = 2^3 + 2^2 + 2^0 \\rightarrow 1101_2$.',
        difficulty: 'van_dung',
        point_weight: 0.50
      }
    ]
  },

  // 10. Công nghệ
  {
    exam: {
      id: 'e1000000-0000-0000-0000-000000000011',
      subject_id: 'b1000000-0000-0000-0000-000000000011',
      title: 'Đề Thi Thử Tốt Nghiệp THPT 2025 - Môn Công nghệ (Đề Chuẩn Số 01)',
      description: 'Công nghệ Điện - Điện tử, Mạch điều khiển cảm biến và Nông nghiệp công nghệ cao 2025.',
      duration_minutes: 50,
      total_questions: 5,
      passing_score: 5.0,
      is_published: true,
    },
    questions: [
      {
        id: 'cb000000-0000-0000-0000-000000000001',
        subject_id: 'b1000000-0000-0000-0000-000000000011',
        type: 'single_choice',
        content: 'Linh kiện bán dẫn nào có tính chất dẫn điện một chiều từ Anot sang Catot và thường dùng trong các mạch chỉnh lưu dòng điện xoay chiều thành một chiều?',
        options: [
          { id: 'A', text: 'Điốt bán dẫn (Diode)' },
          { id: 'B', text: 'Điện trở (Resistor)' },
          { id: 'C', text: 'Tụ điện (Capacitor)' },
          { id: 'D', text: 'Cuộn cảm (Inductor)' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Điốt bán dẫn (Diode) có đặc tính dẫn điện theo một chiều duy nhất từ Anot (A) sang Catot (K).',
        difficulty: 'nhan_biet',
        point_weight: 0.25
      },
      {
        id: 'cb000000-0000-0000-0000-000000000002',
        subject_id: 'b1000000-0000-0000-0000-000000000011',
        type: 'single_choice',
        content: 'Cảm biến quang (LDR / Quang điện trở) hoạt động dựa trên nguyên lý nào?',
        options: [
          { id: 'A', text: 'Giá trị điện trở thay đổi khi cường độ ánh sáng chiếu vào thay đổi' },
          { id: 'B', text: 'Biến đổi trực tiếp từ trường thành lực cơ học' },
          { id: 'C', text: 'Tạo ra sóng siêu âm để đo khoảng cách' },
          { id: 'D', text: 'Lưu trữ điện tích giống như tụ điện' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Quang điện trở (LDR) có giá trị điện trở giảm khi được chiếu sáng mạnh và tăng lên khi ở trong tối.',
        difficulty: 'thong_hieu',
        point_weight: 0.25
      },
      {
        id: 'cb000000-0000-0000-0000-000000000003',
        subject_id: 'b1000000-0000-0000-0000-000000000011',
        type: 'single_choice',
        content: 'Mô hình nhà màng thông minh kết hợp hệ thống tưới nhỏ giọt tự động mang lại ưu điểm vượt trội nào?',
        options: [
          { id: 'A', text: 'Tiết kiệm nước, tối ưu phân bón và ngăn ngừa sâu bệnh hiệu quả' },
          { id: 'B', text: 'Làm tăng nguy cơ ngập úng và xói mòn đất' },
          { id: 'C', text: 'Cần số lượng nhân công làm cỏ gấp 5 lần ngoài đồng ruộng' },
          { id: 'D', text: 'Hoàn toàn không cần ánh sáng mặt trời để quang hợp' }
        ],
        correct_answer: { answer: 'A' },
        explanation: 'Nhà màng công nghệ cao giúp kiểm soát vi khí hậu, tưới chính xác dinh dưỡng và hạn chế thuốc bảo vệ thực vật.',
        difficulty: 'nhan_biet',
        point_weight: 0.25
      },
      {
        id: 'cb000000-0000-0000-0000-000000000004',
        subject_id: 'b1000000-0000-0000-0000-000000000011',
        type: 'true_false',
        content: 'Trong hệ thống điều khiển tự động đèn đường chiếu sáng bằng cảm biến ánh sáng, xét tính đúng/sai của các nhận định:',
        options: [
          { id: 'a', text: 'Khi trời tối, điện trở cảm biến quang tăng làm thay đổi điện áp phân cực kích hoạt rơ-le bật đèn.' },
          { id: 'b', text: 'Rơ-le (Relay) đóng vai trò là phần tử chấp hành đóng ngắt mạch điện công suất lớn.' },
          { id: 'c', text: 'Mạch điều khiển tự động giúp tiết kiệm năng lượng và giảm nhân công vận hành thủ công.' },
          { id: 'd', text: 'Hệ thống này bắt buộc phải có người túc trực 24/24 để nhấn công tắc bật tắt.' }
        ],
        correct_answer: { a: true, b: true, c: true, d: false },
        explanation: 'Hệ thống tự động hóa hoạt động dựa trên cảm biến, không cần người túc trực gạt công tắc thủ công, nên ý d sai.',
        difficulty: 'van_dung',
        point_weight: 1.00
      },
      {
        id: 'cb000000-0000-0000-0000-000000000005',
        subject_id: 'b1000000-0000-0000-0000-000000000011',
        type: 'short_answer',
        content: 'Điện áp xoay chiều lưới điện dân dụng nước ta có giá trị hiệu dụng $U = 220\\text{ V}$. Tính giá trị điện áp đỉnh cực đại $U_0$ theo vôn (V), làm tròn đến số nguyên gần nhất? (Biết $U_0 = U\\sqrt{2}$)',
        options: [],
        correct_answer: { value: '311', accepted_values: ['311', '311V', '311 V'] },
        explanation: '$U_0 = 220 \\times \\sqrt{2} \\approx 220 \\times 1.4142 \\approx 311.13\\text{ V} \\approx 311\\text{ V}$.',
        difficulty: 'van_dung',
        point_weight: 0.50
      }
    ]
  }
];

async function seed() {
  console.log('--- BẮT ĐẦU SEED DỮ LIỆU ĐỀ THI 11 MÔN THI TỐT NGHIỆP ---');

  for (const item of examsData) {
    console.log(`Đang xử lý đề thi: ${item.exam.title}...`);

    // 1. Thêm đề thi
    const { error: examErr } = await supabase
      .from('exams')
      .upsert(item.exam, { onConflict: 'id' });

    if (examErr) {
      console.error(`Lỗi thêm exam ${item.exam.id}:`, examErr);
      continue;
    }

    // 2. Thêm các câu hỏi
    for (let i = 0; i < item.questions.length; i++) {
      const q = item.questions[i];
      const { point_weight, ...qData } = q;

      const { error: qErr } = await supabase
        .from('questions')
        .upsert(qData, { onConflict: 'id' });

      if (qErr) {
        console.error(`Lỗi thêm question ${q.id}:`, qErr);
        continue;
      }

      // 3. Ghép câu hỏi vào đề thi
      const { error: eqErr } = await supabase
        .from('exam_questions')
        .upsert({
          exam_id: item.exam.id,
          question_id: q.id,
          order_index: i + 1,
          point_weight: point_weight || 0.25,
        }, { onConflict: 'exam_id,question_id' });

      if (eqErr) {
        console.error(`Lỗi ghép exam_questions:`, eqErr);
      }
    }

    console.log(`=> Hoàn thành đề thi môn: ${item.exam.title}`);
  }

  console.log('--- SEEDING HOÀN TẤT 100%! ---');
}

seed();
