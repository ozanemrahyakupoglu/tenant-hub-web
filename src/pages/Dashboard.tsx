import { useEffect, useState } from 'react';
import { Card, Col, Row, Spin, Statistic, Typography } from 'antd';
import { HomeOutlined, UserOutlined, DollarOutlined, WalletOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { getRealEstates } from '../services/realEstateService';
import { getUsers } from '../services/userService';
import { getRents } from '../services/rentService';
import { getPayments } from '../services/paymentService';

interface Stats {
  realEstates: number | null;
  users: number | null;
  rents: number | null;
  payments: number | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ realEstates: null, users: null, rents: null, payments: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        getRealEstates({ page: 0, size: 1 }),
        getUsers({ page: 0, size: 1 }),
        getRents({ page: 0, size: 1 }),
        getPayments({ page: 0, size: 1 }),
      ]);
      setStats({
        realEstates: results[0].status === 'fulfilled' ? results[0].value.totalElements : null,
        users: results[1].status === 'fulfilled' ? results[1].value.totalElements : null,
        rents: results[2].status === 'fulfilled' ? results[2].value.totalElements : null,
        payments: results[3].status === 'fulfilled' ? results[3].value.totalElements : null,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Gayrimenkuller',
      value: stats.realEstates,
      icon: <HomeOutlined />,
      gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    },
    {
      title: 'Kullanıcılar',
      value: stats.users,
      icon: <UserOutlined />,
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
    },
    {
      title: 'Kiralamalar',
      value: stats.rents,
      icon: <DollarOutlined />,
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    },
    {
      title: 'Ödemeler',
      value: stats.payments,
      icon: <WalletOutlined />,
      gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
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
