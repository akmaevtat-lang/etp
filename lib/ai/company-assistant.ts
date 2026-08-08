import { db } from "@/lib/db";
import { getAnthropicClient } from "@/lib/ai/client";

const MODEL = "claude-sonnet-5";

const TYPE_LABELS: Record<string, string> = { PURCHASE: "закупка", SALE: "продажа" };

const SYSTEM_PROMPT = `Ты — ИИ-помощник компании на электронной торговой площадке (ЭТП).
Помогаешь с черновиками ТЗ и спецификаций, подсказками по процедурам закупок и продаж
компании, разбором заявок. Ниже дан контекст компании: её текущие процедуры и спецификации.

Важное ограничение (осознанное, не баг): ты только предлагаешь текст в ответе чата.
Ты не можешь создавать, редактировать или удалять что-либо в системе — ни процедуры,
ни спецификации, ни заявки. Если пользователь просит "создай процедуру" или любое другое
действие в самой системе — объясни, что пока умеешь только предлагать текст (например,
черновик ТЗ или спецификации), а применить его пользователь должен сам через интерфейс.`;

async function buildCompanyContext(companyId: string): Promise<string> {
  const procedures = await db.procedure.findMany({
    where: { organizerId: companyId },
    include: { specifications: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  if (procedures.length === 0) return "У компании пока нет ни одной процедуры.";

  return procedures
    .map((p) => {
      const items = p.specifications
        .map((s) => `  - ${s.name || "(без названия)"}: ${s.qty} ${s.unit}, цена без НДС ${s.priceNoVat}`)
        .join("\n");
      const description = p.description ? `\n  Описание: ${p.description}` : "";
      const spec = items ? `\n  Спецификация:\n${items}` : "\n  Спецификация пока пустая.";
      return `Процедура «${p.title}» (${TYPE_LABELS[p.type]}, статус: ${p.status})${description}${spec}`;
    })
    .join("\n\n");
}

export async function generateCompanyAssistantReply(
  companyId: string,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  const client = getAnthropicClient();
  if (!client) {
    return "ИИ-помощник ещё не подключён: не задан ANTHROPIC_API_KEY в настройках проекта. Как только ключ появится, я смогу отвечать по-настоящему.";
  }

  try {
    const context = await buildCompanyContext(companyId);
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: `${SYSTEM_PROMPT}\n\nКонтекст компании:\n${context}`,
      messages: history,
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return text || "Не удалось сформировать ответ.";
  } catch (error) {
    console.error("Anthropic API error:", error);
    return "Не получилось получить ответ от ИИ-помощника — попробуйте ещё раз чуть позже.";
  }
}
