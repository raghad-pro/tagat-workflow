# تقرير تدقيق الـ Endpoints

## نطاق التدقيق

تمت مراجعة طبقة الاتصال في المشروع، وتشمل **23 ملف API module** وجميع استدعاءات `apiClient`، ثم تم إجراء فحص حي على **73 مسارًا** من المسارات المستخدمة. الفحص الحي تم بدون Access Token؛ لذلك فإن استجابة `200` مع `Content-Type: text/html` ومحتوى صفحة Login لا تعني أن الـ endpoint يعمل، بل تعني غالبًا أن الخادم أعاد توجيه الطلب غير الموثق إلى صفحة الدخول. أما `404` الصريح ونتائج إغلاق الاتصال فهي أدلة مباشرة على وجود مشكلة في المسار أو الخادم.

## Endpoints مؤكدة عدم العمل

| الأولوية | Endpoint | الملف والسطر | النتيجة | السبب المرجح | الحل |
|---|---|---|---|---|---|
| حرجة | `GET /api/v1/super_admin/requests/stats` | `src/modules/company-requests/api/company-requests.api.ts:23-24` | `404 Not Found` | الواجهة تستدعي مسار إحصائيات غير موجود في الـ Backend. | إمّا إضافة route/controller باسم `GET /{role}/requests/stats` في الـ Backend، أو حذف الاستدعاء واستخراج الإحصائيات من نتيجة `GET /{role}/requests` إذا كانت البيانات متوفرة هناك. يجب توحيد الحل للـ `super_admin` و`company`. |
| حرجة | `GET /api/v1/super_admin/availbale-user` | `src/modules/employees/api/employees.api.ts:25-44` | `404 Not Found` | المسار غير موجود. كما أن كلمة `availbale` تحتوي خطأ إملائيًا، لكن تجربة `/available-user` أيضًا أعادت `404`، لذلك المشكلة ليست مجرد typo؛ endpoint غير منشور أو تغيّر اسمه. | الأفضل استبدال هذا الاستدعاء بـ `GET /{role}/employees` مع فلتر مناسب، أو إضافة endpoint رسمي موحد مثل `GET /{role}/available-users`. يجب تعديل الـ frontend والـ backend إلى نفس الاسم، ويفضل استخدام kebab-case ثابت. |
| حرجة | `POST /api/v1/verify-otp` | `src/modules/auth/api/auth.api.ts:75-78` | `404 Not Found` | الواجهة تستدعي endpoint غير موجود. المسار القريب الموجود فعليًا هو `POST /verify-email-otp`، وقد أعاد `400 {"status":0,"message":"Invalid OTP"}` عند تجربة OTP غير صحيح، وهذا يؤكد أن مسار التحقق من البريد موجود. | في تدفق تفعيل البريد، استبدال `/verify-otp` بـ `/verify-email-otp` مع مطابقة payload والـ response. أما تدفق استعادة كلمة المرور فيجب فصله واستخدام endpoint مستقل مؤكد من Backend. |
| حرجة | `POST /api/v1/forgot-password` | `src/modules/auth/api/auth.api.ts:59-62` | الاتصال أُغلق من الخادم بدون HTTP response في الاختبار | endpoint لا يعيد استجابة مستقرة عند إرسال طلب استعادة كلمة المرور. قد يكون السبب exception في Backend، WAF/Hostinger، أو اختلاف أسماء الحقول عن contract الفعلي. | فحص Laravel/PHP logs، والتأكد من أن المسار يعيد JSON في كل الحالات، وتوحيد payload مثل `{ email }`. يجب أن يعيد أخطاء التحقق `422` بدل إغلاق الاتصال، والنجاح `200/202` بصيغة JSON ثابتة. |
| حرجة | `POST /api/v1/verify-otp-forgot-password` | `src/modules/auth/api/auth.api.ts:80-83` | الاتصال أُغلق بدون HTTP response | نفس مشكلة تدفق استعادة كلمة المرور، أو endpoint غير مستقر على الخادم. | توحيد تدفق reset password إلى endpoints موثقة، وإضافة اختبار backend للـ OTP الصحيح والخاطئ والمنتهي. يجب أن تعود الحالات `400/422/429` بصيغة JSON بدل قطع الاتصال. |

## Endpoint يحتاج تحقق Backend إضافي

| Endpoint | الملاحظة | التفسير والحل |
|---|---|---|
| `PUT /api/v1/super_admin/meetings/1/whiteboard` | الاتصال أُغلق عند الطلب غير الموثق. | لا يمكن اعتباره `404`؛ المسار قد يكون موجودًا لكن الخادم يغلق طلب PUT قبل إرجاع JSON أو يتطلب Meeting حقيقيًا وToken. يجب اختباره بجلسة موثقة وMeeting فعلي. إذا كان Laravel أو الاستضافة لا تتعامل جيدًا مع PUT multipart/JSON، أضيفوا دعم `POST` مع `_method=PUT` أو أصلحوا middleware ليعيد `401/422` بدل إغلاق الاتصال. |

## نتائج ليست أعطالًا حقيقية

