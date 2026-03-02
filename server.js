import express from "express";
import axios from "axios";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json({ limit: "20mb" }));
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
            content: "You are an expert at writing prompts for image generation. Rewrite the following description into a detailed, cinematic image generation prompt. Return ONLY the improved prompt, nothing else.\n\n" + req.body.prompt
          }
        ],
        max_tokens: 300
      },
      {
        headers: {
          Authorization: "Bearer " + HF_TOKEN
        }
      }
    );

    res.json({
      optimized: response.data.choices[0].message.content
    });
  } catch (error) {
    const detail = error.response?.data?.error || error.response?.data || error.message;
    console.error("LLAMA error:", detail);
    res.status(500).json({ error: "Erreur LLaMA : " + (typeof detail === "string" ? detail : JSON.stringify(detail)) });
  }
});

app.post("/generate-image", async (req, res) => {
  try {
    const { prompt, image, integrate } = req.body;

    let response;

    if (image && integrate) {
      const imageBuffer = Buffer.from(image, "base64");

      response = await axios.post(
        "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-refiner-1.0",
        imageBuffer,
        {
          headers: {
            Authorization: "Bearer " + HF_TOKEN,
            Accept: "image/png",
            "Content-Type": "application/octet-stream",
            "x-use-cache": "false"
          },
          params: {
            prompt: prompt
          },
          responseType: "arraybuffer",
          timeout: 120000
        }
      );
    } else {
      response = await axios.post(
        "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
        { inputs: prompt },
        {
          headers: {
            Authorization: "Bearer " + HF_TOKEN,
            Accept: "image/png"
          },
          responseType: "arraybuffer",
          timeout: 120000
        }
      );
    }

    const base64 = Buffer.from(response.data).toString("base64");
    res.json({ image: base64 });
  } catch (error) {
    let detail = error.message;
    if (error.response?.data) {
      try {
        const text = Buffer.from(error.response.data).toString("utf-8");
        detail = text;
      } catch (e) {
        detail = error.response?.data?.error || error.message;
      }
    }
    console.error("Image error:", detail);
    res.status(500).json({ error: "Erreur image : " + detail });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
