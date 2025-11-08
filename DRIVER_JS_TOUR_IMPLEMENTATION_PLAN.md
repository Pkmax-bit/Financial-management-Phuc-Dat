# Kế Hoạch Triển Khai Driver.js Tour Guide

## 📋 Tổng Quan

Kế hoạch này sẽ hướng dẫn triển khai tour guide sử dụng [driver.js](https://driverjs.com/docs/installation) để hướng dẫn người dùng qua các workflow chính của hệ thống.

### ✨ Tính Năng Đặc Biệt

- **Liên kết các Tour**: Các tour được liên kết với nhau để tạo một flow liên tục
- **Tự Động Chuyển Trang**: Sau khi hoàn thành một tour, hệ thống tự động chuyển sang trang tiếp theo và bắt đầu tour mới
- **Quản Lý Tour Flow**: Quản lý toàn bộ flow từ đầu đến cuối
- **Lưu Tiến Độ**: Lưu trạng thái tour flow để người dùng có thể tiếp tục sau

## 🎯 Các Tour Cần Triển Khai

1. **Tour Tạo Khách Hàng** - `/customers`
2. **Tour Tạo Dự Án** - `/projects`
3. **Tour Tạo Báo Giá** - `/sales/quotes`
   - Chọn sản phẩm
   - Chọn vật tư
   - Điều chỉnh kích thước
4. **Tour Gửi Báo Giá** - `/sales/quotes/{quoteId}`
5. **Tour Duyệt Báo Giá** - `/approve-quote/{quoteId}`
6. **Tour Tạo Chi Phí Thực Tế** - `/expenses` (category: actual)
7. **Tour Tạo Chi Phí Kế Hoạch** - `/expenses` (category: planned)

---

## 📦 Bước 1: Cài Đặt Driver.js

### 1.1 Cài đặt package

```bash
cd frontend
npm install driver.js
```

### 1.2 Kiểm tra package.json

Đảm bảo `driver.js` đã được thêm vào `dependencies`:
```json
{
  "dependencies": {
    "driver.js": "^2.x.x"
  }
}
```

---

## 🏗️ Bước 2: Tạo Tour Guide Service

### 2.1 Tạo file `frontend/src/services/tourGuide.ts`

Service này sẽ quản lý tất cả các tour guides:

```typescript
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export type TourName = 
  | 'create-customer'
  | 'create-project'
  | 'create-quote'
  | 'send-quote'
  | 'approve-quote'
  | 'create-actual-cost'
  | 'create-planned-cost';

export interface TourFlowStep {
  tourName: TourName
  route: string
  title: string
  description: string
}

export interface TourFlowConfig {
  flowId: string
  name: string
  description: string
  steps: TourFlowStep[]
}

export class TourGuideService {
  private driver: ReturnType<typeof driver>;
  private currentFlow: TourFlowConfig | null = null;
  private currentFlowIndex: number = -1;
  private onCompleteCallback: ((nextTour?: TourFlowStep) => void) | null = null;

  constructor() {
    this.driver = driver({
      showProgress: true,
      allowClose: true,
      overlayColor: '#000',
      overlayOpacity: 0.5,
      stagePadding: 4,
      stageRadius: 8,
      popoverClass: 'driverjs-theme',
      popoverOffset: 10,
      smoothScroll: true,
      animate: true,
      keyboardControl: true,
      disableActiveInteraction: false,
      onDestroyStarted: () => {
        // Khi tour kết thúc, kiểm tra xem có tour tiếp theo không
        this.handleTourComplete();
      },
    });
  }

  // Định nghĩa các tour flows
  private getTourFlows(): TourFlowConfig[] {
    return [
      {
        flowId: 'complete-workflow',
        name: 'Quy Trình Hoàn Chỉnh',
        description: 'Hướng dẫn từ tạo khách hàng đến tạo chi phí',
        steps: [
          {
            tourName: 'create-customer',
            route: '/customers',
            title: 'Bước 1: Tạo Khách Hàng',
            description: 'Tạo khách hàng mới trong hệ thống'
          },
          {
            tourName: 'create-project',
            route: '/projects',
            title: 'Bước 2: Tạo Dự Án',
            description: 'Tạo dự án và liên kết với khách hàng'
          },
          {
            tourName: 'create-quote',
            route: '/sales',
            title: 'Bước 3: Tạo Báo Giá',
            description: 'Tạo báo giá với sản phẩm và vật tư'
          },
          {
            tourName: 'create-planned-cost',
            route: '/expenses',
            title: 'Bước 4: Tạo Chi Phí Kế Hoạch',
            description: 'Lập kế hoạch chi phí cho dự án'
          },
          {
            tourName: 'create-actual-cost',
            route: '/expenses',
            title: 'Bước 5: Tạo Chi Phí Thực Tế',
            description: 'Nhập chi phí thực tế của dự án'
          }
        ]
      },
      {
        flowId: 'quote-workflow',
        name: 'Quy Trình Báo Giá',
        description: 'Hướng dẫn từ tạo báo giá đến duyệt báo giá',
        steps: [
          {
            tourName: 'create-quote',
            route: '/sales',
            title: 'Bước 1: Tạo Báo Giá',
            description: 'Tạo báo giá với sản phẩm và vật tư'
          },
          {
            tourName: 'send-quote',
            route: '/sales/quotes', // Cần quote ID, sẽ được xử lý động
            title: 'Bước 2: Gửi Báo Giá',
            description: 'Gửi báo giá đến khách hàng'
          },
          {
            tourName: 'approve-quote',
            route: '/approve-quote', // Cần quote ID, sẽ được xử lý động
            title: 'Bước 3: Duyệt Báo Giá',
            description: 'Duyệt báo giá đã gửi'
          }
        ]
      }
    ];
  }

  // Lấy tour flow theo ID
  getTourFlow(flowId: string): TourFlowConfig | null {
    return this.getTourFlows().find(flow => flow.flowId === flowId) || null;
  }

  // Bắt đầu một tour flow
  startTourFlow(flowId: string, onComplete?: (nextTour?: TourFlowStep) => void) {
    const flow = this.getTourFlow(flowId);
    if (!flow) {
      console.error(`Tour flow "${flowId}" không tồn tại`);
      return;
    }

    this.currentFlow = flow;
    this.currentFlowIndex = 0;
    this.onCompleteCallback = onComplete || null;

    // Bắt đầu tour đầu tiên trong flow
    const firstStep = flow.steps[0];
    this.startTour(firstStep.tourName);
  }

  // Xử lý khi tour hoàn thành
  private handleTourComplete() {
    if (!this.currentFlow || this.currentFlowIndex < 0) {
      return;
    }

    // Kiểm tra xem còn tour tiếp theo không
    const nextIndex = this.currentFlowIndex + 1;
    if (nextIndex < this.currentFlow.steps.length) {
      const nextStep = this.currentFlow.steps[nextIndex];
      
      // Gọi callback để chuyển trang
      if (this.onCompleteCallback) {
        this.onCompleteCallback(nextStep);
      }
    } else {
      // Flow đã hoàn thành
      this.currentFlow = null;
      this.currentFlowIndex = -1;
      if (this.onCompleteCallback) {
        this.onCompleteCallback(undefined);
      }
    }
  }

  // Tiếp tục tour flow (sau khi đã chuyển trang)
  continueTourFlow(tourName: TourName) {
    if (!this.currentFlow) {
      return;
    }

    const stepIndex = this.currentFlow.steps.findIndex(step => step.tourName === tourName);
    if (stepIndex >= 0) {
      this.currentFlowIndex = stepIndex;
      this.startTour(tourName);
    }
  }

  // Lấy ID của flow hiện tại
  getCurrentFlowId(): string | null {
    return this.currentFlow?.flowId || null;
  }

  // Lấy index của step hiện tại
  getCurrentFlowIndex(): number {
    return this.currentFlowIndex;
  }

  // Dừng tour flow hiện tại
  stopTourFlow() {
    this.currentFlow = null;
    this.currentFlowIndex = -1;
    this.onCompleteCallback = null;
    this.driver.destroy();
  }

  // Tour: Tạo Khách Hàng
  startCreateCustomerTour() {
    const steps = [
      {
        element: '#create-customer-button', // Nút "Tạo khách hàng"
        popover: {
          title: '🏢 Bước 1: Tạo Khách Hàng Mới',
          description: 'Nhấn vào nút này để mở form tạo khách hàng mới. Sau khi hoàn thành, hệ thống sẽ tự động chuyển sang bước tiếp theo.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#customer-code-input',
        popover: {
          title: '📝 Mã Khách Hàng',
          description: 'Mã khách hàng sẽ được tự động tạo (VD: CUS001, CUS002). Bạn có thể để trống hoặc nhập mã tùy chỉnh.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#customer-name-input',
        popover: {
          title: '👤 Tên Khách Hàng',
          description: 'Nhập tên đầy đủ của khách hàng (cá nhân hoặc công ty).',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#customer-type-select',
        popover: {
          title: '🏷️ Loại Khách Hàng',
          description: 'Chọn loại khách hàng: Cá nhân, Công ty, hoặc Cơ quan nhà nước.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#customer-email-input',
        popover: {
          title: '📧 Email',
          description: 'Nhập địa chỉ email của khách hàng (tùy chọn).',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#customer-phone-input',
        popover: {
          title: '📞 Số Điện Thoại',
          description: 'Nhập số điện thoại liên hệ của khách hàng (tùy chọn).',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#submit-customer-button',
        popover: {
          title: '✅ Hoàn Tất',
          description: 'Nhấn nút này để lưu thông tin khách hàng. Sau khi tạo thành công, hệ thống sẽ tự động chuyển sang trang tạo dự án và bắt đầu tour tiếp theo.',
          side: 'top',
          align: 'center'
        }
      }
    ];

    this.driver.setSteps(steps);
    this.driver.drive();
  }

  // Tour: Tạo Dự Án
  startCreateProjectTour() {
    const steps = [
      {
        element: '#create-project-button',
        popover: {
          title: '🏗️ Bước 2: Tạo Dự Án',
          description: 'Nhấn vào nút này để mở form tạo dự án mới.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#project-code-input',
        popover: {
          title: '📝 Mã Dự Án',
          description: 'Mã dự án sẽ được tự động tạo (VD: PRJ001, PRJ002).',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#project-name-input',
        popover: {
          title: '📋 Tên Dự Án',
          description: 'Nhập tên dự án (VD: "Xây dựng nhà ở ABC").',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#project-customer-select',
        popover: {
          title: '👥 Chọn Khách Hàng',
          description: 'Chọn khách hàng đã tạo ở bước trước. Dự án sẽ được liên kết với khách hàng này.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#project-manager-select',
        popover: {
          title: '👨‍💼 Project Manager',
          description: 'Chọn nhân viên quản lý dự án từ danh sách.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#project-budget-input',
        popover: {
          title: '💰 Ngân Sách Dự Án',
          description: 'Nhập ngân sách dự kiến cho dự án (VNĐ).',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#submit-project-button',
        popover: {
          title: '✅ Hoàn Tất',
          description: 'Nhấn nút này để tạo dự án. Sau khi tạo thành công, hệ thống sẽ tự động chuyển sang trang tạo báo giá và bắt đầu tour tiếp theo.',
          side: 'top',
          align: 'center'
        }
      }
    ];

    this.driver.setSteps(steps);
    this.driver.drive();
  }

  // Tour: Tạo Báo Giá
  startCreateQuoteTour() {
    const steps = [
      {
        element: '#create-quote-button',
        popover: {
          title: '📄 Bước 3: Tạo Báo Giá',
          description: 'Nhấn vào nút này để mở form tạo báo giá mới.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#quote-customer-select',
        popover: {
          title: '👥 Chọn Khách Hàng',
          description: 'Chọn khách hàng đã tạo ở bước 1.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#quote-project-select',
        popover: {
          title: '🏗️ Chọn Dự Án',
          description: 'Chọn dự án đã tạo ở bước 2. Dự án này sẽ được liên kết với báo giá.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#quote-items-section',
        popover: {
          title: '📦 Thêm Sản Phẩm/Vật Tư',
          description: 'Trong phần này, bạn sẽ thêm các sản phẩm và vật tư vào báo giá.',
          side: 'left',
          align: 'start'
        }
      },
      {
        element: '#add-item-button',
        popover: {
          title: '➕ Thêm Item Mới',
          description: 'Nhấn nút này để thêm một dòng sản phẩm/vật tư mới.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#product-picker-button',
        popover: {
          title: '🛍️ Chọn Sản Phẩm',
          description: 'Nhấn vào nút này để chọn sản phẩm từ danh sách. Bạn có thể chọn nhiều sản phẩm cùng lúc.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#material-picker-button',
        popover: {
          title: '🧱 Chọn Vật Tư',
          description: 'Nhấn vào nút này để chọn vật tư từ danh sách. Vật tư bao gồm: xi măng, gạch, thép, v.v.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#dimensions-section',
        popover: {
          title: '📐 Điều Chỉnh Kích Thước',
          description: 'Trong phần này, bạn có thể nhập kích thước (chiều dài, chiều rộng, chiều cao) để tính toán số lượng vật tư chính xác.',
          side: 'top',
          align: 'start'
        }
      },
      {
        element: '#length-input',
        popover: {
          title: '📏 Chiều Dài',
          description: 'Nhập chiều dài (đơn vị: mét).',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#width-input',
        popover: {
          title: '📏 Chiều Rộng',
          description: 'Nhập chiều rộng (đơn vị: mét).',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#height-input',
        popover: {
          title: '📏 Chiều Cao',
          description: 'Nhập chiều cao (đơn vị: mét). Hệ thống sẽ tự động tính diện tích và thể tích.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#quantity-input',
        popover: {
          title: '🔢 Số Lượng',
          description: 'Nhập số lượng sản phẩm/vật tư. Có thể điều chỉnh sau khi đã nhập kích thước.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#unit-price-input',
        popover: {
          title: '💰 Đơn Giá',
          description: 'Nhập đơn giá cho mỗi đơn vị (VNĐ).',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#save-quote-button',
        popover: {
          title: '💾 Lưu Báo Giá',
          description: 'Nhấn nút này để lưu báo giá ở trạng thái "Nháp". Bạn có thể chỉnh sửa sau.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#send-quote-button',
        popover: {
          title: '📤 Gửi Báo Giá (Tùy Chọn)',
          description: 'Sau khi lưu, bạn có thể nhấn nút này để gửi báo giá đến khách hàng qua email.',
          side: 'top',
          align: 'center'
        }
      }
    ];

    this.driver.setSteps(steps);
    this.driver.drive();
  }

  // Tour: Gửi Báo Giá
  startSendQuoteTour() {
    const steps = [
      {
        element: '#quote-detail-header',
        popover: {
          title: '📄 Chi Tiết Báo Giá',
          description: 'Đây là trang chi tiết của báo giá đã tạo. Từ đây bạn có thể gửi báo giá đến khách hàng.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#quote-status-badge',
        popover: {
          title: '📊 Trạng Thái Báo Giá',
          description: 'Hiển thị trạng thái hiện tại: Nháp, Đã gửi, Đã xem, Đã duyệt, v.v.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#send-quote-action-button',
        popover: {
          title: '📧 Gửi Báo Giá',
          description: 'Nhấn nút này để gửi báo giá đến khách hàng qua email. Khách hàng sẽ nhận được link để xem và duyệt báo giá.',
          side: 'left',
          align: 'start'
        }
      },
      {
        element: '#quote-actions-menu',
        popover: {
          title: '⚙️ Các Hành Động Khác',
          description: 'Menu này chứa các hành động khác như: In PDF, Xuất Excel, Chỉnh sửa, Xóa.',
          side: 'left',
          align: 'start'
        }
      }
    ];

    this.driver.setSteps(steps);
    this.driver.drive();
  }

  // Tour: Duyệt Báo Giá
  startApproveQuoteTour() {
    const steps = [
      {
        element: '#quote-detail-page',
        popover: {
          title: '✅ Duyệt Báo Giá',
          description: 'Trang này cho phép bạn xem chi tiết báo giá và duyệt nó.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '#quote-summary-section',
        popover: {
          title: '📋 Tóm Tắt Báo Giá',
          description: 'Hiển thị thông tin cơ bản: Mã báo giá, Khách hàng, Dự án, Tổng tiền.',
          side: 'left',
          align: 'start'
        }
      },
      {
        element: '#quote-items-list',
        popover: {
          title: '📦 Danh Sách Sản Phẩm/Vật Tư',
          description: 'Hiển thị chi tiết tất cả các sản phẩm và vật tư trong báo giá.',
          side: 'left',
          align: 'start'
        }
      },
      {
        element: '#approve-quote-button',
        popover: {
          title: '✅ Duyệt Báo Giá',
          description: 'Nhấn nút này để duyệt báo giá. Sau khi duyệt, báo giá sẽ chuyển sang trạng thái "Đã duyệt" và có thể chuyển đổi thành đơn hàng.',
          side: 'top',
          align: 'center'
        }
      },
      {
        element: '#reject-quote-button',
        popover: {
          title: '❌ Từ Chối Báo Giá',
          description: 'Nếu báo giá không phù hợp, bạn có thể từ chối và thêm lý do.',
          side: 'top',
          align: 'center'
        }
      }
    ];

    this.driver.setSteps(steps);
    this.driver.drive();
  }

  // Tour: Tạo Chi Phí Thực Tế
  startCreateActualCostTour() {
    const steps = [
      {
        element: '#create-expense-button',
        popover: {
          title: '💰 Bước 4: Tạo Chi Phí Thực Tế',
          description: 'Nhấn vào nút này để mở form tạo chi phí thực tế cho dự án.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#expense-category-select',
        popover: {
          title: '📂 Loại Chi Phí',
          description: 'Chọn loại chi phí: Vật tư, Nhân công, Dịch vụ, Chi phí chung, v.v.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#expense-project-select',
        popover: {
          title: '🏗️ Chọn Dự Án',
          description: 'Chọn dự án mà chi phí này thuộc về.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#expense-description-input',
        popover: {
          title: '📝 Mô Tả Chi Phí',
          description: 'Nhập mô tả chi tiết về chi phí này (VD: "Mua xi măng cho dự án ABC").',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#expense-amount-input',
        popover: {
          title: '💵 Số Tiền',
          description: 'Nhập số tiền thực tế đã chi (VNĐ). Đây là chi phí thực tế, không phải dự kiến.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#expense-date-input',
        popover: {
          title: '📅 Ngày Chi Phí',
          description: 'Chọn ngày mà chi phí này phát sinh.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#expense-receipt-upload',
        popover: {
          title: '🧾 Tải Lên Hóa Đơn',
          description: 'Tải lên hình ảnh hóa đơn/chứng từ để làm bằng chứng cho chi phí này (tùy chọn).',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#submit-actual-cost-button',
        popover: {
          title: '✅ Lưu Chi Phí Thực Tế',
          description: 'Nhấn nút này để lưu chi phí thực tế. Chi phí này sẽ được thêm vào tổng chi phí thực tế của dự án.',
          side: 'top',
          align: 'center'
        }
      }
    ];

    this.driver.setSteps(steps);
    this.driver.drive();
  }

  // Tour: Tạo Chi Phí Kế Hoạch
  startCreatePlannedCostTour() {
    const steps = [
      {
        element: '#create-planned-expense-button',
        popover: {
          title: '📊 Bước 5: Tạo Chi Phí Kế Hoạch',
          description: 'Nhấn vào nút này để mở form tạo chi phí kế hoạch (chi phí dự kiến) cho dự án.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#planned-expense-project-select',
        popover: {
          title: '🏗️ Chọn Dự Án',
          description: 'Chọn dự án mà bạn muốn lập kế hoạch chi phí.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#planned-expense-object-select',
        popover: {
          title: '🎯 Chọn Đối Tượng Chi Phí',
          description: 'Chọn đối tượng chi phí từ danh mục (VD: "Vật tư - Xi măng", "Nhân công - Thợ xây").',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#planned-expense-amount-input',
        popover: {
          title: '💰 Số Tiền Dự Kiến',
          description: 'Nhập số tiền dự kiến cho chi phí này (VNĐ). Đây là ngân sách kế hoạch, không phải chi phí thực tế.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#planned-expense-description-input',
        popover: {
          title: '📝 Mô Tả Chi Phí Kế Hoạch',
          description: 'Nhập mô tả về chi phí kế hoạch này (VD: "Dự kiến chi phí mua gạch cho dự án").',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#planned-expense-date-input',
        popover: {
          title: '📅 Ngày Dự Kiến',
          description: 'Chọn ngày dự kiến mà chi phí này sẽ phát sinh.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#submit-planned-cost-button',
        popover: {
          title: '✅ Lưu Chi Phí Kế Hoạch',
          description: 'Nhấn nút này để lưu chi phí kế Hoạch. Chi phí này sẽ được so sánh với chi phí thực tế để theo dõi chênh lệch ngân sách.',
          side: 'top',
          align: 'center'
        }
      }
    ];

    this.driver.setSteps(steps);
    this.driver.drive();
  }

  // Hàm để bắt đầu tour theo tên
  startTour(tourName: TourName) {
    switch (tourName) {
      case 'create-customer':
        this.startCreateCustomerTour();
        break;
      case 'create-project':
        this.startCreateProjectTour();
        break;
      case 'create-quote':
        this.startCreateQuoteTour();
        break;
      case 'send-quote':
        this.startSendQuoteTour();
        break;
      case 'approve-quote':
        this.startApproveQuoteTour();
        break;
      case 'create-actual-cost':
        this.startCreateActualCostTour();
        break;
      case 'create-planned-cost':
        this.startCreatePlannedCostTour();
        break;
      default:
        console.warn(`Tour "${tourName}" không tồn tại.`);
    }
  }

  // Hàm để dừng tour
  stopTour() {
    this.driver.destroy();
  }

  // Hàm để bỏ qua tour hiện tại
  skipTour() {
    this.driver.destroy();
  }
}

// Export singleton instance
export const tourGuideService = new TourGuideService();
```

---

## 🎨 Bước 3: Tạo Tour Guide Component

### 3.1 Tạo file `frontend/src/components/tour/TourGuideButton.tsx`

Component này sẽ hiển thị nút để bắt đầu tour:

```typescript
'use client'

import { useState } from 'react'
import { HelpCircle, Play, X } from 'lucide-react'
import { tourGuideService, TourName } from '@/services/tourGuide'

interface TourGuideButtonProps {
  tourName: TourName
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  autoStart?: boolean
}

export default function TourGuideButton({ 
  tourName, 
  position = 'bottom-right',
  autoStart = false 
}: TourGuideButtonProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleStartTour = () => {
    tourGuideService.startTour(tourName)
    setIsVisible(false)
  }

  if (!isVisible) return null

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }

  return (
    <button
      onClick={handleStartTour}
      className={`fixed ${positionClasses[position]} z-50 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all duration-200`}
      title="Bắt đầu hướng dẫn"
    >
      <HelpCircle className="w-5 h-5" />
      <span>Hướng dẫn</span>
    </button>
  )
}
```

### 3.2 Tạo file `frontend/src/components/tour/TourGuideWrapper.tsx`

Component wrapper để tự động bắt đầu tour khi trang load:

```typescript
'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { tourGuideService, TourName, TourFlowStep } from '@/services/tourGuide'

interface TourGuideWrapperProps {
  tourName: TourName
  children: React.ReactNode
  autoStart?: boolean
  continueFlow?: boolean // Tiếp tục tour flow nếu có
}

export default function TourGuideWrapper({ 
  tourName, 
  children, 
  autoStart = false,
  continueFlow = false
}: TourGuideWrapperProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    // Kiểm tra xem có đang trong tour flow không
    const flowId = searchParams?.get('flow')
    const flowStep = searchParams?.get('step')
    
    // Nếu đang trong flow và có step parameter, tiếp tục flow
    if (continueFlow && flowId && flowStep) {
      setTimeout(() => {
        tourGuideService.continueTourFlow(tourName)
      }, 500)
      return
    }

    // Auto-start tour nếu có query param `tour` hoặc `autoStart = true`
    const shouldStartTour = autoStart || searchParams?.get('tour') === tourName
    
    if (shouldStartTour) {
      // Delay một chút để đảm bảo DOM đã render xong
      setTimeout(() => {
        tourGuideService.startTour(tourName)
      }, 500)
    }
  }, [tourName, autoStart, continueFlow, searchParams])

  return <>{children}</>
}
```

### 3.3 Tạo file `frontend/src/components/tour/TourFlowManager.tsx`

Component để quản lý tour flow và tự động chuyển trang:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { tourGuideService, TourFlowConfig, TourFlowStep } from '@/services/tourGuide'

interface TourFlowManagerProps {
  children: React.ReactNode
}

export default function TourFlowManager({ children }: TourFlowManagerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isFlowActive, setIsFlowActive] = useState(false)

  useEffect(() => {
    // Lắng nghe khi tour hoàn thành để chuyển trang
    const handleTourComplete = (nextStep?: TourFlowStep) => {
      if (nextStep) {
        // Lưu trạng thái flow vào sessionStorage
        const flowState = {
          flowId: tourGuideService.getCurrentFlowId(),
          stepIndex: tourGuideService.getCurrentFlowIndex()
        }
        sessionStorage.setItem('tourFlowState', JSON.stringify(flowState))

        // Chuyển trang với query params
        const url = new URL(nextStep.route, window.location.origin)
        url.searchParams.set('flow', flowState.flowId || '')
        url.searchParams.set('step', nextStep.tourName)
        url.searchParams.set('tour', nextStep.tourName)
        url.searchParams.set('continueFlow', 'true')

        router.push(url.pathname + url.search)
        
        // Đợi một chút để trang render, sau đó tiếp tục tour
        setTimeout(() => {
          tourGuideService.continueTourFlow(nextStep.tourName)
        }, 1000)
      } else {
        // Flow đã hoàn thành
        sessionStorage.removeItem('tourFlowState')
        setIsFlowActive(false)
      }
    }

    // Kiểm tra xem có tour flow đang chạy không
    const flowStateStr = sessionStorage.getItem('tourFlowState')
    if (flowStateStr) {
      try {
        const flowState = JSON.parse(flowStateStr)
        const flow = tourGuideService.getTourFlow(flowState.flowId)
        if (flow) {
          setIsFlowActive(true)
          // Kiểm tra xem tour hiện tại có match với step trong flow không
          const currentStep = flow.steps[flowState.stepIndex]
          if (currentStep) {
            // Đợi trang render xong
            setTimeout(() => {
              tourGuideService.continueTourFlow(currentStep.tourName)
            }, 500)
          }
        }
      } catch (e) {
        console.error('Error parsing tour flow state:', e)
        sessionStorage.removeItem('tourFlowState')
      }
    }
  }, [pathname, router])

  return <>{children}</>
}
```

**Lưu ý**: Cần thêm các method sau vào `TourGuideService`:
- `getCurrentFlowId()`: Trả về ID của flow hiện tại
- `getCurrentFlowIndex()`: Trả về index của step hiện tại

---

## 🔧 Bước 4: Thêm ID cho các Element

Cần thêm các ID cho các element trong các component để driver.js có thể tìm thấy chúng:

### 4.1 Cập nhật `frontend/src/app/customers/page.tsx`

Thêm các ID sau:
- `#create-customer-button` - Nút "Tạo khách hàng"
- `#customer-code-input` - Input mã khách hàng
- `#customer-name-input` - Input tên khách hàng
- `#customer-type-select` - Select loại khách hàng
- `#customer-email-input` - Input email
- `#customer-phone-input` - Input số điện thoại
- `#submit-customer-button` - Nút submit

