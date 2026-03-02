import streamlit as st
import requests
import os
import base64
from PIL import Image
import io

HF_TOKEN = os.environ.get("HF_TOKEN", "")

LLAMA_URL = "https://router.huggingface.co/v1/chat/completions"
SDXL_URL = "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0"

st.set_page_config(page_title="Nano Banana AI", page_icon="🍌", layout="centered")

st.title("🔥 Nano Banana AI")
st.markdown("Génère des images épiques avec l'IA — optimise ton prompt avec LLaMA, puis génère avec Stable Diffusion.")

if not HF_TOKEN:
    st.error("❌ Le secret HF_TOKEN n'est pas configuré. Ajoute-le dans les secrets Replit.")
    st.stop()

prompt = st.text_area("Décris ton image...", height=120, placeholder="Ex: a dragon flying over a neon city at night")

col1, col2 = st.columns(2)

def optimize_prompt(prompt_text):
    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "meta-llama/Meta-Llama-3-8B-Instruct",
        "messages": [
            {
                "role": "user",
                "content": (
                    "You are an expert at writing prompts for image generation. "
                    "Rewrite the following description into a detailed, cinematic image generation prompt. "
                    "Return ONLY the improved prompt, nothing else.\n\n"
                    f"{prompt_text}"
                )
            }
        ],
        "max_tokens": 300
    }
    response = requests.post(LLAMA_URL, headers=headers, json=payload, timeout=60)
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"].strip()

def generate_image(prompt_text):
    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json"
    }
    payload = {"inputs": prompt_text}
    response = requests.post(SDXL_URL, headers=headers, json=payload, timeout=120)
    if response.status_code == 503:
        raise RuntimeError("Le modèle est en train de charger, réessaie dans quelques secondes.")
    response.raise_for_status()
    return response.content

with col1:
    if st.button("🦙 Optimiser le prompt", use_container_width=True):
        if not prompt.strip():
            st.warning("Entre d'abord une description.")
        else:
            with st.spinner("Optimisation en cours..."):
                try:
                    optimized = optimize_prompt(prompt)
                    st.session_state["optimized_prompt"] = optimized
                    st.success("Prompt optimisé !")
                except requests.exceptions.HTTPError as e:
                    st.error(f"Erreur LLaMA : {e.response.status_code} — {e.response.text[:200]}")
                except Exception as e:
                    st.error(f"Erreur : {e}")

with col2:
    if st.button("🍌 Générer l'image", use_container_width=True):
        final_prompt = st.session_state.get("optimized_prompt", prompt)
        if not final_prompt.strip():
            st.warning("Entre d'abord une description.")
        else:
            with st.spinner("Génération de l'image... (peut prendre 30-60 secondes)"):
                try:
                    image_bytes = generate_image(final_prompt)
                    image = Image.open(io.BytesIO(image_bytes))
                    st.session_state["generated_image"] = image_bytes
                    st.session_state["used_prompt"] = final_prompt
                    st.success("Image générée !")
                except RuntimeError as e:
                    st.warning(str(e))
                except requests.exceptions.HTTPError as e:
                    st.error(f"Erreur génération : {e.response.status_code} — {e.response.text[:200]}")
                except Exception as e:
                    st.error(f"Erreur : {e}")

if "optimized_prompt" in st.session_state:
    st.markdown("### ✨ Prompt optimisé")
    edited = st.text_area("Tu peux modifier avant de générer :", value=st.session_state["optimized_prompt"], height=100, key="edit_optimized")
    if edited != st.session_state["optimized_prompt"]:
        st.session_state["optimized_prompt"] = edited

if "generated_image" in st.session_state:
    st.markdown("### 🖼️ Image générée")
    st.image(st.session_state["generated_image"], use_container_width=True)
    st.download_button(
        label="⬇️ Télécharger l'image",
        data=st.session_state["generated_image"],
        file_name="nano_banana_ai.png",
        mime="image/png"
    )
    with st.expander("Prompt utilisé"):
        st.write(st.session_state.get("used_prompt", ""))
