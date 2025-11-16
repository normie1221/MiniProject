# AI-Powered Finance Manager - Complete API Documentation

## Base URL
```
http://localhost:3000/api (development)
https://your-domain.com/api (production)
```

## Authentication
All endpoints except `/api/hello` and `/api/webhooks/clerk` require authentication via Clerk.

Include the Clerk session token in the Authorization header:
```
Authorization: Bearer <CLERK_TOKEN>
```

---

## Endpoints

### Health Check
**GET** `/api/hello`  
Public endpoint to verify API is running.

**Response:**
```json
{
  "message": "AI Finance Manager Backend — Hello"
}
```

---

### Expenses

#### List & Create Expenses
**GET** `/api/expenses`  
Get all expenses for the authenticated user.

**Response:**
```json
{
  "expenses": [
    {
      "id": "exp_123",
      "amount": 45.99,
      "currency": "USD",
      "category": "groceries",
      "description": "Weekly shopping",
      "date": "2025-11-16T00:00:00.000Z",
      "createdAt": "2025-11-16T10:30:00.000Z"
    }
  ]
}
```

**POST** `/api/expenses`  
Create a new expense.

**Request Body:**
```json
{
  "amount": 45.99,
  "currency": "USD",
  "category": "groceries",
  "description": "Weekly shopping at Whole Foods",
  "note": "Bought organic produce",
  "date": "2025-11-16"
}
```

**Response:**
```json
{
  "expense": {
    "id": "exp_123",
    "amount": 45.99,
    "category": "groceries",
    "description": "Weekly shopping at Whole Foods",
    "encryptedNote": "...",
    "date": "2025-11-16T00:00:00.000Z"
  }
}
```

#### Manage Single Expense
**GET** `/api/expenses/[id]`  
**PUT** `/api/expenses/[id]`  
**DELETE** `/api/expenses/[id]`

---

### Income

#### List & Create Income
**GET** `/api/income`  
Get all income entries for the authenticated user.

**POST** `/api/income`  
Create a new income entry.

**Request Body:**
```json
{
  "amount": 5000,
  "source": "salary",
  "description": "Monthly salary",
  "date": "2025-11-01",
  "recurring": true
}
```

---

### Budget

#### Generate Budget
**POST** `/api/budget`  
Generate a budget based on historical spending.

**Request Body:**
```json
{
  "month": 12,
  "year": 2025
}
```

**Response:**
```json
{
  "budget": {
    "id": "budget_123",
    "month": 12,
    "year": 2025,
    "allocations": {
      "groceries": 25.5,
      "transport": 15.2,
      "dining": 20.3,
      "utilities": 10.0,
      "entertainment": 29.0
    }
  }
}
```

---

### Financial Health Analysis

#### Get Financial Health Score
**GET** `/api/analysis`  
Comprehensive financial health analysis with scoring.

**Response:**
```json
{
  "score": 78,
  "grade": "C",
  "metrics": {
    "monthlyIncome": 5000,
    "monthlyExpenses": 3200,
    "savingsRate": 36.0,
    "expenseToIncomeRatio": 64.0,
    "budgetAdherence": 85.5
  },
  "insights": [
    "Excellent savings rate! You are saving over 20% of your income.",
    "You are managing your budget well."
  ],
  "recommendations": [
    "Consider investing your savings for long-term growth."
  ],
  "explanation": "Score based on: savings rate (36.0%), expense ratio (64.0%), and budget adherence (85.5%)."
}
```

---

### Predictions

#### Predict Future Expenses
**POST** `/api/predict`  
Forecast expenses for next month using linear regression.

**Request Body:**
```json
{
  "months": 3
}
```

**Response:**
```json
{
  "months": 3,
  "predictions": {
    "groceries": {
      "prediction": 458.23,
      "explain": "Linear reg m=12.5400, b=421.50"
    },
    "transport": {
      "prediction": 235.67,
      "explain": "Linear reg m=5.2300, b=220.12"
    }
  }
}
```

---

### Categorization

#### Categorize Expense
**POST** `/api/categorize`  
Automatically categorize an expense description.

**Request Body:**
```json
{
  "description": "Uber ride to airport"
}
```

**Response:**
```json
{
  "category": "transport",
  "explain": "keyword-match"
}
```

---

### Fraud Detection

#### Detect Anomalies
**POST** `/api/fraud`  
Run anomaly detection on an expense amount.

**Request Body:**
```json
{
  "amount": 5000,
  "category": "groceries"
}
```

**Response:**
```json
{
  "isAnomaly": true,
  "score": 3.45,
  "alert": {
    "id": "alert_123",
    "score": 3.45,
    "reason": "z-score anomaly"
  }
}
```

---

### Goals

#### List & Create Goals
**GET** `/api/goals`  
Get all financial goals.

**POST** `/api/goals`  
Create a new financial goal.

**Request Body:**
```json
{
  "title": "Emergency Fund",
  "targetAmt": 10000,
  "currentAmt": 2500,
  "deadline": "2026-12-31"
}
```

**Response:**
```json
{
  "goals": [
    {
      "id": "goal_123",
      "title": "Emergency Fund",
      "targetAmt": 10000,
      "currentAmt": 2500,
      "progressPercentage": 25,
      "remainingAmount": 7500,
      "status": "active",
      "deadline": "2026-12-31"
    }
  ]
}
```

#### Manage Single Goal
**GET** `/api/goals/[id]`  
**PUT** `/api/goals/[id]`  
**DELETE** `/api/goals/[id]`

---

