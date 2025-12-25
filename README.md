# Financial Management System - Phuc Dat

A comprehensive financial management solution built with modern technologies for businesses to manage employees, customers, projects, expenses, and invoices.

## 🚀 Tech Stack

### Backend
- **FastAPI** (0.104.1) - Modern Python web framework
- **Uvicorn** (0.24.0) - ASGI server with hot reload
- **Supabase** (2.18.1) - Backend-as-a-Service with PostgreSQL
- **Python 3.11+** - Programming language

### Frontend
- **Next.js** (15.5.2) - React framework with App Router
- **React** (19.1.0) - UI library
- **Tailwind CSS** (v4) - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript

### Database & Services
- **PostgreSQL** - Primary database (via Supabase)
- **Supabase Auth** - Authentication service
- **Dify AI** - AI-powered features

## 📁 Project Structure

```
financial-management-phuc-dat/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application entry point
│   ├── config.py           # Configuration settings
│   ├── requirements.txt    # Python dependencies
│   ├── routers/            # API route handlers
│   ├── models/             # Pydantic models
│   ├── services/           # Business logic services
│   └── utils/              # Utility functions
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── types/         # TypeScript type definitions
│   │   ├── lib/           # Utility libraries
│   │   └── utils/         # Helper functions
│   ├── package.json       # Node.js dependencies
│   └── tailwind.config.js # Tailwind CSS configuration
├── package.json           # Root package.json with scripts
└── README.md             # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/Pkmax-bit/Financial-management-Phuc-Dat.git
cd Financial-management-Phuc-Dat
```

### 2. Install Dependencies
```bash
# Install all dependencies (backend + frontend)
npm run install:all

# Or install separately:
npm run install:backend
npm run install:frontend
```

### 3. Environment Configuration

#### Backend Environment
Copy the example environment file and configure your settings:
```bash
cd backend
cp env.example .env
```



## 🚀 Running the Application

### Development Mode
```bash
# Run both backend and frontend concurrently
npm run dev

# Or run separately:
npm run dev:backend  # Backend on http://localhost:8000
npm run dev:frontend # Frontend on http://localhost:3000
```

### Production Mode
```bash
# Build frontend
npm run build

# Start backend
npm run start
```

## 📊 Features

### Core Modules
- **Employee Management** - Manage employee information, roles, and permissions
- **Customer Management** - Track customer information and relationships
- **Project Management** - Monitor project progress and budgets
- **Expense Tracking** - Track and approve business expenses
- **Invoice Management** - Create and manage customer invoices
- **Analytics & Reports** - View financial reports and analytics

### Key Features
- 🔐 **Authentication** - Secure user authentication with Supabase Auth
- 📱 **Responsive Design** - Mobile-friendly interface with Tailwind CSS
- 🔄 **Real-time Updates** - Live data synchronization
- 📊 **Data Visualization** - Charts and graphs with Recharts
- 📄 **File Upload** - Support for document and receipt uploads
- 🤖 **AI Integration** - Dify AI for intelligent features
- 📧 **Email Notifications** - Automated email alerts
- 🌐 **Multi-language Support** - Internationalization ready

## 🗄️ Database Schema

### Main Tables
- `auth.users` - User authentication (Supabase Auth)
- `employees` - Employee information
- `customers` - Customer data
- `projects` - Project management
- `expenses` - Expense tracking
- `invoices` - Invoice management
- `departments` - Department structure
- `positions` - Job positions

### Supporting Tables
- `roles` - User roles and permissions
- `activity_logs` - System activity logging
- `chat_history` - AI chat records
- `user_chat_sessions` - Chat session management

## 🔧 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend
```

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both backend and frontend in development mode |
| `npm run build` | Build the frontend for production |
| `npm run start` | Start the backend in production mode |
| `npm run install:all` | Install all dependencies |
| `npm run test` | Run all tests |
| `npm run lint` | Run linting for both backend and frontend |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Phuc Dat** - Project Lead & Developer

## 📞 Support

For support, email backen@vanphuthanh.net or create an issue in the repository.

---

**Built with ❤️ using FastAPI, Next.js, and Supabase**
