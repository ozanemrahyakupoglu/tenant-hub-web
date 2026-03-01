import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import trTR from 'antd/locale/tr_TR';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Permissions from './pages/Permissions';
import RealEstates from './pages/RealEstates';
import Rents from './pages/Rents';
import Payments from './pages/Payments';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ConfigProvider
      locale={trTR}
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorInfo: '#3b82f6',
          borderRadius: 10,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          colorBgLayout: '#f0f2f5',
          controlHeight: 38,
        },
        components: {
          Button: {
            borderRadius: 8,
            controlHeight: 38,
            primaryShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
          },
          Card: {
            borderRadiusLG: 12,
            boxShadowTertiary: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
          },
          Table: {
            headerBg: '#fafafa',
            headerColor: '#6b7280',
            rowHoverBg: '#f8fafc',
            borderColor: '#f0f0f0',
            headerBorderRadius: 10,
          },
          Input: {
            borderRadius: 8,
            controlHeight: 38,
          },
          Select: {
            borderRadius: 8,
            controlHeight: 38,
          },
          Modal: {
            borderRadiusLG: 16,
            titleFontSize: 18,
          },
          Menu: {
            darkItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(255,255,255,0.15)',
            darkItemHoverBg: 'rgba(255,255,255,0.08)',
            darkItemSelectedColor: '#fff',
            itemBorderRadius: 8,
            itemMarginInline: 8,
            iconSize: 18,
          },
          Tag: {
            borderRadiusSM: 6,
          },
          DatePicker: {
            borderRadius: 8,
            controlHeight: 38,
          },
          InputNumber: {
            borderRadius: 8,
            controlHeight: 38,
          },
        },
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/permissions" element={<Permissions />} />
              <Route path="/real-estates" element={<RealEstates />} />
              <Route path="/rents" element={<Rents />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/tenants" element={<Tenants />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}
