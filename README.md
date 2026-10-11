# Projeto OLX Clone

Projeto completo com páginas de anúncio, checkout seguro, geração de Pix em tempo real e painel administrativo dinâmico.

## 🚀 Como Iniciar

Certifique-se de ter o **Node.js (v18+)** instalado no sistema.

No terminal, na pasta do projeto, execute:
```bash
node server.js
```
ou:
```bash
npm start
```

O servidor iniciará na porta `3000` (ou na variável de ambiente `PORT`).

---

## 📌 Rotas Principais

- **Página do Anúncio (Venda):** `http://localhost:3000/` ou `/iphone-17-branco-olx.html`
- **Checkout Seguro:** `http://localhost:3000/checkout`
  - Alternância rápida entre **CPF** e **CNPJ**
  - Formatação e validação de documentos
  - Integração com CEP dos Correios / BrasilAPI via proxy `/api/cep`
- **Pagamento Pix:** `http://localhost:3000/pix`
  - Geração automática com QR Code e código copia e cola
  - Integração direta com a API VulcanoPay
- **Perfil do Vendedor:** `http://localhost:3000/perfil`
- **Painel Administrativo:** `http://localhost:3000/9bkp`
  - Login padrão:
    - **Usuário:** `admin`
    - **Senha:** `123`
  - Permite alterar título, preço, fotos, descrição, avaliações do vendedor e categorias da OLX em tempo real.
  - Pré-visualização instantânea antes de confirmar.
