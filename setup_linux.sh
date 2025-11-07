#!/bin/bash

###############################################################################
# Script cài đặt môi trường cho Financial Management System trên Linux
# Tự động cài đặt dependencies cho Backend (Python) và Frontend (Node.js)
###############################################################################

set -e  # Dừng nếu có lỗi

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "================================================================"
echo "  FINANCIAL MANAGEMENT SYSTEM - LINUX SETUP"
echo "  Cài đặt môi trường Backend và Frontend"
echo "================================================================"
echo -e "${NC}"

# Hàm in thông báo
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Kiểm tra quyền root (không bắt buộc nhưng có thể cần cho một số package)
if [ "$EUID" -eq 0 ]; then 
    print_warning "Đang chạy với quyền root. Khuyến nghị chạy không cần root."
fi

###############################################################################
# BƯỚC 1: Kiểm tra và cài đặt Python
###############################################################################
print_info "Bước 1: Kiểm tra Python..."

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    print_success "Python đã được cài đặt: $PYTHON_VERSION"
    
    # Kiểm tra phiên bản Python (yêu cầu >= 3.8)
    PYTHON_MAJOR=$(python3 -c 'import sys; print(sys.version_info.major)')
    PYTHON_MINOR=$(python3 -c 'import sys; print(sys.version_info.minor)')
    
    if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]); then
        print_error "Python 3.8+ là bắt buộc. Phiên bản hiện tại: $PYTHON_VERSION"
        exit 1
    fi
else
    print_error "Python3 chưa được cài đặt!"
    echo "Vui lòng cài đặt Python 3.8+ trước:"
    echo "  Ubuntu/Debian: sudo apt-get update && sudo apt-get install python3 python3-pip python3-venv"
    echo "  CentOS/RHEL: sudo yum install python3 python3-pip"
    echo "  Fedora: sudo dnf install python3 python3-pip"
    exit 1
fi

# Kiểm tra pip
if command -v pip3 &> /dev/null; then
    print_success "pip3 đã được cài đặt"
else
    print_warning "pip3 chưa được cài đặt. Đang cài đặt..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y python3-pip
    elif command -v yum &> /dev/null; then
        sudo yum install -y python3-pip
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y python3-pip
    else
        print_error "Không thể tự động cài đặt pip3. Vui lòng cài đặt thủ công."
        exit 1
    fi
fi

###############################################################################
# BƯỚC 2: Kiểm tra và cài đặt Node.js
###############################################################################
print_info "Bước 2: Kiểm tra Node.js..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js đã được cài đặt: $NODE_VERSION"
    
    # Kiểm tra phiên bản Node.js (yêu cầu >= 16)
    NODE_MAJOR=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -lt 16 ]; then
        print_warning "Node.js 16+ được khuyến nghị. Phiên bản hiện tại: $NODE_VERSION"
    fi
else
    print_error "Node.js chưa được cài đặt!"
    echo "Vui lòng cài đặt Node.js 16+ trước:"
    echo "  Cách 1: Sử dụng nvm (khuyến nghị):"
    echo "    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "    nvm install 18"
    echo "    nvm use 18"
    echo ""
    echo "  Cách 2: Sử dụng package manager:"
    echo "    Ubuntu/Debian: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
    echo "    CentOS/RHEL: curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash - && sudo yum install -y nodejs"
    exit 1
fi

# Kiểm tra npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm đã được cài đặt: $NPM_VERSION"
else
    print_error "npm chưa được cài đặt. Vui lòng cài đặt Node.js (npm đi kèm)."
    exit 1
fi

###############################################################################
# BƯỚC 3: Cài đặt system dependencies (nếu cần)
###############################################################################
print_info "Bước 3: Kiểm tra system dependencies..."

# Kiểm tra và cài đặt build-essential (cần cho một số Python packages)
if ! dpkg -l | grep -q build-essential 2>/dev/null; then
    if command -v apt-get &> /dev/null; then
        print_info "Đang cài đặt build-essential..."
        sudo apt-get update
        sudo apt-get install -y build-essential python3-dev libpq-dev
    fi
fi

