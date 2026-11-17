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
        intro: 'ចូលប្រើបានក្នុង ៤ ជំហាន។',
        steps: [
          'ចូលគណនីដោយអ៊ីមែល ឬឈ្មោះអ្នកប្រើ និងពាក្យសម្ងាត់ដែលប្រធានក្រុមឱ្យ។',
          'ពេលចូលលើកដំបូង ប្រព័ន្ធឱ្យប្តូរពាក្យសម្ងាត់។ ជ្រើសពាក្យសម្ងាត់ថ្មីដែលអ្នកចាំបាន។',
          'ជ្រើសភាសា (ខ្មែរ ឬ EN) និងរបៀបភ្លឺ/ងងឹត នៅខាងលើ។',
          'មានលេខកូដក្រុម? ចុច "ចូលរួមក្រុម" ហើយបញ្ចូលលេខកូដ។ បើគ្មាន សូមរង់ចាំប្រធានបន្ថែមអ្នក។',
        ],
        tips: ['ចុចរូបភ្នែកក្នុងប្រអប់ពាក្យសម្ងាត់ ដើម្បីមើលអ្វីដែលអ្នកវាយ។'],
      },
      {
        id: 'daily',
        title: 'សរសេរ ToDo ប្រចាំថ្ងៃ',
        intro: 'ToDo ប្រាប់ក្រុមថាថ្ងៃនេះអ្នកធ្វើអ្វី។ សរសេរក្នុងប្រអប់តែមួយ នៅទំព័រដើម ឬ "ToDo ប្រចាំថ្ងៃ"។',
        steps: [
          'បន្ទាត់ទី ១ ជាឈ្មោះគម្រោង ឬចំណងជើង។ វាមិនមែនជាកិច្ចការទេ។',
          'បន្ទាត់បន្ទាប់ជាកិច្ចការ មួយបន្ទាត់ក្នុងមួយកិច្ចការ ចាប់ផ្តើមដោយ "-"។',
          'ចង់ប្រាប់ថាធ្វើបានប៉ុន្មាន? សរសេរ "- 80%" នៅចុងបន្ទាត់។',
          'ធ្វើរួចហើយ? ដាក់ [x] ឬ 100%។',
          'មើលប្រអប់ "មើលជាមុន" ក្រោមអក្សរ ដើម្បីពិនិត្យ រួចចុច "បង្ហោះ" (ឬ Ctrl+Enter)។',
        ],
        example: 'គម្រោងវេបសាយ\n- រចនាទំព័រ Login - 80%\n- សរសេរសៀវភៅណែនាំ\n- [x] រៀបចំ Database',
        mistakes: [
          {
            wrong: '- រចនាទំព័រ Login\n- សរសេរសៀវភៅ',
            right: 'គម្រោងវេបសាយ\n- រចនាទំព័រ Login\n- សរសេរសៀវភៅ',
            why: 'បន្ទាត់ទី ១ ត្រូវបានយកជាឈ្មោះគម្រោង។ បើសរសេរកិច្ចការនៅទីនោះ វាបាត់ពីបញ្ជី។',
          },
          {
            wrong: 'គម្រោងវេបសាយ\n- រចនា 80%',
            right: 'គម្រោងវេបសាយ\n- រចនា - 80%',
            why: 'ត្រូវមានសញ្ញា "-" មុនលេខ។ ឬសរសេរ "(80%)" ក៏បាន។',
          },
          {
            wrong: 'គម្រោងវេបសាយ\n- រចនា 80% រួចសរសេរបន្ត',
            right: 'គម្រោងវេបសាយ\n- រចនាបន្ត - 80%',
            why: 'ភាគរយត្រូវនៅចុងបំផុតនៃបន្ទាត់ ទើបប្រព័ន្ធអាន។',
          },
          {
            wrong: 'គម្រោងវេបសាយ\n- រចនា, សរសេរ, តេស្ត',
            right: 'គម្រោងវេបសាយ\n- រចនា\n- សរសេរ\n- តេស្ត',
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
          'ចុចរូបខ្មៅដៃ នៅជ្រុងខាងស្តាំនៃ ToDo របស់អ្នក។',
          'កែអត្ថបទ មើលលទ្ធផលក្នុង "មើលជាមុន" រួចចុច "រក្សាទុក"។',
          'កិច្ចការដែលអ្នកបានធីករួច នៅតែធីក ប្រសិនបើអត្ថបទរបស់វាមិនប្តូរ។',
          'ចង់ធីក ឬដកធីក? ចុចលើកិច្ចការនោះក្នុងបញ្ជី។',
          'ធ្វើអស់ហើយ? ចុច "បញ្ជាក់ថាបានធ្វើរួច" ដើម្បីឱ្យប្រធានត្រួតពិនិត្យ។',
        ],
        tips: ['ពេលប្រធានអនុម័តហើយ មានតែប្រធានដែលកែបាន។', 'ចង់លុបទាំងមូល? ចុចរូបធុងសំរាម។'],
      },
      {
        id: 'tasks',
        title: 'កិច្ចការដែលបានចាត់ឱ្យ',
        intro: 'ប្រធានចាត់កិច្ចការឱ្យអ្នក ហើយអ្នកប្រាប់ថាធ្វើបានប៉ុន្មាន។',
        steps: [
          'បើកផ្ទាំង "កិច្ចការ" ដើម្បីឃើញកិច្ចការរបស់អ្នក និងថ្ងៃកំណត់។',
          'ចុច "ចាប់ផ្តើម" ពេលចាប់ផ្តើមធ្វើ។',
          'រំកិលរបារ "វឌ្ឍនភាព" ឬចុច 25% 50% 75%។ ប្រព័ន្ធរក្សាទុកដោយខ្លួនឯង។',
          'ធ្វើរួច? ចុច "រួចរាល់" (១០០%) វានឹងទៅរង់ចាំប្រធានត្រួតពិនិត្យ។',
          'រង់ចាំប្រធានអនុម័ត។ ពេលអនុម័តរួច កិច្ចការត្រូវបិទ។',
        ],
        tips: ['ពណ៌ក្រហម = ហួសកំណត់។ សួរសំណួរដោយដាក់មតិយោបល់ក្នុងកិច្ចការ។'],
      },
      {
        id: 'team',
        title: 'កិច្ចការរួម (ទាំងអស់គ្នា)',
        intro: 'កិច្ចការតែមួយ ដែលសមាជិកម្នាក់ៗត្រូវធ្វើ ឧទាហរណ៍ "ដំឡើងកម្មវិធី"។',
        steps: [
          'ប្រធានជ្រើស "ទាំងអស់គ្នា" ឬ "ជ្រើសរើស" ពេលកំណត់កិច្ចការថ្មី។',
          'កាតតែមួយបង្ហាញវឌ្ឍនភាពរួម (មធ្យមភាគ) និងផ្នែករបស់ម្នាក់ៗ។',
          'អ្នករំកិលបានតែវឌ្ឍនភាពរបស់អ្នកផ្ទាល់។ ប្រធានកែបានរបស់គ្រប់គ្នា។',
          'ចុច "មើលជាកិច្ចការនីមួយៗ" ដើម្បីមើលចំណាំ មតិយោបល់ និងថ្ងៃកំណត់របស់ម្នាក់ៗ។',
        ],
      },
      {
        id: 'talk',
        title: 'មតិយោបល់ និងប្រតិកម្ម',
        steps: [
          'ចុច "មតិយោបល់" ក្រោមកិច្ចការ ឬ ToDo ដើម្បីសរសេរ។ Ctrl+Enter ដើម្បីផ្ញើ។',
          'កែ ឬលុបមតិរបស់អ្នកបាន។ ប្រធានលុបមតិអ្នកដទៃបាន តែកែមិនបាន។',
          'ចុចរូបញញឹម ដើម្បីដាក់ប្រតិកម្មលើ ToDo។ ចុចម្តងទៀតដើម្បីដក។',
          'រូបកណ្ដឹងខាងលើ ប្រាប់ពីការងារ និងមតិថ្មី។',
        ],
      },
      {
        id: 'leader',
        title: 'សម្រាប់ប្រធានក្រុម',
        steps: [
          'បង្កើតក្រុម រួចបន្ថែមសមាជិក ("បន្ថែមសមាជិក")។ ពាក្យសម្ងាត់បណ្តោះអាសន្នបង្ហាញតែម្តង ដូច្នេះចម្លងវាភ្លាម។',
          'ចាត់កិច្ចការ៖ ប៊ូតុង "កំណត់កិច្ចការថ្មី"។ ជ្រើសម្នាក់ ជ្រើសរើស ឬទាំងអស់គ្នា។',
          'ប្តូរថ្ងៃកំណត់ដោយចុចលើថ្ងៃ។ ប្តូរអ្នកទទួលដោយចុច "ប្តូរអ្នកទទួល"។',
          'ពិនិត្យ និងអនុម័ត ToDo និងកិច្ចការដែលមានស្លាក "រង់ចាំត្រួតពិនិត្យ"។',
          'បើកផ្ទាំង "របាយការណ៍" ដើម្បីបោះពុម្ពសេចក្តីសង្ខេបបង្ហាញគ្រូ។',
        ],
      },
      {
        id: 'help',
        title: 'បញ្ហាញឹកញាប់',
        faq: [
          { q: 'ភ្លេចពាក្យសម្ងាត់?', a: 'ប្រាប់ប្រធានក្រុម។ គាត់បង្កើតពាក្យសម្ងាត់បណ្តោះអាសន្នថ្មីឱ្យអ្នក។' },
          { q: 'ចូលមិនបាន?', a: 'ពិនិត្យអ៊ីមែល ឬឈ្មោះអ្នកប្រើ និងពាក្យសម្ងាត់ (មើលអក្សរធំតូច)។ បើនៅតែមិនបាន ប្រាប់ប្រធានក្រុម។' },
          { q: 'មិនអាចសរសេរ ឬកែអ្វីទេ?', a: 'អ្នកប្រហែលជា "អ្នកមើល" ដែលអានបានតែប៉ុណ្ណោះ។ ឬគណនីប្រធានក្រុមផុតកំណត់ ក្រុមក្លាយជាមើលតែប៉ុណ្ណោះ។' },
          { q: 'ToDo ត្រូវបានអនុម័តហើយ ចង់កែ?', a: 'ប្រាប់ប្រធានក្រុម។ មានតែប្រធានដែលកែបាន។' },
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
        intro: 'You are in after 4 steps.',
        steps: [
          'Log in with your email or username and the password your leader gave you.',
          'The first time, you must change the password. Choose a new one you can remember.',
          'Pick the language (Khmer or EN) and light or dark mode at the top.',
          'Have a group code? Tap "Join group" and enter it. If not, wait for your leader to add you.',
        ],
        tips: ['Tap the eye in a password box to see what you typed.'],
      },
      {
        id: 'daily',
        title: 'Write your daily ToDo',
        intro: 'A ToDo tells the team what you are doing today. Write it in the one box on the home page or on "Daily ToDo".',
        steps: [
          'Line 1 is the project name or a title. It is not a task.',
          'The next lines are tasks, one task per line, starting with "-".',
          'Want to show progress? Write "- 80%" at the end of the line.',
          'Already done? Add [x] or 100%.',
          'Check the "Preview" under the text, then tap "Post" (or Ctrl+Enter).',
        ],
        example: 'Website project\n- Design the login page - 80%\n- Write the user guide\n- [x] Set up the database',
        mistakes: [
          {
            wrong: '- Design the login page\n- Write the guide',
            right: 'Website project\n- Design the login page\n- Write the guide',
            why: 'Line 1 is read as the project name. A task written there is missing from the list.',
          },
          {
            wrong: 'Website project\n- Design 80%',
            right: 'Website project\n- Design - 80%',
            why: 'The "-" must come before the number. "(80%)" works too.',
          },
          {
            wrong: 'Website project\n- Design 80% and then continue',
            right: 'Website project\n- Design and continue - 80%',
            why: 'The percent must be the very last thing on the line, or it is not read.',
          },
          {
            wrong: 'Website project\n- Design, write, test',
            right: 'Website project\n- Design\n- Write\n- Test',
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
          'Tap the pencil at the right of your ToDo.',
          'Change the text, check the "Preview", then tap "Save".',
          'Tasks you already ticked stay ticked if their text is the same.',
          'Want to tick or untick? Tap the task in the list.',
          'All done? Tap "Mark as done" so your leader can review it.',
        ],
        tips: ['After your leader approves, only the leader can edit.', 'Want to remove it completely? Tap the bin.'],
      },
      {
        id: 'tasks',
        title: 'Tasks you were given',
        intro: 'Your leader gives you tasks, and you tell the team how far you are.',
        steps: [
          'Open "Tasks" to see your tasks and their deadlines.',
          'Tap "Start" when you begin.',
          'Drag the "Progress" bar or tap 25% 50% 75%. It saves by itself.',
          'Finished? Tap "Done" (100%). It goes to your leader for review.',
          'Wait for approval. Once approved, the task is closed.',
        ],
        tips: ['Red means overdue. Ask a question by leaving a comment on the task.'],
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
          'Tap "Comments" under a task or ToDo to write. Ctrl+Enter sends.',
          "You can edit or delete your comment. A leader can delete others' comments but not edit them.",
          'Tap the smiley to react to a ToDo. Tap again to remove it.',
          'The bell at the top tells you about new work and comments.',
        ],
      },
      {
        id: 'leader',
        title: 'For team leaders',
        steps: [
          'Create a group, then add members ("Add member"). The temporary password is shown only once, so copy it now.',
          'Assign work with the "New task" button. Pick one person, several, or everyone.',
          'Change a deadline by tapping the date. Change the person with "Reassign".',
          'Review and approve ToDos and tasks marked "In review".',
          'Open "Report" to print a summary for your lecturer.',
        ],
      },
      {
        id: 'help',
        title: 'Common questions',
        faq: [
          { q: 'Forgot your password?', a: 'Tell your leader. They create a new temporary password for you.' },
          { q: 'Cannot log in?', a: 'Check the email or username and the password (watch upper and lower case). If it still fails, tell your leader.' },
          { q: 'Cannot write or edit anything?', a: 'You may be a "viewer", who can only read. Or the leader\'s plan ended and the group is view only.' },
          { q: 'The ToDo is approved but you want to change it?', a: 'Ask your leader. Only a leader can edit it now.' },
          { q: 'The ToDo percent is wrong?', a: 'Write "- 80%" at the end of the line and check the "Preview" before posting.' },
        ],
      },
    ],
  },
};
