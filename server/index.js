import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client/build")));

const SYSTEM_OWN = `Ты — эксперт по геомаркетингу и продвижению на Яндекс Картах.
При анализе карточки оцени каждый пункт: ✅ (хорошо) / ⚠️ (частично) / ❌ (плохо):
1. БАЗОВОЕ ЗАПОЛНЕНИЕ: название, категория, адрес, часы, телефон, сайт
2. КОНТЕНТ: описание, фото, услуги с ценами, истории, события
3. РЕПУТАЦИЯ: рейтинг, количество отзывов, ответы на отзывы
4. РЕКЛАМА: платное продвижение, Яндекс Бизнес, метки
5. РЕКОМЕНДАЦИИ: топ-5 действий прямо сейчас
Отвечай на русском. Используй эмодзи и заголовки (##).`;

const SYSTEM_COMPETITOR = `Ты — эксперт по геомаркетингу. Анализируй конкурентов на Яндекс Картах.
Для каждого: рейтинг, отзывы, контент, реклама, сильные и слабые стороны.
Затем: общие паттерны топа, незакрытые потребности, топ-5 идей для обгона.
Отвечай на русском. Используй эмодзи и заголовки (##).`;

app.post("/api/analyze", async (req, res) => {
  const { mode, input, extraInfo } = req.body;
  if (!input?.trim()) return res.status(400).json({ error: "Введите данные" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "API ключ не настроен" });

  const userMessage = mode === "own"
    ? `Проанализируй карточку:\n${input}${extraInfo ? `\nДоп. инфо:\n${extraInfo}` : ""}`
    : `Проанализируй конкурентов:\n${input}${extraInfo ? `\nНиша:\n${extraInfo}` : ""}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 2000,
        messages: [
          { role: "system", content: mode === "own" ? SYSTEM_OWN : SYSTEM_COMPETITOR },
          { role: "user", content: userMessage }
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message });
    const text = data.choices[0].message.content;
    res.json({ result: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
