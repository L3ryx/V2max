import express from "express";
import axios from "axios";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 10000;
const HF_TOKEN = process.env.HF_TOKEN;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/optimize", async (req, res) => {
  try {
    const response = await axios.post(
      "https://router.huggingface.co/v1/chat/completions",
      {
        model: "meta-llama/Meta-Llama-3-8B-Instruct",
        messages: [
          {
            role: "user",
            content: `You are an expert at writing prompts for image generation. Rewrite the following description into a detailed, cinematic image generation prompt. Return ONLY the improved prompt, nothing else.\n\n${req.body.prompt}`
          }
        ],
        max_tokens: 300
      },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`
        }
      }
    );

    res.json({
      optimized: response.data.choices[0].message.content
    });
  } catch (error) {
    console.error("LLAMA error:", error.response?.data || error.message);
    res.status(500).json({ error: "Erreur LLaMA" });
  }
});

app.post("/generate-image", async (req, res) => {
  try {
    const response = await axios.post(
      "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
      { inputs: req.body.prompt },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`
        },
        responseType: "arraybuffer",
        timeout: 120000
      }
    );

    const base64 = Buffer.from(response.data).toString("base64");
    res.json({ image: base64 });
  } catch (error) {
    console.error("Image error:", error.response?.data || error.message);
    res.status(500).json({ error: "Erreur génération image" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
