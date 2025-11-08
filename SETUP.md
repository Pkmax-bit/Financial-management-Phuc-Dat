# 🚀 Quick Setup Guide - Financial Management System

## 📋 Prerequisites

- **Python 3.11+** - [Download here](https://www.python.org/downloads/)
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Supabase Account** - [Sign up here](https://supabase.com/)

## ⚡ Quick Start (5 minutes)

### 1. Clone and Setup
```bash
git clone https://github.com/Pkmax-bit/Financial-management-Phuc-Dat.git
cd Financial-management-Phuc-Dat
```

### 2. Install Dependencies
```bash
# Install all dependencies
npm run install:all

# Or install separately:
npm run install:backend
npm run install:frontend
```

### 3. Configure Environment

#### Backend Configuration
```bash
cd backend
cp env.example .env
```

Edit `backend/.env` with your Supabase credentials:
```env
SUPABASE_URL="https://mfmijckzlhevduwfigkl.supabase.co"
SUPABASE_SERVICE_KEY="your_service_key_here"
SUPABASE_ANON_KEY="your_anon_key_here"
```

#### Frontend Configuration
```bash
cd frontend
cp env.local.example .env.local
```

Edit `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL="https://mfmijckzlhevduwfigkl.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key_here"
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

### 4. Setup Database

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project or use existing one
3. Go to SQL Editor
4. Copy and run the contents of `database/schema.sql`
5. This will create all necessary tables and sample data

### 5. Start Development Servers

```bash
# Start both backend and frontend
npm run dev

# Or start separately:
npm run dev:backend   # Backend on http://localhost:8000
npm run dev:frontend  # Frontend on http://localhost:3000
```

## 🌐 Access Your Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔐 Default Login Credentials

For testing, you can use these demo credentials:
- **Email**: admin@example.com
- **Password**: admin123

## 📊 Features Available

### ✅ Completed Features
- **Authentication System** - Login, Register, Password Reset
- **Employee Management** - CRUD operations, search, filter
- **Dashboard** - Overview with statistics and recent activities
- **Responsive Design** - Mobile-friendly interface
- **API Documentation** - Auto-generated Swagger docs

### 🚧 In Development
- Customer Management
- Project Management
- Expense Tracking
- Invoice Management
- Reports & Analytics

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start both servers
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only

# Building
npm run build            # Build frontend
npm run start            # Start production backend

# Testing
npm run test             # Run all tests
npm run test:backend     # Backend tests only
npm run test:frontend    # Frontend tests only

# Linting
npm run lint             # Lint all code
npm run lint:backend     # Backend linting
npm run lint:frontend    # Frontend linting
```

## 🗄️ Database Schema

The system includes these main tables:
- `users` - User authentication and profiles
- `employees` - Employee information
- `customers` - Customer data
- `projects` - Project management
- `expenses` - Expense tracking
- `invoices` - Invoice management
- `departments` - Department structure
- `positions` - Job positions

## 🔧 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill processes on ports 3000 and 8000
   npx kill-port 3000 8000
   ```

2. **Python dependencies not installing**
   ```bash
   # Upgrade pip
   python -m pip install --upgrade pip
   # Install with verbose output
   pip install -r backend/requirements.txt -v
   ```

3. **Node modules issues**
   ```bash
   # Clear npm cache and reinstall
   cd frontend
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Supabase connection issues**
   - Verify your Supabase URL and keys
   - Check if your Supabase project is active
   - Ensure RLS policies are properly configured

### Getting Help

- Check the [API Documentation](http://localhost:8000/docs) for backend endpoints
- Review the [README.md](README.md) for detailed information
- Create an issue in the repository for bugs or feature requests

## 🎯 Next Steps

1. **Customize the system** for your business needs
2. **Add more features** using the existing architecture
3. **Deploy to production** using your preferred hosting platform
4. **Integrate with external services** like payment gateways

## 📞 Support

For support or questions:
- Email: phannguyendangkhoa0915@gmail.com
- Create an issue in the repository

---

**Happy coding! 🚀**
