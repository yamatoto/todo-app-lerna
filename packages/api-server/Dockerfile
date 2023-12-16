# ベースイメージを指定
FROM node:18

# アプリケーションのワーキングディレクトリを設定
WORKDIR /usr/src/app

# アプリケーションの依存関係をインストール
COPY package*.json ./
RUN npm install

# アプリケーションのソースをコピー
COPY . .

# TypeScriptプロジェクトの場合、ビルドを実行
RUN npm run build

# アプリケーションがリッスンするポートを指定
EXPOSE 3001

# アプリケーションを起動
CMD ["node", "dist/server.js"]
