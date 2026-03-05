# Project Context

## 1. Genel Proje Tanımı & Amaç

**Tenant Hub**, gayrimenkul kiralama süreçlerini yönetmek için geliştirilmiş bir yönetim panelidir. Sistem; gayrimenkul, kiralama, ödeme, kullanıcı, rol ve yetki yönetimini tek bir platformda sunar.

**Temel işlevler:**
- Gayrimenkul kaydı ve takibi (kiracı ve ev sahibi atamasıyla birlikte)
- Kiralama sözleşmesi yönetimi
- Ödeme takibi
- Kullanıcı, rol ve yetki yönetimi (RBAC)

---

## 2. Kullanıcı Rolleri & İzinler

Yetkilendirme **JWT tabanlı RBAC** ile sağlanır. JWT payload'ında `roles[]` ve `permissions[]` dizileri bulunur. Frontend bu dizileri decode ederek menü görünürlüğünü ve buton erişimini kontrol eder.

### İzin Konvansiyonu
`{KAYNAK}_{EYLEM}` formatı kullanılır. Örnek: `REAL_ESTATE_READ`, `USER_CREATE`

### Tanımlı İzinler

| Kaynak | İzinler |
|---|---|
| Kullanıcılar | `USER_READ`, `USER_CREATE`, `USER_UPDATE`, `USER_DELETE` |
| Roller | `ROLES_READ`, `ROLES_CREATE`, `ROLES_UPDATE`, `ROLES_DELETE` |
| Yetkiler | `PERMISSION_READ`, `PERMISSION_CREATE`, `PERMISSION_UPDATE`, `PERMISSION_DELETE` |
| Gayrimenkuller | `REAL_ESTATE_READ`, `REAL_ESTATE_CREATE`, `REAL_ESTATE_UPDATE`, `REAL_ESTATE_DELETE` |
| Kiralamalar | `RENT_READ`, `RENT_CREATE`, `RENT_UPDATE`, `RENT_DELETE` |
| Ödemeler | `PAYMENT_READ`, `PAYMENT_CREATE`, `PAYMENT_UPDATE`, `PAYMENT_DELETE` |
| Kiracılar | `TENANT_READ` |

---

## 3. Mimari Kararlar & Prensipler

- **Monorepo değil** — frontend ve backend ayrı repository'lerde
- **API-first** — tüm veri backend REST API üzerinden gelir, frontend saf UI katmanıdır
- **JWT Auth** — accessToken `localStorage`'da, refreshToken `httpOnly cookie`'de saklanır
- **Token yenileme** — 401 hatası alındığında axios interceptor otomatik refresh dener; başarısızsa `/login`'e yönlendirir
- **Server-side pagination** — tüm listeleme ekranlarında Spring Data `Page` formatı kullanılır (`content`, `totalElements`, `totalPages`, `size`, `number`)
- **Permission-based UI** — menü öğeleri ve aksiyon butonları (ekle/düzenle/sil) `hasPermission()` ile conditionally render edilir

---

## 4. Bileşenler

### 4.1 Database

> Bu repo yalnızca web frontend kodunu barındırır; database katmanı ayrı bir repository'de yönetilmektedir.

---

### 4.2 Backend

> Bu repo yalnızca web frontend kodunu barındırır; backend katmanı ayrı bir repository'de yönetilmektedir.
>
> Frontend'in iletişim kurduğu API hakkında bilgi için bkz. **Bölüm 3 — Mimari Kararlar & Prensipler**.

---

### 4.3 Web Frontend

#### Teknoloji Stack'i

| Araç | Versiyon | Açıklama |
|---|---|---|
| Vite | ^7.3.1 | Build tool |
| React | ^19.2.0 | UI framework |
| TypeScript | ~5.9.3 | Tip güvenliği |
| Ant Design | ^6.3.1 | UI component library |
| React Router | ^7.13.1 | Client-side routing |
| Axios | ^1.13.6 | HTTP client |
| dayjs | (antd bağımlılığı) | Tarih işlemleri |

#### Mimari Notlar

