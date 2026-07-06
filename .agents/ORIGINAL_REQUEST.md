# Original User Request

## 2026-07-03T17:01:17Z

قيّم مشروع **Workflow** (تطبيق Next.js 16 / React 19) من منظور خبير Frontend بتركيز على ثلاثة محاور: **السرعة والأداء، كفاءة الكود، والحماية الأمنية**. اجمع النتائج في تقرير شامل بأولويات الإصلاح.

Working directory: `c:\Users\m s i\Downloads\Telegram Desktop\workflow - 2\workflow - 2`

Integrity mode: development

---

## Stack المشروع (للمرجعية)

- **Framework:** Next.js 16 + React 19
- **Language:** TypeScript 5
- **State:** TanStack React Query + Zustand
- **Forms:** React Hook Form + Zod
- **UI:** Radix UI + Shadcn + Recharts + Lucide
- **Auth/Token:** js-cookie
- **HTTP:** Axios
- **i18n:** next-intl
- **CSS:** Tailwind CSS 4

---

## Requirements

### R1. تقييم السرعة والأداء
افحص المشروع لمشاكل تؤثر على سرعة التحميل والأداء:
- حجم الـ bundle (مع تحليل @next/bundle-analyzer أو المكافئ).
- استخدام `next/image` بدل `<img>` العادي.
- مدى تطبيق `dynamic()` / lazy loading للمكونات الثقيلة.
- استخدام `Suspense` و `loading.tsx` بشكل صحيح.
- أي imports ثقيلة تُحمَّل في client bundle بدون ضرورة.
- إعدادات caching في `next.config.ts` (headers, revalidate).

### R2. تقييم كفاءة الكود والبنية
افحص الكود لجودة التنفيذ ومشاكل الكفاءة:
- Re-renders غير ضرورية (مكونات بدون `memo`، hooks تُحسب في كل render).
- استخدام React Query بشكل صحيح (stale time, caching, prefetching).
- Zustand stores: هل هي مجزأة بشكل سليم أم كل شيء في store واحد؟
- Dead code أو مكونات/hooks غير مستخدمة.
- مشاكل في `useEffect` (dependencies، cleanup، memory leaks محتملة).
- TypeScript errors موجودة وتأثيرها على الكود.

### R3. تقييم الحماية الأمنية
افحص المشروع لمخاطر الأمان الشائعة في تطبيقات Next.js:
- كيفية تخزين وإدارة tokens (js-cookie) — هل هي HttpOnly؟ هل مُعرَّضة لـ XSS؟
- تسرب متغيرات البيئة: هل يوجد `NEXT_PUBLIC_` على بيانات حساسة؟
- API calls: هل headers الـ Authorization مكشوفة أو مُسرَّبة للـ client؟
- هل يوجد تحقق من مدخلات المستخدم (Zod) في كل النماذج أم في بعضها فقط؟
- هل يوجد `Content-Security-Policy` أو Security Headers في `next.config.ts`؟
- أي `dangerouslySetInnerHTML` أو مخاطر XSS مباشرة.

### R4. تشغيل الأدوات الآلية
شغّل الأوامر التالية واجمع نتائجها في التقرير:
```bash
# TypeScript errors
npx tsc --noEmit

# ESLint
npx next lint

# Bundle analysis (install إذا مش موجود)
npx @next/bundle-analyzer
```

---

## Acceptance Criteria

### التقرير النهائي يجب أن يحتوي على

- [ ] **Executive Summary:** ملخص من 5-10 أسطر بأبرز المشاكل المكتشفة
- [ ] **جدول أولويات:** كل مشكلة مصنّفة (Critical / High / Medium / Low)
- [ ] **نتائج R1 (الأداء):** مشاكل محددة مع ملف/سطر + اقتراح الإصلاح
- [ ] **نتائج R2 (الكفاءة):** مشاكل محددة مع ملف/سطر + اقتراح الإصلاح
- [ ] **نتائج R3 (الأمان):** مشاكل محددة مع ملف/سطر + اقتراح الإصلاح
- [ ] **نتائج الأدوات الآلية (R4):** نسخ من outputs مع شرح مختصر لكل مشكلة
- [ ] **خطة الإصلاح:** قائمة مرتبة بحسب الأولوية (ابدأ بـ Critical ثم High)

### معايير الجودة

- [ ] كل مشكلة تذكر: الملف الدقيق + رقم السطر + الكود المشكل + الكود المُصلَح المقترح
- [ ] التقرير مكتوب بالعربية (مع الاحتفاظ بالمصطلحات التقنية بالإنجليزية)
- [ ] لا تكتفي بالنظرة السطحية — افتح الملفات الداخلية وافحصها فعلياً

