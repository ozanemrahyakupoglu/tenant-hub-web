import { useEffect, useState } from 'react';
import { Card, Col, Row, Spin, Statistic, Typography } from 'antd';
import { HomeOutlined, UserOutlined, DollarOutlined, WalletOutlined, BankOutlined, ShopOutlined, TeamOutlined, KeyOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, type DashboardStats } from '../services/dashboardService';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Gayrimenkuller',
      value: stats?.totalRealEstates,
      icon: <HomeOutlined />,
      gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    },
    {
      title: 'Kullanıcılar',
      value: stats?.totalUsers,
      icon: <UserOutlined />,
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
    },
    {
      title: 'Kiralamalar',
      value: stats?.totalRents,
      icon: <DollarOutlined />,
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    },
    {
      title: 'Ödemeler',
      value: stats?.totalPayments,
      icon: <WalletOutlined />,
      gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    },
    {
      title: 'Kiraya Verilmiş',
      value: stats?.rentedRealEstates,
      icon: <BankOutlined />,
      gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    },
    {
      title: 'Boş Gayrimenkul',
      value: stats?.vacantRealEstates,
      icon: <ShopOutlined />,
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    },
    {
      title: 'Kiracılar',
      value: stats?.totalTenants,
      icon: <TeamOutlined />,
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    },
    {
      title: 'Ev Sahipleri',
      value: stats?.totalLandlords,
      icon: <KeyOutlined />,
      gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <Typography.Title level={3} style={{ margin: 0, fontWeight: 700 }}>
          Hoş geldiniz, {user?.username}
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 15 }}>
          Tenant Hub yönetim paneline genel bakış
        </Typography.Text>
      </div>

      <Row gutter={[20, 20]}>
        {statCards.map((card) => (
          <Col xs={24} sm={12} lg={6} key={card.title}>
            <Card
              style={{ borderRadius: 14, border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              styles={{ body: { padding: 24 } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {loading ? (
                  <Spin />
                ) : (
                  <Statistic
                    title={<span style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>{card.title}</span>}
                    value={card.value ?? '—'}
                    valueStyle={{ fontSize: 28, fontWeight: 700, color: '#111827' }}
                  />
                )}
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: card.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  color: '#fff',
                  flexShrink: 0,
                }}>
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
