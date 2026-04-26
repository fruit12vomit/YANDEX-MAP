import { useState } from "react";

function formatResult(text) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ") || line.startsWith("# ")) {
      return <h3 key={i} style={{ color: "#FF4D2E", marginTop: 20, marginBottom: 6, fontSize: 15, fontFamily: "'Unbounded', sans-serif", fontWeight: 700 }}>{line.replace(/^#+\s/, "")}</h3>;
    }
    if (line.startsWith("- ") || line.startsWith("• ")) {
      return <div key={i} style={{ paddingLeft: 16, margin: "2px 0", color: "#333", lineHeight: 1.6, display: "flex", gap: 8 }}><span style={{ color: "#FF4D2E", flexShrink: 0 }}>›</span><span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} /></div>;
    }
    if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
    return <p key={i} style={{ margin: "3px 0", color: "#333", lineHeight: 1.65, fontSize: 14 }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
  });
}

export default function App() {
  const [mode, setMode] = useState("own");
  const [input, setInput] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!input.trim()) { setError("Введите данные"); return; }
    setError(""); setResult(""); setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, input, extraInfo }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Ошибка сервера");
      setResult(data.result);
    } catch (e) {
      setError("Ошибка: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => { setMode(m); setResult(""); setInput(""); setExtraInfo(""); setError(""); };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F3EE", padding: "24px 16px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, background: "#FF4D2E", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🗺️</div>
            <h1 style={{ margin: 0, fontFamily: "'Unbounded', sans-serif", fontSize: 20, fontWeight: 900, color: "#1a1a1a", letterSpacing: -0.5 }}>ГЕО АНАЛИТИК</h1>
          </div>
          <p style={{ margin: 0, color: "#888", fontSize: 13, paddingLeft: 46 }}>Анализ карточек Яндекс Карт с помощью ИИ</p>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button className={`tab ${mode === "own" ? "active" : "inactive"}`} onClick={() => switchMode("own")}>📍 Моя карточка</button>
          <button className={`tab ${mode === "competitor" ? "active" : "inactive"}`} onClick={() => switchMode("competitor")}>🔍 Конкуренты</button>
        </div>
        <div style={{ background: "white", borderRadius: 16, padding: 20, marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8 }}>
            {mode === "own" ? "Ссылка или название компании" : "Ссылки конкурентов (каждый с новой строки)"}
          </label>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            placeholder={mode === "own" ? "https://yandex.ru/maps/org/... или название и город" : "Конкурент 1: название\nКонкурент 2: ..."}
            style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 10, padding: 12, fontSize: 14, minHeight: 90, color: "#1a1a1a", background: "#fafafa" }} />
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#888", margin: "14px 0 8px", textTransform: "uppercase", letterSpacing: 0.8 }}>Дополнительно (необязательно)</label>
          <textarea value={extraInfo} onChange={e => setExtraInfo(e.target.value)}
            placeholder={mode === "own" ? "Рейтинг: 4.2 / Отзывов: 47 / Фото: 12..." : "Ниша и город: салон красоты, Москва..."}
            style={{ width: "100%", border: "1.5px solid #eee", borderRadius: 10, padding: 12, fontSize: 13, minHeight: 60, color: "#555", background: "#fafafa" }} />
        </div>
        {error && <div style={{ background: "#fff0ee", border: "1px solid #ffccc7", borderRadius: 10, padding: "10px 14px", marginBottom: 14, color: "#c0392b", fontSize: 13 }}>{error}</div>}
        <button className="btn-analyze" onClick={analyze} disabled={loading}>
          {loading ? "⏳ Анализирую..." : mode === "own" ? "🔍 Анализировать карточку" : "📊 Анализировать конкурентов"}
        </button>
        {result && (
          <div style={{ background: "white", borderRadius: 16, padding: 22, marginTop: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 14, borderBottom: "2px solid #F5F3EE" }}>
              <span style={{ fontSize: 18 }}>{mode === "own" ? "📋" : "📊"}</span>
              <span style={{ fontFamily: "'Unbounded', sans-serif", fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{mode === "own" ? "РЕЗУЛЬТАТ АНАЛИЗА" : "АНАЛИЗ КОНКУРЕНТОВ"}</span>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7 }}>{formatResult(result)}</div>
          </div>
        )}
        {!result && !loading && (
          <div style={{ marginTop: 20, padding: 16, background: "white", borderRadius: 14, border: "1.5px dashed #e0ddd6" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#999", lineHeight: 1.7 }}>💡 <strong style={{ color: "#666" }}>Совет:</strong> Чем больше данных укажете вручную, тем точнее анализ.</p>
          </div>
        )}
      </div>
    </div>
  );
}
