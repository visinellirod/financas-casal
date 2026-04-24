# 💚 Finanças do Casal — v2.0

> Sistema de controle financeiro para casais, construído com React 18 + TypeScript + Firebase.

---

## ✨ Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | Resumo geral com gráficos interativos (Recharts) |
| **Entradas** | Controle de receitas e ganhos |
| **Gastos** | Despesas do casal, do Vini e da Bell separadamente |
| **Cartões** | Gestão de cartões de crédito e limites |
| **Parcelas** | Compras parceladas com progresso visual |
| **Dívidas** | Controle de empréstimos com prioridade |
| **Contas Fixas** | Contas mensais recorrentes com marcação de pago |
| **Contas Bancárias** | Saldos de contas corrente, poupança, etc |
| **Metas** | Objetivos financeiros com aportes rápidos |
| **Relatórios** | Análise completa com exportação PDF e Excel |

## 🚀 Tecnologias

- **React 18** + **TypeScript** (strict mode)
- **Vite 5** com code splitting por rota
- **Firebase 10** (Auth + Firestore em tempo real)
- **TailwindCSS 3** — tema escuro customizado
- **Recharts** — gráficos responsivos
- **jsPDF + jspdf-autotable** — exportação PDF
- **xlsx** — exportação Excel
- **lucide-react** — ícones
- **react-router-dom v6** — navegação SPA
- **date-fns** — manipulação de datas

---

## 📦 Instalação local

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/financas-casal.git
cd financas-casal

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com as credenciais do seu projeto Firebase

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173) no navegador.

---

## 🔥 Configuração do Firebase

### 1. Crie um projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **Adicionar projeto**
3. Dê um nome (ex: `financas-casal`) e confirme

### 2. Ative Authentication

1. No menu lateral, clique em **Authentication** → **Começar**
2. Na aba **Sign-in method**, ative **E-mail/senha**
3. Crie um usuário em **Users** → **Adicionar usuário**

### 3. Ative Firestore

1. No menu lateral, clique em **Firestore Database** → **Criar banco de dados**
2. Escolha o modo **produção** (as regras estão em `firestore.rules`)
3. Selecione uma região próxima (ex: `southamerica-east1`)

### 4. Obtenha as credenciais

1. Clique em **Configurações do projeto** (ícone de engrenagem)
2. Em **Seus aplicativos**, clique em **Web** (`</>`)
3. Registre o app e copie o objeto `firebaseConfig`
4. Cole os valores no arquivo `.env`

### 5. Publique as regras de segurança

```bash
# Instale o Firebase CLI (se ainda não tiver)
npm install -g firebase-tools

# Login e inicialização
firebase login
firebase init firestore

# Publique as regras
firebase deploy --only firestore:rules
```

---

## 🌐 Deploy no GitHub Pages

### Configuração automática via GitHub Actions

1. Faça fork / push do projeto para seu GitHub
2. Vá em **Settings → Secrets and variables → Actions**
3. Adicione os seguintes secrets:

| Secret | Valor |
|--------|-------|
| `VITE_FIREBASE_API_KEY` | Sua API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `seu-projeto.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `seu-projeto` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `seu-projeto.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID numérico |
| `VITE_FIREBASE_APP_ID` | App ID completo |

4. Vá em **Settings → Pages**
5. Em **Source**, selecione **GitHub Actions**
6. Faça um push para a branch `main` — o deploy acontece automaticamente!

### Deploy manual

```bash
npm run build
# O conteúdo de /dist está pronto para servir como site estático
```

---

## 📁 Estrutura do projeto

```
src/
├── components/
│   ├── layout/
│   │   └── Layout.tsx          # Sidebar + drawer mobile
│   └── ui/
│       └── index.tsx           # Modal, StatCard, Input, etc
├── contexts/
│   ├── AuthContext.tsx         # Autenticação Firebase
│   ├── FinanceContext.tsx      # Estado global financeiro
│   └── ToastContext.tsx        # Notificações
├── firebase/
│   ├── config.ts               # Inicialização Firebase
│   └── firestore.ts            # Helpers CRUD
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Entradas.tsx
│   ├── Gastos.tsx
│   ├── GastosIndividuais.tsx
│   ├── CartaoCredito.tsx
│   ├── Parcelas.tsx
│   ├── Dividas.tsx
│   ├── ContasFixas.tsx
│   ├── ContasBancarias.tsx
│   ├── Metas.tsx
│   └── Relatorios.tsx
├── types/
│   └── index.ts                # Interfaces TypeScript
└── utils/
    ├── constants.ts
    ├── format.ts
    └── validators.ts
```

---

## 📝 Scripts disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build local
npm run type-check   # Verificação TypeScript sem emitir arquivos
npm run lint         # ESLint
```

---

## 🔐 Segurança

- Cada usuário acessa **apenas seus próprios dados** (Firestore Rules)
- Autenticação obrigatória em todas as rotas
- Variáveis de ambiente separadas por `.env`
- Tokens gerenciados pelo Firebase Auth SDK

---

## 💡 Melhorias na v2.0

- ✅ Migração completa para TypeScript strict
- ✅ Code splitting por rota (lazy loading)
- ✅ Context API otimizada com `useMemo` / `useCallback`
- ✅ Sistema de toast notifications
- ✅ Skeleton loaders
- ✅ Confirmação antes de deletar
- ✅ Formulários com validação em tempo real
- ✅ Aportes rápidos em metas
- ✅ Progresso visual em parcelas e dívidas
- ✅ Toggle "paga/pendente" nas contas fixas
- ✅ Exportação PDF e Excel em Relatórios
- ✅ CI/CD automático via GitHub Actions

---

Feito com 💚 por Vini & Bell
