import { useState } from 'react';
import { Users, FolderKanban, FileText, Receipt } from 'lucide-react';
import { CustomersModule } from './modules/customers';
import { ProjectsModule } from './modules/projects';
import { QuotesModule } from './modules/quotes';
import { InvoicesModule } from './modules/invoices';
import { ModuleType } from './types';

function App() {
  const [activeModule, setActiveModule] = useState<ModuleType>('customers');

  const navigation = [
    {
      id: 'customers' as ModuleType,
      label: 'Khách hàng',
      icon: Users,
      component: CustomersModule,
    },
    {
      id: 'projects' as ModuleType,
      label: 'Dự án',
      icon: FolderKanban,
      component: ProjectsModule,
    },
    {
      id: 'quotes' as ModuleType,
      label: 'Báo giá',
      icon: FileText,
      component: QuotesModule,
    },
    {
      id: 'invoices' as ModuleType,
      label: 'Hóa đơn',
      icon: Receipt,
      component: InvoicesModule,
    },
  ];

  const ActiveModuleComponent =
    navigation.find((nav) => nav.id === activeModule)?.component || CustomersModule;

  return (
    <div className="h-screen flex bg-[#F5F7F8]">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-[#E1E3E5] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#E1E3E5]">
          <h1 className="text-xl font-bold text-[#2066B0]">
            Quản lý Tài chính
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1">Bitrix24-inspired</p>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded transition-all
                    ${
                      isActive
                        ? 'bg-[#E8F4FD] text-[#2066B0] font-semibold'
                        : 'text-[#535C69] hover:bg-[#F5F7F8]'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#E1E3E5]">
          <div className="text-xs text-[#9CA3AF] text-center">
            <p>Design inspired by Bitrix24</p>
            <p className="mt-1">Built with React & Tailwind CSS</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ActiveModuleComponent />
      </div>
    </div>
  );
}

export default App;
