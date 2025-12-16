# 🔥 Churrascomêtro Pro

Calculadora inteligente para planejamento de churrasco. Calcule a quantidade ideal de carnes, bebidas e acompanhamentos para sua festa!

![Churrascomêtro Pro](https://img.shields.io/badge/React-18-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan) ![Vite](https://img.shields.io/badge/Vite-5-purple)

## ✨ Funcionalidades

- 📊 **Cálculo preciso** de carnes por perfil (homens, mulheres, crianças)
- 🍺 **Bebidas personalizadas** - escolha quem bebe cerveja, whisky, vodka ou gin
- 🥖 **Acompanhamentos** configuráveis (pão de alho, farofa, vinagrete...)
- ⏱️ **Fator de duração** - ajusta quantidades baseado nas horas de festa
- 📋 **Lista de compras** pronta para copiar e compartilhar
- 🤖 **Orçamento com IA** - estimativa de preços por região (Google Gemini)
- ⚙️ **Ajustes finos** - personalize as quantidades por pessoa

## 🚀 Deploy Gratuito (Vercel)

### Passo 1: Crie uma conta no Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub

### Passo 2: Suba o código para o GitHub
```bash
# Na pasta do projeto
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/churrasquimetro-pro.git
git push -u origin main
```

### Passo 3: Deploy no Vercel
1. No Vercel, clique em **"Add New Project"**
2. Importe o repositório do GitHub
3. O Vercel detecta automaticamente que é um projeto Vite
4. Configure a variável de ambiente (veja abaixo)
5. Clique em **"Deploy"**

### Passo 4: Configure a API Key do Gemini (Opcional - para orçamento com IA)
1. Obtenha uma API Key gratuita em: [Google AI Studio](https://makersuite.google.com/app/apikey)
2. No Vercel, vá em **Settings > Environment Variables**
3. Adicione:
   - Nome: `GEMINI_API_KEY`
   - Valor: `sua_api_key_aqui`
4. Faça redeploy para aplicar

## 💻 Desenvolvimento Local

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Instalação
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/churrasquimetro-pro.git
cd churrasquimetro-pro

# Instale as dependências
npm install

# (Opcional) Configure a API do Gemini
# Crie um arquivo .env.local na raiz:
# GEMINI_API_KEY=sua_api_key_aqui

# Inicie o servidor de desenvolvimento
npm run dev
```

O app estará disponível em `http://localhost:5173`

### Scripts disponíveis
```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build para produção
npm run preview  # Preview do build
```

## 📁 Estrutura do Projeto

```
churrasquimetro-pro/
├── api/
│   └── budget.js          # API serverless (Vercel Function)
├── public/
│   └── favicon.svg        # Ícone do app
├── src/
│   ├── components/
│   │   └── ChurrascoProV2.jsx  # Componente principal
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css          # Estilos globais + Tailwind
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── vercel.json            # Config do Vercel
```

## 🛠️ Tecnologias

- **React 18** - UI Library
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **Google Gemini** - IA para estimativa de preços
- **Vercel** - Hosting + Serverless Functions

## 🎨 Customização

### Alterar quantidades padrão
Edite `DEFAULT_SETTINGS` em `src/components/ChurrascoProV2.jsx`:

```javascript
const DEFAULT_SETTINGS = {
  meatPerMan: 500,      // gramas de carne por homem
  meatPerWoman: 350,    // gramas de carne por mulher
  meatPerKid: 200,      // gramas de carne por criança
  beerPerPerson: 1500,  // ml de cerveja por pessoa
  // ...
};
```

### Adicionar novos acompanhamentos
Adicione ao array `SIDE_OPTIONS`:

```javascript
{ id: 'arroz', label: 'Arroz', unit: 'kg', ratePerPerson: 0.08 }
```

## 📄 Licença

MIT License - use como quiser!

---

Feito com 🔥 e ❤️ para todos os mestres churrasqueiros do Brasil!

