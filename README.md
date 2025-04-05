# 🌟 Blend.Ar - Your Arabic Learning Companion

![Blend.Ar Logo](public/blendar.jpg)

Blend.Ar is an innovative AI-powered platform designed to make learning Levantine Arabic engaging, personalized, and culturally enriching. Whether you're a beginner or an advanced learner, Blend.Ar adapts to your needs, offering interactive lessons and conversations.

> *"Understanding a language is understanding its people."*

## 🎯 What is Blend.Ar?

Blend.Ar bridges cultural and linguistic gaps by teaching conversational Levantine Arabic, tailored specifically for Hebrew speakers. Here's what makes it unique:

- 🤖 **AI Tutor "Laith"**: Engage in natural, interactive conversations.
- 📚 **Structured Lessons**: Weekly lessons customized to your proficiency.
- 🔄 **Authentic Arabic**: Learn spoken Arabic, not just Modern Standard Arabic (MSA).
- 🌐 **Multi-Language Support**: Includes Hebrew transliteration for ease of learning.
- 🚀 **Personalized Progress**: Track your learning journey with tailored feedback.

## 🛠️ Built With Love and Tech

### Frontend
- **React + TypeScript**: Modern, scalable UI.
- **Vite**: Lightning-fast build tool.
- **TailwindCSS**: Beautiful, responsive designs.
- **Framer Motion**: Smooth animations.
- **React Query**: Efficient data fetching.

### Backend
- **Python + Flask**: Robust API backend.
- **OpenAI GPT**: AI-driven conversational intelligence.
- **Firebase**: Authentication and database.
- **Firestore**: Real-time data storage.

### DevOps
- **Bun/npm**: Dependency management.
- **Docker**: Ready for containerized deployment.

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v16+ or Bun
- Python 3.8+
- Firebase account
- OpenAI API key

### Setup in Minutes

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/LaithMimi/BlendarChatBot
   cd BlendarChatBot
   ```

2. **Install Dependencies**:
   ```bash
   # Frontend
   bun install
   # or npm install

   # Backend
   pip install -r requirements.txt
   ```

3. **Environment Configuration**:
   Create a `.env` file:
   ```env
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Firebase Setup**:
   - Create a Firebase project.
   - Enable Authentication (Google, Phone).
   - Configure Firestore.
   - Add `serviceAccountKey.json` to the root directory.

5. **Seed the Database**:
   ```bash
   python seed_data.py
   ```

6. **Run the Application**:
   ```bash
   # Backend
   python app.py

   # Frontend
   bun dev
   # or npm run dev
   ```

7. **Access the App**:
   Open [http://localhost:8050](http://localhost:8050) in your browser.

## 📋 Project Structure

```
arabic-tutor-bot/
├── public/             # Static assets
├── build/              # Production build
├── data_files/         # Training data
├── src/                # Frontend code
│   ├── api/            # API integration
│   ├── components/     # Reusable UI components
│   ├── contexts/       # React context
│   ├── hooks/          # Custom hooks
│   ├── pages/          # App pages
│   └── utils/          # Helper functions
├── app.py              # Flask backend
├── seed_data.py        # Database seeding
└── requirements.txt    # Python dependencies
```

## ✨ Features You'll Love

### Learners
- **Interactive Conversations**: Chat naturally with "Laith."
- **Level-Based Lessons**: Beginner to advanced content.
- **Cultural Insights**: Learn phrases with context.
- **Flexible Modes**: Arabic script, Hebrew, or English transliteration.
- **Free & Premium Plans**: Start free, upgrade anytime.

### Administrators
- **Content Management**: Update lessons easily.
- **Chat Logs**: Review and support learners.

## 🔒 Authentication Options

- Google Sign-In

## 💰 Subscription Plans

- **Basic (Free)**:
  - Core lessons
  - Limited conversations
  - Basic progress tracking

- **Premium (₪30/month or ₪288/year)**:
  - Unlimited conversations
  - Advanced materials
  - Personalized feedback
  - Priority support

## 🤝 Contribute to Blend.Ar

We welcome contributions! Here's how to get started:

1. Fork the repo.
2. Create a branch: `git checkout -b feature/your-feature`.
3. Commit changes: `git commit -m 'Add your feature'`.
4. Push: `git push origin feature/your-feature`.
5. Open a Pull Request.

Follow our style guide and include tests where applicable.

## 🐛 Known Issues & Roadmap

- Improve mobile responsiveness.
- Add more dialect options.
- Enable voice input for practice.
- Enhance offline learning capabilities.

## 📄 License

Licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 📊 Project Status

Actively maintained with regular updates.

## 📞 Contact Us

Have questions or feedback? Reach out at **blendarabic@gmail.com**.

---

Developed with ❤️ by the Blend.Ar Team

---

### Firebase Commands

Deploy static files:
```bash
yarn build && firebase deploy --only hosting
```

Run emulators:
```bash
firebase emulators:start
```

Deploy cloud functions:
```bash
firebase deploy --only functions
```

Manage OpenAI API key:
```bash
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:access OPENAI_API_KEY
```
