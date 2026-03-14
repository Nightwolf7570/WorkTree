import type { BackendAnalysis, BackendRecommendation, BackendDocument } from "@/types/analysis";
import { generateId } from "./store";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface CompanyInput {
  name: string;
  website?: string;
  stage?: string;
  employeeCount?: number;
  industry?: string;
  description?: string;
}

interface AnalysisPromptData {
  company: CompanyInput;
  documents: BackendDocument[];
}

async function callOpenAI(messages: { role: string; content: string }[]): Promise<string> {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === "your-openai-api-key-here") {
    throw new Error("OpenAI API key not configured. Add OPENAI_API_KEY to .env.local");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${error.error?.message ?? response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content ?? "";
}

function buildAnalysisPrompt(data: AnalysisPromptData): string {
  const { company, documents } = data;
  
  const docContent = documents
    .map((doc) => `### ${doc.title}\n${doc.content}`)
    .join("\n\n");

  return `You are an expert organizational analyst and hiring strategist. Analyze this company and their documents to provide strategic hiring recommendations.

## Company Information
- Name: ${company.name}
- Industry: ${company.industry ?? "Not specified"}
- Stage: ${company.stage ?? "Not specified"}
- Employee Count: ${company.employeeCount ?? "Not specified"}
- Description: ${company.description ?? "Not provided"}

## Company Documents
${docContent || "No documents provided"}

## Your Task
Analyze this company's current state and provide:
1. Assessment of company stage and maturity
2. Analysis of product, growth, and engineering states
3. Strongest and weakest areas
4. Strategic bottlenecks and execution risks
5. The single most critical hiring need

Respond in this exact JSON format:
{
  "companyStage": "description of company stage (e.g., 'Early Growth', 'Series A', 'Scaling')",
  "productState": "description of product maturity and health",
  "growthState": "description of growth/sales/marketing capabilities",
  "engineeringState": "description of engineering team capabilities",
  "strongestAreas": ["area1", "area2", "area3"],
  "weakestAreas": ["area1", "area2"],
  "strategicBottlenecks": ["bottleneck1", "bottleneck2", "bottleneck3"],
  "executionRisks": ["risk1", "risk2"],
  "topBottleneck": "the single most critical bottleneck",
  "recommendedHiringFocus": "the key area/role to focus hiring on",
  "evidence": [
    {"claim": "claim about the company", "supportingContext": "evidence from documents or company info"}
  ]
}

Be specific and actionable. Base your analysis on the provided information.`;
}

function buildRecommendationPrompt(analysis: BackendAnalysis, companyName: string): string {
  return `Based on this company analysis, recommend the single most important hire.

## Company: ${companyName}

## Analysis Summary
- Stage: ${analysis.companyStage}
- Product State: ${analysis.productState}
- Growth State: ${analysis.growthState}
- Engineering State: ${analysis.engineeringState}
- Top Bottleneck: ${analysis.topBottleneck}
- Recommended Hiring Focus: ${analysis.recommendedHiringFocus}
- Weakest Areas: ${analysis.weakestAreas.join(", ")}
- Strategic Bottlenecks: ${analysis.strategicBottlenecks.join(", ")}

## Your Task
Recommend the single most impactful hire for this company right now.

Respond in this exact JSON format:
{
  "roleToHire": "Specific job title (e.g., 'Senior DevOps Engineer', 'Product Marketing Manager')",
  "summary": "2-3 sentence summary of why this role is critical",
  "whyNow": "Why this hire is urgent at this moment",
  "expectedImpact": ["impact1", "impact2", "impact3"],
  "urgencyScore": 75,
  "confidenceScore": 85,
  "signalsUsed": ["signal1 from analysis", "signal2"],
  "risksIfDelayed": ["risk1 if not hired soon", "risk2"]
}

urgencyScore and confidenceScore should be 0-100.
Be specific about the role and concrete about impacts.`;
}

export async function analyzeCompany(
  companyId: string,
  company: CompanyInput,
  documents: BackendDocument[]
): Promise<BackendAnalysis> {
  const prompt = buildAnalysisPrompt({ company, documents });
  
  const response = await callOpenAI([
    { role: "system", content: "You are an expert organizational analyst. Always respond with valid JSON only, no markdown." },
    { role: "user", content: prompt },
  ]);

  // Parse JSON response
  let parsed: Omit<BackendAnalysis, "id" | "companyId">;
  try {
    // Clean up response - remove markdown code blocks if present
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse OpenAI response:", response);
    throw new Error("Failed to parse analysis response from AI");
  }

  return {
    id: generateId(),
    companyId,
    ...parsed,
  };
}

export async function generateRecommendation(
  companyId: string,
  analysis: BackendAnalysis,
  companyName: string
): Promise<BackendRecommendation> {
  const prompt = buildRecommendationPrompt(analysis, companyName);
  
  const response = await callOpenAI([
    { role: "system", content: "You are an expert hiring strategist. Always respond with valid JSON only, no markdown." },
    { role: "user", content: prompt },
  ]);

  // Parse JSON response
  let parsed: Omit<BackendRecommendation, "id" | "companyId">;
  try {
    const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse OpenAI response:", response);
    throw new Error("Failed to parse recommendation response from AI");
  }

  return {
    id: generateId(),
    companyId,
    ...parsed,
  };
}
