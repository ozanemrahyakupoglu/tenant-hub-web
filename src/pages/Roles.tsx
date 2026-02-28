import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Col, Drawer, Form, Input, message, Modal, Popconfirm, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ClearOutlined, SafetyOutlined } from '@ant-design/icons';
import type { TablePaginationConfig } from 'antd';
import type { SorterResult } from 'antd/es/table/interface';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  type Role,
  type RoleRequest,
  type RoleListParams,
} from '../services/roleService';
import {
  getPermissionsByRoleId,
  assignPermissionToRole,
  removeRolePermission,
  type RolePermissionResponse,
} from '../services/rolePermissionService';
import { getPermissions, type Permission } from '../services/permissionService';
import { useAuth } from '../context/AuthContext';

interface Filters {
  name?: string;
  status?: string;
}

export default function Roles() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('ROLE_CREATE');
  const canUpdate = hasPermission('ROLE_UPDATE');
  const canDelete = hasPermission('ROLE_DELETE');

  const [data, setData] = useState<Role[]>([]);
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
  const [editingRecord, setEditingRecord] = useState<Role | null>(null);
  const [form] = Form.useForm<RoleRequest>();
  const [filterForm] = Form.useForm<Filters>();

  // Role-Permission drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRole, setDrawerRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionResponse[]>([]);
  const [rpLoading, setRpLoading] = useState(false);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedPermissionId, setSelectedPermissionId] = useState<number | undefined>();
  const [assigning, setAssigning] = useState(false);

  const fetchData = useCallback(async (
    page = 0,
    size = 10,
    sort = `${sortField},${sortOrder}`,
    currentFilters = filters,
  ) => {
    setLoading(true);
    try {
      const params: RoleListParams = { page, size, sort };
      if (currentFilters.name) params.name = currentFilters.name;
      if (currentFilters.status) params.status = currentFilters.status;

      const res = await getRoles(params);
      setData(res.content);
      setPagination((prev) => ({
        ...prev,
        current: res.number + 1,
        pageSize: res.size,
        total: res.totalElements,
      }));
    } catch {
      message.error('Roller yüklenirken hata oluştu');
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
    sorter: SorterResult<Role> | SorterResult<Role>[],
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

  const openEditModal = (record: Role) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editingRecord) {
        await updateRole(editingRecord.id, values);
        message.success('Rol güncellendi');
      } else {
        await createRole(values);
        message.success('Rol oluşturuldu');
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
      await deleteRole(id);
      message.success('Rol silindi');
      fetchData((pagination.current ?? 1) - 1, pagination.pageSize ?? 10);
    } catch {
      message.error('Rol silinemedi');
    }
  };

  // --- Role-Permission Drawer ---
  const fetchRolePermissions = async (roleId: number) => {
    setRpLoading(true);
    try {
      const rp = await getPermissionsByRoleId(roleId);
      setRolePermissions(rp);
    } catch {
      message.error('Rol yetkileri yüklenemedi');
    } finally {
      setRpLoading(false);
    }
  };

  const fetchAllPermissions = async () => {
    try {
      const res = await getPermissions({ page: 0, size: 1000 });
      setAllPermissions(res.content);
    } catch {
      message.error('Yetkiler yüklenemedi');
    }
  };

  const openPermissionDrawer = async (role: Role) => {
    setDrawerRole(role);
    setDrawerOpen(true);
    setSelectedPermissionId(undefined);
    await Promise.all([fetchRolePermissions(role.id), fetchAllPermissions()]);
  };

  const handleAssignPermission = async () => {
    if (!selectedPermissionId || !drawerRole) return;
    setAssigning(true);
    try {
      await assignPermissionToRole({ roleId: drawerRole.id, permissionId: selectedPermissionId });
      message.success('Yetki atandı');
      setSelectedPermissionId(undefined);
      await fetchRolePermissions(drawerRole.id);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        message.error(axiosErr.response?.data?.message || 'Yetki atanamadı');
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleRemovePermission = async (rpId: number) => {
    try {
      await removeRolePermission(rpId);
      message.success('Yetki kaldırıldı');
      if (drawerRole) await fetchRolePermissions(drawerRole.id);
    } catch {
      message.error('Yetki kaldırılamadı');
    }
  };

  const assignedPermissionIds = rolePermissions.map((rp) => rp.permissionId);
  const availablePermissions = allPermissions.filter((p) => !assignedPermissionIds.includes(p.id));

  const rpColumns = [
    {
      title: 'Yetki Adı',
      dataIndex: 'permissionName',
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
    ...(canUpdate ? [{
      title: 'İşlem',
      render: (_: unknown, record: RolePermissionResponse) => (
        <Popconfirm
          title="Bu yetkiyi kaldırmak istediğinize emin misiniz?"
          onConfirm={() => handleRemovePermission(record.id)}
          okText="Evet"
          cancelText="Hayır"
        >
          <Button type="link" danger icon={<DeleteOutlined />}>
            Kaldır
          </Button>
        </Popconfirm>
      ),
    }] : []),
  ];

  // --- Table columns ---
  const getSortOrder = (field: string) =>
    sortField === field ? (sortOrder === 'asc' ? 'ascend' as const : 'descend' as const) : undefined;

  const columns = [
    {
      title: 'Rol Adı',
      dataIndex: 'name',
      sorter: true,
      sortOrder: getSortOrder('name'),
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      sorter: true,
      sortOrder: getSortOrder('description'),
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
    {
      title: 'Oluşturan',
      dataIndex: 'createdBy',
    },
    ...((canUpdate || canDelete) ? [{
      title: 'İşlemler',
      render: (_: unknown, record: Role) => (
        <Space>
          {canUpdate && (
            <Button type="link" icon={<SafetyOutlined />} onClick={() => openPermissionDrawer(record)}>
              Yetkiler
            </Button>
          )}
          {canUpdate && (
            <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
              Düzenle
            </Button>
          )}
          {canDelete && (
            <Popconfirm
              title="Bu rolü silmek istediğinize emin misiniz?"
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
        <Typography.Title level={3} style={{ margin: 0 }}>Roller</Typography.Title>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Yeni Rol
          </Button>
        )}
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Form form={filterForm} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="name" label="Rol Adı" style={{ marginBottom: 0 }}>
                <Input placeholder="Ara..." allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="Durum" style={{ marginBottom: 0 }}>
                <Select placeholder="Tümü" allowClear>
                  <Select.Option value="ACTIVE">ACTIVE</Select.Option>
                  <Select.Option value="INACTIVE">INACTIVE</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={10} style={{ display: 'flex', alignItems: 'flex-end' }}>
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
        title={editingRecord ? 'Rol Düzenle' : 'Yeni Rol'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => { setModalOpen(false); form.resetFields(); setEditingRecord(null); }}
        confirmLoading={saving}
        okText={editingRecord ? 'Güncelle' : 'Oluştur'}
        cancelText="İptal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Rol Adı"
            rules={[
              { required: true, message: 'Rol adı boş olamaz' },
              { max: 100, message: 'Rol adı en fazla 100 karakter olabilir' },
            ]}
          >
            <Input placeholder="Örn: ADMIN" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Açıklama"
            rules={[{ max: 500, message: 'Açıklama en fazla 500 karakter olabilir' }]}
          >
            <Input.TextArea rows={3} placeholder="Rol açıklaması" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Role-Permission Drawer */}
      <Drawer
        title={`${drawerRole?.name ?? ''} — Yetki Yönetimi`}
        width={640}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDrawerRole(null); setRolePermissions([]); }}
      >
        {canUpdate && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Select
              style={{ flex: 1 }}
              placeholder="Yetki seçin..."
              value={selectedPermissionId}
              onChange={setSelectedPermissionId}
              showSearch
              optionFilterProp="label"
              options={availablePermissions.map((p) => ({ value: p.id, label: p.name }))}
              allowClear
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAssignPermission}
              loading={assigning}
              disabled={!selectedPermissionId}
            >
              Ata
            </Button>
          </div>
        )}

        <Table
          rowKey="id"
          columns={rpColumns}
          dataSource={rolePermissions}
          loading={rpLoading}
          pagination={false}
          size="small"
        />
      </Drawer>
    </div>
  );
}
