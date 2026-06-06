import { GoogleGenAI, Type } from "@google/genai";
import type { Request, Response } from "express";

// Lazy-initialized Gemini client helper to avoid crashing if API key is missing at startup
let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please set it in Settings > Secrets or Vercel Environment Variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

export default async function handler(req: Request, res: Response) {
  // Handle CORS and preflight
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed. Use POST instead." });
  }

  try {
    const { achievementStandard, subject, grade } = req.body;

    if (!achievementStandard || !achievementStandard.trim()) {
      return res.status(400).json({ error: "성취기준 내용을 입력해주세요." });
    }

    const ai = getAIClient();

    const systemInstruction = `
교사는 2022 개정 교육과정의 '깊이 있는 학습(Deep Learning)'과 역량 중심 교육을 설계하기 위해 성취기준을 분석하고 재구성합니다.
당신은 대한민국 교육과정(특히 2022 개정 교육과정) 분석 및 백워드 설계(Backward Design)의 권위자인 수석교사/교육과정 컨설턴트입니다.

입력된 성취기준(및 교과, 학년군 정보)을 바탕으로 성취기준을 '지식·이해', '과정·기능', '가치·태도'라는 세 가지 차원으로 분해하고, 이를 유기적으로 관통하는 '핵심 아이디어(Big Idea/영속적 이해)'를 도출해야 합니다.

반드시 다음의 엄격한 가이드라인을 따르세요:

1. 세 가지 차원 분해:
   - 지식·이해: 학생들이 이해해야 할 핵심 개념, 정보, 사실, 지식 (주로 성취기준의 명사형 내용 요소). 단답형이 아닌 명확하고 깊이 있는 개념 문구로 여러 개(2~4개) 추출하십시오.
   - 과정·기능: 지식을 탐구하고 다루며 역량을 발휘하기 위한 학생들의 주체적인 행동, 탐구 기능 (주로 성취기준의 서술어/동사구 부분). (~하기, ~탐구하기, ~분석하기 등의 형태로 2~4개 추출).
   - 가치·태도: 배움을 통해 함양해야 할 태도, 사회적 가치, 지향성, 자긍심 (~하는 태도, ~를 소중히 여기는 마음, ~에 참여하려는 의지 등으로 2~3개 추출). 성취기준 문장에 생략되어 있거나 명시되어 있지 않더라도, 해당 탐구 활동과 이념을 통해 자연스럽게 심어져야 할 태도를 교사 입장에서 역량 기반으로 명확하게 도출해 주십시오.

2. 핵심 아이디어(Big Idea) 도출 공식:
   반드시 다음 수식을 100% 충족하는 하나의 완벽하고 매끄러운 한국어 연결 문장으로 도출하십시오:
   "[지식·이해 개념]은 [과정·기능 행동]을 통해 이해될 수 있으며, 이는 우리 삶에 [가치·태도] 측면에서 중요한 의미를 지닌다."
   
   - 예시 (사회과 지역 유산): "우리 지역의 문화유산에 담긴 조상들의 지혜와 삶의 모습(지식)은 인터넷 검색 및 현장 답사 등의 다양한 탐구 활동(과정)을 통해 이해될 수 있으며, 이는 우리 삶에 지역 공동체에 대한 정체성과 자긍심을 함양하고 소중히 여기는 태도를 지니는(태도) 측면에서 중요한 의미를 지닌다."
   - 생성하는 문장이 한국어 문법에 맞아 매끄럽고, 깊이를 담은 문장이어야 합니다. 성취기준의 맥락과 용어를 그대로 살려 주십시오.

3. 수행평가 연계 제안(evaluation_plans):
   분석된 과정·기능을 바탕으로 실제 교실에서 쓸 수 있는 수업 연계 수행평가 방안 또는 과제를 2~3개 제안해 주십시오 (수행 과제명, 평가 방법 포함).
`;

    const prompt = `
[분석 대상 성취기준]
- 교과: ${subject || "미지정"}
- 학년군/학교체제: ${grade || "미지정"}
- 성취기준 내용: "${achievementStandard}"

위 성취기준을 완전히 해체하여 교사용 3대 영역 분석 데이터 및 핵심 아이디어(Big Idea)를 격조 높고 전문적인 교육학 용어를 활용해 도출해 주세요.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            knowledge: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "추출된 '지식·이해' 요소 리스트 (주로 명사형 개념/사실/원리)",
            },
            process: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "추출된 '과정·기능' 요소 리스트 (~하기 형태)",
            },
            attitude: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "추출된 '가치·태도' 요소 리스트 (~하는 태도/의지 등)",
            },
            core_idea: {
              type: Type.STRING,
              description: "공식에 의거해 작성된 단 한 문장의 핵심 아이디어(Big Idea)",
            },
            evaluation_plans: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "과정·기능 및 성취기준 기반의 실제 교실 수행평가 연계형 과제 아이디어 (2-3개)",
            },
            rationale: {
              type: Type.STRING,
              description: "이 성취기준 분석 및 핵심 아이디어 도출에 대한 교육과정 해석/설명 (1-2문장)",
            }
          },
          required: ["knowledge", "process", "attitude", "core_idea", "evaluation_plans", "rationale"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("AI 응답을 생성하지 못했습니다.");
    }

    const data = JSON.parse(resultText);
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("API Error in Serverless Function:", error);
    return res.status(500).json({ error: error.message || "서버 통신 중 오류가 발생했습니다." });
  }
}
