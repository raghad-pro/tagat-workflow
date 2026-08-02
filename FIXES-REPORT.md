# تقرير الإصلاحات — Conversations · Auth · Projects

> **التاريخ:** 2026-08-01 · **الفرع:** `staging`
> **النطاق:** وحدة المحادثات، صلاحيات الدخول (الأدوار)، وحدة المشاريع

كل خلل مذكور أدناه جرى التحقّق منه مقابل الـ API الحيّ قبل الإصلاح، لا استنتاجًا من الكود وحده.

---

## 1. وحدة المحادثات (Conversations)

### 1.1 المعاملات تُرسل مغلّفة مرّتين — `{ params }`

`ApiClient.get` يغلّف وسيطه الثاني داخل `{ params }` بنفسه، فتمرير `{ params }` مرّة أخرى ينتج:

```
❌  /conversations?params[search]=ali&params[per_page]=20
✅  /conversations?search=ali&per_page=20
```

النتيجة: البحث والترقيم لا يعملان إطلاقًا — السيرفر لا يرى المفاتيح أصلاً.

```ts
// src/modules/conversations/api/conversations.api.ts
getAll: apiClient.get(base(role), params as Record<string, unknown>)
```

> ⚠️ **نفس الخلل ما زال موجودًا في `src/modules/projects/api/projects.api.ts`** — لم يُصلَح لأنه خارج نطاق ما طُلب.

### 1.2 المحادثات تُفتح فارغة

نقطة التفصيل تُعشِّش الرسائل تحت `data.conversation`، بينما الواجهة كانت تقرأ `data` مباشرة، فتخرج قائمة رسائل فارغة دائمًا. أُضيفت دالة فكّ تغليف واحدة تتعامل مع الشكلين وتحتفظ بـ `receiver`:

```ts
function unwrapConversation(body: unknown): Conversation {
  const payload = unwrapOne<Record<string, any>>(body);
  if (payload && typeof payload === "object" && "conversation" in payload) {
    const { conversation, receiver } = payload;
    return { ...(conversation as Conversation), receiver: receiver ?? null };
  }
  return payload as Conversation;
}
```

### 1.3 `type` مرفوض من السيرفر — "The selected type is invalid"

القيم الصالحة ليست `private` / `group` بل **`team_chat` / `client_chat`**. صار النوع يُشتق من المشاركين المختارين:

```ts
const apiType = chosen.some((p) => p.kind === "client") ? "client_chat" : "team_chat";
```

`private` / `group` بقيت **مفهومًا في الواجهة فقط**، لا تُرسل للسيرفر.

### 1.4 طرق HTTP خاطئة → 405

| العملية | كان | صار |
|---|---|---|
| تغيير دور عضو | `POST` | `PUT` |
| تعديل المجموعة | `POST` + FormData | `PUT` (مع تراجع لطيف عند الفشل) |

### 1.5 التواريخ تُقرأ خطأً

`"2026-07-30 14:03:12"` بلا `T` وبلا منطقة زمنية → `Date.parse` يعطي `NaN` على بعض المتصفحات، فينهار الترتيب وتظهر الطوابع الزمنية فارغة:

```ts
// src/modules/conversations/utils/conversation.helpers.ts
export function toTimestamp(value?: string | null): number {
  if (!value) return 0;
  let normalized = String(value).trim();
  if (!normalized.includes("T")) normalized = normalized.replace(" ", "T");
  if (!/([Zz]|[+-]\d{2}:?\d{2})$/.test(normalized)) normalized += "Z";
  const ms = Date.parse(normalized);
  return Number.isNaN(ms) ? 0 : ms;
}
```

كل عرض وترتيب للوقت يمرّ الآن عبرها.

### 1.6 المحادثة الجديدة لا تظهر في القائمة

سببان منفصلان:

1. **تأخّر الكاش** — عولج ببذر النتيجة في الكاش فورًا ثم `invalidate`:

```ts
onSuccess: (created) => {
  if (created?.id) {
    queryClient.setQueriesData<ConversationsListResult>(
      { queryKey: conversationKeys.all(role) },
      (old) => {
        if (!old?.data) return old;
        if (old.data.some((c) => String(c.id) === String(created.id))) return old;
        return { ...old, data: [created, ...old.data], /* … */ };
      });
  }
  return invalidateAll();
}
```

2. **محادثات شبح — خلل في الـ backend** ⚠️
   السيرفر يستخدم soft-delete، ومنطق منع التكرار يطابق **الصفوف المحذوفة أيضًا**: فيعيد لك `id` محادثة محذوفة بحالة `200 OK`، لكنها لا تظهر في قائمة `index` لأنها محذوفة. لا يوجد مسار `restore`.
   **لا يمكن إصلاحه من الواجهة.** ما فُعل: كشف الحالة وتنبيه المستخدم بدل الفشل الصامت:

