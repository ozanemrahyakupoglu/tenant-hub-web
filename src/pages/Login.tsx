import { Button, Card, Form, Input, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = (values: { username: string; password: string }) => {
    if (login(values.username, values.password)) {
      navigate('/dashboard', { replace: true });
    } else {
      message.error('Kullanıcı adı veya şifre hatalı!');
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f0f2f5',
    }}>
      <Card style={{ width: 400 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 32 }}>
          Tenant Hub
        </Typography.Title>
        <Form onFinish={onFinish} autoComplete="off">
          <Form.Item name="username" rules={[{ required: true, message: 'Kullanıcı adı gerekli' }]}>
            <Input prefix={<UserOutlined />} placeholder="Kullanıcı Adı" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Şifre gerekli' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Şifre" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              Giriş Yap
            </Button>
          </Form.Item>
        </Form>
        <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
          Kullanıcı: admin / Şifre: 123456
        </Typography.Text>
      </Card>
    </div>
  );
}
