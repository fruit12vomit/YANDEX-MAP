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

app.post("/api/analyze", async (req, res) => {
  const { mode, input, extraInfo } = req.body;
  if (!input?.trim()) return res.status(400).json({ error: "Vvedite dannye" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "API klyuch ne nastroyen" });

  const prompt = mode === "own"
    ? "Najdi aktualnyye dannye ob etoy kompanii na Yandex Kartah i v internete: " + input + ". Proanaliziruy kartochku na Yandex Kartah: 1.BAZOVOE ZAPOLNENIE (nazvanie, adres, chasy, telefon, sayt) - est ili net 2.KONTENT (foto, opisanie, uslugi s tsenami) 3.REPUTATSIYA (reyting, kolichestvo otzyvov, otvety na otzyvy) 4.REKLAMA (est li platnoe prodvizhenie) 5.TOP-5 REKOMENDATSIY chto uluchshit. Otvechay na russkom s emoji i ##."
    : "Najdi dannye ob etikh kompaniyakh na Yandex Kartah: " + input + ". Sravni ikh: reyting, otzyvy, foto, opisanie, reklama. Day TOP-5 idey kak obognat konkurentov. Otvechay na russkom s emoji i ##.";

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        tools: [{ type: "web_search_preview" }],
        input: prompt,
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message });
    const text = data.output
      .filter(b => b.type === "message")
      .flatMap(b => b.content)
      .filter(c => c.type === "output_text")
      .map(c => c.text)
      .join("\n");
    res.json({ result: text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

app.listen(PORT, () => console.log("Server running on port " + PORT));
