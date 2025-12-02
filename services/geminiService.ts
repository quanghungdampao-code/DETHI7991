import { GoogleGenAI, Type } from "@google/genai";
import { TopicPlan, ModelType, QuestionType, DifficultyLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- TEMPLATES ---

const EX_TEST_TEMPLATES = {
  MCQ: `\\begin{ex} %Câu X:[Chủ đề - Mức độ]
Nội dung câu hỏi với $công\\ thức$.
\\choice
{Đáp án A}
{Đáp án B}
{Đáp án C}
{\\True Đáp án D đúng}
\\loigiai{Lời giải chi tiết.\\\\}
\\end{ex}`,
  TF: `\\begin{ex} %Câu X:[Chủ đề - Mức độ]
Cho ... Xét đúng/sai các mệnh đề:
\\choiceTF
{\\True Mệnh đề đúng}
{Mệnh đề sai}
{\\True Mệnh đề đúng}
{Mệnh đề sai}
\\loigiai{Giải thích.\\\\}
\\end{ex}`,
  SA: `\\begin{ex} %Câu X:[Chủ đề - Mức độ]
Câu hỏi trả lời ngắn.
\\shortans{Đáp án}
\\loigiai{Lời giải tóm tắt.\\\\}
\\end{ex}`
};

const WORD_TEMPLATES = {
  MCQ: `Câu X: [Chủ đề - Mức độ] Nội dung câu hỏi với $công\\ thức$?
A. Đáp án A
B. Đáp án B
C. Đáp án C
D. Đáp án D
(Đáp án đúng: D)
Lời giải: Giải thích chi tiết...`,
  TF: `Câu X: [Chủ đề - Mức độ] Cho ... Xét tính đúng sai:
a) Mệnh đề 1 ($công\\ thức$) -> ĐÚNG
b) Mệnh đề 2 -> SAI
c) Mệnh đề 3 -> ĐÚNG
d) Mệnh đề 4 -> SAI
Lời giải: Giải thích chi tiết...`,
  SA: `Câu X: [Chủ đề - Mức độ] Nội dung câu hỏi?
Đáp án: $kết\\ quả$
Lời giải: Giải thích chi tiết...`
};

const DIFFICULTY_GUIDE = `
- NB (Nhận biết): Nhớ lại, nhận ra kiến thức cơ bản.
- TH (Thông hiểu): Hiểu, diễn giải, áp dụng cơ bản.
- VD (Vận dụng): Áp dụng vào tình huống quen thuộc.
- VDC (Vận dụng cao): Phân tích, tổng hợp, giải quyết vấn đề mới.`;

// --- MAIN GENERATION FUNCTIONS ---

export const generateExamPart = async (
  modelName: ModelType,
  plans: TopicPlan[],
  type: QuestionType,
  outputFormat: 'latex' | 'word',
  subject: string
): Promise<string> => {
  if (plans.length === 0) return "";
  
  // Group plans by topic
  const topicsSummary = plans.map(p => `- ${p.count} câu về "${p.topic}" mức độ ${p.level}`).join("\n");
  const totalCount = plans.reduce((sum, p) => sum + p.count, 0);
  
  const template = outputFormat === 'latex' ? EX_TEST_TEMPLATES[type] : WORD_TEMPLATES[type];
  const formatInstructions = outputFormat === 'latex' 
    ? "Tuân thủ nghiêm ngặt định dạng LaTeX gói ex_test. Dùng $...$ cho công thức toán." 
    : "Định dạng văn bản rõ ràng. QUAN TRỌNG: Tất cả công thức toán, biểu thức, biến số PHẢI viết dạng LaTeX và đặt trong cặp dấu $ (ví dụ: $x^2+1=0$). Không dùng Unicode cho toán học.";

  const systemInstruction = `Bạn là chuyên gia ra đề thi môn ${subject}, thành thạo kỹ năng sư phạm.
Nhiệm vụ: Sinh ra CHÍNH XÁC ${totalCount} khối câu hỏi loại ${type} (${outputFormat === 'latex' ? 'LaTeX' : 'Word'}).
${formatInstructions}
Mẫu định dạng:
${template}

Hướng dẫn mức độ:
${DIFFICULTY_GUIDE}

Quy tắc:
1. Luôn có lời giải chi tiết.
2. Tiếng Việt chuẩn mực.
3. Nội dung phong phú, không trùng lặp.`;

  const prompt = `Hãy tạo ${totalCount} câu hỏi ${type} cho môn ${subject} với phân bổ:\n${topicsSummary}`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.6,
      }
    });

    return response.text || "";
  } catch (error) {
    console.error(`Error generating ${type}:`, error);
    return `Lỗi khi tạo phần ${type}. Vui lòng thử lại.`;
  }
};

