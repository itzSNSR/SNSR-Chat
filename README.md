# SNSR AI Chat

A modern AI-powered chat application with real-time conversations, user authentication, and email verification.

![SNSR AI](public/logo.svg)

## ✨ Features

- 🤖 **AI Chat** - Powered by snsrLM (API Based)
- 🔐 **User Authentication** - Secure signup/login with JWT
- 📧 **Email Verification** - OTP-based verification via Brevo
- 💬 **Chat History** - Save and retrieve conversations
- 🎨 **Modern UI** - Dark theme with glassmorphism effects
- 📱 **Responsive Design** - Works on all devices
- 📋 **Code Blocks** - Syntax highlighting with copy button

## 🛠️ Tech Stack

**Frontend:**
- React 18 + Vite
- Axios for API calls
- Lucide React icons
- React Markdown

**Backend:**
- Node.js + Express
- MongoDB Atlas
- JWT Authentication
- Brevo Email API

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Brevo account (for email verification)
- Google AI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/itzSNSR/SNSR-Chat.git
cd SNSR-Chat
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd server
npm install
```

4. Configure environment variables:
```bash
# Copy the example file
cp server/.env.example server/.env

# Edit server/.env with your API keys
```

5. Start the backend server:
```bash
cd server
npm run dev
```

6. Start the frontend (new terminal):
```bash
npm run dev
```

7. Open http://localhost:5173 in your browser

## 📁 Project Structure

```
SNSR-Chat/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   └── services/        # API services
├── server/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   └── services/        # Backend services
└── README.md
```

## 👨‍💻 Author

**Sabarinadh S R**

## 📄 License

This project is open source and available under the MIT License.
