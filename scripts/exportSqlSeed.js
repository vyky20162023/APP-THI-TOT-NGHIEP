import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = 'https://vvlzcmqzskshvilwcyfg.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bHpjbXF6c2tzaHZpbHdjeWZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzE5MDczNiwiZXhwIjoyMTA4NzY2NzM2fQ.7BJK8JNTw4JDD1T2e5hw1bftUemsZDUc9GT5ZNGZwmk';
const supabase = createClient(url, key);

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

async function exportSql() {
  const { data: exams } = await supabase.from('exams').select('*').order('created_at');
  const { data: questions } = await supabase.from('questions').select('*').order('created_at');
  const { data: eq } = await supabase.from('exam_questions').select('*').order('exam_id, order_index');

  let sql = '\n\n-- ==============================================================================\n';
  sql += '-- 14. SEED DỮ LIỆU ĐỀ THI VÀ CÂU HỎI ĐẦY ĐỦ 11 MÔN THI TỐT NGHIỆP THPT 2025\n';
  sql += '-- ==============================================================================\n\n';

  // Questions for other exams (exclude Math questions which are already in schema)
  const mathQIds = [
    'c1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000005',
    'c1000000-0000-0000-0000-000000000006',
    'c1000000-0000-0000-0000-000000000007'
  ];

  const newQuestions = (questions || []).filter(q => !mathQIds.includes(q.id));
  for (const q of newQuestions) {
    const opts = JSON.stringify(q.options || []).replace(/'/g, "''");
    const ans = JSON.stringify(q.correct_answer || {}).replace(/'/g, "''");
    sql += `INSERT INTO public.questions (id, subject_id, type, content, options, correct_answer, explanation, difficulty) VALUES (${escapeSql(q.id)}, ${escapeSql(q.subject_id)}, ${escapeSql(q.type)}, ${escapeSql(q.content)}, '${opts}'::jsonb, '${ans}'::jsonb, ${escapeSql(q.explanation)}, ${escapeSql(q.difficulty)}) ON CONFLICT (id) DO NOTHING;\n`;
  }

  // New exams
  const newExams = (exams || []).filter(e => e.id !== 'e1000000-0000-0000-0000-000000000001');
  for (const e of newExams) {
    sql += `INSERT INTO public.exams (id, subject_id, title, description, duration_minutes, total_questions, passing_score, is_published) VALUES (${escapeSql(e.id)}, ${escapeSql(e.subject_id)}, ${escapeSql(e.title)}, ${escapeSql(e.description)}, ${e.duration_minutes}, ${e.total_questions}, ${e.passing_score}, ${e.is_published}) ON CONFLICT (id) DO NOTHING;\n`;
  }

  // New exam questions
  const newEq = (eq || []).filter(item => item.exam_id !== 'e1000000-0000-0000-0000-000000000001');
  for (const item of newEq) {
    sql += `INSERT INTO public.exam_questions (exam_id, question_id, order_index, point_weight) VALUES (${escapeSql(item.exam_id)}, ${escapeSql(item.question_id)}, ${item.order_index}, ${item.point_weight}) ON CONFLICT (exam_id, question_id) DO NOTHING;\n`;
  }

  // Also include RLS policy fix for anon access to questions
  sql += '\n-- Cập nhật quyền đọc câu hỏi cho khách vãng lai và học sinh chưa đăng nhập\n';
  sql += 'DROP POLICY IF EXISTS "Mọi người đăng nhập có thể xem câu hỏi" ON public.questions;\n';
  sql += 'DROP POLICY IF EXISTS "Mọi người có thể xem câu hỏi trong đề thi" ON public.questions;\n';
  sql += 'CREATE POLICY "Mọi người có thể xem câu hỏi trong đề thi" ON public.questions FOR SELECT TO authenticated, anon USING (true);\n';
  sql += 'DROP POLICY IF EXISTS "Xem danh sách câu hỏi trong đề thi" ON public.exam_questions;\n';
  sql += 'CREATE POLICY "Xem danh sách câu hỏi trong đề thi" ON public.exam_questions FOR SELECT TO authenticated, anon USING (true);\n';

  fs.appendFileSync('schema.sql', sql);
  fs.writeFileSync('scripts/update_database.sql', sql);
  console.log('Appended SQL to schema.sql and saved to scripts/update_database.sql! Total chars:', sql.length);
}

exportSql();