### 4.2 Cập nhật `frontend/src/components/projects/CreateProjectModal.tsx`

Thêm các ID:
- `#create-project-button` - Nút "Tạo dự án"
- `#project-code-input` - Input mã dự án
- `#project-name-input` - Input tên dự án
- `#project-customer-select` - Select khách hàng
- `#project-manager-select` - Select project manager
- `#project-budget-input` - Input ngân sách
- `#submit-project-button` - Nút submit

### 4.3 Cập nhật `frontend/src/components/sales/CreateQuoteSidebarFullscreen.tsx`

Thêm các ID:
- `#create-quote-button` - Nút "Tạo báo giá"
- `#quote-customer-select` - Select khách hàng
- `#quote-project-select` - Select dự án
- `#quote-items-section` - Section danh sách items
- `#add-item-button` - Nút thêm item
- `#product-picker-button` - Nút chọn sản phẩm
- `#material-picker-button` - Nút chọn vật tư
- `#dimensions-section` - Section kích thước
- `#length-input` - Input chiều dài
- `#width-input` - Input chiều rộng
- `#height-input` - Input chiều cao
- `#quantity-input` - Input số lượng
- `#unit-price-input` - Input đơn giá
- `#save-quote-button` - Nút lưu
- `#send-quote-button` - Nút gửi

