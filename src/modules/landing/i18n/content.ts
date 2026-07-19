// Default bundled content for both languages.
// The Laravel dashboard can override any of these values via GET /api/content?locale=xx
// (deep-merged over these defaults at runtime).

export const content = {
  en: {
    dir: 'ltr',
    nav: {
      home: 'Home',
      about: 'About',
      features: 'Features',
      pricing: 'Pricing',
      contact: 'Contact Us',
      getStarted: 'Get Started',
    },
    hero: {
      titleA: 'Forget Task Chaos Manage Your ',
      titleHighlightA: 'Projects',
      titleB: 'and Unite Your ',
      titleHighlightB: 'Team in One Place',
      subtitle:
        'Workflow is the ultimate command center for agile teams — organize your plans, master your work, and collaborate intuitively, all from one place.',
      ctaPrimary: 'Get Started',
      ctaSecondary: 'Watch Pricing',
    },
    features: {
      titleA: 'Core ',
      titleB: 'Features',
      subtitle: 'Everything you need to manage your projects efficiently',
      items: [
        {
          title: 'Create Your Workspace',
          text: 'Sign up in seconds and customize your workspace to match your brand and working style.',
        },
        {
          title: 'Invite Your Team & Assign Tasks',
          text: 'Bring your team in with custom permissions and start delegating for instant collaboration.',
        },
        {
          title: 'Track Progress & Celebrate Success',
          text: 'Live dashboards surface bottlenecks and milestones so every win gets recognized.',
        },
      ],
    },
    about: {
      label: 'ABOUT',
      titleA: 'What is ',
      titleB: 'Workflow?',
      text:
        'Workflow is a centralized cloud platform designed to eliminate task fragmentation and bring your team together in one workspace. Instead of scattering your projects, files, and communication across multiple disconnected apps, Workflow provides a single, unified environment that keeps everyone aligned and boosts overall productivity.',
    },
    how: {
      titleA: 'How It ',
      titleB: 'Works?',
      subtitle: 'Get started in 3 simple steps',
      steps: [
        {
          title: 'Create Your Workspace',
          text: 'Choose a ready-made template that suits your project nature (development, design, marketing).',
        },
        {
          title: 'Invite Your Team & Assign Tasks',
          text: "Add team members with their email and define each person's responsibilities with simple clicks.",
        },
        {
          title: 'Track Progress & Celebrate Success',
          text: 'Monitor work progress in real-time and watch your ideas turn into reality.',
        },
      ],
    },
    testimonials: {
      titleA: 'What Innovators and Developers',
      titleB: 'Say ',
      titleHighlight: 'About Workflow',
      titleC: '?',
      items: [
        {
          quote:
            '"The platform helped us organize our development team tasks during the hackathon and reduced delivery time by 30%."',
          name: 'Ahmed Mohamed',
          emoji: '\u{1F468}‍\u{1F4BB}',
        },
        {
          quote:
            '"Simple and easy-to-use interface, made project management a pleasure instead of a burden."',
          name: 'Sarah Ali',
          emoji: '\u{1F469}‍\u{1F4BC}',
        },
        {
          quote:
            '"The best tool I\'ve used for organizing work with a remote team. Collaboration became smooth and effective."',
          name: 'Khaled Abdullah',
          emoji: '\u{1F468}‍\u{1F4BC}',
        },
      ],
    },
    team: {
      label: 'TEAM',
      titleA: 'The people ',
      titleB: 'behind Workflow',
      members: [
        { name: 'Zainab Al-Mudallal', role: 'UI/UX Designer', photo: '/team/zainab.jpg', email: 'Zeinabalmudalal0@gmail.com', phone: 'https://wa.me/qr/WI7JVDQFOHS6N1', linkedin: 'https://www.linkedin.com/in/zeinab-al-mudalal-680199308' },
        { name: 'Raghad Ayyad', role: 'Frontend Developer', photo: '/team/raghad.jpg', email: 'raghadabdulla609@gmail.com', phone: 'https://wa.me/qr/IMTAYBC7JK3LK1', linkedin: 'https://www.linkedin.com/in/raghadayyad' },
        { name: 'Alaa ElDin AlDahdar', role: 'Backend Developer', photo: '/team/alaa.jpg', email: 'alaamhammad2003@gmail.com', phone: 'https://wa.me/972597696155', linkedin: 'https://www.linkedin.com/in/alaa2003' },
        { name: 'Ahmad Shanan', role: 'Backend Developer', photo: '/team/ahmad.jpg', email: 'ahmedjshanan@gmail.com', phone: 'https://wa.me/qr/ZDH7N3AGI2FVJ1', linkedin: 'https://www.linkedin.com/in/ahmed-shanan-695154228' },
        { name: 'Hala Jendeya', role: 'Frontend Developer', photo: '/team/hala.jpg', email: 'halahaithamjendeya@gmail.com', phone: 'https://wa.me/970598173092', linkedin: 'https://www.linkedin.com/in/hala-jendeya-025a97412' },
        { name: 'Majd Salim', role: 'AI Specialist', photo: '/team/majd.jpg', email: 'majdosama614@gmail.com', phone: 'https://wa.me/970597717455', linkedin: 'https://www.linkedin.com/in/mjad-sal-727998374/' },
        { name: 'Mahmoud Salem', role: 'Front-End', photo: '/team/mahmoud.jpg', email: 'ssalemmahmoud332@gmail.com', phone: 'https://wa.me/972595073176', linkedin: 'https://www.linkedin.com/in/mahmoud-salem-052495419' },
      ],
    },
    plans: {
      titleA: 'Plans for ',
      titleB: 'Every Team',
      subtitle: 'Start free and upgrade to Pro when you need more',
      mostPopular: 'Most Popular',
      enterpriseBadge: 'Enterprise Plan',
      getStarted: 'Get started',
      free: {
        name: 'Free Plan',
        desc: 'For individuals and small teams starting out',
        price: 'Free',
        features: [
          '5 clients, employees & projects',
          '3 currencies, contracts & devs',
          '5 invoices & 30 tasks',
          '20 financial transactions',
          'No chat between staff & clients',
        ],
      },
      pro: {
        name: 'Pro Plan',
        desc: 'For growing teams and businesses',
        price: '$20/month',
        features: [
          'Unlimited team members',
          'Unlimited projects',
          'Priority email support',
          'Advanced analytics',
          'Custom integrations',
        ],
      },
      enterprise: {
        name: 'Enterprise Plan',
        desc: 'For large companies and organizations',
        price: '$200/year',
        features: [
          'All Pro Plan features',
          '24/7 dedicated support',
          'Advanced security & protection',
          'Dedicated account manager',
          'Comprehensive admin panel',
        ],
      },
    },
    cta: {
      title: 'Ready to Transform How Your Team Works?',
      subtitle: 'Join thousands of successful companies utilizing Workflow today.',
      button: 'Get Started',
    },
    contact: {
      label: 'CONTACT',
      title: 'Get in touch',
      text:
        'Have questions? We would love to hear from you. Our team is ready to help you get started with Workflow.',
      email: 'support@workflownets.com',
      website: 'www.workflownets.com',
      location: 'Palestine, Gaza',
      form: {
        name: 'Full Name',
        namePlaceholder: 'Ahmed Mohamed',
        email: 'Email Address',
        emailPlaceholder: 'ahmed@company.com',
        message: 'Message',
        messagePlaceholder: 'Tell us how we can help...',
        submit: 'Send Message',
        sending: 'Sending...',
        success: 'Thank you! Your message has been sent.',
        error: 'Something went wrong. Please try again.',
      },
    },
    footer: {
      logoA: 'Work',
      logoB: 'flow',
      text:
        'The ultimate command center for agile teams. Organize plans, master work, and collaborate intuitively — all from one place.',
      navTitle: 'Navigation',
      navLinks: ['Home', 'Features', 'Pricing', 'Contact Us', 'Support'],
      contactTitle: 'Contact',
      rights: '© 2026 Workflow. All rights reserved.',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
    },
    dashboard: {
      // Text inside the CSS dashboard mockup
      search: 'Searching....',
      title: 'Dashboard',
      subtitle: 'Platform performance overview',
      admin: 'General Manager',
      adminEmail: 'admin@workflow.com',
      mrr: 'Monthly Recurring Revenue (MRR)',
      mrrNote: 'Compared to last month',
      activeCompanies: 'Active Companies',
      engagement: 'Engagement Rate: 94%',
      thisMonth: '+8 this month',
      unpaid: 'Unpaid Invoices',
      followUp: 'Requires Follow-up',
      overdue: '12 overdue invoices',
      pending: 'Pending Requests',
      needsProcessing: 'Needs Processing',
      cashFlow: 'Monthly Cash Flow',
      expenses: 'Expenses',
      revenue: 'Revenue',
      growth: 'Subscriber Growth vs Churn Rate',
      cancellations: 'Cancellations',
      newSubs: 'New Subscriptions',
      packages: 'Package Distribution',
      latestCompanies: 'Latest Registered Companies',
      latestRequests: 'Latest Subscriber Requests',
      showAll: 'Show All',
      processing: 'Processing',
      menu: {
        home: 'Home',
        dashboard: 'Dashboard',
        subscriberMgmt: 'Subscriber Management',
        companies: 'Companies',
        companyRequests: 'Company Requests',
        clients: 'Clients',
        financialMgmt: 'Financial Management',
        invoices: 'Invoices',
        payments: 'Payments',
        wallets: 'Wallets',
        walletTx: 'Wallet Transactions',
        currencies: 'Currencies',
        internalOps: 'Internal Operations',
        roles: 'Roles',
        employees: 'Employees',
        projects: 'Projects',
        tasks: 'Tasks',
        timeLogs: 'Time Logs',
      },
    },
  },

  ar: {
    dir: 'rtl',
    nav: {
      home: 'الرئيسية',
      about: 'من نحن',
      features: 'المزايا',
      pricing: 'الأسعار',
      contact: 'تواصل معنا',
      getStarted: 'ابدأ الآن',
    },
    hero: {
      titleA: 'ودّع فوضى المهام وأدر ',
      titleHighlightA: 'مشاريعك',
      titleB: 'واجمع فريقك ',
      titleHighlightB: 'في مكانٍ واحد',
      subtitle:
        'ووركفلو هو مركز القيادة الأمثل لفرق العمل المرنة — نظّم خططك، وأتقن عملك، وتعاون مع فريقك بسلاسة، كل ذلك من مكانٍ واحد.',
      ctaPrimary: 'ابدأ الآن',
      ctaSecondary: 'اطّلع على الأسعار',
    },
    features: {
      titleA: 'المزايا ',
      titleB: 'الأساسية',
      subtitle: 'كل ما تحتاجه لإدارة مشاريعك بكفاءة',
      items: [
        {
          title: 'أنشئ مساحة عملك',
          text: 'سجّل خلال ثوانٍ وخصّص مساحة عملك لتناسب هويتك وأسلوبك في العمل.',
        },
        {
          title: 'ادعُ فريقك ووزّع المهام',
          text: 'أضف أعضاء فريقك بصلاحيات مخصصة وابدأ بتوزيع المهام لتعاونٍ فوري.',
        },
        {
          title: 'تابع التقدم واحتفل بالإنجاز',
          text: 'لوحات متابعة مباشرة تكشف نقاط التعثر والمحطات المهمة ليحظى كل إنجاز بالتقدير.',
        },
      ],
    },
    about: {
      label: 'من نحن',
      titleA: 'ما هو ',
      titleB: 'ووركفلو؟',
      text:
        'ووركفلو منصة سحابية مركزية صُممت للقضاء على تشتت المهام وجمع فريقك في مساحة عمل واحدة. فبدلاً من تبعثر مشاريعك وملفاتك وتواصلك بين تطبيقات متعددة غير مترابطة، يوفّر لك ووركفلو بيئة موحّدة تُبقي الجميع على نفس المسار وترفع إنتاجية فريقك بأكمله.',
    },
    how: {
      titleA: 'كيف ',
      titleB: 'يعمل؟',
      subtitle: 'ابدأ في ٣ خطوات بسيطة',
      steps: [
        {
          title: 'أنشئ مساحة عملك',
          text: 'اختر قالباً جاهزاً يناسب طبيعة مشروعك (برمجة، تصميم، تسويق).',
        },
        {
          title: 'ادعُ فريقك ووزّع المهام',
          text: 'أضف أعضاء الفريق عبر بريدهم الإلكتروني وحدّد مسؤوليات كل شخص بنقرات بسيطة.',
        },
        {
          title: 'تابع التقدم واحتفل بالإنجاز',
          text: 'راقب سير العمل لحظةً بلحظة وشاهد أفكارك تتحول إلى واقع.',
        },
      ],
    },
    testimonials: {
      titleA: 'ماذا يقول المبتكرون والمطورون',
      titleB: '',
      titleHighlight: 'عن ووركفلو',
      titleC: '؟',
      items: [
        {
          quote:
            '«ساعدتنا المنصة في تنظيم مهام فريق التطوير خلال الهاكاثون وقلّصت وقت التسليم بنسبة ٣٠٪.»',
          name: 'أحمد محمد',
          emoji: '\u{1F468}‍\u{1F4BB}',
        },
        {
          quote: '«واجهة بسيطة وسهلة الاستخدام، جعلت إدارة المشاريع متعةً بدل أن تكون عبئاً.»',
          name: 'سارة علي',
          emoji: '\u{1F469}‍\u{1F4BC}',
        },
        {
          quote:
            '«أفضل أداة استخدمتها لتنظيم العمل مع فريق عن بُعد. أصبح التعاون سلساً وفعالاً.»',
          name: 'خالد عبدالله',
          emoji: '\u{1F468}‍\u{1F4BC}',
        },
      ],
    },
    team: {
      label: 'الفريق',
      titleA: ' الأشخاص ',
      titleB: 'خلف WorkFlow',
      members: [
        { name: 'زينب المدلل', role: 'مصممة UI/UX', photo: '/team/zainab.jpg', email: 'Zeinabalmudalal0@gmail.com', phone: 'https://wa.me/qr/WI7JVDQFOHS6N1', linkedin: 'https://www.linkedin.com/in/zeinab-al-mudalal-680199308' },
        { name: 'رغد عياد', role: 'مطورة واجهات أمامية', photo: '/team/raghad.jpg', email: 'raghadabdulla609@gmail.com', phone: 'https://wa.me/qr/IMTAYBC7JK3LK1', linkedin: 'https://www.linkedin.com/in/raghadayyad' },
        { name: 'علاء الدين الدهدار', role: 'مطور خلفيات', photo: '/team/alaa.jpg', email: 'alaamhammad2003@gmail.com', phone: 'https://wa.me/972597696155', linkedin: 'https://www.linkedin.com/in/alaa2003' },
        { name: 'أحمد شنن', role: 'مطور خلفيات', photo: '/team/ahmad.jpg', email: 'ahmedjshanan@gmail.com', phone: 'https://wa.me/qr/ZDH7N3AGI2FVJ1', linkedin: 'https://www.linkedin.com/in/ahmed-shanan-695154228' },
        { name: 'حلا جندية', role: 'مطورة واجهات أمامية', photo: '/team/hala.jpg', email: 'halahaithamjendeya@gmail.com', phone: 'https://wa.me/970598173092', linkedin: 'https://www.linkedin.com/in/hala-jendeya-025a97412' },
        { name: 'مجد سليم', role: 'متخصص ذكاء صناعي', photo: '/team/majd.jpg', email: 'majdosama614@gmail.com', phone: 'https://wa.me/970597717455', linkedin: 'https://www.linkedin.com/in/mjad-sal-727998374/' },
        { name: 'محمود سالم', role: 'مطور واجهة امامية', photo: '/team/mahmoud.jpg', email: 'ssalemmahmoud332@gmail.com', phone: 'https://wa.me/972595073176', linkedin: 'https://www.linkedin.com/in/mahmoud-salem-052495419' },
      ],
    },
    plans: {
      titleA: 'خطط تناسب ',
      titleB: 'كل فريق',
      subtitle: 'ابدأ مجاناً وارتقِ إلى الخطة الاحترافية عندما تحتاج المزيد',
      mostPopular: 'الأكثر شيوعاً',
      enterpriseBadge: 'خطة المؤسسات',
      getStarted: 'ابدأ الآن',
      free: {
        name: 'الخطة المجانية',
        desc: 'للأفراد والفرق الصغيرة في بداية الطريق',
        price: 'مجاناً',
        features: [
          '٥ عملاء وموظفين ومشاريع',
          '٣ عملات وعقود ومطورين',
          '٥ فواتير و٣٠ مهمة',
          '٢٠ معاملة مالية',
          'بدون محادثة بين الموظفين والعملاء',
        ],
      },
      pro: {
        name: 'الخطة الاحترافية',
        desc: 'للفرق والأعمال النامية',
        price: '٢٠$ / شهرياً',
        features: [
          'أعضاء فريق بلا حدود',
          'مشاريع غير محدودة',
          'دعم بريدي ذو أولوية',
          'تحليلات متقدمة',
          'تكاملات مخصصة',
        ],
      },
      enterprise: {
        name: 'خطة المؤسسات',
        desc: 'للشركات والمؤسسات الكبرى',
        price: '٢٠٠$ / سنوياً',
        features: [
          'جميع مزايا الخطة الاحترافية',
          'دعم مخصص على مدار الساعة',
          'أمان وحماية متقدمة',
          'مدير حساب مخصص',
          'لوحة تحكم إدارية شاملة',
        ],
      },
    },
    cta: {
      title: 'هل أنت مستعد لتغيير طريقة عمل فريقك؟',
      subtitle: 'انضم إلى آلاف الشركات الناجحة التي تعتمد على ووركفلو اليوم.',
      button: 'ابدأ الآن',
    },
    contact: {
      label: 'تواصل معنا',
      title: 'تواصل معنا',
      text:
        'لديك أسئلة؟ يسعدنا سماعك دائماً. فريقنا جاهز لمساعدتك على البدء مع ووركفلو.',
      email: 'support@workflownets.com',
      website: 'www.workflownets.com',
      location: 'فلسطين، غزة',
      form: {
        name: 'الاسم الكامل',
        namePlaceholder: 'أحمد محمد',
        email: 'البريد الإلكتروني',
        emailPlaceholder: 'ahmed@company.com',
        message: 'رسالتك',
        messagePlaceholder: 'أخبرنا كيف يمكننا مساعدتك...',
        submit: 'إرسال الرسالة',
        sending: 'جارٍ الإرسال...',
        success: 'شكراً لك! تم إرسال رسالتك بنجاح.',
        error: 'حدث خطأ ما. حاول مرة أخرى من فضلك.',
      },
    },
    footer: {
      logoA: 'وورك',
      logoB: 'فلو',
      text:
        'مركز القيادة الأمثل لفرق العمل المرنة. نظّم خططك، وأتقن عملك، وتعاون بسلاسة — كل ذلك من مكانٍ واحد.',
      navTitle: 'روابط سريعة',
      navLinks: ['الرئيسية', 'المزايا', 'الأسعار', 'تواصل معنا', 'الدعم'],
      contactTitle: 'تواصل معنا',
      rights: '© 2026 ووركفلو. جميع الحقوق محفوظة.',
      privacy: 'سياسة الخصوصية',
      terms: 'شروط الاستخدام',
    },
    dashboard: {
      search: 'ابحث هنا....',
      title: 'لوحة التحكم',
      subtitle: 'نظرة عامة على أداء المنصة',
      admin: 'المدير العام',
      adminEmail: 'admin@workflow.com',
      mrr: 'الإيراد الشهري المتكرر (MRR)',
      mrrNote: 'مقارنةً بالشهر الماضي',
      activeCompanies: 'الشركات النشطة',
      engagement: 'معدل التفاعل: ٩٤٪',
      thisMonth: '+٨ هذا الشهر',
      unpaid: 'فواتير غير مدفوعة',
      followUp: 'تتطلب متابعة',
      overdue: '١٢ فاتورة متأخرة',
      pending: 'طلبات معلّقة',
      needsProcessing: 'بحاجة إلى معالجة',
      cashFlow: 'التدفق النقدي الشهري',
      expenses: 'المصروفات',
      revenue: 'الإيرادات',
      growth: 'نمو المشتركين مقابل معدل الإلغاء',
      cancellations: 'الإلغاءات',
      newSubs: 'اشتراكات جديدة',
      packages: 'توزيع الباقات',
      latestCompanies: 'أحدث الشركات المسجلة',
      latestRequests: 'أحدث طلبات الاشتراك',
      showAll: 'عرض الكل',
      processing: 'قيد المعالجة',
      menu: {
        home: 'الرئيسية',
        dashboard: 'لوحة التحكم',
        subscriberMgmt: 'إدارة المشتركين',
        companies: 'الشركات',
        companyRequests: 'طلبات الشركات',
        clients: 'العملاء',
        financialMgmt: 'الإدارة المالية',
        invoices: 'الفواتير',
        payments: 'المدفوعات',
        wallets: 'المحافظ',
        walletTx: 'حركات المحافظ',
        currencies: 'العملات',
        internalOps: 'العمليات الداخلية',
        roles: 'الأدوار',
        employees: 'الموظفون',
        projects: 'المشاريع',
        tasks: 'المهام',
        timeLogs: 'سجلات الوقت',
      },
    },
  },
}

// Deep merge helper: API overrides -> bundled defaults
export function mergeContent(base: any, override: any) {
  if (!override || typeof override !== 'object') return base
  const out = Array.isArray(base) ? [...base] : { ...base }
  for (const key of Object.keys(override)) {
    const b = base ? base[key] : undefined
    const o = override[key]
    if (o && typeof o === 'object' && b && typeof b === 'object') {
      out[key] = mergeContent(b, o)
    } else if (o !== undefined && o !== null) {
      out[key] = o
    }
  }
  return out
}
