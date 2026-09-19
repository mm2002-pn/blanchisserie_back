import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PageHeaderProvider } from '@/context/PageHeaderContext';

export function MainLayout() {
  return (
    <PageHeaderProvider>
      <div className="min-h-screen bg-paper-2">
        <Sidebar />

        <div className="ml-64 flex flex-col min-h-screen">
          <Header />

          <main className="flex-1 p-7">
            <Outlet />
          </main>
        </div>
      </div>
    </PageHeaderProvider>
  );
}
