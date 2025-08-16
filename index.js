const express = require("express");
const multer = require("multer");
const fs = require("fs");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(express.static("public"));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.post("/chat", upload.array("files"), async (req, res) => {
  try {
    const { message } = req.body;
    const parts = [];

    if (message) parts.push(message);

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const buffer = fs.readFileSync(file.path);
        parts.push({
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: file.mimetype,
          },
        });
        fs.unlinkSync(file.path); // hapus file temp
      }
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("✅ Server jalan di http://localhost:3000");
});