export const generateFullExam = async (
  model: ModelType,
  plans: TopicPlan[],
  outputFormat: 'latex' | 'word',
  subject: string
): Promise<string> => {
  const mcqPlans = plans.filter(p => p.type === 'MCQ');
  const tfPlans = plans.filter(p => p.type === 'TF');
  const saPlans = plans.filter(p => p.type === 'SA');

  try {
    const [mcqContent, tfContent, saContent] = await Promise.all([
      generateExamPart(model, mcqPlans, 'MCQ', outputFormat, subject),
      generateExamPart(model, tfPlans, 'TF', outputFormat, subject),
      generateExamPart(model, saPlans, 'SA', outputFormat, subject),
    ]);

    const header = outputFormat === 'latex' 
      ? `% ====================================\n% ĐỀ THI 7991 (${subject.toUpperCase()}) - ${new Date().toLocaleDateString()}\n% ====================================\n`
      : `ĐỀ THI 7991 (${subject.toUpperCase()})\nNgày tạo: ${new Date().toLocaleDateString()}\n------------------------------------\n`;

    return `${header}\n\n[PHẦN TRẮC NGHIỆM]\n${mcqContent}\n\n[PHẦN ĐÚNG SAI]\n${tfContent}\n\n[PHẦN TRẢ LỜI NGẮN]\n${saContent}`;
  } catch (error) {
    throw error;
  }
};

// --- AUTO SUGGESTION ---

export const suggestTopicPlan = async (
  grade: string,
  subject: string,
  modelName: ModelType
): Promise<TopicPlan[]> => {
  // Enhanced prompt to be specific about subject content
  const prompt = `Bạn là tổ trưởng chuyên môn môn ${subject} lớp ${grade} theo chương trình GDPT 2018 (Việt Nam).
  Hãy lập một MA TRẬN ĐỀ THI mẫu cấu trúc 7991 (22 câu: 12 Trắc nghiệm, 4 Đúng/Sai, 6 Trả lời ngắn).
  
  YÊU CẦU QUAN TRỌNG VỀ NỘI DUNG:
  1. Các chủ đề (topic) phải là tên BÀI HỌC/CHƯƠNG cụ thể trong sách giáo khoa ${subject} lớp ${grade}.
  2. KHÔNG sử dụng tên chủ đề chung chung (như "Chủ đề 1", "Lý thuyết", "Bài tập").
  3. Nếu là môn TỰ NHIÊN (Lý, Hóa, Sinh), tập trung vào các định luật, hiện tượng, bài toán đặc trưng.
  4. Nếu là môn XÃ HỘI (Sử, Địa, GDCD), tập trung vào các sự kiện, vùng kinh tế, bài học đạo đức cụ thể.
  5. Nếu là môn NGỮ VĂN, tập trung vào tên tác phẩm, giai đoạn văn học, tiếng Việt.

  Ví dụ mong đợi:
  - Vật lí: "Định luật Ohm", "Thấu kính hội tụ", "Điện từ trường"...
  - Địa lí: "Vùng Đông Nam Bộ", "Địa lí dân cư", "Kinh tế biển"...
  - Hóa học: "Kim loại kiềm", "Este - Lipit", "Bảng tuần hoàn"...

  Phân bổ mức độ (NB, TH, VD, VDC) hợp lý để phân loại học sinh.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING, description: "Tên bài học/chủ đề cụ thể" },
              type: { type: Type.STRING, enum: ["MCQ", "TF", "SA"] },
              count: { type: Type.INTEGER },
              level: { type: Type.STRING, enum: ["NB", "TH", "VD", "VDC"] }
            },
            required: ["topic", "type", "count", "level"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");
    
    // Validate output structure just in case
    if (!Array.isArray(data) || data.length === 0) throw new Error("Empty plan");

    return data.map((item: any, index: number) => ({
      ...item,
      id: `${Date.now()}-${index}`
    }));
  } catch (error) {
    console.error("Error auto-suggesting plan:", error);
    
    // Fallback that is aware of the subject name to avoid looking like Math
    const genericTopic = (idx: number) => `Chủ đề ${subject} ${idx}`;
    return [
      { id: '1', topic: genericTopic(1), type: 'MCQ', count: 4, level: 'NB' },
      { id: '2', topic: genericTopic(2), type: 'MCQ', count: 4, level: 'TH' },
      { id: '3', topic: genericTopic(3), type: 'MCQ', count: 4, level: 'NB' },
      { id: '4', topic: genericTopic(4), type: 'TF', count: 2, level: 'TH' },
      { id: '5', topic: genericTopic(5), type: 'TF', count: 2, level: 'VD' },
      { id: '6', topic: genericTopic(6), type: 'SA', count: 3, level: 'VD' },
      { id: '7', topic: genericTopic(7), type: 'SA', count: 3, level: 'VDC' },
    ];
  }
};