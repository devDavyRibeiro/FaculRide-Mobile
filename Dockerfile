# Escolhemos uma versão estável do Node (compatível com a sua v24)
FROM node:24.14.0-alpine

# Define a pasta de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências e o CLI do Expo globalmente
RUN npm install
RUN npm install -g expo-cli
RUN npm install -g @expo/ngrok --silent

# Copia o restante dos arquivos do projeto
COPY . .

# Porta padrão do Expo
EXPOSE 8081

# Comando para iniciar o servidor
CMD ["npx", "expo", "start", "--dev-client", "--host", "lan"]