```ts
const created = await createConversation(payload);
const { data: fresh } = await refetchConversations();
const isVisible = fresh?.data?.some((c) => String(c.id) === String(created?.id));
if (created?.id && !isVisible) toast.error(t("orphanedToast"), { id: toastId });
```

### 1.7 تحسينات مصاحبة

- **Polling:** القائمة كل 20 ثانية، الخيط المفتوح كل 7 ثوانٍ.
- **إرسال تفاؤلي** (`onMutate`) — الرسالة تظهر فورًا وتُصحَّح عند ردّ السيرفر.
- ملفات جديدة: `conversation.helpers.ts` · `message.format.ts` · `useParticipants.ts` · `ConversationSkeleton.tsx`.
- إعادة بناء الواجهة كاملة على design tokens (`--color-bg-form`, `--color-text-brand`, …) مع دعم كامل للوضع الليلي و RTL عبر الخصائص المنطقية (`ps-`, `pe-`, `border-e`, `rtl:rotate-180`).

---

## 2. الأدوار — السوبر أدمن يدخل كـ "company"

### السبب الجذري

```js
String([{ id: 1, name: "super_admin" }])   // → "[object Object]"
```

الـ API يُرجع الدور أحيانًا كمصفوفة كائنات، وأحيانًا كائنًا، ورقمًا، ونصًّا. الكود كان يعمل `String()` مباشرة، فينتج `"[object Object]"` الذي لا يطابق أي دور معروف → السقوط للقيمة الافتراضية `"company"`.

### الإصلاح

`extractRoleSource()` في `src/modules/auth/types/auth.types.ts` يتعامل مع الأشكال الأربعة، ويقدّم **الاسم على الـ id**، ويقرأ `role` و `roles` من كائن المستخدم ومن الحمولة الخام معًا.

### فخّ مهم — الكاش القديم

الدور الخاطئ كان محفوظًا في `localStorage`، فالإصلاح وحده لا يكفي للجلسات القائمة. أُضيف ترقيم إصدار للمخطّط:

```ts
// src/providers/AuthProvider.tsx
const USER_SCHEMA_KEY = "user_schema";
const USER_SCHEMA_VERSION = "2";   // loadUser() يُسقط أي كاش أقدم
```

### أثر جانبي فوري

بعد تصحيح الدور اختفت "المحادثات" من قائمة السوبر أدمن — لأن العنصر كان مقيّدًا بـ `["company"]` فقط:

```ts
// src/components/organisms/Sidebar.tsx:88
roles: ["super_admin", "company", "employee", "client"]
```

---

## 3. وحدة المشاريع (Projects)

### 3.1 🔴 الأخطر — إسناد الشخص الخطأ للمشروع

القائمة كانت ترسل **`employee.id`** (مُعرِّف سجلّ الموظف)، بينما السيرفر يتحقّق من `employees[]` و `leader_id` مقابل جدول **`users`**. المُعرِّفان مختلفان تمامًا.

**الأثر:** لا يظهر خطأ إطلاقًا — الطلب ينجح بـ `200`، ويُسنَد **شخص آخر** للمشروع بصمت. في بيانات الاختبار كان **الموظفون الخمسة جميعهم مسنَدين لأشخاص خاطئين**.

```ts
.map((e: any) => ({
  value: String(e.user_id ?? e.user?.id ?? ""),     // ← user id، لا employee id
  label: e.user?.name ?? e.name ?? e.employee_name ?? "",
}))
.filter((o: any) => o.value !== "")
```

### 3.2 حقل قائد المشروع (Leader) — إضافة جديدة

مقيّد بأعضاء الفريق المختارين، ويُمسح تلقائيًا إذا أُزيل من الأعضاء:

```ts
const selectedEmployees: string[] = form.watch("employees") ?? [];
const leaderOptions = employeeOptions.filter(
  (o: any) => o.value !== "no-data" && selectedEmployees.includes(o.value));

const selectedLeader = form.watch("leader_id");
useEffect(() => {
  if (selectedLeader && !selectedEmployees.includes(selectedLeader))
    form.setValue("leader_id", "");
}, [selectedEmployees, selectedLeader, form]);
```

مع تحقّق على مستوى المخطّط كخطّ دفاع ثانٍ:

```ts
.refine((v) => !v.leader_id || v.employees.includes(v.leader_id), {
  path: ["leader_id"], message: tProject("validation.leaderNotMember") })
```

الحقل معطّل حتى يُختار عضو واحد على الأقل، وفي نافذة التعديل لا يُملأ مسبقًا إلا إذا كان القائد المحفوظ ما زال عضوًا.

### 3.3 قائمة العملاء معطّلة دائمًا — "No clients"

المصدر القديم `/{role}/company-data/{id}` **ميّت**:

- `super_admin` → `500 Cannot redeclare InvoiceController::clientProjects()`
- `company` → `404` (المسار غير موجود أصلاً)

