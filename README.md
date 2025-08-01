# Finurate
A full-stack portfolio analytics platform for tracking and evaluating assets across stocks and cryptocurrencies - featuring 
real-time price updates, technical indicators, portfolio-level metrics, and sentiment analysis of financial news.

## Features
- **Real-Time Portfolio Tracking**  
  Tracks live prices and percent changes for individual stocks, cryptocurrencies, and the overall portfolio using yfinance.

- **Portfolio Evaluation**  
  Calculates metrics like **Diversification**, **Risk Aversion**, **Liquidity**, **Stability**, and **Growth** using backend logic and presents them with MUI Charts.

- **Technical Analysis**  
  Visualizes price action and technical indicators — including **RSI**, **MACD**, and **EMAs** — for each asset using TradingView Lightweight Charts

- **News Sentiment Analysis**  
  Fetches relevant articles using NewsAPI for assets in the user’s portfolio and performs sentiment analysis with VADER NLP, scoring both individual articles and the overall portfolio sentiment.

- **User Auth & Data Persistence**  
  Implements secure **Google-based** authentication via Firebase Auth, enabling personalized portfolio access and persistent data storage through Firestore.

## Tech Stack

- **Frontend:** React, TypeScript, Material UI, TradingView Lightweight Charts  
- **Backend:** Django, Django REST Framework, yfinance, vaderSentiment  
- **Database & Auth:** Firebase Firestore + Authentication


## Setup Instructions
1. **Clone the repository**
   ```bash
    git clone https://github.com/BorilBalchev/Finurate.git
2. **Backend Setup (Django)**
   ```bash
   cd backend
   pip install -r requirements.txt
   python manage.py runserver
   ```
3. **NewsAPI setup**
   - Navigate to the backend folder and create a `.env` file in this format:
   ```bash
   NEWSAPI=your_NewsAPI_key
   ```
4. **Frontend Setup (React + Vite)**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
5. **Firebase setup**
   - Create a Firebase project
   - Enable Google Authentication
   - Set up Firestore
   - Navigate to the frontend folder and create a `.env` file in this format:
     ```bash
     VITE_FIREBASE_API_KEY=your_firebase_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
     VITE_FIREBASE_APP_ID=your_firebase_app_id
     ```
     Alternatively, you can navigate to frontend/src/utils/firebase.ts and edit the file as necessary.

## Contributing
Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

## License
Distributed under the MIT License. See `LICENSE` for more information.

## Contact
LinkedIn: https://linkedin.com/in/boril-balchev