### 4.4 Cập nhật các component khác tương tự

---

## 🎯 Bước 5: Tích Hợp Tour Guide vào Các Trang

### 5.1 Cập nhật Layout Root (`layout.tsx`)

Thêm `TourFlowManager` vào layout root để quản lý tour flow toàn cục:

```typescript
// frontend/src/app/layout.tsx
import TourFlowManager from '@/components/tour/TourFlowManager'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <TourFlowManager>
          {children}
        </TourFlowManager>
      </body>
    </html>
  )
}
```

### 5.2 Trang Khách Hàng (`/customers`)

```typescript
// frontend/src/app/customers/page.tsx
import TourGuideButton from '@/components/tour/TourGuideButton'
import TourGuideWrapper from '@/components/tour/TourGuideWrapper'
import { useSearchParams } from 'next/navigation'

export default function CustomersPage() {
  const searchParams = useSearchParams()
  const continueFlow = searchParams?.get('continueFlow') === 'true'

  return (
    <TourGuideWrapper 
      tourName="create-customer" 
      continueFlow={continueFlow}
    >
      <LayoutWithSidebar>
        {/* ... existing code ... */}
        <TourGuideButton tourName="create-customer" />
      </LayoutWithSidebar>
    </TourGuideWrapper>
  )
}
```