| الحالة | التوضيح |
|---|---|
| `POST /register` أعاد `422` | هذا متوقع لأن الاختبار أرسل body غير مكتمل. يجب اختبار التسجيل ببيانات صحيحة، وليس اعتبار `422` فشل route. |
| أغلب GET/POST أعادت `200` مع HTML Login | هذه ليست استجابة API ناجحة. هي Redirect/Login fallback بسبب عدم وجود Access Token. يجب أن يعيد Backend `401 JSON` لمسارات `/api/v1/*` بدل صفحة HTML، خصوصًا عند وجود `Accept: application/json`. |
| `/super_admin/wallet-transactions` أعاد `404` في الاختبار الأول | هذا لم يكن المسار المستخدم في الكود. الكود يستخدم camelCase: `/super_admin/walletTransactions`. عند تجربة المسار الفعلي ظهر `200 HTML Login`، لذلك لا يوجد دليل حالي على أن route نفسه مفقود. يجب توحيد التسمية لاحقًا لأن وجود camelCase في URL يسبب التباسًا. |
| `/super_admin/profile` أعاد `404` في الاختبار الأول | الكود لا يستخدم هذا المسار؛ `profile.api.ts` يستخدم `/{role}/account` و`/{role}/account/update`. لذلك نتيجة `/profile` لا تخص endpoint مستخدمًا من التطبيق. |

## مشاكل في طبقة الـ API قد تجعل endpoint يبدو متعطلًا رغم أن route موجود

### حذف الحساب يرسل body متداخلًا

الـ shared client يعرّف `delete(url, body)` ثم يرسل body داخل `{ data: body }`. في المقابل، `profileApi.deleteAccount` يمرر أصلًا `{ data: { account_activation: true } }`. النتيجة المحتملة هي body متداخل بهذا الشكل:

```json
{
  "data": {
    "data": {
      "account_activation": true
    }
  }
}
```

يجب تعديل الاستدعاء إلى:

```ts
apiClient.delete(`${prefix}/account/delete`, {
  account_activation: true,
});
```

أو تغيير contract الخاص بـ `apiClient.delete` بحيث يقبل Axios config بشكل واضح، وليس body مخصصًا.

### عدم توحيد response unwrap

بعض الوحدات تتعامل مع نتيجة `apiClient` على أنها body كامل وتقرأ `.data`، وبعضها يعيد النتيجة مباشرة، وبعض تدفقات المصادقة تعيد `response` الخام. بما أن `apiClient` يرجع أصلًا `res.data` من Axios، يجب اعتماد contract واحد:

```ts
// apiClient يرجع body الخاص بالـ API
const body = await apiClient.get<ApiResponse<T>>(url);
return body.data;
```

أما إذا كانت الاستجابة غير مغلفة، فيجب التعامل معها عبر helper موحد، وليس عبر `response.data` عشوائيًا في كل module. هذا مهم خصوصًا في `auth.api.ts` و`employees.api.ts` و`contracts.api.ts`.

### Middleware يعيد صفحة Login بدل JSON

في `src/middleware.ts` يوجد proxy محلي لمسار `/backend-api`، لكن الخادم البعيد يعيد HTML Login عند عدم وجود token. هذا يجعل Axios يمرر استجابة `200 text/html` إلى أجزاء تتوقع JSON، فتظهر المشكلة في الواجهة كأنها empty data أو parsing failure.

الحل الصحيح هو جعل API middleware في Backend يعيد:

```json
{
  "success": false,
  "message": "Unauthenticated"
}
```

مع status `401` و`Content-Type: application/json`. وفي الواجهة، يجب رفض أي response ليست JSON متوقعة بدل اعتبارها بيانات فارغة.

## ترتيب الإصلاح المقترح

1. إصلاح أو حذف `GET /{role}/requests/stats` لأنه 404 مؤكد ويؤثر على صفحة طلبات الشركات.
2. إصلاح `getAvailableUsers`؛ الحل الأسرع استخدام قائمة الموظفين الموجودة بدل endpoint المفقود.
3. توحيد OTP: استخدام `/verify-email-otp` لتفعيل البريد، وإعادة بناء تدفق forgot-password بعد التأكد من أسماء endpoints في Backend.
4. فحص أخطاء الخادم الخاصة بـ `/forgot-password` و`/verify-otp-forgot-password` لأن الاتصال ينقطع بدل إرجاع JSON.
5. إصلاح `deleteAccount` بسبب body المتداخل.
6. جعل جميع أخطاء API تعود JSON مع `401/403/404/422/500` بدل HTML Login.
7. إعادة اختبار جميع endpoints بجلسة موثقة، لأن الاختبار الحالي يثبت وجود المسارات أو غيابها لكنه لا يثبت صلاحيات كل role أو صحة كل payload.

## الخلاصة

المشاكل المؤكدة حاليًا هي **ثلاثة مسارات مفقودة صراحةً**: إحصائيات طلبات الشركات، المستخدمون المتاحون، و`verify-otp`، بالإضافة إلى **مسارين في استعادة كلمة المرور يقطعان الاتصال**. كما يوجد خلل مؤكد في body الخاص بحذف الحساب، ومشكلة بنيوية في إعادة HTML Login بدل JSON. بقية endpoints لا يمكن اعتبارها سليمة نهائيًا اعتمادًا على `200` الحالي، لأن أغلبها اختُبر بدون Token وأعاد صفحة الدخول.

## مراجع الأدلة داخل المشروع

[1]: `src/modules/company-requests/api/company-requests.api.ts` — تعريف endpoint إحصائيات الطلبات.
[2]: `src/modules/employees/api/employees.api.ts` — تعريف endpoint `availbale-user`.
[3]: `src/modules/auth/api/auth.api.ts` — تدفقات التسجيل وOTP واستعادة كلمة المرور.
[4]: `src/modules/profile/api/profile.api.ts` — endpoint حذف الحساب وbody الحالي.
[5]: `src/services/apiClient.ts` — contract الخاص بـ GET/POST/PUT/DELETE.
[6]: `src/middleware.ts` — proxy المحلي لمسار `/backend-api`.
[7]: `endpoint-probe-results.csv` — نتائج الفحص الحي لجميع المسارات المختبرة.
[8]: `endpoint-probe-detail.json` — تفاصيل response bodies للمسارات المشكوك بها.
