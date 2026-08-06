# فحص شامل للداشبورد — تقرير الأخطاء والحلول

> **التاريخ:** 2026-08-06 · **الفرع:** `staging`
> **النطاق:** كل وحدات الداشبورد — ٢٠ وحدة، ٢٢ صفحة، ٩٦ نقطة API

كل خطأ أدناه **تم إثباته بطلب حقيقي على السيرفر**، لا بقراءة الكود. لكل خطأ: السبب الجذري، مصدره (واجهة أم باك إند)، وحلّه.

---

## ملخّص سريع

| المصدر | العدد | الحالة |
|---|---|---|
| 🟢 **الواجهة** | 11 | ✅ مُصلَحة كلها |
| 🔴 **الباك إند** | 8 | ⚠️ تحتاج تذكرة — موصوفة بالحل الدقيق |
| ⚪️ ليست أخطاء | 2 | تحقّقت ونُفيت |

---

## جولة ثانية — بحساب مدير شركة حقيقي (الشركة رقم 1)

الدخول بحساب شركة حقيقي كشف ثلاثة أشياء لم يكن حساب السوبر أدمن ليكشفها:

### 🔴 تسريب بيانات — `/company/clients` يعرض عملاء شركة أخرى

```
/company/employees   rows:1   companies:[1]     ✅
/company/clients     rows:4   companies:[1,2]   ❌ عملاء الشركة 2 ظاهرون
/company/projects    rows:0   companies:[]      ✅
/company/roles       rows:3   companies:[1]     ✅
/company/currencies  rows:1   companies:[1]     ✅
```

مدير الشركة ١ يرى عملاء الشركة ٢. **عزل بيانات مفقود على السيرفر** — بقية النقاط تعزل صحيحًا، فالخلل في `ClientController::index` وحده.

**الحل (باك إند):** تقييد الاستعلام بشركة التوكن، كما تفعل `EmployeeController`.

### 🔴 `/company/walletTransactions` → 403 Unauthorized

الشريط الجانبي يعرض "حركات المحفظة" لدور الشركة، لكن النقطة ترفض الطلب. والصلاحية `wallet_transactions.view` **غير ممنوحة** لـ `company_admin` — الإشارتان متفقتان: هذه الصفحة ليست لدور الشركة.

**قرار لك:** إما إزالة العنصر من قائمة دور الشركة، أو منح الصلاحية على السيرفر. لم أغيّرها من تلقاء نفسي لأنها قرار منتج.

### 🟢 و-١٠ · 🔴 تراجُع أدخلتُه أنا — بوابة الصلاحيات كانت ستُخفي صفحات تعمل

هذا الأهم. جدول الصلاحيات على السيرفر **يناقض مساراته**:

| الدور | يملك `conversations.view`؟ | `GET /{role}/conversations` |
|---|---|---|
| `super_admin` | ✅ نعم | 200 |
| `company_admin` | ❌ **لا** | **200** |
| `employee` | ❌ **لا** | **200** |
| `client` | ❌ **لا** | **200** |

البوابة التي بنيتها كانت `role && permission`، فكانت ستُخفي:

```
company   → walletTransactions, conversations
employee  → conversations
client    → conversations
```

أي أن **المحادثات كانت ستختفي عن الجميع عدا السوبر أدمن** — وهي الوحدة التي طلبت إصلاحها في نفس الجلسة.

**الحل:** جعل البوابة **تجميعية** — الصلاحية **تفتح** قسمًا ولا **تغلقه** أبدًا:

```ts
const isVisible = (item) =>
  item.roles.includes(role) || hasPermission(item.permission);
```

أضفت `hasPermission()` بجانب `can()`: الأولى تُرجع `false` عند عدم معرفة الصلاحيات (تُستخدم للفتح فقط)، والثانية تُرجع `true` (تُستخدم للأزرار حيث الخطأ غير مؤذٍ).

**التحقّق:**
```
قبل:  company → يفقد walletTransactions, conversations
      employee → يفقد conversations
      client → يفقد conversations
بعد:  PASS  كل دور لا يفقد شيئًا يسمح به دوره
      PASS  موظف مُنح invoices.view يكسب قسم الفواتير الذي لا يملكه دوره الأساسي
```

> ⚠️ **الأثر على الميزة:** الدور المخصّص الآن **يمنح ولا يمنع**. المنع الحقيقي متعذّر ما دامت صفوف الصلاحيات لا تطابق المسارات.
> **الحل (باك إند):** منح الأدوار الأساسية الصلاحيات التي تخدمها مساراتها فعلًا — وأوّلها `conversations.*` للأدوار الأربعة. عندها يصبح المنع آمنًا وأفعّله بسطر واحد.

