# Image officielle Node
FROM node:20

# Dossier de travail
WORKDIR /app

# Copier tout le projet
COPY . .

# Installer les dépendances backend
RUN cd backend && npm install

# Exposer le port utilisé par ton serveur
EXPOSE 3000

# Lancer le serveur
CMD ["sh", "-c", "cd backend && npm start"]