### Investment Recommendations

#### Get Recommendations
**POST** `/api/investments/recommend`  
Get personalized investment recommendations.

**Request Body:**
```json
{
  "riskAppetite": "medium",
  "monthlyIncome": 5000
}
```

**Response:**
```json
{
  "riskProfile": "medium",
  "recommendations": [
    {
      "type": "mutual_funds",
      "name": "Balanced Mutual Funds",
      "allocation": 35,
      "expectedReturn": "8-12%",
      "risk": "Medium",
      "description": "Mix of equity and debt for balanced growth."
    }
  ],
  "suggestedMonthlyInvestment": 1000,
  "explanation": "Based on your medium risk appetite...",
  "disclaimer": "Investment recommendations are for educational purposes only..."
}
```

---

### Learning Modules

#### Get All Modules
**GET** `/api/learning/modules`  
Get all financial literacy learning modules.

**Response:**
```json
{
  "modules": [
    {
      "id": "budgeting-basics",
      "title": "Budgeting Basics",
      "category": "Foundations",
      "duration": "15 min",
      "description": "Learn how to create and maintain a personal budget.",
      "topics": ["50/30/20 rule", "Fixed vs Variable Expenses"],
      "content": "A budget helps you understand..."
    }
  ],
  "totalModules": 8,
  "categories": ["Foundations", "Savings", "Investing", "Debt"]
}
```

---

### Insights & Visualization

#### Get Insights
**GET** `/api/insights?period=6`  
Get visualization-ready data for charts.

**Query Parameters:**
- `period` (optional): Number of months to analyze (default: 6)

**Response:**
```json
{
  "period": "6 months",
  "monthlyTrend": [
    { "month": "Jun 2025", "expenses": 3200 },
    { "month": "Jul 2025", "expenses": 3450 }
  ],
  "categoryBreakdown": [
    { "category": "groceries", "amount": 850, "percentage": 26.5 }
  ],
  "topExpenses": [...],
  "weeklySpendingPattern": [
    { "day": "Monday", "amount": 120 }
  ],
  "totalExpenses": 19200,
  "averageMonthly": 3200
}
```

---

### Savings Insights

#### Get Savings Analysis
**GET** `/api/savings`  
Get detailed savings insights and goal recommendations.

**Response:**
```json
{
  "currentMonth": {
    "income": 5000,
    "expenses": 3200,
    "savings": 1800,
    "savingsRate": 36.0
  },
  "lastMonth": {
    "income": 5000,
    "expenses": 3400,
    "savings": 1600
  },
  "trends": {
    "savingsGrowth": 12.5,
    "expenseChange": -5.88
  },
  "goalProgress": [
    {
      "goalId": "goal_123",
      "goalTitle": "Emergency Fund",
      "remainingAmount": 7500,
      "suggestedMonthlySaving": 625,
      "monthsLeft": 12
    }
  ],
  "totalMonthlySavingsNeeded": 625,
  "savingsShortfall": 0,
  "tips": [
    "Excellent! You're saving over 20% of your income."
  ]
}
```

---

### Dashboard

#### Get Dashboard Summary
**GET** `/api/dashboard`  
Get aggregated dashboard metrics.

**Response:**
```json
{
  "summary": {
    "totalIncome": 5000,
    "totalExpenses": 3200,
    "currentSavings": 1800,
    "savingsRate": 36.0,
    "transactionCount": 45
  },
  "topCategories": [
    { "category": "groceries", "amount": 850 }
  ],
  "goals": [
    {
      "id": "goal_123",
      "title": "Emergency Fund",
      "progress": 25,
      "remaining": 7500
    }
  ],
  "recentTransactions": [...],
  "alerts": {
    "fraudAlerts": 2,
    "recentAlerts": [...]
  },
  "upcomingBills": []
}
```

---

### Reports

#### Download Report
**GET** `/api/reports/download?format=csv&startDate=2025-01-01&endDate=2025-12-31`  
Download financial report in JSON or CSV format.

**Query Parameters:**
- `format`: `json` or `csv` (default: json)
- `startDate`: ISO date string
- `endDate`: ISO date string

**Response (JSON):**
```json
{
  "generatedAt": "2025-11-17T00:00:00.000Z",
  "period": { "start": "2025-01-01", "end": "2025-12-31" },
  "summary": {
    "totalExpenses": 38400,
    "expenseCount": 240,
    "averageExpense": 160,
    "categories": 8
  },
  "expenses": [...],
  "goals": [...]
}
```

**Response (CSV):**
```csv
date,amount,category,description,currency
2025-11-16,45.99,groceries,"Weekly shopping",USD
```

---

### Webhooks

#### Clerk User Sync
**POST** `/api/webhooks/clerk`  
Webhook endpoint for Clerk user events (public, signature verified).

**Headers:**
- `x-clerk-signature`: HMAC-SHA256 signature

**Request Body:** (Clerk webhook payload)

**Response:**
```json
{
  "received": true
}
```

---

## Error Responses

All endpoints return standard error responses:

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

**400 Bad Request:**
```json
{
  "error": "Invalid request parameters"
}
```

**404 Not Found:**
```json
{
  "error": "Not found"
}
```

**405 Method Not Allowed:**
```json
{
  "error": "Method GET Not Allowed"
}
```

---

## Rate Limiting
Currently not implemented. For production, consider adding rate limiting middleware.

## Pagination
Currently not implemented. All list endpoints return all results. For production, add pagination support.

---

## Support
For issues or questions, refer to the README.md or create an issue in the repository.