### 5.3 Trang Dự Án (`/projects`)

```typescript
// frontend/src/app/projects/page.tsx
import TourGuideButton from '@/components/tour/TourGuideButton'
import TourGuideWrapper from '@/components/tour/TourGuideWrapper'
import { useSearchParams } from 'next/navigation'

export default function ProjectsPage() {
  const searchParams = useSearchParams()
  const continueFlow = searchParams?.get('continueFlow') === 'true'

  return (
    <TourGuideWrapper 
      tourName="create-project"
      continueFlow={continueFlow}
    >
      <LayoutWithSidebar>
        {/* ... existing code ... */}
        <TourGuideButton tourName="create-project" />
      </LayoutWithSidebar>
    </TourGuideWrapper>
  )
}
```

### 5.4 Trang Báo Giá (`/sales`)

Tương tự cho các trang khác với `continueFlow` prop.

---

## 🎨 Bước 6: Tùy Chỉnh Theme (Tùy Chọn)

Tạo file `frontend/src/styles/driverjs-theme.css`:

```css
.driverjs-theme {
  background: white;
  color: #333;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.driverjs-theme .driver-popover-title {
  font-size: 18px;
  font-weight: 600;
  color: #2563eb;
}

.driverjs-theme .driver-popover-description {
  font-size: 14px;
  line-height: 1.6;
  color: #666;
  margin-top: 8px;
}

.driverjs-theme .driver-popover-footer {
  margin-top: 16px;
}

.driverjs-theme .driver-btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
}

.driverjs-theme .driver-btn-primary {
  background: #2563eb;
  color: white;
}

.driverjs-theme .driver-btn-primary:hover {
  background: #1d4ed8;
}
```

