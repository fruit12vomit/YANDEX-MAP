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

const SYSTEM_OWN = "Ty ekspert po geomarketingu na Yandex Kartah. Oceni kartochku po punktam: BAZOVOE ZAPOLNENIE, KONTENT, REPUTACIYA, REKLAMA, REKOMENDACII. Ispolzuy emoji i ##. Otvechay na russkom yazyke.";

const SYSTEM_COMPETITOR = "Ty ekspert po geomarketingu. Analiziruy konkurentov na Yandex Kartah. Day top-5 idey dlya obgona. Ispolzuy emoji i ##. Otvechay na russkom yazyke.";

app.post("/api/analyze", async (req, res) => {
  const { mode, input, extraInfo } = req.body;
  if (!input?.trim()) return res.status(400).json({ error: "Vvedite dannye" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "API klyuch ne nastroyen" });

  const userMessage = mode === "own"
    ? "Proanaliziruy kartochku:\n" + input + (extraInfo ? "\nDop. info:\n" + extraInfo : "")
    : "Proanaliziruy konkurentov:\n" + input + (extraInfo ? "\nNisha:\n" + extraInfo : "");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
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

app.listen(PORT, () => console.log("Server running on port " + PORT));