---

# 🟢 أخطاء الواجهة — مُصلَحة

## و-١ · تغليف مزدوج للمعاملات — البحث والترقيم لا يعملان

**الوحدات:** `projects` · `contracts` · `payments` · `tasks`

`ApiClient.get` يغلّف وسيطه الثاني داخل `{ params }` **بنفسه**، فتمريره مرة ثانية ينتج:

```
❌  /projects?params[search]=ali&params[page]=2
✅  /projects?search=ali&page=2
```

السيرفر لا يرى المفاتيح إطلاقًا، فالبحث يتجاهَل والترقيم يعود دائمًا للصفحة الأولى.

**الحل:**
```diff
- apiClient.get(`${getRolePrefix(role)}/projects`, { params })
+ apiClient.get(`${getRolePrefix(role)}/projects`, params as Record<string, unknown>)
```

**التحقّق:** `?search=zzz_no_such_project` → النتائج `1 → 0`. قبل الإصلاح كانت تبقى `1`.

> نفس الخلل كان في `conversations` و `roles` و `employees` وأُصلح سابقًا. الآن **صفر** حالات متبقية في المشروع.

---

## و-٢ · 🔴 الأخطر — قائمة الفواتير كانت فارغة دائمًا

`GET /invoices` يُرجع **مصفوفة مجرّدة**، بينما `GET /payments` يُرجع مغلّف الترقيم المعتاد — حتى وهو فارغ. أي أن الفواتير تستخدم `get()` لا `paginate()`.

الواجهة تقرأ `.data` و `.total` و `.last_page`:

```ts
const invoices = invoicesData?.data ?? [];   // مصفوفة ليس لها .data → []  دائمًا
```

**الأثر:** الجدول يعرض "لا توجد بيانات" مهما بلغ عدد الفواتير. لا خطأ، لا تحذير — فقط فراغ.

**الحل:** توحيد الشكل في طبقة الـ API بحيث تقبل الاثنين:

```ts
if (Array.isArray(payload)) {
  const perPage = Number(params?.per_page) || payload.length || 1;
  return { current_page: …, data: payload, total: payload.length,
           per_page: perPage, last_page: Math.max(Math.ceil(payload.length / perPage), 1) };
}
return payload;
```

اخترت التوحيد في الواجهة لا انتظار الباك إند: تبقى الصفحة سليمة لو حُوِّلت النقطة إلى `paginate()` لاحقًا.

**التحقّق:**
```
PASS  server returns a bare array
PASS  control — the raw array has no .data  ← يثبت أن العطل حقيقي
PASS  normalised .data is an array the page can map over
```

---

## و-٣ · بطاقات الإحصائيات مجمّدة على الصفر — الفواتير والمدفوعات

`/invoices/stats` و `/payments/stats` يردّان **404** (السبب في ب-٣ أدناه). لا يوجد أي تعامل مع الفشل، فالبطاقات تعرض `$0.00` و `0` **دائمًا**.

هذا أسوأ من رسالة خطأ: الصفر يبدو كبيانات حقيقية.

**الحل:** اشتقاق الإحصائيات من القائمة عند فشل النقطة — وهو نمط مستخدم أصلًا في المشروع (`roleApi.getStats` و `employeeApi.getStats`):

```ts
try {
  const response = await apiClient.get(`…/payments/stats`);
  if (response?.data) return response.data;
} catch { /* نشتقّها */ }

const list = await paymentApi.getAll(role, { page: 1 });
return {
  totalRevenue:      rows.filter(p => !isPending(p)).reduce((s, p) => s + amount(p), 0),
  pendingPayments:   rows.filter(isPending).reduce((s, p) => s + amount(p), 0),
  transactionVolume: Number(list?.total ?? rows.length) || 0,
  derived: true,   // ← علامة تدلّ أنها محسوبة لا مصدرها السيرفر
};
```

`try/catch` يعني أن الكود يعود تلقائيًا لنقطة السيرفر لحظة إصلاحها — بلا أي تعديل.

---

## و-٤ · صفحات معطّلة تقول "لا توجد بيانات" بدل "السيرفر معطّل"

`PageContainer` كان يعرف `isLoading` فقط. عند فشل الطلب يصير `isLoading = false` و `data = undefined`، فتُرسم جدول فارغ.

**الأثر:** صفحتا **العقود** و **طلبات الشركات** — وكلتاهما ميتة على السيرفر (ب-١، ب-٢) — كانتا تُخبران المستخدم أن **سجلّاته غير موجودة**، بينما الطلب لم ينجح أصلًا. أسوأ نوع من الأخطاء: يكذب بثقة.

