// Landing page texts

export interface LandingCopy {
  nav: { backToApp: string; signIn: string; features: string; pricing: string; faq: string };
  hero: {
    eyebrow: string;
    title: string;
    highlight: string;
    subtitle: string;
    explore: string;
    exploreHint: string;
    contact: string;
    mock: {
      sample: string;
      group: string;
      progress: string;
      tasks: { title: string; who: string; status: string; state: 'done' | 'doing' | 'late' }[];
      toast: string;
    };
  };
  problems: { title: string; items: { title: string; text: string }[] };
  steps: { title: string; items: { title: string; text: string }[] };
  features: { title: string; items: { title: string; text: string }[] };
  pricing: {
    title: string;
    subtitle: string;
    pilot: string;
    askPrice: string;
    perSemester: string;
    perMonth: string;
    perYear: string;
    upTo: (n: number) => string;
    plans: Record<'demo' | 'student', { name: string; description: string; points: string[]; cta: string; badge?: string }>;
  };
  sponsor: {
    eyebrow: string;
    title: string;
    text: string;
    roadmapTitle: string;
    roadmap: { title: string; text: string }[];
    benefitsTitle: string;
    benefits: string[];
    cta: string;
    message: string;
    sponsorsTitle: string;
  };
  faq: { title: string; items: { q: string; a: string }[] };
  final: { title: string; text: string };
  footer: { rights: string; back: string };
}

