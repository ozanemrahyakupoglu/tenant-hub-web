import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Col, Drawer, Form, Input, message, Modal, Popconfirm, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ClearOutlined, CrownOutlined } from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type User,
  type CreateUserRequest,
  type UpdateUserRequest,
  type UserListParams,
} from '../services/userService';
import {
  getRolesByUserId,
  assignRoleToUser,
  removeUserRole,
  type UserRoleResponse,
} from '../services/userRoleService';
import { getRoles, type Role } from '../services/roleService';
import { useAuth } from '../context/AuthContext';

interface Filters {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  status?: string;
}

export default function Users() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('USER_CREATE');
  const canUpdate = hasPermission('USER_UPDATE');
  const canDelete = hasPermission('USER_DELETE');

  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [sortField, setSortField] = useState('username');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filters, setFilters] = useState<Filters>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm<Filters>();

  // User-Role drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerUser, setDrawerUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<UserRoleResponse[]>([]);
  const [urLoading, setUrLoading] = useState(false);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | undefined>();
  const [assigning, setAssigning] = useState(false);

  const fetchData = useCallback(async (
    page = 0,
    size = 10,
    sort = `${sortField},${sortOrder}`,
    currentFilters = filters,
  ) => {
    setLoading(true);
    try {
      const params: UserListParams = { page, size, sort };
      if (currentFilters.username) params.username = currentFilters.username;
      if (currentFilters.email) params.email = currentFilters.email;
      if (currentFilters.firstName) params.firstName = currentFilters.firstName;
      if (currentFilters.lastName) params.lastName = currentFilters.lastName;
      if (currentFilters.status) params.status = currentFilters.status;

      const res = await getUsers(params);
      setData(res.content);
      setPagination((prev) => ({
        ...prev,
        current: res.number + 1,
        pageSize: res.size,
        total: res.totalElements,
      }));
    } catch {
      message.error('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [sortField, sortOrder, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTableChange = (
    pag: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<User> | SorterResult<User>[],
  ) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const newField = (s.field as string) || sortField;
    const newOrder = s.order === 'descend' ? 'desc' : 'asc';
    setSortField(newField);
    setSortOrder(newOrder);
    fetchData((pag.current ?? 1) - 1, pag.pageSize ?? 10, `${newField},${newOrder}`, filters);
  };

  const handleFilterSearch = () => {
    const values = filterForm.getFieldsValue();
    setFilters(values);
    fetchData(0, pagination.pageSize ?? 10, `${sortField},${sortOrder}`, values);
  };

  const handleFilterReset = () => {
    filterForm.resetFields();
    setFilters({});
    fetchData(0, pagination.pageSize ?? 10, `${sortField},${sortOrder}`, {});
  };

  const openCreateModal = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (record: User) => {
    setEditingRecord(record);
    form.setFieldsValue({
      email: record.email,
      firstName: record.firstName,
      lastName: record.lastName,
      phone: record.phone,
      status: record.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editingRecord) {
        const payload: UpdateUserRequest = {
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
          status: values.status,
        };
        await updateUser(editingRecord.id, payload);
        message.success('Kullanıcı güncellendi');
      } else {
        const payload: CreateUserRequest = {
          username: values.username,
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone,
        };
        await createUser(payload);
        message.success('Kullanıcı oluşturuldu');
      }
      setModalOpen(false);
      form.resetFields();
      setEditingRecord(null);
      fetchData((pagination.current ?? 1) - 1, pagination.pageSize ?? 10);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        message.error(axiosErr.response?.data?.message || 'İşlem başarısız');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      message.success('Kullanıcı silindi');
      fetchData((pagination.current ?? 1) - 1, pagination.pageSize ?? 10);
    } catch {
      message.error('Kullanıcı silinemedi');
    }
  };

  // --- User-Role Drawer ---
  const fetchUserRoles = async (userId: number) => {
    setUrLoading(true);
    try {
      const ur = await getRolesByUserId(userId);
      setUserRoles(ur);
    } catch {
      message.error('Kullanıcı rolleri yüklenemedi');
    } finally {
      setUrLoading(false);
    }
  };

  const fetchAllRoles = async () => {
    try {
      const res = await getRoles({ page: 0, size: 1000 });
      setAllRoles(res.content);
    } catch {
      message.error('Roller yüklenemedi');
    }
  };

  const openRoleDrawer = async (user: User) => {
    setDrawerUser(user);
    setDrawerOpen(true);
    setSelectedRoleId(undefined);
    await Promise.all([fetchUserRoles(user.id), fetchAllRoles()]);
  };

  const handleAssignRole = async () => {
    if (!selectedRoleId || !drawerUser) return;
    setAssigning(true);
    try {
      await assignRoleToUser({ userId: drawerUser.id, roleId: selectedRoleId });
      message.success('Rol atandı');
      setSelectedRoleId(undefined);
      await fetchUserRoles(drawerUser.id);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        message.error(axiosErr.response?.data?.message || 'Rol atanamadı');
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveRole = async (urId: number) => {
    try {
      await removeUserRole(urId);
      message.success('Rol kaldırıldı');
      if (drawerUser) await fetchUserRoles(drawerUser.id);
    } catch {
      message.error('Rol kaldırılamadı');
    }
  };

  const assignedRoleIds = userRoles.map((ur) => ur.roleId);
  const availableRoles = allRoles.filter((r) => !assignedRoleIds.includes(r.id));

  const urColumns = [
    {
      title: 'Rol Adı',
      dataIndex: 'roleName',
    },
    {
      title: 'Atanma Tarihi',
      dataIndex: 'createdDate',
      render: (date: string) => new Date(date).toLocaleDateString('tr-TR'),
    },
    {
      title: 'Atayan',
      dataIndex: 'createdBy',
    },
    {
      title: 'İşlem',
      render: (_: unknown, record: UserRoleResponse) => (
        <Popconfirm
          title="Bu rolü kaldırmak istediğinize emin misiniz?"
          onConfirm={() => handleRemoveRole(record.id)}
          okText="Evet"
          cancelText="Hayır"
        >
          <Button type="link" danger icon={<DeleteOutlined />}>
            Kaldır
          </Button>
        </Popconfirm>
      ),
    },
  ];

  // --- Table columns ---
  const getSortOrder = (field: string) =>
    sortField === field ? (sortOrder === 'asc' ? 'ascend' as const : 'descend' as const) : undefined;

  const columns = [
    {
      title: 'Kullanıcı Adı',
      dataIndex: 'username',
      sorter: true,
      sortOrder: getSortOrder('username'),
    },
    {
      title: 'Ad',
      dataIndex: 'firstName',
      sorter: true,
      sortOrder: getSortOrder('firstName'),
    },
    {
      title: 'Soyad',
      dataIndex: 'lastName',
      sorter: true,
      sortOrder: getSortOrder('lastName'),
    },
    {
      title: 'E-posta',
      dataIndex: 'email',
      sorter: true,
      sortOrder: getSortOrder('email'),
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      sorter: true,
      sortOrder: getSortOrder('status'),
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: 'Oluşturma Tarihi',
      dataIndex: 'createdDate',
      sorter: true,
      sortOrder: getSortOrder('createdDate'),
      render: (date: string) => new Date(date).toLocaleDateString('tr-TR'),
    },
    ...((canUpdate || canDelete) ? [{
      title: 'İşlemler',
      render: (_: unknown, record: User) => (
        <Space>
          {canUpdate && (
            <Button type="link" icon={<CrownOutlined />} onClick={() => openRoleDrawer(record)}>
              Roller
            </Button>
          )}
          {canUpdate && (
            <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
              Düzenle
            </Button>
          )}
          {canDelete && (
            <Popconfirm
              title="Bu kullanıcıyı silmek istediğinize emin misiniz?"
              onConfirm={() => handleDelete(record.id)}
              okText="Evet"
              cancelText="Hayır"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Sil
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    }] : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Kullanıcılar</Typography.Title>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Yeni Kullanıcı
          </Button>
        )}
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Form form={filterForm} layout="vertical">
          <Row gutter={16}>
            <Col span={4}>
              <Form.Item name="username" label="Kullanıcı Adı" style={{ marginBottom: 0 }}>
                <Input placeholder="Ara..." allowClear />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="firstName" label="Ad" style={{ marginBottom: 0 }}>
                <Input placeholder="Ara..." allowClear />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="lastName" label="Soyad" style={{ marginBottom: 0 }}>
                <Input placeholder="Ara..." allowClear />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name="email" label="E-posta" style={{ marginBottom: 0 }}>
                <Input placeholder="Ara..." allowClear />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item name="status" label="Durum" style={{ marginBottom: 0 }}>
                <Select placeholder="Tümü" allowClear>
                  <Select.Option value="ACTIVE">ACTIVE</Select.Option>
                  <Select.Option value="INACTIVE">INACTIVE</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleFilterSearch}>
                  Ara
                </Button>
                <Button icon={<ClearOutlined />} onClick={handleFilterReset}>
                  Temizle
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />

      {/* Create / Edit Modal */}
      <Modal
        title={editingRecord ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditingRecord(null); }}
        confirmLoading={saving}
        okText={editingRecord ? 'Güncelle' : 'Oluştur'}
        cancelText="İptal"
      >
        <Form form={form} layout="vertical">
          {!editingRecord && (
            <Form.Item name="username" label="Kullanıcı Adı" rules={[{ required: true, message: 'Zorunlu alan' }]}>
              <Input />
            </Form.Item>
          )}
          <Form.Item name="email" label="E-posta" rules={[{ required: true, type: 'email', message: 'Geçerli e-posta girin' }]}>
            <Input />
          </Form.Item>
          {!editingRecord && (
            <Form.Item name="password" label="Şifre" rules={[{ required: true, min: 8, message: 'En az 8 karakter' }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="firstName" label="Ad" rules={[{ required: true, message: 'Zorunlu alan' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Soyad" rules={[{ required: true, message: 'Zorunlu alan' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Telefon" rules={[{ required: true, message: 'Zorunlu alan' }]}>
            <Input />
          </Form.Item>
          {editingRecord && (
            <Form.Item name="status" label="Durum" rules={[{ required: true, message: 'Zorunlu alan' }]}>
              <Select>
                <Select.Option value="ACTIVE">ACTIVE</Select.Option>
                <Select.Option value="INACTIVE">INACTIVE</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* User-Role Drawer */}
      <Drawer
        title={`${drawerUser?.username ?? ''} — Rol Yönetimi`}
        width={640}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDrawerUser(null); setUserRoles([]); }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Select
            style={{ flex: 1 }}
            placeholder="Rol seçin..."
            value={selectedRoleId}
            onChange={setSelectedRoleId}
            showSearch
            optionFilterProp="label"
            options={availableRoles.map((r) => ({ value: r.id, label: r.name }))}
            allowClear
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAssignRole}
            loading={assigning}
            disabled={!selectedRoleId}
          >
            Ata
          </Button>
        </div>

        <Table
          rowKey="id"
          columns={urColumns}
          dataSource={userRoles}
          loading={urLoading}
          pagination={false}
          size="small"
        />
      </Drawer>
    </div>
  );
}
