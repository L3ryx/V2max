# Nano Banana AI

Generateur d'images IA avec optimisation de prompt.

- Optimisation de prompt avec LLaMA 3 8B
- Generation d'image avec Stable Diffusion XL

## Deploiement sur Render

1. Creer un repo GitHub et pousser ces fichiers
2. Sur render.com : New > Web Service > connecter le repo
3. Render detecte automatiquement la config via render.yaml
4. Ajouter la variable d'environnement HF_TOKEN dans Environment avec ton token Hugging Face (https://huggingface.co/settings/tokens)

## Lancer en local

```bash
npm install
HF_TOKEN=ton_token node server.js
```

Le serveur demarre sur http://localhost:10000