Import vào `globals.css`:
```css
@import './driverjs-theme.css';
```

---

## 📝 Bước 7: Tạo Tour Guide Menu với Tour Flow

### 7.1 Cập nhật Tour Guide Menu

Cập nhật menu để hỗ trợ tour flows:

```typescript
// frontend/src/components/tour/TourGuideMenu.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HelpCircle, X, Play, ArrowRight } from 'lucide-react'
import { tourGuideService, TourName, TourFlowConfig } from '@/services/tourGuide'

const tours: { name: TourName; label: string; description: string }[] = [
  { name: 'create-customer', label: 'Tạo Khách Hàng', description: 'Hướng dẫn tạo khách hàng mới' },
  { name: 'create-project', label: 'Tạo Dự Án', description: 'Hướng dẫn tạo dự án mới' },
  { name: 'create-quote', label: 'Tạo Báo Giá', description: 'Hướng dẫn tạo báo giá với sản phẩm và vật tư' },
  { name: 'send-quote', label: 'Gửi Báo Giá', description: 'Hướng dẫn gửi báo giá đến khách hàng' },
  { name: 'approve-quote', label: 'Duyệt Báo Giá', description: 'Hướng dẫn duyệt báo giá' },
  { name: 'create-actual-cost', label: 'Tạo Chi Phí Thực Tế', description: 'Hướng dẫn nhập chi phí thực tế' },
  { name: 'create-planned-cost', label: 'Tạo Chi Phí Kế Hoạch', description: 'Hướng dẫn lập kế hoạch chi phí' },
]

export default function TourGuideMenu() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleStartTour = (tourName: TourName) => {
    tourGuideService.startTour(tourName)
    setIsOpen(false)
  }

  const handleStartTourFlow = (flowId: string) => {
    const flow = tourGuideService.getTourFlow(flowId)
    if (!flow) return

    // Xác định route của bước đầu tiên
    const firstStep = flow.steps[0]
    const url = new URL(firstStep.route, window.location.origin)
    url.searchParams.set('flow', flowId)
    url.searchParams.set('step', firstStep.tourName)
    url.searchParams.set('tour', firstStep.tourName)

    // Chuyển đến trang đầu tiên và bắt đầu flow
    router.push(url.pathname + url.search)
    
    // Bắt đầu flow sau khi chuyển trang
    setTimeout(() => {
      tourGuideService.startTourFlow(flowId, (nextStep) => {
        if (nextStep) {
          const nextUrl = new URL(nextStep.route, window.location.origin)
          nextUrl.searchParams.set('flow', flowId)
          nextUrl.searchParams.set('step', nextStep.tourName)
          nextUrl.searchParams.set('tour', nextStep.tourName)
          nextUrl.searchParams.set('continueFlow', 'true')
          router.push(nextUrl.pathname + nextUrl.search)
        }
      })
    }, 500)

    setIsOpen(false)
  }

  const tourFlows: TourFlowConfig[] = [
    {
      flowId: 'complete-workflow',
      name: 'Quy Trình Hoàn Chỉnh',
      description: 'Từ tạo khách hàng → dự án → báo giá → chi phí',
      steps: []
    },
    {
      flowId: 'quote-workflow',
      name: 'Quy Trình Báo Giá',
      description: 'Từ tạo báo giá → gửi → duyệt',
      steps: []
    }
  ]

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200"
        title="Mở menu hướng dẫn"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl p-4 w-96 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Hướng Dẫn</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tour Flows Section */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">📚 Quy Trình Đầy Đủ</h4>
        <div className="space-y-2">
          {tourFlows.map((flow) => (
            <button
              key={flow.flowId}
              onClick={() => handleStartTourFlow(flow.flowId)}
              className="w-full text-left p-3 rounded-lg border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-800 flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    {flow.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{flow.description}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Individual Tours Section */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">📖 Hướng Dẫn Riêng Lẻ</h4>
        <div className="space-y-2">
          {tours.map((tour) => (
            <button
              key={tour.name}
              onClick={() => handleStartTour(tour.name)}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              <div className="font-medium text-gray-800">{tour.label}</div>
              <div className="text-sm text-gray-600 mt-1">{tour.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

Tạo component menu để người dùng có thể chọn tour muốn xem:

```typescript
// frontend/src/components/tour/TourGuideMenu.tsx
'use client'

import { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { tourGuideService, TourName } from '@/services/tourGuide'

const tours: { name: TourName; label: string; description: string }[] = [
  { name: 'create-customer', label: 'Tạo Khách Hàng', description: 'Hướng dẫn tạo khách hàng mới' },
  { name: 'create-project', label: 'Tạo Dự Án', description: 'Hướng dẫn tạo dự án mới' },
  { name: 'create-quote', label: 'Tạo Báo Giá', description: 'Hướng dẫn tạo báo giá với sản phẩm và vật tư' },
  { name: 'send-quote', label: 'Gửi Báo Giá', description: 'Hướng dẫn gửi báo giá đến khách hàng' },
  { name: 'approve-quote', label: 'Duyệt Báo Giá', description: 'Hướng dẫn duyệt báo giá' },
  { name: 'create-actual-cost', label: 'Tạo Chi Phí Thực Tế', description: 'Hướng dẫn nhập chi phí thực tế' },
  { name: 'create-planned-cost', label: 'Tạo Chi Phí Kế Hoạch', description: 'Hướng dẫn lập kế hoạch chi phí' },
]

export default function TourGuideMenu() {
  const [isOpen, setIsOpen] = useState(false)

  const handleStartTour = (tourName: TourName) => {
    tourGuideService.startTour(tourName)
    setIsOpen(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200"
        title="Mở menu hướng dẫn"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Hướng Dẫn</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="space-y-2">
        {tours.map((tour) => (
          <button
            key={tour.name}
            onClick={() => handleStartTour(tour.name)}
            className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
          >
            <div className="font-medium text-gray-800">{tour.label}</div>
            <div className="text-sm text-gray-600 mt-1">{tour.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
```

---

## ✅ Checklist Triển Khai

- [ ] Cài đặt driver.js
- [ ] Tạo tour guide service
- [ ] Tạo tour guide components
- [ ] Thêm ID cho tất cả các element cần thiết
- [ ] Tích hợp tour guide vào các trang
- [ ] Test từng tour
- [ ] Tùy chỉnh theme (nếu cần)
- [ ] Tạo tour guide menu (nếu cần)
- [ ] Cập nhật documentation

---

## 🚀 Sử Dụng

### Cách 1: Sử dụng Tour Flow (Khuyên dùng) ⭐

1. **Nhấn vào nút hướng dẫn** ở góc phải màn hình
2. **Chọn "Quy Trình Đầy Đủ"** trong menu
3. Hệ thống sẽ **tự động chuyển trang** và bắt đầu tour tiếp theo sau mỗi bước

**Ví dụ**: Chọn "Quy Trình Hoàn Chỉnh":
- Tự động chuyển từ `/customers` → `/projects` → `/sales` → `/expenses`
- Mỗi trang sẽ tự động bắt đầu tour tương ứng
- Bạn chỉ cần làm theo hướng dẫn, không cần chuyển trang thủ công

### Cách 2: Sử dụng nút hướng dẫn riêng lẻ
Mỗi trang sẽ có một nút "Hướng dẫn" ở góc phải màn hình. Nhấn vào để bắt đầu tour cho trang hiện tại.

### Cách 3: Auto-start với query parameter
Truy cập URL với query param `?tour=<tour-name>`:
- `/customers?tour=create-customer`
- `/projects?tour=create-project`
- `/sales?tour=create-quote`

### Cách 4: Sử dụng menu tour guide
Component `TourGuideMenu` sẽ hiển thị menu để:
- Chọn **Tour Flow** (quy trình đầy đủ)
- Hoặc chọn **Tour riêng lẻ** (chỉ xem hướng dẫn cho một trang)

### Cách 5: Tiếp tục Tour Flow đã dừng

Nếu bạn đã dừng tour flow giữa chừng, hệ thống sẽ tự động tiếp tục khi bạn quay lại trang tương ứng với trạng thái đã lưu.

---

## 📚 Tài Liệu Tham Khảo

- [Driver.js Documentation](https://driverjs.com/docs/installation)
- [Driver.js Examples](https://driverjs.com/docs/examples)

---

## 🎯 Lưu Ý

1. **Timing**: Đảm bảo DOM đã render xong trước khi bắt đầu tour (sử dụng `setTimeout` hoặc `useEffect`)
2. **Element IDs**: Tất cả các element cần có ID duy nhất để driver.js có thể tìm thấy
3. **Responsive**: Kiểm tra tour trên các kích thước màn hình khác nhau
4. **Accessibility**: Đảm bảo tour guide không ảnh hưởng đến accessibility của trang
5. **Tour Flow Navigation**: 
   - Sử dụng `sessionStorage` để lưu trạng thái tour flow
   - Đảm bảo delay đủ lâu để trang mới render xong trước khi bắt đầu tour tiếp theo (khuyến nghị: 500-1000ms)
   - Xử lý trường hợp người dùng đóng tab/refresh - sẽ tiếp tục tour flow khi quay lại
6. **Dynamic Routes**: Đối với các tour có route động (như `/sales/quotes/{quoteId}`), cần xử lý riêng để lấy ID từ URL hoặc state

---

## 🆕 Tính Năng Mới (v2.0)

### ✅ Tour Flow - Liên Kết Các Tour

- **Tự động chuyển trang**: Sau khi hoàn thành một tour, hệ thống tự động chuyển sang trang tiếp theo
- **Tour Flow Manager**: Component quản lý toàn bộ tour flow
- **Lưu tiến độ**: Tự động lưu trạng thái tour flow vào sessionStorage
- **Tiếp tục tour**: Có thể tiếp tục tour flow đã dừng giữa chừng
- **Multiple Flows**: Hỗ trợ nhiều tour flow khác nhau (Complete Workflow, Quote Workflow, etc.)

### 📋 Các Tour Flow Hiện Có

1. **Complete Workflow**: Tạo khách hàng → Dự án → Báo giá → Chi phí kế hoạch → Chi phí thực tế
2. **Quote Workflow**: Tạo báo giá → Gửi báo giá → Duyệt báo giá

### 🔄 Workflow

```
User clicks "Tour Flow" 
  → Start first tour 
  → User completes tour 
  → Navigate to next page 
  → Auto-start next tour 
  → Repeat until flow complete
```

---

**Người tạo**: AI Assistant  
**Ngày tạo**: 2024  
**Phiên bản**: 2.0 (với Tour Flow Support)

