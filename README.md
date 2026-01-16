# Align CRM - Frontend

## Descrição
Frontend do CRM corporativo Align, construído com Next.js 14, TypeScript e Tailwind CSS.
Design premium inspirado no Linear.

## Tecnologias
- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Estado Global:** Zustand
- **Formulários:** React Hook Form + Zod
- **Ícones:** Lucide React
- **Animações:** Framer Motion
- **HTTP Client:** Axios
- **Drag & Drop:** @hello-pangea/dnd
- **Fluxogramas:** Excalidraw

## Instalação

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.local.example .env.local

# Iniciar servidor de desenvolvimento
npm run dev
```

## Estrutura do Projeto

```
src/
├── app/           # App Router (páginas e layouts)
├── components/    # Componentes reutilizáveis
│   ├── ui/        # Componentes base (Button, Input, Modal...)
│   └── navegacao/ # Sidebar, Header
├── contextos/     # Context API e stores Zustand
├── hooks/         # Custom hooks
├── layouts/       # Layouts de página
├── servicos/      # Serviços de API
├── tipos/         # Tipos TypeScript
├── utils/         # Funções utilitárias
└── estilos/       # Estilos globais
```

## Scripts Disponíveis

```bash
npm run dev       # Servidor de desenvolvimento
npm run build     # Build de produção
npm run start     # Iniciar produção
npm run lint      # Linting
npm run type-check # Verificação de tipos
```

## Variáveis de Ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Align
NEXT_PUBLIC_ENV=development
```

## Características

### 🎨 Design Premium
- Visual inspirado no Linear
- Tema claro/escuro
- Sidebar com efeito glassmorphism
- Animações suaves

### 🔐 Autenticação
- Login/Registro premium
- JWT armazenado com segurança
- Proteção de rotas

### 📊 Dashboard
- Estatísticas em tempo real
- Projetos recentes
- Tarefas prioritárias
- Atividade recente

### 📁 Projetos
- CRUD completo
- Membros e colaboradores
- Progresso visual

### ✅ Tarefas
- Kanban com drag & drop
- Prioridades e status
- Atribuição de responsáveis

## Licença
Proprietário - Align CRM