**Dizin yapısı:**
```
src/
├── context/
│   └── AuthContext.tsx         # JWT parse, user state, hasPermission/hasAnyPermission
├── layouts/
│   └── MainLayout.tsx          # Sidebar + Header + Outlet (authenticated route)
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Users.tsx
│   ├── Roles.tsx
│   ├── Permissions.tsx
│   ├── RealEstates.tsx
│   ├── Rents.tsx
│   ├── Payments.tsx
│   ├── Tenants.tsx             # Placeholder
│   └── Settings.tsx            # Placeholder
├── services/
│   ├── api.ts                  # Axios instance + request/response interceptors
│   ├── authService.ts          # login / logout API çağrıları
│   ├── userService.ts
│   ├── roleService.ts
│   ├── permissionService.ts
│   ├── rolePermissionService.ts
│   ├── userRoleService.ts
│   ├── realEstateService.ts
│   ├── rentService.ts
│   └── paymentService.ts
├── App.tsx                     # ConfigProvider (tema) + Router + Routes
├── main.tsx
└── index.css                   # Global stiller, Inter font, scrollbar
```

**CRUD sayfa pattern'i (tüm modüllerde tekrar eden yapı):**
1. Sayfa başlığı + "Yeni Ekle" butonu (canCreate ile koşullu)
2. Filter Card — `Form` + `Input`/`Select` alanları, Ara / Temizle butonları
3. `Table` — sunucu taraflı sort (`sorter: true`), pagination (`onChange`)
4. Create/Edit `Modal` — form validasyonu backend `@Size`/`@NotBlank` constraint'leriyle uyumlu
5. İlişki yönetimi gereken modüllerde `Drawer` (User→Role, Role→Permission)
6. Hata yönetimi: `axiosErr.response?.data?.message` pattern'i

**Yetkilendirme pattern'i (her sayfada):**
```tsx
const canCreate = hasPermission('RESOURCE_CREATE');
const canUpdate = hasPermission('RESOURCE_UPDATE');
const canDelete = hasPermission('RESOURCE_DELETE');
// Butonlar ve Actions kolonu conditional spread ile eklenir:
...((canUpdate || canDelete) ? [{ title: 'İşlemler', render: ... }] : [])
```

**Tema:**
- Accent rengi: `#4f46e5` (indigo)
- Sidebar: koyu indigo gradient (`#1e1b4b → #4338ca`), fixed pozisyon, 260px genişlik
- Header: beyaz, sticky, subtle shadow
- Content: beyaz kart, `#f5f5f9` arka plan
- Font: Inter (Google Fonts)

---

### 4.4 Mobile

> Bu repo yalnızca web frontend kodunu barındırır; mobil uygulama ayrı bir repository'de geliştirilecektir.

---

## 5. Mevcut Modüller & Özellikler

| Modül | Durum | Açıklama |
|---|---|---|
| Auth (Login/Logout) | ✅ Tamamlandı | JWT login, httpOnly refresh cookie, token yenileme interceptor |
| Dashboard | ✅ Tamamlandı | Gayrimenkul, kullanıcı, kiralama, ödeme toplam sayıları |
| Kullanıcılar | ✅ Tamamlandı | CRUD + User-Role Drawer + filtre/sıralama |
| Roller | ✅ Tamamlandı | CRUD + Role-Permission Drawer + filtre/sıralama |
| Yetkiler | ✅ Tamamlandı | CRUD + filtre/sıralama |
| Gayrimenkuller | ✅ Tamamlandı | CRUD + kiracı/ev sahibi seçimi (user listesinden) + filtre/sıralama |
| Kiralama | ✅ Tamamlandı | CRUD + gayrimenkul seçimi + para birimi + filtre/sıralama |
| Ödemeler | ✅ Tamamlandı | CRUD + kiralama seçimi + para birimi + filtre/sıralama |
| Kiracılar | 🔲 Placeholder | Henüz geliştirilmedi |
| Ayarlar | 🔲 Placeholder | Henüz geliştirilmedi |
