// User guide texts. The guide page and docs/user-guide.*.md are both made from this file.

export interface GuideMistake {
  wrong: string;
  right: string;
  why: string;
}

export interface GuideSection {
  id: string;
  title: string;
  intro?: string;
  steps?: string[];
  /** A ToDo text, shown with how the app reads it */
  example?: string;
  mistakes?: GuideMistake[];
  tips?: string[];
  faq?: { q: string; a: string }[];
}

export interface GuideCopy {
  title: string;
  subtitle: string;
  onThisPage: string;
  wrong: string;
  right: string;
  exampleLabel: string;
  tipLabel: string;
  sections: GuideSection[];
}

export const guide: Record<'km' | 'en', GuideCopy> = {
  km: {
    title: 'របៀបប្រើ សាមគ្គី',
    subtitle: 'ណែនាំជំហានម្តងមួយៗ សម្រាប់អ្នកថ្មី។ អានតែផ្នែកដែលអ្នកត្រូវការ។',
    onThisPage: 'ក្នុងទំព័រនេះ',
    wrong: 'ខុស',
    right: 'ត្រូវ',
    exampleLabel: 'គំរូ',
    tipLabel: 'ចំណាំ',
    sections: [
      {
        id: 'start',
        title: 'ចាប់ផ្តើម',
        intro: 'ចាប់ផ្តើមប្រើបានក្នុង ៤ ជំហានសាមញ្ញ។',
        steps: [
          'ចូលគណនីដោយអ៊ីមែល ឬឈ្មោះអ្នកប្រើ និងពាក្យសម្ងាត់ដែលប្រធានក្រុមឱ្យ។',
          'ពេលចូលលើកដំបូង ប្រព័ន្ធឱ្យប្តូរពាក្យសម្ងាត់។ ជ្រើសពាក្យសម្ងាត់ថ្មីដែលអ្នកចាំបាន។',
          'ចង់ប្តូរភាសា? ចុចរូបទង់នៅជ្រុងខាងលើស្តាំ ហើយជ្រើស "ខ្មែរ" ឬ "English"។ ក្បែរនោះមានប៊ូតុងប្តូរពណ៌ភ្លឺ/ងងឹតដែរ។',
          'មានលេខកូដក្រុម? ចុច "ចូលរួមក្រុម" ហើយបញ្ចូលលេខកូដ។ បើគ្មាន សូមរង់ចាំប្រធានក្រុមបន្ថែមអ្នក។',
        ],
        tips: ['ចុចរូបភ្នែកក្នុងប្រអប់ពាក្យសម្ងាត់ ដើម្បីមើលអ្វីដែលអ្នកវាយ។'],
      },
      {
        id: 'daily',
        title: 'សរសេរ ToDo ប្រចាំថ្ងៃ',
        intro: 'ToDo ប្រាប់ក្រុមថាថ្ងៃនេះអ្នកធ្វើអ្វី។ សរសេរក្នុងប្រអប់តែមួយ នៅទំព័រដើម ឬ "ToDo ប្រចាំថ្ងៃ"។',
        steps: [
          'សរសេរ "ចំណុចគោល" មួយក្នុងមួយបន្ទាត់ (មិនដាក់ "-") ឧទាហរណ៍ ឈ្មោះគម្រោង ឬផ្នែកមួយនៃគម្រោង។',
          'ក្រោមវា រាយចំណុចតូចៗដែលត្រូវធីក។ ចាប់ផ្តើមដោយ "-" មួយបន្ទាត់ក្នុងមួយចំណុច។',
          'មិនចង់បានចំណុចគោលទេ? សរសេរតែបន្ទាត់ "-" ប៉ុណ្ណោះ។ បន្ទាត់នីមួយៗក្លាយជាកិច្ចការដែលអាចធីកបាន។',
          'ធ្វើគម្រោងតែមួយ តែមានច្រើនផ្នែក? ដាក់ចំណុចគោលបន្ថែម។ កិច្ចការនៅក្រោមចំណុចនីមួយៗត្រូវដាក់ជាក្រុមរួមគ្នា។',
          'ចង់ប្រាប់ថាធ្វើបានប៉ុន្មាន? សរសេរ "- 80%" នៅចុងបន្ទាត់។ ធ្វើរួចហើយ? ដាក់ [x] ឬ 100%។',
          'ពេលអ្នកវាយ ប្រអប់ "មើលជាមុន" នឹងលេចឡើងក្រោមអក្សរ។ ពិនិត្យឱ្យត្រូវ រួចចុច "បង្ហោះ ToDo" (ឬចុច Ctrl+Enter)។',
        ],
        example: 'គម្រោងបញ្ចប់ការសិក្សា\nវេបសាយ\n- រចនាទំព័រ Login - 80%\n- [x] រៀបចំ Database\nកម្មវិធីទូរស័ព្ទ\n- សាងសង់ទំព័រដើម',
        mistakes: [
          {
            wrong: 'វេបសាយ\n- រចនា 80%',
            right: 'វេបសាយ\n- រចនា - 80%',
            why: 'ត្រូវមានសញ្ញា "-" មុនលេខ។ ឬសរសេរ "(80%)" ក៏បាន។',
          },
          {
            wrong: 'វេបសាយ\n- រចនា 80% រួចសរសេរបន្ត',
            right: 'វេបសាយ\n- រចនាបន្ត - 80%',
            why: 'ភាគរយត្រូវនៅចុងបំផុតនៃបន្ទាត់ ទើបប្រព័ន្ធអាន។',
          },
          {
            wrong: 'វេបសាយ\n- រចនា, សរសេរ, តេស្ត',
            right: 'វេបសាយ\n- រចនា\n- សរសេរ\n- តេស្ត',
            why: 'មួយបន្ទាត់ ក្នុងមួយកិច្ចការ ទើបធីក និងគិតភាគរយបាន។',
          },
        ],
        tips: ['លេខរៀង "1." "2." ក៏ត្រូវបានអានជាកិច្ចការដែរ។', 'ភាគរយនៃ ToDo = មធ្យមភាគនៃកិច្ចការទាំងអស់ (ធ្វើរួច = ១០០%)។'],
      },
      {
        id: 'fix',
        title: 'ខុស? កែបាន',
        intro: 'អ្នកអាចកែ ToDo ដែលបានបង្ហោះ។ មិនបាច់លុបហើយសរសេរថ្មីទេ។',
        steps: [
          'ចុចរូបខ្មៅដៃ នៅជ្រុងខាងស្តាំលើនៃ ToDo របស់អ្នក (នៅក្នុងទំព័រ "ToDo ប្រចាំថ្ងៃ")។',
          'កែអត្ថបទ មើលលទ្ធផលក្នុង "មើលជាមុន" រួចចុច "រក្សាទុក"។',
          'កិច្ចការដែលអ្នកបានធីករួច នៅតែធីក ប្រសិនបើអត្ថបទរបស់វាមិនប្តូរ។',
          'ចង់ធីក ឬដកធីក? ចុចលើកិច្ចការនោះក្នុងបញ្ជី។',
          'ធីកគ្រប់កិច្ចការ ToDo នឹងរួចដោយស្វ័យប្រវត្តិ។ ឬចុច "បញ្ជាក់ថាបានធ្វើរួច" ដើម្បីឱ្យប្រធានក្រុមមកត្រួតពិនិត្យ។',
        ],
        tips: ['ពេលប្រធានក្រុមអនុម័តហើយ ToDo ត្រូវចាក់សោ គ្មាននរណាកែបានទេ។ ប្រធានក្រុមអាចចុច "បើកឡើងវិញដើម្បីកែ" ប្រសិនបើត្រូវកែ។', 'ចង់លុបទាំងមូល? ចុចរូបធុងសំរាម។'],
      },
      {
        id: 'tasks',
        title: 'កិច្ចការដែលបានចាត់ឱ្យ',
        intro: 'ប្រធានក្រុមចាត់កិច្ចការឱ្យអ្នក ហើយអ្នកប្រាប់ថាធ្វើបានប៉ុន្មាន។',
        steps: [
          'បើកផ្ទាំង "កិច្ចការ" ដើម្បីឃើញកិច្ចការរបស់អ្នក និងថ្ងៃកំណត់។',
          'ចុច "ចាប់ផ្តើម" ពេលអ្នកចាប់ផ្តើមធ្វើ។',
          'រំកិលរបារ "វឌ្ឍនភាព" ឬចុច 25% 50% 75%។ ប្រព័ន្ធរក្សាទុកឱ្យដោយខ្លួនឯង មិនបាច់ចុចរក្សាទុកទេ។',
          'ធ្វើរួច? ចុច "រួចរាល់" (១០០%) ឬ "ធ្វើរួច ផ្ញើឱ្យពិនិត្យ"។ កិច្ចការនឹងទៅរង់ចាំប្រធានក្រុមត្រួតពិនិត្យ។',
          'រង់ចាំប្រធានក្រុមអនុម័ត។ ពេលអនុម័តរួច កិច្ចការត្រូវចាក់សោ មិនអាចកែវឌ្ឍនភាពទៀតទេ លុះត្រាតែប្រធានក្រុមបើកឡើងវិញ។',
        ],
        tips: ['ពណ៌ក្រហម = ហួសកំណត់។ សួរសំណួរដោយដាក់មតិយោបល់ក្នុងកិច្ចការ។', 'ពិពណ៌នាវែង? ចុច "បង្ហាញបន្ថែម" ក្រោមកិច្ចការ ដើម្បីមើលទាំងអស់ (ឧទាហរណ៍ បញ្ជីអ្វីដែលត្រូវដំឡើង)។'],
      },
      {
        id: 'team',
        title: 'កិច្ចការរួម (ទាំងអស់គ្នា)',
        intro: 'កិច្ចការតែមួយ ដែលសមាជិកម្នាក់ៗត្រូវធ្វើ ឧទាហរណ៍ "ដំឡើងកម្មវិធី"។',
        steps: [
          'ប្រធានក្រុមជ្រើស "ទាំងអស់គ្នា" ឬ "ជ្រើសរើស" ពេលកំណត់កិច្ចការថ្មី។',
          'កាតតែមួយបង្ហាញវឌ្ឍនភាពរួម (មធ្យមភាគ) និងផ្នែករបស់ម្នាក់ៗ។',
          'អ្នករំកិលបានតែវឌ្ឍនភាពរបស់អ្នកផ្ទាល់។ ប្រធានក្រុមកែបានរបស់គ្រប់គ្នា។',
          'ចុច "មើលជាកិច្ចការនីមួយៗ" ដើម្បីមើលចំណាំ មតិយោបល់ និងថ្ងៃកំណត់របស់ម្នាក់ៗ។',
        ],
      },
      {
        id: 'talk',
        title: 'មតិយោបល់ និងប្រតិកម្ម',
        steps: [
          'ចុច "មតិយោបល់" ក្រោមកិច្ចការ ឬ ToDo រួចសរសេរក្នុងប្រអប់។ ចុចព្រួញនៅខាងស្តាំ (ឬ Ctrl+Enter) ដើម្បីផ្ញើ។',
          'កែ ឬលុបមតិរបស់អ្នកបាន។ ប្រធានក្រុមលុបមតិអ្នកដទៃបាន តែកែមិនបាន។',
          'ចុចរូបញញឹមក្បែរ ToDo ដើម្បីដាក់ប្រតិកម្ម។ ចុចម្តងទៀតដើម្បីដកចេញ។',
          'រូបកណ្ដឹងខាងលើ ប្រាប់ពីការងារ និងមតិថ្មី។',
        ],
      },
      {
        id: 'leader',
        title: 'សម្រាប់ប្រធានក្រុម',
        steps: [
          'បង្កើតក្រុម រួចបន្ថែមសមាជិក ("បន្ថែមសមាជិក")។ ពាក្យសម្ងាត់បណ្តោះអាសន្នបង្ហាញតែម្តង ដូច្នេះចម្លងវាភ្លាម។',
          'ចាត់កិច្ចការ៖ ប៊ូតុង "កំណត់កិច្ចការថ្មី"។ ជ្រើសម្នាក់ ជ្រើសរើស ឬទាំងអស់គ្នា។',
          'មានកិច្ចការច្រើន? ចុច "នាំចូលកិច្ចការ" នៅទំព័រ "កិច្ចការ" រួចចម្លងតារាងពី Google Sheets ឬ Excel មកដាក់ (ឬជ្រើសឯកសារ CSV)។ ១ ជួរដេក = ១ កិច្ចការ។ ត្រូវមានជួរឈរ Task title និង Due date។ ជួរផ្សេង (Module, Assign to, Members, Priority, Start date, Due time, Details) ជាជម្រើស។ ប្រព័ន្ធបង្ហាញលទ្ធផលមុននាំចូល ហើយរំលងជួរដែលមានបញ្ហា។ ចុច "ទាញយកគំរូ" ដើម្បីបានទម្រង់ត្រូវ។',
          'ប្តូរថ្ងៃកំណត់ដោយចុចលើថ្ងៃ។ ប្តូរអ្នកទទួលដោយចុច "ប្តូរអ្នកទទួល"។',
          'ពិនិត្យ និងអនុម័ត ToDo និងកិច្ចការដែលមានស្លាក "រង់ចាំត្រួតពិនិត្យ"។ ពេលអនុម័តរួច វាត្រូវចាក់សោ។ ចង់កែ? ចុច "បើកឡើងវិញដើម្បីកែ"។',
          'បើកផ្ទាំង "របាយការណ៍" រួចចុច "បោះពុម្ព / PDF" ដើម្បីទទួលបានសេចក្តីសង្ខេបបង្ហាញគ្រូ។',
        ],
      },
      {
        id: 'help',
        title: 'បញ្ហាញឹកញាប់',
        faq: [
          { q: 'ភ្លេចពាក្យសម្ងាត់?', a: 'ប្រាប់ប្រធានក្រុម។ គាត់បង្កើតពាក្យសម្ងាត់បណ្តោះអាសន្នថ្មីឱ្យអ្នក។' },
          { q: 'ចូលមិនបាន?', a: 'ពិនិត្យអ៊ីមែល ឬឈ្មោះអ្នកប្រើ និងពាក្យសម្ងាត់ (មើលអក្សរធំតូច)។ បើនៅតែមិនបាន ប្រាប់ប្រធានក្រុម។' },
          { q: 'មិនអាចសរសេរ ឬកែអ្វីទេ?', a: 'អ្នកប្រហែលជា "អ្នកមើល" ដែលអានបានតែប៉ុណ្ណោះ។ ឬគណនីប្រធានក្រុមផុតកំណត់ ក្រុមក្លាយជាមើលតែប៉ុណ្ណោះ។' },
          { q: 'ToDo ត្រូវបានអនុម័តហើយ ចង់កែ?', a: 'ប្រាប់ប្រធានក្រុម។ ប្រធានក្រុមត្រូវចុច "បើកឡើងវិញដើម្បីកែ" ជាមុនសិន ទើបអ្នកកែបាន។' },
          { q: 'ភាគរយ ToDo ខុស?', a: 'សរសេរ "- 80%" នៅចុងបន្ទាត់ ហើយមើល "មើលជាមុន" មុនបង្ហោះ។' },
        ],
      },
    ],
  },

  en: {
    title: 'How to use Sameakki',
    subtitle: 'Step by step, for new people. Read only the parts you need.',
    onThisPage: 'On this page',
    wrong: 'Wrong',
    right: 'Right',
    exampleLabel: 'Example',
    tipLabel: 'Note',
    sections: [
      {
        id: 'start',
        title: 'Getting started',
        intro: 'You can start in 4 easy steps.',
        steps: [
          'Log in with your email or username and the password your leader gave you.',
          'The first time, you must change the password. Choose a new one you can remember.',
          'To change language, tap the flag at the top right and pick "ខ្មែរ" or "English". Next to it is the light or dark mode button.',
          'Have a group code? Tap "Join a Group" and enter it. If not, wait for your leader to add you.',
        ],
        tips: ['Tap the eye in a password box to see what you typed.'],
      },
      {
        id: 'daily',
        title: 'Write your daily ToDo',
        intro: 'A ToDo tells the team what you are doing today. Write it in the one box on the home page or on "Daily ToDo".',
        steps: [
          'Write a "main point" on its own line, without "-". It can be the project name or one part of the project.',
          'Under it, list the small things to tick. Start each with "-", one per line.',
          'Do not need a main point? Write only "-" lines. Each line becomes a task to tick.',
          'One project with several parts? Add more main points. The tasks under each one are grouped together.',
          'Want to show progress? Write "- 80%" at the end of the line. Already done? Add [x] or 100%.',
          'As you type, a "Preview" appears under the text. Check it, then tap "Post ToDo" (or press Ctrl+Enter).',
        ],
        example: 'Final project\nWebsite\n- Design the login page - 80%\n- [x] Set up the database\nMobile app\n- Build the home screen',
        mistakes: [
          {
            wrong: 'Website\n- Design 80%',
            right: 'Website\n- Design - 80%',
            why: 'The "-" must come before the number. "(80%)" works too.',
          },
          {
            wrong: 'Website\n- Design 80% and then continue',
            right: 'Website\n- Design and continue - 80%',
            why: 'The percent must be the very last thing on the line, or it is not read.',
          },
          {
            wrong: 'Website\n- Design, write, test',
            right: 'Website\n- Design\n- Write\n- Test',
            why: 'One task per line, so each can be ticked and counted.',
          },
        ],
        tips: ['Numbers like "1." and "2." are read as tasks too.', 'The ToDo percent is the average of all tasks (done = 100%).'],
      },
      {
        id: 'fix',
        title: 'Made a mistake? You can edit',
        intro: 'You can edit a ToDo you already posted. No need to delete it and write again.',
        steps: [
          'Tap the pencil at the top right of your ToDo (on the "Daily ToDo" page).',
          'Change the text, check the "Preview", then tap "Save".',
          'Tasks you already ticked stay ticked if their text is the same.',
          'Want to tick or untick? Tap the task in the list.',
          'Ticked every task? The ToDo is marked done by itself. Or tap "Mark as done" so your leader can review it.',
        ],
        tips: ['Once your leader approves, the ToDo is locked and nobody can edit it. A leader can tap "Reopen to edit" if a change is needed.', 'Want to remove it completely? Tap the bin.'],
      },
      {
        id: 'tasks',
        title: 'Tasks you were given',
        intro: 'Your leader gives you tasks, and you tell the team how far you are.',
        steps: [
          'Open "Tasks" to see your tasks and their deadlines.',
          'Tap "Start" when you begin.',
          'Drag the "Progress" bar or tap 25% 50% 75%. It saves by itself, no save button needed.',
          'Finished? Tap "Done" (100%) or "Done, send for review". It goes to your leader.',
          'Wait for approval. Once approved, the task is locked and its progress cannot change unless your leader reopens it.',
        ],
        tips: ['Red means overdue. Ask a question by leaving a comment on the task.', 'Long description? Tap "Show more" under the task to read all of it (for example, a list of things to install).'],
      },
      {
        id: 'team',
        title: 'Team tasks (for everyone)',
        intro: 'One task that every member must do, for example "Install the software".',
        steps: [
          'The leader picks "Everyone" or "Choose" when creating a task.',
          "One card shows the team progress (the average) and each person's part.",
          "You can move only your own progress. The leader can edit everyone's.",
          'Tap "View as individual tasks" to see notes, comments and deadline of each person.',
        ],
      },
      {
        id: 'talk',
        title: 'Comments and reactions',
        steps: [
          'Tap "Comments" under a task or ToDo and type in the box. Tap the arrow on the right (or press Ctrl+Enter) to send.',
          "You can edit or delete your comment. A leader can delete others' comments but not edit them.",
          'Tap the smiley next to a ToDo to react. Tap again to remove it.',
          'The bell at the top tells you about new work and comments.',
        ],
      },
      {
        id: 'leader',
        title: 'For team leaders',
        steps: [
          'Create a group, then add members ("Add member"). The temporary password is shown only once, so copy it now.',
          'Assign work with the "New task" button. Pick "One person", "Choose" or "Everyone".',
          'Many tasks? Tap "Import tasks" on the "Tasks" page, then paste a table from Google Sheets or Excel (or choose a CSV file). One row is one task. You need the columns Task title and Due date. Other columns (Module, Assign to, Members, Priority, Start date, Due time, Details) are optional. The app shows a preview first and skips rows with problems. Tap "Download template" to get the right layout.',
          'Change a deadline by tapping the date. Change the person with "Reassign".',
          'Review and approve ToDos and tasks marked "Waiting for review". Approved work is locked. To change it, tap "Reopen to edit".',
          'Open "Report" and tap "Print / PDF" to get a summary for your lecturer.',
        ],
      },
      {
        id: 'help',
        title: 'Common questions',
        faq: [
          { q: 'Forgot your password?', a: 'Tell your leader. They create a new temporary password for you.' },
          { q: 'Cannot log in?', a: 'Check the email or username and the password (watch upper and lower case). If it still fails, tell your leader.' },
          { q: 'Cannot write or edit anything?', a: 'You may be a "viewer", who can only read. Or the leader\'s plan ended and the group is view only.' },
          { q: 'The ToDo is approved but you want to change it?', a: 'Ask your leader. They must tap "Reopen to edit" first, then you can change it.' },
          { q: 'The ToDo percent is wrong?', a: 'Write "- 80%" at the end of the line and check the "Preview" before posting.' },
        ],
      },
    ],
  },
};