## Follow-up — 2026-07-03T17:09:47Z

قيّم مشروع **Workflow** (تطبيق Next.js 16 / React 19) من منظور خبير Frontend بتركيز على ثلاثة محاور: **السرعة والأداء، كفاءة الكود، والحماية الأمنية**. اجمع النتائج في تقرير شامل بأولويات الإصلاح.

Working directory: `c:\Users\m s i\Downloads\Telegram Desktop\workflow - 2\workflow - 2`

Integrity mode: development

---

## Stack المشروع (للمرجعية)

- **Framework:** Next.js 16 + React 19
- **Language:** TypeScript 5
- **State:** TanStack React Query + Zustand
- **Forms:** React Hook Form + Zod
- **UI:** Radix UI + Shadcn + Recharts + Lucide
- **Auth/Token:** js-cookie
- **HTTP:** Axios
- **i18n:** next-intl
- **CSS:** Tailwind CSS 4

---

## Requirements

### R1. تقييم السرعة والأداء
افحص المشروع لمشاكل تؤثر على سرعة التحميل والأداء:
- حجم الـ bundle (مع تحليل @next/bundle-analyzer أو المكافئ).
- استخدام `next/image` بدل `<img>` العادي.
- مدى تطبيق `dynamic()` / lazy loading للمكونات الثقيلة.
- استخدام `Suspense` و `loading.tsx` بشكل صحيح.
- أي imports ثقيلة تُحمَّل في client bundle بدون ضرورة.
- إعدادات caching في `next.config.ts` (headers, revalidate).

### R2. تقييم كفاءة الكود والبنية
افحص الكود لجودة التنفيذ ومشاكل الكفاءة:
- Re-renders غير ضرورية (مكونات بدون `memo`، hooks تُحسب في كل render).
- استخدام React Query بشكل صحيح (stale time, caching, prefetching).
- Zustand stores: هل هي مجزأة بشكل سليم أم كل شيء في store واحد؟
- Dead code أو مكونات/hooks غير مستخدمة.
- مشاكل في `useEffect` (dependencies، cleanup، memory leaks محتملة).
- TypeScript errors موجودة وتأثيرها على الكود.

### R3. تقييم الحماية الأمنية
افحص المشروع لمخاطر الأمان الشائعة في تطبيقات Next.js:
- كيفية تخزين وإدارة tokens (js-cookie) — هل هي HttpOnly؟ هل مُعرَّضة لـ XSS؟
- تسرب متغيرات البيئة: هل يوجد `NEXT_PUBLIC_` على بيانات حساسة؟
- API calls: هل headers الـ Authorization مكشوفة أو مُسرَّبة للـ client؟
- هل يوجد تحقق من مدخلات المستخدم (Zod) في كل النماذج أم في بعضها فقط؟
- هل يوجد `Content-Security-Policy` أو Security Headers في `next.config.ts`؟
- أي `dangerouslySetInnerHTML` أو مخاطر XSS مباشرة.

### R4. تشغيل الأدوات الآلية
شغّل الأوامر التالية واجمع نتائجها في التقرير:
```bash
# TypeScript errors
npx tsc --noEmit

# ESLint
npx next lint
```

---

## Acceptance Criteria

### التقرير النهائي يجب أن يحتوي على

- [ ] **Executive Summary:** ملخص من 5-10 أسطر بأبرز المشاكل المكتشفة
- [ ] **جدول أولويات:** كل مشكلة مصنّفة (Critical / High / Medium / Low)
- [ ] **نتائج R1 (الأداء):** مشاكل محددة مع ملف/سطر + اقتراح الإصلاح
- [ ] **نتائج R2 (الكفاءة):** مشاكل محددة مع ملف/سطر + اقتراح الإصلاح
- [ ] **نتائج R3 (الأمان):** مشاكل محددة مع ملف/سطر + اقتراح الإصلاح
- [ ] **نتائج الأدوات الآلية (R4):** نسخ من outputs مع شرح مختصر لكل مشكلة
- [ ] **خطة الإصلاح:** قائمة مرتبة بحسب الأولوية (ابدأ بـ Critical ثم High)

### معايير الجودة

- [ ] كل مشكلة تذكر: الملف الدقيق + رقم السطر + الكود المشكل + الكود المُصلَح المقترح
- [ ] التقرير مكتوب بالعربية (مع الاحتفاظ بالمصطلحات التقنية بالإنجليزية)
- [ ] لا تكتفي بالنظرة السطحية — افتح الملفات الداخلية وافحصها فعلياً

**اكتب التقرير النهائي في ملف markdown واجعله artifact يُعرض للمستخدم.**