# Kiểm tra PostgreSQL client libraries (cần cho psycopg2)
if command -v apt-get &> /dev/null; then
    if ! dpkg -l | grep -q libpq-dev 2>/dev/null; then
        print_info "Đang cài đặt PostgreSQL client libraries..."
        sudo apt-get install -y libpq-dev
    fi
fi

###############################################################################
# BƯỚC 4: Cài đặt Backend Dependencies
###############################################################################
print_info "Bước 4: Cài đặt Backend Dependencies (Python)..."

if [ ! -d "backend" ]; then
    print_error "Thư mục backend không tồn tại!"
    exit 1
fi

cd backend

# Tạo virtual environment nếu chưa có
if [ ! -d "venv" ]; then
    print_info "Đang tạo Python virtual environment..."
    python3 -m venv venv
    print_success "Đã tạo virtual environment"
fi

# Kích hoạt virtual environment
print_info "Đang kích hoạt virtual environment..."
source venv/bin/activate

# Nâng cấp pip
print_info "Đang nâng cấp pip..."
pip install --upgrade pip setuptools wheel

# Cài đặt dependencies
if [ -f "requirements.txt" ]; then
    print_info "Đang cài đặt Python packages từ requirements.txt..."
    pip install -r requirements.txt
    print_success "Đã cài đặt tất cả Python dependencies"
else
    print_error "Không tìm thấy requirements.txt!"
    exit 1
fi

# Tạo file .env từ env.example nếu chưa có
if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        print_info "Đang tạo file .env từ env.example..."
        cp env.example .env
        print_warning "Vui lòng cập nhật file backend/.env với thông tin của bạn!"
    else
        print_warning "Không tìm thấy env.example. Vui lòng tạo file .env thủ công."
    fi
else
    print_success "File .env đã tồn tại"
fi

deactivate
cd ..

###############################################################################
# BƯỚC 5: Cài đặt Frontend Dependencies
###############################################################################
print_info "Bước 5: Cài đặt Frontend Dependencies (Node.js)..."

if [ ! -d "frontend" ]; then
    print_error "Thư mục frontend không tồn tại!"
    exit 1
fi

cd frontend

# Kiểm tra package.json
if [ ! -f "package.json" ]; then
    print_error "Không tìm thấy package.json!"
    exit 1
fi

# Cài đặt npm dependencies
print_info "Đang cài đặt npm packages (có thể mất vài phút)..."
npm install

if [ $? -eq 0 ]; then
    print_success "Đã cài đặt tất cả npm dependencies"
else
    print_error "Có lỗi khi cài đặt npm dependencies"
    exit 1
fi

# Tạo file .env.local từ env.local.example nếu chưa có
if [ ! -f ".env.local" ]; then
    if [ -f "env.local.example" ]; then
        print_info "Đang tạo file .env.local từ env.local.example..."
        cp env.local.example .env.local
        print_warning "Vui lòng cập nhật file frontend/.env.local với thông tin của bạn!"
    else
        print_warning "Không tìm thấy env.local.example. Vui lòng tạo file .env.local thủ công."
    fi
else
    print_success "File .env.local đã tồn tại"
fi

cd ..

###############################################################################
# BƯỚC 6: Tóm tắt và hướng dẫn
###############################################################################
echo ""
echo -e "${GREEN}"
echo "================================================================"
echo "  CÀI ĐẶT HOÀN TẤT!"
echo "================================================================"
echo -e "${NC}"

print_success "Backend và Frontend đã được cài đặt thành công!"

echo ""
echo -e "${YELLOW}Các bước tiếp theo:${NC}"
echo ""
echo "1. Cấu hình Backend:"
echo "   - Chỉnh sửa file: backend/.env"
echo "   - Cập nhật Supabase URL và keys"
echo ""
echo "2. Cấu hình Frontend:"
echo "   - Chỉnh sửa file: frontend/.env.local"
echo "   - Cập nhật NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - Cập nhật NEXT_PUBLIC_API_URL nếu cần"
echo ""
echo "3. Khởi động Backend:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
echo ""
echo "4. Khởi động Frontend (terminal mới):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "5. Hoặc chạy cả hai với network access:"
echo "   ./start_network.sh"
echo "   hoặc"
echo "   python3 start_network.py"
echo ""
echo -e "${BLUE}Chúc bạn thành công!${NC}"

