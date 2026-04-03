import { useCallback, useEffect, useState } from 'react';
import { Button, Form, message, Modal, Popconfirm, Select, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import {
  getTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  type Tenant,
  type TenantRequest,
  type TenantListParams,
} from '../services/tenantService';
import { getUsers, type User } from '../services/userService';
import { useAuth } from '../context/AuthContext';

export default function Tenants() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('TENANT_CREATE');
  const canUpdate = hasPermission('TENANT_UPDATE');
  const canDelete = hasPermission('TENANT_DELETE');

  const [data, setData] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [sortField, setSortField] = useState('id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Tenant | null>(null);
  const [form] = Form.useForm<TenantRequest>();
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const fetchData = useCallback(async (
    page = 0,
    size = 10,
    sort = `${sortField},${sortOrder}`,
  ) => {
    setLoading(true);
    try {
      const params: TenantListParams = { page, size, sort };
      const res = await getTenants(params);
      setData(res.content);
      setPagination((prev) => ({
        ...prev,
        current: res.number + 1,
        pageSize: res.size,
        total: res.totalElements,
      }));
    } catch {
      message.error('Kiracılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [sortField, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchAllUsers = async () => {
    try {
      const res = await getUsers({ page: 0, size: 1000 });
      setAllUsers(res.content);
    } catch {
      message.error('Kullanıcılar yüklenemedi');
    }
  };

  const handleTableChange = (
    pag: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<Tenant> | SorterResult<Tenant>[],
  ) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const newField = (s.field as string) || sortField;
    const newOrder = s.order === 'descend' ? 'desc' : 'asc';
    setSortField(newField);
    setSortOrder(newOrder);
    fetchData((pag.current ?? 1) - 1, pag.pageSize ?? 10, `${newField},${newOrder}`);
  };

  const openCreateModal = () => {
    setEditingRecord(null);
    form.resetFields();
    fetchAllUsers();
    setModalOpen(true);
  };

  const openEditModal = (record: Tenant) => {
    setEditingRecord(record);
    form.setFieldsValue({ usersId: record.usersId });
    fetchAllUsers();
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editingRecord) {
        await updateTenant(editingRecord.id, values);
        message.success('Kiracı güncellendi');
      } else {
        await createTenant(values);
        message.success('Kiracı oluşturuldu');
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
      await deleteTenant(id);
      message.success('Kiracı silindi');
      fetchData((pagination.current ?? 1) - 1, pagination.pageSize ?? 10);
    } catch {
      message.error('Kiracı silinemedi');
    }
  };

  const getSortOrder = (field: string) =>
    sortField === field ? (sortOrder === 'asc' ? 'ascend' as const : 'descend' as const) : undefined;

  const columns = [
    {
      title: 'Ad Soyad',
      dataIndex: 'usersFullName',
      sorter: false,
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
      render: (date: string) => dayjs(date, 'YYYYMMDDHHmmss').format('DD.MM.YYYY'),
    },
    {
      title: 'Oluşturan',
      dataIndex: 'createdBy',
    },
    ...((canUpdate || canDelete) ? [{
      title: 'İşlemler',
      render: (_: unknown, record: Tenant) => (
        <Space>
          {canUpdate && (
            <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
              Düzenle
            </Button>
          )}
          {canDelete && (
            <Popconfirm
              title="Bu kiracıyı silmek istediğinize emin misiniz?"
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

  const userOptions = allUsers.map((u) => ({
    value: u.id,
    label: `${u.firstName} ${u.lastName} (${u.username})`,
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Kiracılar</Typography.Title>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Yeni Kiracı
          </Button>
        )}
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
      />

      <Modal
        title={editingRecord ? 'Kiracı Düzenle' : 'Yeni Kiracı'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditingRecord(null); }}
        confirmLoading={saving}
        okText={editingRecord ? 'Güncelle' : 'Oluştur'}
        cancelText="İptal"
        width={480}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="usersId" label="Kullanıcı" rules={[{ required: true, message: 'Zorunlu alan' }]}>
            <Select
              placeholder="Kullanıcı seçin..."
              allowClear
              showSearch
              optionFilterProp="label"
              options={userOptions}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