export const landing: Record<'km' | 'en', LandingCopy> = {
  km: {
    nav: { backToApp: 'ត្រឡប់ទៅកម្មវិធី', signIn: 'ចូលប្រើប្រាស់', features: 'មុខងារ', pricing: 'កញ្ចប់', faq: 'សំណួរ' },
    hero: {
      eyebrow: 'សម្រាប់ក្រុមនិស្សិត',
      title: 'កិច្ចការក្រុម',
      highlight: 'ដោយមិនមានជម្លោះ',
      subtitle:
        'ដឹងភ្លាមថាអ្នកណាធ្វើអ្វី ដល់ណាហើយ និងអ្នកណាមិនទាន់ធ្វើ។ ប្រធានក្រុមមិនចាំបាច់ធ្វើគ្រប់យ៉ាងម្នាក់ឯងទៀតទេ។',
      explore: 'សាកល្បងមើលឥឡូវនេះ',
      exploreHint: 'មិនបាច់ចុះឈ្មោះ ប្រើទិន្នន័យគំរូ',
      contact: 'ទាក់ទង Admin តាម Telegram',
      mock: {
        sample: 'ឧទាហរណ៍',
        group: 'គម្រោងវេបសាយ',
        progress: 'វឌ្ឍនភាពក្រុម',
        tasks: [
          { title: 'រចនាទំព័រ Login', who: 'ស្រីនាង', status: 'បានអនុម័ត', state: 'done' },
          { title: 'បង្កើតផ្ទាំងគ្រប់គ្រង', who: 'សុខា', status: 'កំពុងធ្វើ', state: 'doing' },
          { title: 'សរសេរសៀវភៅណែនាំ', who: 'ដារ៉ា', status: 'ហួសកាលកំណត់', state: 'late' },
        ],
        toast: 'សុខា បានបញ្ចប់ «បង្កើតផ្ទាំងគ្រប់គ្រង» រង់ចាំអ្នកពិនិត្យ',
      },
    },
    problems: {
      title: 'បញ្ហាដែលនិស្សិតគ្រប់គ្នាស្គាល់',
      items: [
        {
          title: 'សមាជិកខ្លះមិនធ្វើអ្វីសោះ',
          text: 'ចាត់កិច្ចការច្បាស់លាស់ ជាមួយថ្ងៃកំណត់។ អ្នកណាធ្វើអ្វី ឃើញទាំងអស់ក្នុងមួយកន្លែង។',
        },
        {
          title: 'ភ្លេចថាអ្នកណាសន្យាអ្វី',
          text: 'ជួងជូនដំណឹងពេលមានកិច្ចការថ្មី ជិតដល់ថ្ងៃកំណត់ ឬមានមតិយោបល់ ដោយមិនចាំបាច់រើសមើលសារក្នុង Telegram។',
        },
        {
          title: 'គ្រូសួរថាអ្នកណាធ្វើអ្វី',
          text: 'ទាញរបាយការណ៍សង្ខេបកិច្ចការរបស់សមាជិកម្នាក់ៗ ទុកបង្ហាញគ្រូបាន។',
        },
      ],
    },
    steps: {
      title: 'ចាប់ផ្តើមយ៉ាងងាយ ៣ ជំហាន',
      items: [
        { title: 'ទាក់ទង Admin', text: 'ផ្ញើសារតាម Telegram ហើយទទួលគណនីប្រធានក្រុម។' },
        { title: 'បង្កើតក្រុម', text: 'បន្ថែមសមាជិក ហើយចាត់កិច្ចការជាមួយថ្ងៃកំណត់។' },
        { title: 'តាមដានរៀងរាល់ថ្ងៃ', text: 'សមាជិកផ្ញើរបាយការណ៍ប្រចាំថ្ងៃ ប្រធានអនុម័ត ហើយឃើញវឌ្ឍនភាពភ្លាម។' },
      ],
    },
    features: {
      title: 'អ្វីដែលអ្នកទទួលបាន',
      items: [
        { title: 'របាយការណ៍ប្រចាំថ្ងៃ', text: 'សរសេរបញ្ជីការងារថ្ងៃនេះបានរហ័ស ហើយប្រព័ន្ធគណនាភាគរយវឌ្ឍនភាពឱ្យ។' },
        { title: 'កិច្ចការ និងថ្ងៃកំណត់', text: 'ចាត់កិច្ចការជូនសមាជិក កំណត់អាទិភាព និងដឹងថាអ្វីហួសកាលកំណត់។' },
        { title: 'ការអនុម័តដោយប្រធាន', text: 'ប្រធានពិនិត្យ អនុម័ត និងផ្តល់មតិកែលម្អលើការងារនីមួយៗ។' },
        { title: 'ជួងជូនដំណឹង', text: 'ដឹងភ្លាមពេលមានការងារថ្មី កិច្ចការត្រូវពិនិត្យ ឬមានអ្នកបញ្ចេញមតិ។' },
        { title: 'មតិយោបល់ក្នុងកិច្ចការ', text: 'ពិភាក្សាក្នុងកិច្ចការនីមួយៗ មិនច្របូកច្របល់ជាមួយសារផ្សេង។' },
        { title: 'ភាសាខ្មែរ ប្រើលើទូរសព្ទបាន', text: 'មានភាសាខ្មែរ និងអង់គ្លេស ទម្រង់ភ្លឺ/ងងឹត ហើយដំណើរការល្អលើទូរសព្ទ។' },
      ],
    },
    pricing: {
      title: 'កញ្ចប់ងាយៗ',
      subtitle: 'សមាជិកប្រើឥតគិតថ្លៃ។ ប្រធានក្រុមជាអ្នកបង់ ហើយអាចចែកថ្លៃគ្នាក្នុងក្រុម។',
      pilot: 'ក្រុមដំបូងៗ ទទួលបានការប្រើប្រាស់ ១ ខែឥតគិតថ្លៃ ជាថ្នូរនឹងមតិយោបល់របស់អ្នក។',
      askPrice: 'ទាក់ទងសួរតម្លៃ',
      perSemester: '/ ឆមាស',
      perMonth: '/ ខែ',
      perYear: '/ ឆ្នាំ',
      upTo: n => `សមាជិកអតិបរមា ${n} នាក់ក្នុងមួយក្រុម`,
      plans: {
        demo: {
          name: 'ទស្សនកិច្ច',
          description: 'សាកល្បងមើលមុននឹងសម្រេចចិត្ត',
          points: ['ទិន្នន័យគំរូ មើលបានតែប៉ុណ្ណោះ', 'មិនបាច់ចុះឈ្មោះ', 'ឥតគិតថ្លៃ'],
          cta: 'សាកល្បងមើល',
        },
        student: {
          badge: 'ណែនាំ',
          name: 'ក្រុមនិស្សិត',
          description: 'សម្រាប់ក្រុមធ្វើគម្រោងក្នុងថ្នាក់',
          points: ['កិច្ចការ និងថ្ងៃកំណត់', 'របាយការណ៍ប្រចាំថ្ងៃ និងការអនុម័ត', 'ជួងជូនដំណឹង និងមតិយោបល់', 'របាយការណ៍សង្ខេបទុកបង្ហាញគ្រូ'],
          cta: 'ទាក់ទងតាម Telegram',
        },
      },
    },
    sponsor: {
      eyebrow: 'គម្រោងនៅដំណាក់កាលដំបូង',
      title: 'ជួយឱ្យ LeaderSync លូតលាស់ ជាមួយនិស្សិតខ្មែរ',
      text: 'យើងកំពុងអភិវឌ្ឍបន្តិចម្តងៗ ហើយចង់ឱ្យវាកាន់តែល្អសម្រាប់និស្សិតទូទាំងប្រទេស។ បើសាលា ក្រុមហ៊ុន ឬអ្នកណាម្នាក់ចង់ជួយឧបត្ថម្ភ ការជួយរបស់អ្នកនឹងជួយឱ្យយើងបន្ថែមមុខងារថ្មី និងរក្សាសេវានេះឱ្យនិស្សិតប្រើបាន។',
      roadmapTitle: 'អ្វីដែលយើងចង់បន្ថែមបន្ទាប់',
      roadmap: [
        { title: 'ជូនដំណឹងលើទូរសព្ទ', text: 'ផ្ញើការជូនដំណឹងតាម Telegram ទោះមិនបានបើកកម្មវិធី។' },
        { title: 'បង់ប្រាក់ងាយស្រួល', text: 'ទូទាត់តាម KHQR ដោយស្វ័យប្រវត្តិ។' },
        { title: 'ដំឡើងលើទូរសព្ទ', text: 'ដាក់នៅលើអេក្រង់ដើមដូចកម្មវិធីធម្មតា។' },
        { title: 'ឧបករណ៍ល្អជាងសម្រាប់ក្រុមធំ', text: 'សិទ្ធិ និងការគ្រប់គ្រងសម្រាប់ថ្នាក់ និងស្ថាប័ន។' },
      ],
      benefitsTitle: 'ដៃគូឧបត្ថម្ភទទួលបាន',
      benefits: [
        'ឱ្យនិស្សិត ឬបុគ្គលិករបស់អ្នកប្រើឥតគិតថ្លៃ តាមចំនួនក្រុមដែលយើងព្រមព្រៀង',
        'ឈ្មោះ ឬនិមិត្តសញ្ញារបស់អ្នកនៅលើទំព័រនេះ ជាដៃគូឧបត្ថម្ភ',
        'ស្នើមុខងារដែលអ្នកត្រូវការមុនគេ',
      ],
      cta: 'ទាក់ទងដើម្បីឧបត្ថម្ភ',
      message: 'សួស្តី ខ្ញុំចាប់អារម្មណ៍ចង់ឧបត្ថម្ភគម្រោង LeaderSync។',
      sponsorsTitle: 'ដៃគូឧបត្ថម្ភរបស់យើង',
    },
    faq: {
      title: 'សំណួរញឹកញាប់',
      items: [
        {
          q: 'សមាជិកត្រូវបង់ប្រាក់ដែរទេ?',
          a: 'មិនត្រូវទេ! មានតែប្រធានក្រុមដែលមានគណនីបង់ប្រាក់ ហើយសមាជិកដែលត្រូវបានបន្ថែមប្រើបានឥតគិតថ្លៃ ក្នុងចំនួនដែលកញ្ចប់អនុញ្ញាត។',
        },
        {
          q: 'តើខ្ញុំបង់ប្រាក់ និងទទួលគណនីយ៉ាងដូចម្តេច?',
          a: 'ចុចប៊ូតុង Telegram ហើយផ្ញើសារ។ Admin នឹងប្រាប់វិធីបង់ប្រាក់ ហើយបង្កើតគណនីប្រធានក្រុមឱ្យអ្នក។',
        },
        {
          q: 'អ្នកណាអាចមើលព័ត៌មានក្រុមរបស់ខ្ញុំ?',
          a: 'សមាជិកក្នុងក្រុមនោះ។ ក្រុមផ្សេងមិនអាចមើលឃើញទិន្នន័យរបស់អ្នកទេ។',
        },
        {
          q: 'Admin អាចមើលការងារ និងការពិភាក្សារបស់ខ្ញុំបានទេ?',
          a: 'មិនបាន លុះត្រាតែប្រធានក្រុមអនុញ្ញាត។ Admin ឃើញតែព័ត៌មានគណនី (ឈ្មោះ កញ្ចប់ ចំនួនសមាជិក) មិនឃើញកិច្ចការ របាយការណ៍ ឬមតិយោបល់ទេ។ ពេលអ្នកត្រូវការជំនួយ ប្រធានក្រុមអាចបើកឱ្យ Admin មើលជាបណ្តោះអាសន្ន ហើយបិទវិញបានគ្រប់ពេល។ សមាជិកទាំងអស់ឃើញនៅពេលវាបើក។ (ដូចសេវាអនឡាញគ្រប់យ៉ាង អ្នកគ្រប់គ្រង server មានសិទ្ធិបច្ចេកទេស តែយើងមិនមើលទេ។)',
        },
        {
          q: 'បើខ្ញុំភ្លេចពាក្យសម្ងាត់?',
          a: 'ប្រាប់ប្រធានក្រុមរបស់អ្នក (ឬ Admin ប្រសិនបើអ្នកជាប្រធានក្រុម)។ គាត់នឹងបង្កើតពាក្យសម្ងាត់បណ្តោះអាសន្នថ្មី ហើយអ្នកត្រូវប្តូរវាពេលចូលលើកក្រោយ។ អ្នកនឹងឃើញការជូនដំណឹងថាអ្នកណាបាន reset វា ហើយពាក្យសម្ងាត់ចាស់មិនអាចមើលឃើញទេ។',
        },
        {
          q: 'ខ្ញុំអាចឱ្យគ្រូមើលវឌ្ឍនភាពបានទេ?',
          a: 'បាន! អ្នកអាចបន្ថែមគ្រូជា "អ្នកមើល" ដែលអានបានតែប៉ុណ្ណោះ ឬទាញរបាយការណ៍សង្ខេបទៅបង្ហាញគាត់។',
        },
        {
          q: 'ប្រើលើទូរសព្ទបានទេ?',
          a: 'បាន! វាជាវេបសាយដែលដំណើរការលើទូរសព្ទ និងកុំព្យូទ័រ ដោយមិនចាំបាច់ដំឡើងកម្មវិធី។',
        },
      ],
    },
    final: {
      title: 'ត្រៀមខ្លួនឱ្យក្រុមរបស់អ្នកធ្វើការបានល្អជាងមុនហើយឬនៅ?',
      text: 'សាកល្បងមើលដោយមិនបាច់ចុះឈ្មោះ ហើយបើពេញចិត្ត ទាក់ទងមកយើងតាម Telegram។',
    },
    footer: { rights: 'រក្សាសិទ្ធិគ្រប់យ៉ាង', back: 'ត្រឡប់ទៅទំព័រដើម' },
  },

  en: {
    nav: { backToApp: 'Back to the app', signIn: 'Log in', features: 'Features', pricing: 'Plans', faq: 'FAQ' },
    hero: {
      eyebrow: 'Made for student teams',
      title: 'Group projects',
      highlight: 'without the drama',
      subtitle:
        'Know at once who did what, how far it has got, and who has not started. The team leader no longer has to do everything alone.',
      explore: 'Try it now',
      exploreHint: 'No sign-up, sample data',
      contact: 'Contact the Admin on Telegram',
      mock: {
        sample: 'Example',
        group: 'Website project',
        progress: 'Team progress',
        tasks: [
          { title: 'Design the login page', who: 'Sreyneang', status: 'Approved', state: 'done' },
          { title: 'Build the dashboard', who: 'Sokha', status: 'In progress', state: 'doing' },
          { title: 'Write the user guide', who: 'Dara', status: 'Overdue', state: 'late' },
        ],
        toast: 'Sokha finished "Build the dashboard" and is waiting for your review',
      },
    },
    problems: {
      title: 'Problems every student knows',
      items: [
        {
          title: 'Some members do nothing',
          text: 'Give clear tasks with deadlines. Who is doing what is visible in one place.',
        },
        {
          title: 'Forgetting who promised what',
          text: 'A bell tells you about new tasks, deadlines coming up and comments, so you do not dig through Telegram messages.',
        },
        {
          title: 'The lecturer asks who did what',
          text: 'Export a summary report of each member’s tasks to show your lecturer.',
        },
      ],
    },
    steps: {
      title: 'Start in 3 easy steps',
      items: [
        { title: 'Contact the Admin', text: 'Message us on Telegram and get your team leader account.' },
        { title: 'Create your group', text: 'Add your members and assign tasks with deadlines.' },
        { title: 'Follow up every day', text: 'Members post a daily update, you approve it, and progress is clear at a glance.' },
      ],
    },
    features: {
      title: 'What you get',
      items: [
        { title: 'Daily updates', text: 'Write today’s to-do list in seconds and the progress percentage is worked out for you.' },
        { title: 'Tasks and deadlines', text: 'Assign tasks, set priorities and see what is overdue.' },
        { title: 'Leader approval', text: 'The leader reviews, approves and gives feedback on each piece of work.' },
        { title: 'Notification bell', text: 'Hear straight away about new work, tasks to review and new comments.' },
        { title: 'Comments on tasks', text: 'Discuss each task in its own thread, not mixed in with other messages.' },
        { title: 'Khmer, and works on phones', text: 'Khmer and English, light and dark mode, and it works well on a phone.' },
      ],
    },
    pricing: {
      title: 'Simple plans',
      subtitle: 'Members use it for free. The team leader pays, and can split the cost with the group.',
      pilot: 'The first groups get one month free in return for your feedback.',
      askPrice: 'Ask for the price',
      perSemester: '/ semester',
      perMonth: '/ month',
      perYear: '/ year',
      upTo: n => `Up to ${n} members per group`,
      plans: {
        demo: {
          name: 'Explore',
          description: 'Look around before you decide',
          points: ['Sample data, view only', 'No sign-up', 'Free'],
          cta: 'Try it',
        },
        student: {
          badge: 'Recommended',
          name: 'Student team',
          description: 'For a class project group',
          points: ['Tasks and deadlines', 'Daily updates and approval', 'Notification bell and comments', 'Summary report for your lecturer'],
          cta: 'Contact us on Telegram',
        },
      },
    },
    sponsor: {
      eyebrow: 'An early-stage project',
      title: 'Help LeaderSync grow with Khmer students',
      text: 'We are building step by step and want it to get better for students across the country. If a school, a company or anyone would like to sponsor, your support helps us add new features and keep this service available to students.',
      roadmapTitle: 'What we want to add next',
      roadmap: [
        { title: 'Phone notifications', text: 'Send notifications through Telegram, even when the app is closed.' },
        { title: 'Easier payment', text: 'Pay automatically with KHQR.' },
        { title: 'Install on your phone', text: 'Put it on your home screen like a regular app.' },
        { title: 'Better tools for big groups', text: 'Permissions and management for classes and organisations.' },
      ],
      benefitsTitle: 'Sponsors receive',
      benefits: [
        'Your students or staff use it free, for the number of groups we agree on',
        'Your name or logo on this page as a sponsor',
        'Ask for the features you need first',
      ],
      cta: 'Contact us to sponsor',
      message: 'Hello, I am interested in sponsoring LeaderSync.',
      sponsorsTitle: 'Our sponsors',
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        {
          q: 'Do members have to pay?',
          a: 'No! Only the team leader has the paid account. Members you add use it for free, up to the number your plan allows.',
        },
        {
          q: 'How do I pay and get an account?',
          a: 'Tap the Telegram button and send a message. The Admin tells you how to pay and creates your team leader account.',
        },
        {
          q: 'Who can see my group’s information?',
          a: 'The members of that group. Other groups cannot see your data.',
        },
        {
          q: 'Can the Admin see my work and discussions?',
          a: 'No, unless your team leader allows it. The Admin only sees account details (name, plan, number of members), not your tasks, updates or comments. When you need help, the leader can open it to the Admin for a limited time and turn it off at any time. Every member can see when it is on. (As with any online service, whoever runs the server technically has access to stored data, but we do not look.)',
        },
        {
          q: 'What if I forget my password?',
          a: 'Tell your team leader (or the Admin if you are the leader). They create a new temporary password, and you must change it the next time you log in. You get a notification showing who reset it, and old passwords can never be read.',
        },
        {
          q: 'Can my lecturer see our progress?',
          a: 'Yes! Add your lecturer as a "viewer", who can read but not change anything, or export the summary report and show it to them.',
        },
        {
          q: 'Does it work on a phone?',
          a: 'Yes! It is a website that works on phones and computers, with nothing to install.',
        },
      ],
    },
    final: {
      title: 'Ready for your team to work better?',
      text: 'Try it with no sign-up, and if you like it, message us on Telegram.',
    },
    footer: { rights: 'All rights reserved', back: 'Back to home' },
  },
};
