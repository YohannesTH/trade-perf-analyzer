# 📈 Trading Strategy Backtester

A full-stack SaaS web application that allows traders to simulate and evaluate trading strategies on historical market data before applying them in live environments.

![Project Screenshot](https://i.imgur.com/your-screenshot-url.png)
*(Replace the URL above with a real screenshot of your application)*

---

## 🚀 Core Features

* **Strategy Simulation**: Test different trading strategies like **SMA Crossover** and **RSI Thresholds**.
* **Dynamic Parameters**: Easily adjust strategy parameters like moving average windows or RSI levels.
* **Performance Metrics**: Instantly get key metrics like **Cumulative Returns**, **Max Drawdown**, and **Win Rate**.
* **Data Visualization**: View your portfolio's growth over time with an interactive equity curve chart.
* **User Accounts**: Save your backtest configurations and results to review later.

---

## 🛠️ Tech Stack

* **Frontend**: React, Vite, Chart.js
* **Backend**: Python, FastAPI
* **Database**: Replit PostgreSQL
* **Authentication**: Replit Auth
* **Data Source**: `yfinance` library

---

## ⚙️ Getting Started

You can run this project directly in Replit.

1.  **Fork the Repl**: Click the "Fork" button to clone this project to your own Replit account.
2.  **Set Up Secrets**: In the Replit sidebar, go to the **Secrets** tab. The project should run without any secrets, but if you connect to a dedicated database, you'll need to add your `POSTGRES_URL` here.
3.  **Run the App**: Click the "Run" button at the top. Replit will automatically install the dependencies and start both the frontend and backend servers.

---

## 📖 How to Use

1.  **Register/Login**: Use the integrated authentication to create an account.
2.  **Configure Backtest**:
    * Enter a valid stock ticker (e.g., `AAPL`, `TSLA`).
    * Select a date range.
    * Choose a strategy from the dropdown.
    * Set the strategy-specific parameters.
3.  **Run Simulation**: Click "Run Backtest" and wait for the results.
4.  **Analyze & Save**: Review the performance metrics and chart. Click "Save" to add the test to your history.
