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
  /** The page title and description shown by search engines and the browser tab. */
  meta: { title: string; description: string };
  faq: { title: string; items: { q: string; a: string }[] };
  final: { title: string; text: string };
  footer: { rights: string; back: string; guide: string };
  creator: { label: string };
}

export const landing: Record<'km' | 'en', LandingCopy> = {
  km: {
    nav: { backToApp: 'ត្រឡប់ទៅកម្មវិធី', signIn: 'ចូលគណនី', features: 'មុខងារ', pricing: 'កញ្ចប់', faq: 'សំណួរ' },
    hero: {
      eyebrow: 'សម្រាប់ក្រុមនិស្សិត',
      title: 'កិច្ចការក្រុម',
      highlight: 'ដោយមិនមានជម្លោះ',
      subtitle:
        'ដឹងភ្លាមថាអ្នកណាធ្វើអ្វី ដល់ណាហើយ និងអ្នកណាមិនទាន់ធ្វើ។',
      explore: 'សាកល្បងមើលឥឡូវនេះ',
      exploreHint: 'មិនបាច់ចុះឈ្មោះ ប្រើទិន្នន័យគំរូ',
      contact: 'ទាក់ទងតាម Telegram',
      mock: {
        sample: 'ឧទាហរណ៍',
        group: 'គម្រោងវេបសាយ',
        progress: 'វឌ្ឍនភាពក្រុម',
        tasks: [
          { title: 'រចនាទំព័រ Login', who: 'ស្រីនាង', status: 'បានអនុម័ត', state: 'done' },
          { title: 'បង្កើតផ្ទាំងគ្រប់គ្រង', who: 'សុខា', status: 'កំពុងធ្វើ', state: 'doing' },
          { title: 'សរសេរសៀវភៅណែនាំ', who: 'ដារ៉ា', status: 'ហួសកំណត់', state: 'late' },
        ],
        toast: 'សុខា បានបញ្ចប់ «បង្កើតផ្ទាំងគ្រប់គ្រង» រង់ចាំអ្នកពិនិត្យ',
      },
    },
    problems: {
      title: 'បញ្ហាដែលនិស្សិតគ្រប់គ្នាស្គាល់',
      items: [
        {
          title: 'សមាជិកខ្លះមិនធ្វើអ្វីសោះ',
          text: 'កិច្ចការច្បាស់លាស់ មានថ្ងៃកំណត់ ឃើញទាំងអស់ក្នុងមួយកន្លែង។',
        },
        {
          title: 'ភ្លេចថាអ្នកណាសន្យាអ្វី',
          text: 'ការជូនដំណឹងប្រាប់អ្នកពេលមានកិច្ចការ ថ្ងៃកំណត់ ឬមតិថ្មី។',
        },
        {
          title: 'គ្រូសួរថាអ្នកណាធ្វើអ្វី',
          text: 'ទាញរបាយការណ៍សង្ខេប ទុកបង្ហាញគ្រូ។',
        },
      ],
    },
    steps: {
      title: 'ចាប់ផ្តើមយ៉ាងងាយ ៣ ជំហាន',
      items: [
        { title: 'ទាក់ទង Admin', text: 'ផ្ញើសារតាម Telegram ដើម្បីទទួលគណនី។' },
        { title: 'បង្កើតក្រុម', text: 'បន្ថែមសមាជិក ហើយចាត់កិច្ចការ។' },
        { title: 'តាមដានរៀងរាល់ថ្ងៃ', text: 'សមាជិកបង្ហោះ ToDo ហើយប្រធានអនុម័ត។' },
      ],
    },
    features: {
      title: 'អ្វីដែលអ្នកទទួលបាន',
      items: [
        { title: 'ToDo ប្រចាំថ្ងៃ និង Streak', text: 'សរសេរបញ្ជីការងារ ប្រព័ន្ធគណនាភាគរយឱ្យ ហើយ Streak ជួយរក្សាទម្លាប់។' },
        { title: 'កិច្ចការ និងថ្ងៃកំណត់', text: 'កំណត់អាទិភាព ហើយឃើញអ្វីដែលហួសកំណត់។' },
        { title: 'កិច្ចការរួម', text: 'ចាត់ជូនទាំងអស់គ្នា ហើយឃើញភាគរយរបស់ម្នាក់ៗ។' },
        { title: 'ការអនុម័តដោយប្រធាន', text: 'ពិនិត្យ អនុម័ត និងផ្តល់មតិ។' },
        { title: 'ការជូនដំណឹង', text: 'ដឹងភ្លាមពេលមានការងារ ឬមតិថ្មី ទាំងក្នុងកម្មវិធី និងតាម Telegram។' },
        { title: 'ភាសាខ្មែរ និងប្រើលើទូរសព្ទ', text: 'មានភាសាខ្មែរ និងអង់គ្លេស របៀបភ្លឺ និងងងឹត ហើយដំណើរការល្អលើទូរសព្ទ។' },
      ],
    },
    pricing: {
      title: 'កញ្ចប់ងាយៗ',
      subtitle: 'សមាជិកប្រើឥតគិតថ្លៃ។ ប្រធានក្រុមជាអ្នកបង់។',
      pilot: 'ក្រុមដំបូងៗ ប្រើ ១ ខែឥតគិតថ្លៃ ជាថ្នូរនឹងមតិរបស់អ្នក។',
      askPrice: 'ទាក់ទងសួរតម្លៃ',
      perSemester: '/ ឆមាស',
      perMonth: '/ ខែ',
      perYear: '/ ឆ្នាំ',
      upTo: n => `សមាជិកអតិបរមា ${n} នាក់ក្នុងមួយក្រុម`,
      plans: {
        demo: {
          name: 'ទស្សនកិច្ច',
          description: 'សាកល្បងមើលមុននឹងសម្រេចចិត្ត',
          points: ['ទិន្នន័យគំរូ (មើលតែប៉ុណ្ណោះ)', 'មិនបាច់ចុះឈ្មោះ', 'ឥតគិតថ្លៃ'],
          cta: 'សាកល្បងមើល',
        },
        student: {
          badge: 'ណែនាំ',
          name: 'ក្រុមនិស្សិត',
          description: 'សម្រាប់ក្រុមធ្វើគម្រោងក្នុងថ្នាក់',
          points: ['កិច្ចការ និងវឌ្ឍនភាពជាភាគរយ', 'ToDo ប្រចាំថ្ងៃ និងការអនុម័ត', 'ការជូនដំណឹង និងមតិយោបល់', 'របាយការណ៍ទុកបង្ហាញគ្រូ'],
          cta: 'ទាក់ទងតាម Telegram',
        },
      },
    },
    sponsor: {
      eyebrow: 'គម្រោងនៅដំណាក់កាលដំបូង',
      title: 'ជួយឱ្យ សាមគ្គី លូតលាស់ ជាមួយនិស្សិតខ្មែរ',
      text: 'យើងអភិវឌ្ឍបន្តិចម្តងៗ។ ការឧបត្ថម្ភរបស់អ្នកជួយឱ្យយើងបន្ថែមមុខងារថ្មី និងរក្សាសេវានេះសម្រាប់និស្សិត។',
      roadmapTitle: 'អ្វីដែលយើងចង់បន្ថែមបន្ទាប់',
      roadmap: [
        { title: 'ការរំលឹកស្វ័យប្រវត្តិ', text: 'ផ្ញើការរំលឹកតាម Telegram មុនដាច់ Streak និងមុនដល់ថ្ងៃកំណត់។' },
        { title: 'បង់ប្រាក់ងាយស្រួល', text: 'ទូទាត់តាម KHQR ដោយស្វ័យប្រវត្តិ។' },
        { title: 'ដំឡើងលើទូរសព្ទ', text: 'ដាក់នៅលើអេក្រង់ដើមដូចកម្មវិធីធម្មតា។' },
        { title: 'ឧបករណ៍ល្អជាងសម្រាប់ក្រុមធំ', text: 'សិទ្ធិ និងការគ្រប់គ្រងសម្រាប់ថ្នាក់ និងស្ថាប័ន។' },
      ],
      benefitsTitle: 'ដៃគូឧបត្ថម្ភទទួលបាន',
      benefits: [
        'និស្សិត ឬបុគ្គលិករបស់អ្នកប្រើឥតគិតថ្លៃ តាមចំនួនដែលព្រមព្រៀង',
        'ឈ្មោះ ឬនិមិត្តសញ្ញារបស់អ្នកលើទំព័រនេះ',
        'ស្នើមុខងារដែលត្រូវការមុនគេ',
      ],
      cta: 'ទាក់ទងដើម្បីឧបត្ថម្ភ',
      message: 'សួស្តី ខ្ញុំចាប់អារម្មណ៍ចង់ឧបត្ថម្ភគម្រោង សាមគ្គី។',
      sponsorsTitle: 'ដៃគូឧបត្ថម្ភរបស់យើង',
    },
    meta: {
      title: 'សាមគ្គី Sameakki - គ្រប់គ្រងកិច្ចការក្រុម និង ToDo ប្រចាំថ្ងៃ សម្រាប់និស្សិត',
      description: 'សាមគ្គី ជួយក្រុមនិស្សិតចាត់កិច្ចការ កំណត់ថ្ងៃកំណត់ សរសេរ ToDo ប្រចាំថ្ងៃ និងតាមដានវឌ្ឍនភាពសមាជិកនៅមួយកន្លែង។ សាកល្បងមើលដោយមិនចាំបាច់ចុះឈ្មោះ។',
    },
    faq: {
      title: 'សំណួរញឹកញាប់',
      items: [
        {
          q: 'សមាជិកត្រូវបង់ប្រាក់ដែរទេ?',
          a: 'មិនត្រូវទេ។ មានតែប្រធានក្រុមដែលបង់។ សមាជិកប្រើឥតគិតថ្លៃ តាមចំនួនដែលកញ្ចប់អនុញ្ញាត។',
        },
        {
          q: 'តើខ្ញុំបង់ប្រាក់ និងទទួលគណនីយ៉ាងដូចម្តេច?',
          a: 'ចុចប៊ូតុង Telegram ហើយផ្ញើសារ។ Admin នឹងប្រាប់វិធីបង់ ហើយបង្កើតគណនីឱ្យអ្នក។',
        },
        {
          q: 'អ្នកណាអាចមើលព័ត៌មានក្រុមរបស់ខ្ញុំ?',
          a: 'សមាជិកក្នុងក្រុមនោះ។ ក្រុមផ្សេងមិនអាចមើលឃើញទិន្នន័យរបស់អ្នកទេ។',
        },
        {
          q: 'Admin អាចមើលការងារ និងការពិភាក្សារបស់ខ្ញុំបានទេ?',
          a: 'មិនបានទេ លុះត្រាតែប្រធានក្រុមអនុញ្ញាត។ Admin ឃើញតែព័ត៌មានគណនី មិនឃើញកិច្ចការ ToDo ឬមតិយោបល់ទេ។ ប្រធានក្រុមអាចបើកឱ្យមើលបណ្តោះអាសន្ន ហើយបិទវិញបានគ្រប់ពេល។ សមាជិកទាំងអស់ឃើញពេលវាបើក។ (អ្នកគ្រប់គ្រង server មានសិទ្ធិបច្ចេកទេសចូលមើលទិន្នន័យ ប៉ុន្តែយើងមិនមើលទេ។)',
        },
        {
          q: 'បើខ្ញុំភ្លេចពាក្យសម្ងាត់?',
          a: 'សូមប្រាប់ប្រធានក្រុម (ឬ Admin បើអ្នកជាប្រធានក្រុម)។ គាត់នឹងបង្កើតពាក្យសម្ងាត់បណ្តោះអាសន្ន ហើយអ្នកត្រូវប្តូរវាពេលចូលគណនី។',
        },
        {
          q: 'ខ្ញុំអាចឱ្យគ្រូមើលវឌ្ឍនភាពបានទេ?',
          a: 'បាន។ សូមបន្ថែមគ្រូជា «អ្នកមើល» (អានបានតែប៉ុណ្ណោះ) ឬបោះពុម្ពរបាយការណ៍ទៅបង្ហាញ។',
        },
        {
          q: 'ប្រើលើទូរសព្ទបានទេ?',
          a: 'បាន។ វាជាគេហទំព័រ ប្រើបានលើទូរសព្ទ និងកុំព្យូទ័រ ហើយមិនចាំបាច់ដំឡើងទេ។',
        },
      ],
    },
    final: {
      title: 'ត្រៀមខ្លួនឱ្យក្រុមរបស់អ្នកធ្វើការបានល្អជាងមុនឬនៅ?',
      text: 'សាកល្បងមុន មិនបាច់ចុះឈ្មោះ។ ពេញចិត្តហើយ ទាក់ទងតាម Telegram។',
    },
    footer: { rights: 'រក្សាសិទ្ធិគ្រប់យ៉ាង', back: 'ត្រឡប់ទៅទំព័រដើម', guide: 'របៀបសរសេរ ToDo និងប្រើសាមគ្គី' },
    creator: { label: 'បង្កើតដោយ' },
  },

  en: {
    nav: { backToApp: 'Back to the app', signIn: 'Log in', features: 'Features', pricing: 'Plans', faq: 'FAQ' },
    hero: {
      eyebrow: 'Made for student teams',
      title: 'Group projects',
      highlight: 'without the drama',
      subtitle:
        'See who did what, how far it is, and who has not started.',
      explore: 'Try it now',
      exploreHint: 'No sign-up, sample data',
      contact: 'Contact us on Telegram',
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
          text: 'Clear tasks with deadlines, all in one place.',
        },
        {
          title: 'Forgetting who promised what',
          text: 'Notifications tell you about new tasks, due dates and comments.',
        },
        {
          title: 'The lecturer asks who did what',
          text: 'Export a summary to show your lecturer.',
        },
      ],
    },
    steps: {
      title: 'Start in 3 easy steps',
      items: [
        { title: 'Contact the Admin', text: 'Message us on Telegram for an account.' },
        { title: 'Create your group', text: 'Add members and assign tasks.' },
        { title: 'Follow up every day', text: 'Members post a ToDo every day, and you approve.' },
      ],
    },
    features: {
      title: 'What you get',
      items: [
        { title: 'Daily ToDo and streaks', text: 'Write your to-do list and we work out the percent. Streaks help you keep the habit.' },
        { title: 'Tasks and deadlines', text: 'Set priority and spot what is late.' },
        { title: 'Team tasks', text: 'Assign to everyone and see each person’s percent.' },
        { title: 'Leader approval', text: 'Review, approve and give feedback.' },
        { title: 'Notifications', text: 'Hear at once about new work or comments, in the app and on Telegram.' },
        { title: 'Khmer, and on phones', text: 'Khmer and English, light and dark mode, and it works well on a phone.' },
      ],
    },
    pricing: {
      title: 'Simple plans',
      subtitle: 'Members are free. The team leader pays.',
      pilot: 'First groups get 1 month free for your feedback.',
      askPrice: 'Ask for the price',
      perSemester: '/ semester',
      perMonth: '/ month',
      perYear: '/ year',
      upTo: n => `Up to ${n} members per group`,
      plans: {
        demo: {
          name: 'Explore',
          description: 'Look around before you decide',
          points: ['Sample data (view only)', 'No sign-up', 'Free'],
          cta: 'Try it',
        },
        student: {
          badge: 'Recommended',
          name: 'Student team',
          description: 'For a class project group',
          points: ['Tasks and progress in percent', 'Daily ToDo and approval', 'Notifications and comments', 'Report for your lecturer'],
          cta: 'Contact us on Telegram',
        },
      },
    },
    sponsor: {
      eyebrow: 'An early-stage project',
      title: 'Help Sameakki grow with Khmer students',
      text: 'We build step by step. Your support helps us add features and keep this service available to students.',
      roadmapTitle: 'What we want to add next',
      roadmap: [
        { title: 'Automatic reminders', text: 'Send reminders on Telegram before a streak ends and before a task is due.' },
        { title: 'Easier payment', text: 'Pay automatically with KHQR.' },
        { title: 'Install on your phone', text: 'Put it on your home screen like a regular app.' },
        { title: 'Better tools for big groups', text: 'Permissions and management for classes and organisations.' },
      ],
      benefitsTitle: 'Sponsors receive',
      benefits: [
        'Free use for your students or staff (agreed number of groups)',
        'Your name or logo on this page',
        'Request the features you need first',
      ],
      cta: 'Contact us to sponsor',
      message: 'Hello, I am interested in sponsoring Sameakki.',
      sponsorsTitle: 'Our sponsors',
    },
    meta: {
      title: 'Sameakki សាមគ្គី – Team Task Manager & Daily ToDo for Students',
      description: 'Sameakki helps student teams assign tasks, set deadlines, post a daily ToDo and track every member’s progress in one place. Try it without signing up.',
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        {
          q: 'Do members have to pay?',
          a: 'No. Only the team leader pays. Members use it for free, up to the plan’s limit.',
        },
        {
          q: 'How do I pay and get an account?',
          a: 'Tap the Telegram button and send a message. The Admin tells you how to pay and creates your account.',
        },
        {
          q: 'Who can see my group’s information?',
          a: 'The members of that group. Other groups cannot see your data.',
        },
        {
          q: 'Can the Admin see my work and discussions?',
          a: 'No, unless your team leader allows it. The Admin sees only account details, not tasks, ToDos or comments. The leader can open it for a limited time and turn it off at any time. Every member can see when it is on. (Whoever runs the server technically has access to the stored data, but we do not look at it.)',
        },
        {
          q: 'What if I forget my password?',
          a: 'Tell your team leader (or the Admin, if you are the leader). They will set a temporary password, and you change it when you log in.',
        },
        {
          q: 'Can my lecturer see our progress?',
          a: 'Yes. Add your lecturer as a "viewer" (read only), or print the report and show it.',
        },
        {
          q: 'Does it work on a phone?',
          a: 'Yes. It is a website that works on phones and computers. There is nothing to install.',
        },
      ],
    },
    final: {
      title: 'Ready for better teamwork?',
      text: 'Try it with no sign-up. Like it? Message us on Telegram.',
    },
    footer: { rights: 'All rights reserved', back: 'Back to home', guide: 'How to write a daily ToDo and use Sameakki' },
    creator: { label: 'Built by' },
  },
};
