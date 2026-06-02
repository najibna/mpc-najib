# 🧾 Intact Receipt Manager

**MPC Hacks × Intact Insurance** 🏢

Upload Excel card charges → get a live dashboard 📊  
Ask AI questions 💬 · catch broken rules ⚠️ · review spend ✅ · export reports 📤  

Demo data loads when you open the app — no setup needed 🚀

> **Rules find problems. AI explains them. You decide.** 🎯  
> Math = Java ☕️ · Answers = Gemini ✨ · No fake numbers ❌

---

## 🌐 Try it now

- **App:** https://mpc-najib.onrender.com  
- **Code:** https://github.com/najibna/mpc-najib  

**Ask AI examples:**  
💳 *Who spent the most?* · 🧾 *Which charges have no receipt?* · 🏪 *Which stores cost the most?*

---

## ✅ 4 main features

| # | What | How it works |
| --- | --- | --- |
| 1️⃣ | **Ask AI** 🗣️ | Type a question → get a chart + plain answer |
| 2️⃣ | **Rule checks** 📋 | Flags bad charges (no receipt, over $50, splits, etc.) |
| 3️⃣ | **Spend review** 👀 | Approve or deny flagged charges + AI tip |
| 4️⃣ | **Reports** 📊 | Auto groups trips · export CSV/JSON |

---

## 🎁 Extra goodies

- 🔍 Fraud & risk scores  
- 📈 Monthly spend forecast  
- 🏪 Top stores & duplicate charges  
- 💳 Spend by card  
- 🎨 Intact-style UI (cream + red)

---

## 🛠️ Tech

React ⚛️ · Java Spring Boot ☕️ · Apache POI 📁 · Gemini AI ✨

---

## 💻 Run on your laptop

**API (Java only — Spring Boot)** ☕️
```bash
cd backend
mvn spring-boot:run
```

**Website**
```bash
cd frontend && npm install && npm run dev
```

Open **http://localhost:5180** 🌐

Set `frontend/.env`:
```bash
VITE_API_BASE_URL=http://127.0.0.1:8010
```

Optional: copy `backend/.env.example` to `backend/.env` and set `OPENROUTER_API_KEY` for Ask AI.

---

## ☁️ Hosted on Render

Frontend + API in `render.yaml` · add `OPENROUTER_API_KEY` for Ask AI 🔑

---

Built for **MPC Hacks** 💪 · **Intact** look & feel ❤️ · ~4,180 sample charges in the demo 📦
