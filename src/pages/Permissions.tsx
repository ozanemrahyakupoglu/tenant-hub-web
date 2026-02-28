import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Col, Form, Input, message, Modal, Popconfirm, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ClearOutlined } from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  type Permission,
  type PermissionRequest,
  type PermissionListParams,
} from '../services/permissionService';

interface Filters {
  name?: string;
  module?: string;
  action?: string;
  status?: string;
}

export default function Permissions() {
  const [data, setData] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filters, setFilters] = useState<Filters>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Permission | null>(null);
  const [form] = Form.useForm<PermissionRequest>();
  const [filterForm] = Form.useForm<Filters>();

  const fetchData = useCallback(async (
    page = 0,
    size = 10,
    sort = `${sortField},${sortOrder}`,
    currentFilters = filters,
  ) => {
    setLoading(true);
    try {
      const params: PermissionListParams = { page, size, sort };
      if (currentFilters.name) params.name = currentFilters.name;
      if (currentFilters.module) params.module = currentFilters.module;
      if (currentFilters.action) params.action = currentFilters.action;
      if (currentFilters.status) params.status = currentFilters.status;

      const res = await getPermissions(params);
      setData(res.content);
      setPagination((prev) => ({
        ...prev,
        current: res.number + 1,
        pageSize: res.size,
        total: res.totalElements,
      }));
    } catch {
      message.error('Yetkiler yüklenirken hata oluştu');
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
    sorter: SorterResult<Permission> | SorterResult<Permission>[],
  ) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const newField = (s.field as string) || sortField;
    const newOrder = s.order === 'descend' ? 'desc' : 'asc';
    setSortField(newField);
    setSortOrder(newOrder);
    fetchData(
      (pag.current ?? 1) - 1,
      pag.pageSize ?? 10,
      `${newField},${newOrder}`,
      filters,
    );
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
    form.setFieldsValue({ status: 'ACTIVE' });
    setModalOpen(true);
  };

  const openEditModal = (record: Permission) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      module: record.module,
      action: record.action,
      status: record.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editingRecord) {
        await updatePermission(editingRecord.id, values);
        message.success('Yetki güncellendi');
      } else {
        await createPermission(values);
        message.success('Yetki oluşturuldu');
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
      await deletePermission(id);
      message.success('Yetki silindi');
      fetchData((pagination.current ?? 1) - 1, pagination.pageSize ?? 10);
    } catch {
      message.error('Yetki silinemedi');
    }
  };

  const columns = [
    {
      title: 'Yetki Adı',
      dataIndex: 'name',
      sorter: true,
      sortOrder: sortField === 'name' ? (sortOrder === 'asc' ? 'ascend' as const : 'descend' as const) : undefined,
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      sorter: true,
      sortOrder: sortField === 'description' ? (sortOrder === 'asc' ? 'ascend' as const : 'descend' as const) : undefined,
    },
    {
      title: 'Modül',
      dataIndex: 'module',
      sorter: true,
      sortOrder: sortField === 'module' ? (sortOrder === 'asc' ? 'ascend' as const : 'descend' as const) : undefined,
    },
    {
      title: 'Aksiyon',
      dataIndex: 'action',
      sorter: true,
      sortOrder: sortField === 'action' ? (sortOrder === 'asc' ? 'ascend' as const : 'descend' as const) : undefined,
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      sorter: true,
      sortOrder: sortField === 'status' ? (sortOrder === 'asc' ? 'ascend' as const : 'descend' as const) : undefined,
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: 'Oluşturma Tarihi',
      dataIndex: 'createdDate',
      sorter: true,
      sortOrder: sortField === 'createdDate' ? (sortOrder === 'asc' ? 'ascend' as const : 'descend' as const) : undefined,
      render: (date: string) => new Date(date).toLocaleDateString('tr-TR'),
    },
    {
      title: 'İşlemler',
      render: (_: unknown, record: Permission) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            Düzenle
          </Button>
          <Popconfirm
            title="Bu yetkiyi silmek istediğinize emin misiniz?"
            onConfirm={() => handleDelete(record.id)}
            okText="Evet"
            cancelText="Hayır"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Sil
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>Yetkiler</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Yeni Yetki
        </Button>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Form form={filterForm} layout="vertical">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="name" label="Yetki Adı" style={{ marginBottom: 0 }}>
                <Input placeholder="Ara..." allowClear />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name="module" label="Modül" style={{ marginBottom: 0 }}>
                <Input placeholder="Ara..." allowClear />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="action" label="Aksiyon" style={{ marginBottom: 0 }}>
                <Select placeholder="Tümü" allowClear>
                  <Select.Option value="CREATE">CREATE</Select.Option>
                  <Select.Option value="READ">READ</Select.Option>
                  <Select.Option value="UPDATE">UPDATE</Select.Option>
                  <Select.Option value="DELETE">DELETE</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="status" label="Durum" style={{ marginBottom: 0 }}>
                <Select placeholder="Tümü" allowClear>
                  <Select.Option value="ACTIVE">ACTIVE</Select.Option>
                  <Select.Option value="INACTIVE">INACTIVE</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={5} style={{ display: 'flex', alignItems: 'flex-end' }}>
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

      <Modal
        title={editingRecord ? 'Yetki Düzenle' : 'Yeni Yetki'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditingRecord(null); }}
        confirmLoading={saving}
        okText={editingRecord ? 'Güncelle' : 'Oluştur'}
        cancelText="İptal"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Yetki Adı" rules={[{ required: true, message: 'Zorunlu alan' }]}>
            <Input placeholder="Örn: USER_CREATE" />
          </Form.Item>
          <Form.Item name="description" label="Açıklama" rules={[{ required: true, message: 'Zorunlu alan' }]}>
            <Input placeholder="Örn: Kullanıcı oluşturma" />
          </Form.Item>
          <Form.Item name="module" label="Modül" rules={[{ required: true, message: 'Zorunlu alan' }]}>
            <Input placeholder="Örn: USER" />
          </Form.Item>
          <Form.Item name="action" label="Aksiyon" rules={[{ required: true, message: 'Zorunlu alan' }]}>
            <Select placeholder="Seçiniz">
              <Select.Option value="CREATE">CREATE</Select.Option>
              <Select.Option value="READ">READ</Select.Option>
              <Select.Option value="UPDATE">UPDATE</Select.Option>
              <Select.Option value="DELETE">DELETE</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Durum" rules={[{ required: true, message: 'Zorunlu alan' }]}>
            <Select>
              <Select.Option value="ACTIVE">ACTIVE</Select.Option>
              <Select.Option value="INACTIVE">INACTIVE</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