بما أن العميل حقل مطلوب، كان إنشاء أي مشروع **مستحيلاً**. حُوِّل المصدر إلى `/{role}/clients` مع تصفية حسب الشركة للسوبر أدمن:

```ts
// src/modules/projects/hooks/useCompanyData.ts
const response = await apiClient.get(`${getRolePrefix(role)}/clients`, { per_page: 200 });
if (isCompanyAdmin || !companyId) return list;
return list.filter((c: any) =>
  Array.isArray(c?.companies)
    ? c.companies.some((co: any) => String(co?.id) === String(companyId))
    : String(c?.company_id ?? "") === String(companyId));
```

### 3.4 قائمة الموظفين لا تُفتح — تعارض z-index

القائمة **كانت تُفتح فعلاً**، لكن خلف المودال:

```
ActionModal      →  fixed inset-0   z-[100]
PopoverContent   →  Portal إلى <body>   z-50      ← مختفية تحته
```

`PopoverContent` يمرّ عبر **Portal** إلى `document.body`. حقلا العميل والعملة يعملان لأنهما `SelectContent` بـ **`usePortal={false}`** فيُرسمان داخل المودال. الفرق في آلية العرض، لا في البيانات — والدليل أن الحقل كان يعرض "Select employees" (أي عنده خيارات) لا "No employees".

```diff
- <PopoverContent className="w-[300px] p-0 …"
+ <PopoverContent className="z-[200] w-[300px] p-0 …"
```

أُصلح في المكوّن المشترك `src/components/molecules/FormFields.tsx` لا في مكان الاستخدام، فيستفيد كل استخدامات `MultiSelectField`.

**التحقّق:** `twMerge` يُسقط `z-50` ويُبقي `z-[200]` → `"flex z-[200] w-[300px] …"` ✅

### 3.5 حالة `on_hold` مرفوضة

اكتُشف بإرسال قيمة غير صالحة وقراءة قائمة القيم المقبولة من ردّ التحقّق. أُزيلت من خيارات الحالة.

---

## 4. أخطاء في الـ Backend — لا يمكن إصلاحها من الواجهة

| # | النقطة | العطل |
|---|---|---|
| 1 | `GET /{role}/company-data/{id}` | `500 Cannot redeclare InvoiceController::clientProjects()` |
| 2 | `GET /company/company-data` | `404` — المسار غير موجود |
| 3 | Conversations | soft-delete + منطق منع التكرار يطابق الصفوف المحذوفة → محادثات شبح |
| 4 | Conversations | نقطة التفصيل تُقدّم محادثات محذوفة |
| 5 | Conversations | لا يوجد مسار `restore` |
| 6 | Conversations | لا يوجد مسار لرفع صورة المجموعة |
| 7 | Conversations | لا يوجد مسار لحذف رسالة |
| 8 | Contracts | الـ controller مفقود → `500` |

**الأولوية:** (1) و (2) — تمنعان استخدام وحدة المشاريع كليًّا. (3) يسبّب فقدان بيانات ظاهريًّا للمستخدم.

---

## 5. المنهجية

1. **استكشاف المسارات** — طلب `PATCH` وقراءة ترويسة `Allow` للحصول على الطرق المدعومة فعليًّا.
2. **استخراج الحقول المطلوبة** — `POST` فارغ وقراءة أخطاء التحقّق.
3. **استخراج قيم الـ enum** — إرسال قيمة غير صالحة عمدًا.
4. **تمييز الجداول** — مُعرِّفات متمايزة للتفريق بين تحقّق `users` و `employees` (هكذا انكشف الخلل 3.1).
5. **إعادة تنفيذ المنطق الشحين في Node** على حمولات حقيقية بدل التخمين.
6. **تجارب قابلة للعكس** — إضافة عضو ← فحص ← إزالة. **كل بيانات الاختبار حُذفت.**

---

## 6. حالة التحقّق

```
tsc            0 أخطاء ✅
eslint         نظيف ✅
next build     ✓ Compiled successfully — exit 0 ✅
```

⚠️ **لم يجرِ تحقّق بصري** — لا أملك بيانات دخول، فالتأكيد من داخل الواجهة على المستخدم.

---

## 7. متبقٍّ / مفتوح

- [ ] **تأكيد بصري** لفتح قائمة الموظفين بعد إصلاح z-index.
- [ ] **حقل Company غائب** من نافذة إضافة مشروع — يعني أن التطبيق ما زال يعتبر الحساب `role === "company"` لا `super_admin`. للفحص:
  ```js
  JSON.parse(localStorage.getItem('user')).role
  ```
- [ ] فتح تذكرة backend للعطلين `500` (البند 4-1، 4-2).
- [ ] إصلاح تغليف `{ params }` المزدوج في `src/modules/projects/api/projects.api.ts`.
- [ ] حسم صياغة قائمة نوع المحادثة: "خاص / مجموعة" أم "فريق / عميل"؟
