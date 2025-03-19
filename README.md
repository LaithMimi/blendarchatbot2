# 🌟 Blend.Ar - Arabic Tutor Bot

![Blend.Ar Logo](public/blendar.jpg)

A sophisticated AI-powered Arabic language learning platform that provides personalized, interactive conversations and lessons in the Levantine dialect.

> *"הבנת שפה היא הבנת אנשים" - "Understanding a language is understanding people"*

## 🎯 Project Overview

Blend.Ar is designed to bridge cultural gaps through language learning, focusing specifically on teaching conversational Levantine Arabic to Hebrew speakers. The platform offers:

- 🤖 AI-powered conversations with a tutor named "Laith"
- 📚 Structured weekly lessons based on proficiency level
- 🔄 Support for authentic spoken Arabic (not just MSA)
- 🌐 Multi-language support with Hebrew transliteration
- 🚀 Personalized learning paths and progress tracking

## 🛠️ Tech Stack

### Frontend
- React + TypeScript
- Vite build tool
- TailwindCSS + shadcn/ui components
- Framer Motion for animations
- React Query for data fetching

### Backend
- Python + Flask API
- OpenAI GPT integration
- Firebase Authentication
- Firestore database

### DevOps
- Bun/npm for package management
- Docker support (configuration ready)

## 🚀 Getting Started

### Prerequisites
- Node.js v16+ or Bun
- Python 3.8+
- Firebase account
- OpenAI API key

### Quick Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/LaithMimi/BlendarChatBot
   cd BlendarChatBot
   ```

2. **Install dependencies**:
   ```bash
   # Install frontend dependencies
   bun install
   # or npm install

   # Install backend dependencies
   pip install -r requirements.txt
   ```

3. **Configure environment**:
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Set up Firebase**:
   - Create a Firebase project
   - Enable Authentication (Google, Phone)
   - Set up Firestore database
   - Download your `serviceAccountKey.json` credentials
   - Place the file in the project root

5. **Seed the database**:
   ```bash
   python seed_data.py
   ```

6. **Run the application**:
   ```bash
   # Terminal 1: Start the backend
   python app.py

   # Terminal 2: Start the frontend
   bun dev
   # or npm run dev
   ```

7. **Access the application**:
   Open your browser and navigate to `http://localhost:8050`

## 📋 Project Structure

```
arabic-tutor-bot/
├── public/             # Static assets
├── build/              # Production build output
├── data_files/         # Training data and materials
├── src/                # Frontend source code
│   ├── api/            # API integration
│   ├── components/     # UI components
│   ├── contexts/       # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Application pages
│   └── utils/          # Utility functions
├── app.py              # Flask backend
├── seed_data.py        # Database seeding script
└── requirements.txt    # Python dependencies
```

## ✨ Key Features

### For Learners
- **Personalized Conversations**: Interact with the AI tutor in natural language
- **Level-Based Learning**: Content tailored to beginner, intermediate, and advanced levels
- **Cultural Context**: Learn phrases with cultural insights
- **Multiple Learning Modes**: Choose between Arabic script, Hebrew transliteration, or English transliteration
- **Accessible Learning**: Free basic plan with premium features available

### For Administrators
- **Content Management**: Update learning materials and lessons
- **Chat Logs**: Review conversation history and provide support

## 🔒 Authentication

The application supports multiple authentication methods:
- Phone number verification (with SMS)
- Google Sign-In
- Guest mode for trial access

## 💰 Subscription Tiers

- **Basic (Free)**
  - Access to fundamental lessons
  - Limited conversation turns
  - Basic progress tracking

- **Premium (₪30/month or ₪288/year)**
  - Unlimited conversations
  - Advanced learning materials
  - Personalized feedback
  - Priority support

## 🤝 Contributing

We welcome contributions to make Blend.Ar even better! Here's how to get involved:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please ensure your code follows the project's style guidelines and includes appropriate tests.

## 🐛 Known Issues & Future Improvements

- Mobile responsiveness needs refinement on smaller devices
- Add additional dialect options beyond Levantine
- Implement user voice input for conversation practice
- Improve offline capabilities for learning on-the-go

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📊 Project Status

This project is actively maintained and under development. Updates are released regularly with new features and improvements.

## 📞 Contact

For questions, feedback, or support, please contact us at blendarabic@gmail.com.

---

Developed with ❤️ by the Blend.Ar team