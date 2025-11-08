#!/bin/bash

# Script tự động clone và setup dự án Financial Management trên Ubuntu Linux
# Sử dụng: chmod +x clone_and_setup_ubuntu.sh && ./clone_and_setup_ubuntu.sh

set -e  # Dừng nếu có lỗi

# Màu sắc cho output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Kiểm tra quyền root
check_root() {
    if [ "$EUID" -eq 0 ]; then 
        print_error "Vui lòng không chạy script này với quyền root/sudo"
        exit 1
    fi
}

# Kiểm tra Git
check_git() {
    if ! command -v git &> /dev/null; then
        print_warning "Git chưa được cài đặt. Đang cài đặt..."
        sudo apt update
        sudo apt install git -y
    fi
    print_success "Git đã được cài đặt: $(git --version)"
}

# Kiểm tra Python
check_python() {
    if ! command -v python3.11 &> /dev/null; then
        print_warning "Python 3.11 chưa được cài đặt. Đang cài đặt..."
        sudo apt install software-properties-common -y
        sudo add-apt-repository ppa:deadsnakes/ppa -y
        sudo apt update
        sudo apt install python3.11 python3.11-venv python3.11-dev python3-pip -y
    fi
    print_success "Python đã được cài đặt: $(python3.11 --version)"
}

# Kiểm tra Node.js
check_node() {
    if ! command -v node &> /dev/null; then
        print_warning "Node.js chưa được cài đặt. Đang cài đặt..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_warning "Node.js version < 18. Đang cài đặt Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
    fi
    print_success "Node.js đã được cài đặt: $(node --version)"
    print_success "npm đã được cài đặt: $(npm --version)"
}

# Clone repository
clone_repo() {
    REPO_URL="https://github.com/Pkmax-bit/Financial-management-Phuc-Dat.git"
    REPO_NAME="Financial-management-Phuc-Dat"
    
    if [ -d "$REPO_NAME" ]; then
        print_warning "Thư mục $REPO_NAME đã tồn tại. Bỏ qua bước clone."
        cd "$REPO_NAME"
    else
        print_info "Đang clone repository từ GitHub..."
        git clone "$REPO_URL"
        cd "$REPO_NAME"
        print_success "Đã clone repository thành công!"
    fi
}

# Cài đặt backend dependencies
setup_backend() {
    print_info "Đang cài đặt backend dependencies..."
    
    cd backend
    
    # Tạo virtual environment
    if [ ! -d "venv" ]; then
        print_info "Đang tạo virtual environment..."
        python3.11 -m venv venv
    fi
    
    # Kích hoạt virtual environment
    print_info "Đang kích hoạt virtual environment..."
    source venv/bin/activate
    
    # Cài đặt dependencies
    print_info "Đang cài đặt Python packages..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Tạo file .env nếu chưa có
    if [ ! -f ".env" ]; then
        print_info "Đang tạo file .env từ env.example..."
        cp env.example .env
        print_warning "Vui lòng chỉnh sửa file backend/.env với thông tin Supabase của bạn!"
    else
        print_info "File .env đã tồn tại."
    fi
    
    deactivate
    cd ..
    print_success "Backend dependencies đã được cài đặt!"
}

# Cài đặt frontend dependencies
setup_frontend() {
    print_info "Đang cài đặt frontend dependencies..."
    
    cd frontend
    
    # Cài đặt npm packages
    print_info "Đang cài đặt npm packages..."
    npm install
    
    # Tạo file .env.local nếu chưa có
    if [ ! -f ".env.local" ]; then
        if [ -f "env.local.example" ]; then
            print_info "Đang tạo file .env.local từ env.local.example..."
            cp env.local.example .env.local
            print_warning "Vui lòng chỉnh sửa file frontend/.env.local với thông tin Supabase của bạn!"
        else
            print_warning "File env.local.example không tồn tại."
        fi
    else
        print_info "File .env.local đã tồn tại."
    fi
    
    cd ..
    print_success "Frontend dependencies đã được cài đặt!"
}

# Cài đặt root dependencies
setup_root() {
    print_info "Đang cài đặt root dependencies..."
    
    if [ -f "package.json" ]; then
        npm install
        print_success "Root dependencies đã được cài đặt!"
    else
        print_warning "File package.json không tồn tại ở root."
    fi
}

# Main function
main() {
    echo "=========================================="
    echo "  CLONE VÀ SETUP DỰ ÁN TRÊN UBUNTU"
    echo "=========================================="
    echo ""
    
    # Kiểm tra quyền
    check_root
    
    # Kiểm tra và cài đặt các công cụ cần thiết
    print_info "Đang kiểm tra các công cụ cần thiết..."
    check_git
    check_python
    check_node
    echo ""
    
    # Clone repository
    print_info "Đang clone repository..."
    clone_repo
    echo ""
    
    # Cài đặt dependencies
    print_info "Đang cài đặt dependencies..."
    setup_root
    setup_backend
    setup_frontend
    echo ""
    
    # Kết quả
    echo "=========================================="
    print_success "CÀI ĐẶT HOÀN TẤT!"
    echo "=========================================="
    echo ""
    print_info "Các bước tiếp theo:"
    echo "  1. Chỉnh sửa file backend/.env với thông tin Supabase của bạn"
    echo "  2. Chỉnh sửa file frontend/.env.local với thông tin Supabase của bạn"
    echo "  3. Khởi động dự án:"
    echo "     - npm run dev (chạy cả backend và frontend)"
    echo "     - hoặc ./start_network.sh"
    echo ""
    print_info "Truy cập ứng dụng:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:8000"
    echo "  - API Docs: http://localhost:8000/docs"
    echo ""
}

# Chạy main function
main