**الحل:** حالة فشل اختيارية في `PageContainer` (لا تؤثر على أي مستدعٍ قائم)، موصولة بالصفحتين:

```tsx
<PageContainer isLoading={isLoading} isError={isError} error={error} onRetry={() => refetch()}>
```

تعرض رسالة السيرفر الحقيقية مع زر إعادة محاولة — واعتراض axios يحوّل الـ 5xx لجملة عربية مفهومة أصلًا.

---

## و-٥ · ٢٤ مفتاح ترجمة مفقود — كل واحد يرمي استثناءً

مصيدة دقيقة في `next-intl`: الدالة **ترمي** عند غياب المفتاح، فالنمط الشائع في المشروع:

```ts
label: t("relatedWallet") || "Related Wallet"
```

**لا يصل إلى الاحتياطي أبدًا** — يرمي قبله.

الفحص الآلي وجد ٢٤ مفتاحًا في ٧ وحدات:

| الوحدة | مفاتيح | ملاحظة |
|---|---|---|
| `walletTransactions` | 7 | تسميات حقول ورسائل نجاح |
| `development.form.*` | 5 | **موجودة بالإنجليزية ومفقودة بالعربية** — النموذج مكسور بالعربية فقط |
| `task` | 3 | `selectCompany` · `selectProject` · `selectEmployee` |
| `payments.messages` | 3 | رسائل نجاح وتصدير |
| `contract` | 2 | عناوين النوافذ |
| `common` | 3 | + `retry` و `loadFailedTitle` للحالة الجديدة |
| `auth` | 1 | `loading` |

**الحل:** ملأتها في `en.json` و `ar.json`. **النصوص الإنجليزية مأخوذة حرفيًا من الاحتياطي المكتوب بجانب كل استدعاء** — تلك كانت التسميات المقصودة، لم تكن تظهر فحسب.

**التحقّق:** الفحص يعيد `No missing translation keys.`

---

## و-٦ · شاشة الصلاحيات كانت سترى ١٠ موظفين فقط

`GET /employees` **يتجاهل `per_page`** ويثبّتها على ١٠. شاشة الصلاحيات تعدّ وتصفّي على كامل الطاقم، فقائمة مبتورة تعني أرقامًا خاطئة بصمت.

**الحل:** `employeeApi.getAllPages` تمشي على الصفحات (بحدّ ٥٠ صفحة كي لا تدور بلا نهاية).

> ⚠️ **صفحة الموظفين نفسها ما زالت مصابة** — تطلب `per_page: 1000` وتحصل على ١٠. لم ألمسها لأنها خارج نطاق ما طلبته؛ الإصلاح جاهز (`getAllPages`) ومتاح متى أردت.

---

# 🔴 أخطاء الباك إند — لا يمكن إصلاحها من الواجهة

## ب-١ · وحدة العقود ميتة بالكامل — 500

```
GET /{role}/contracts        → 500
GET /{role}/contracts/stats  → 500
"Target class [App\Http\Controllers\Api\ContractController] does not exist."
```

الـ controller غير موجود أو غير مُسجَّل في الـ autoload.

**الحل (باك إند):** إنشاء `ContractController` أو تصحيح مساره في `routes/api.php`، ثم `composer dump-autoload`.

**ما فعلته:** الصفحة تعرض الآن خطأ واضحًا بدل جدول فارغ (و-٤).

---

## ب-٢ · طلبات الشركات ميتة — 500

```
GET /super_admin/requests → 500
GET /company/requests     → 500
"Call to undefined relationship [role] on model [App\Models\User]."
```

الـ controller يستدعي علاقة **`role`** بينما النموذج يعرّف **`roles`** (علاقة many-to-many — وهي نفسها التي تقرأها ميزة الصلاحيات).

**الحل (باك إند):** سطر واحد —

```php
->with('role')      // ❌
->with('roles')     // ✅
```

ويلزم تعديل ما يقرأ النتيجة بعدها، لأن `roles` مجموعة لا كائن مفرد.

---

## ب-٣ · ترتيب المسارات يبتلع `/stats`

```
GET /{role}/invoices/stats → 404  "No query results for model [App\Models\Invoice] stats"
GET /{role}/payments/stats → 404  "No query results for model [App\Models\Payment] stats"
```

رسالة الخطأ تكشف السبب بدقة: Laravel يفسّر كلمة **`stats` كمُعرِّف** ويحاول جلب فاتورة رقمها `"stats"`. أي أن `/{id}` مُعلَن **قبل** `/stats`، والمطابقة تتم بالترتيب.

