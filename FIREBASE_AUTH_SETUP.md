# Guia de Autenticação com Firebase

## 1. Configuração Inicial

### ✅ Já feito:
- Firebase SDK instalado
- Variáveis de ambiente configuradas no `.env.local`
- Contexto de autenticação criado
- Componentes de login e registro criados

## 2. Próximos Passos

### 2.1 Configurar Autenticação por Email/Senha
No Firebase Console:
1. Vá em **Authentication** > **Sign-in method**
2. Ative **Email/Password** (você já fez isso ✓)

### 2.2 Configurar Google Sign-In
1. No Firebase Console > **Authentication** > **Sign-in method**
2. Ative **Google** (você já fez isso ✓)
3. Vá em **Project Settings** > **Web API key** e copie sua chave
4. Configure no Google Cloud Console:
   - Vá em [https://console.cloud.google.com](https://console.cloud.google.com)
   - Selecione seu projeto Firebase
   - Em **Credenciais**, crie um **OAuth 2.0 Client ID** (Web application)
   - Adicione autoridades de origem: `http://localhost:5173` (desenvolvimento) e seu domínio de produção
   - Copie o **Client ID**
5. Adicione no `.env.local`:
```env
VITE_GOOGLE_CLIENT_ID=seu_google_client_id_aqui
```

## 3. Integrar no seu Aplicativo

### 3.1 Atualizar `main.tsx`

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from '@/contexts/AuthContext'
import App from './App.tsx'
import './index.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
```

### 3.2 Configurar Rotas (exemplo com React Router)

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
```

## 4. Usar a Autenticação no Código

### 4.1 Usar o Contexto de Autenticação

```typescript
import { useAuthContext } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, login, logout, loading, error } = useAuthContext()

  if (loading) return <div>Carregando...</div>

  return (
    <div>
      {user ? (
        <>
          <p>Bem-vindo, {user.email}</p>
          <button onClick={logout}>Sair</button>
        </>
      ) : (
        <p>Não autenticado</p>
      )}
    </div>
  )
}
```

### 4.2 Acessar o Usuário

```typescript
import { useAuthContext } from '@/contexts/AuthContext'

const { user } = useAuthContext()
console.log(user?.email) // email do usuário
console.log(user?.uid) // ID único do usuário
console.log(user?.photoURL) // foto de perfil (se houver)
```

## 5. Salvar Dados do Usuário no Firestore

Quando um usuário se registra, você pode salvar seus dados:

```typescript
import { useAuthContext } from '@/contexts/AuthContext'
import { db } from '@/lib/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

async function saveUserData(user) {
  try {
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true })
  } catch (error) {
    console.error('Erro ao salvar dados:', error)
  }
}
```

## 6. Erros Comuns

### "Firebase app not initialized"
- Verifique se as variáveis de ambiente estão corretas em `.env.local`
- Reinicie o servidor de desenvolvimento

### "Invalid API key"
- Copie a API Key correta do Firebase Console
- Certifique-se de que a chave está em VITE_FIREBASE_API_KEY

### Google Sign-In não funciona
- Verifique se o Client ID está correto
- Verifique as autoridades de origem no Google Cloud Console
- Limpe o cache do navegador

## 7. Estrutura de Arquivos Criada

```
src/
├── contexts/
│   ├── AuthContext.tsx          # Contexto de autenticação
│   └── InventoryContext.tsx     # (existente)
├── components/auth/
│   ├── LoginForm.tsx            # Formulário de login
│   ├── RegisterForm.tsx         # Formulário de registro
│   ├── GoogleSignInButton.tsx   # Botão de Google Sign-In
│   └── ProtectedRoute.tsx       # Componente para rotas protegidas
├── pages/
│   ├── Login.tsx                # Página de login
│   ├── Register.tsx             # Página de registro
│   └── ...
└── lib/
    └── firebase.ts              # Configuração do Firebase
```

## 8. Testando

1. Acesse `http://localhost:5173/register`
2. Crie uma conta com email/senha ou Google
3. Você deve ser redirecionado para `/dashboard`
4. Tente acessar `/dashboard` em uma aba incógnita sem login - deve redirecionar para `/login`
