import { useMemo, useState } from 'react';
import { Layout, Menu, Button, Typography, Avatar, Dropdown, theme } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  SafetyOutlined,
  CrownOutlined,
  HomeOutlined,
  DollarOutlined,
  WalletOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;

interface MenuItem {
  key: string;
  icon: ReactNode;
  label: string;
  requiredPermission?: string;
}

const allMenuItems: MenuItem[] = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/users', icon: <UserOutlined />, label: 'Kullanıcılar', requiredPermission: 'USER_READ' },
  { key: '/roles', icon: <CrownOutlined />, label: 'Roller', requiredPermission: 'ROLES_READ' },
  { key: '/permissions', icon: <SafetyOutlined />, label: 'Yetkiler', requiredPermission: 'PERMISSION_READ' },
  { key: '/real-estates', icon: <HomeOutlined />, label: 'Gayrimenkuller', requiredPermission: 'REAL_ESTATE_READ' },
  { key: '/rents', icon: <DollarOutlined />, label: 'Kiralama', requiredPermission: 'RENT_READ' },
  { key: '/payments', icon: <WalletOutlined />, label: 'Ödemeler', requiredPermission: 'PAYMENT_READ' },
  { key: '/tenants', icon: <TeamOutlined />, label: 'Kiracılar', requiredPermission: 'TENANT_READ' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Ayarlar' },
];

export default function MainLayout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { token: { borderRadiusLG } } = theme.useToken();

  const menuItems = useMemo(
    () => allMenuItems
      .filter((item) => !item.requiredPermission || hasPermission(item.requiredPermission))
      .map(({ requiredPermission: _, ...item }) => item),
    [hasPermission],
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profil',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Ayarlar',
      onClick: () => navigate('/settings'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Çıkış Yap',
      danger: true,
      onClick: async () => { await logout(); navigate('/login', { replace: true }); },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        style={{
          background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          boxShadow: '2px 0 12px rgba(0,0,0,0.08)',
          overflow: 'auto',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 10,
        }}
      >
        <div style={{
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: '0 16px',
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 800,
            color: '#fff',
            backdropFilter: 'blur(4px)',
          }}>
            T
          </div>
          {!collapsed && (
            <span style={{
              color: '#fff',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: -0.5,
            }}>
              Tenant Hub
            </span>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            borderRight: 'none',
            padding: '4px 0',
          }}
        />
      </Sider>

      <Layout style={{
        marginLeft: collapsed ? 80 : 260,
        transition: 'margin-left 0.2s',
        background: '#f5f5f9',
      }}>
        <Header style={{
          padding: '0 28px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          position: 'sticky',
          top: 0,
          zIndex: 9,
          height: 64,
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 18, width: 40, height: 40 }}
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              padding: '4px 12px',
              borderRadius: 10,
              transition: 'background 0.2s',
            }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Avatar
                size={36}
                style={{
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {user.username.substring(0, 2).toUpperCase()}
              </Avatar>
              <div style={{ lineHeight: 1.3 }}>
                <Typography.Text strong style={{ display: 'block', fontSize: 14 }}>
                  {user.username}
                </Typography.Text>
              </div>
            </div>
          </Dropdown>
        </Header>

        <Content style={{
          margin: 24,
          padding: 28,
          background: '#fff',
          borderRadius: borderRadiusLG,
          minHeight: 280,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