**الحل (باك إند):** نقل مسار `stats` فوق المسار المُعامِل:

```php
Route::get('invoices/stats', [InvoiceController::class, 'stats']);   // ← أولًا
Route::apiResource('invoices', InvoiceController::class);            // ← ثانيًا
```

**ما فعلته:** اشتقاق الإحصائيات من القائمة، مع `try` يعود للسيرفر تلقائيًا عند الإصلاح (و-٣).

---

## ب-٤ · `/requests/stats` غير موجود أصلًا

```
GET /super_admin/requests/stats → 404  "The route … could not be found."
```

الواجهة تستدعيه عبر `joinRequestApi.getStats`. **الحل (باك إند):** إضافة المسار، أو حذف الاستدعاء من الواجهة إن لم يكن مطلوبًا.

---

## ب-٥ · `/company-data` غير متاح لدور الشركة

```
GET /super_admin/company-data/1 → 200 ✅
GET /company/company-data       → 404 ❌
```

النسخة المُعامِلة موجودة للسوبر أدمن فقط؛ مدير الشركة لا يملك طريقة لجلب بيانات شركته.

**الحل (باك إند):** تسجيل `company-data` تحت بادئة `company` بحيث يستنتج الشركة من التوكن.

> 📌 **خبر جيد:** `/super_admin/company-data/{id}` كان يردّ `500 Cannot redeclare InvoiceController::clientProjects()` في التقرير السابق — **أُصلح على السيرفر**، يعمل الآن. الالتفاف الذي بنيته في `useCompanyClients` ما زال يعمل ولا يضرّ.

---

## ب-٦ · ازدواج مجموعة صلاحيات المحفظة

الكتالوج يحوي المورد نفسه بتهجئتين: `wallet_transactions.*` (37-40) و `walletTransactions.*` (72-74)، بأفعال متداخلة جزئيًا.

**الخطر:** منح `wallet_transactions.view` قد لا يُرضي فحصًا مكتوبًا على `walletTransactions.view`.

**الحل (باك إند):** توحيد التهجئة وترحيل الصفوف. **ما فعلته:** الواجهة تدمجهما في مجموعة واحدة وتمنح **كل المعرّفات** بالتهجئتين عند تفعيل أي فعل.

---

# ⚪️ فُحصت ونُفيت

| الحالة | النتيجة |
|---|---|
| `/wallets/1/balance` → 404 | ليست عطلًا — لا توجد محافظ في قاعدة البيانات أصلًا (`total: 0`). |
| `/client/*` ترد 404 لكثير من النقاط | مقصود — العميل لا يملك موظفين ولا عملات ولا أدوارًا. الشريط الجانبي يخفيها له أصلًا. |

---

# حالة التحقّق

```
tsc              0 أخطاء ✅
eslint           0 أخطاء · 13 تحذير (كلها <img> بدل next/image — قائمة من قبل) ✅
next build       ✓ Compiled successfully — exit 0 ✅
مفاتيح i18n      لا يوجد مفقود ✅
اختبارات حية     12/12 نجحت ✅
```

⚠️ **لم يجرِ تحقّق بصري** — لا أستطيع تسجيل الدخول. كل ما سبق مُثبَت بطلبات حقيقية وفحص آلي، لكن رؤية الشاشات لك.

---

# أولويات تذكرة الباك إند

1. **🔒 تسريب `/company/clients`** — مدير الشركة يرى عملاء شركة أخرى. مشكلة عزل بيانات، لا مجرد عطل واجهة.
2. **صفوف الصلاحيات لا تطابق المسارات** — لا دور أساسي يملك `conversations.*` عدا السوبر أدمن، والمسار مفتوح للجميع. هذا ما يمنع تفعيل المنع في ميزة الأدوار.
3. **ب-١** العقود — وحدة كاملة معطّلة
4. **ب-٢** طلبات الشركات — وحدة كاملة معطّلة، والحل سطر واحد
5. **ب-٣** ترتيب مسارات `/stats` — الواجهة تعوّضها الآن لكن الأرقام تقريبية
6. **`/company/walletTransactions` → 403** — قرار: تُمنح الصلاحية أم يُزال العنصر؟
7. **ب-٥** `company-data` لدور الشركة
8. **ب-٦** ازدواج تهجئة الصلاحيات
9. **ب-٤** `/requests/stats`

مع ثلاث ثغرات من التقرير السابق ما زالت قائمة: قبول `role_id` من شركة أخرى، الحذف الناعم للمحادثات، ودلالة `PUT` التي تعتبر غياب الحقل أمرًا بمسحه.
