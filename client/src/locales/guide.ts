// User guide texts. The guide page and docs/user-guide.*.md are both made from this file.
// Names of buttons and pages must be written exactly as the app shows them (see translations.ts).
// Khmer uses « » for names in the app, and English uses " ".

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
    subtitle: 'ការណែនាំជាជំហានៗ សម្រាប់អ្នកថ្មី។ អានតែផ្នែកដែលអ្នកត្រូវការ។',
    onThisPage: 'ក្នុងទំព័រនេះ',
    wrong: 'ខុស',
    right: 'ត្រូវ',
    exampleLabel: 'គំរូ',
    tipLabel: 'ចំណាំ',
    sections: [
      {
        id: 'start',
        title: 'ចាប់ផ្តើម',
        intro: 'អ្នកអាចចាប់ផ្តើមប្រើបានក្នុង ៤ ជំហានសាមញ្ញ។',
        steps: [
          'ចូលគណនីដោយអ៊ីមែល ឬឈ្មោះអ្នកប្រើ និងពាក្យសម្ងាត់ដែលប្រធានក្រុមបានឱ្យអ្នក។',
          'ពេលចូលលើកដំបូង ប្រព័ន្ធនឹងសុំឱ្យអ្នកប្តូរពាក្យសម្ងាត់។ សូមជ្រើសពាក្យសម្ងាត់ថ្មីដែលអ្នកចាំបាន។',
          'ចង់ប្តូរភាសា? ចុចរូបទង់នៅជ្រុងខាងលើស្តាំ ហើយជ្រើស «ខ្មែរ» ឬ «English»។ ប៊ូតុងនៅក្បែរនោះប្តូររបៀបភ្លឺ ឬងងឹត។',
          'មានលេខកូដក្រុម? ចុច «ចូលរួមក្រុម» ហើយបញ្ចូលលេខកូដ។ បើគ្មាន សូមរង់ចាំប្រធានក្រុមបន្ថែមអ្នក។',
        ],
        tips: [
          'ចុចរូបភ្នែកក្នុងប្រអប់ពាក្យសម្ងាត់ ដើម្បីមើលអ្វីដែលអ្នកបានវាយ។',
          'ចង់ប្តូររូបតំណាង? ចុចឈ្មោះរបស់អ្នកខាងក្រោមឆ្វេង រួចចុច «ប្តូររូបតំណាង»។ មាន ៣០ រូប រួមទាំងជនជាតិខ្មែរគ្រប់សម័យកាល ចាប់ពីនគរភ្នំ អង្គរ រហូតដល់សម័យថ្មី។',
          'ទ្រាំវាយអ៊ីមែលវែងមិនបាន? ចុចឈ្មោះរបស់អ្នកខាងក្រោមឆ្វេង បើក «ការកំណត់ផ្ទាល់ខ្លួន» ហើយដាក់ «ឈ្មោះអ្នកប្រើ» ខ្លីៗ (ឧទាហរណ៍ sopheak)។ លើកក្រោយអ្នកអាចចូលដោយឈ្មោះនេះជំនួសអ៊ីមែល។ ឈ្មោះនេះមិនអាចដូចអ្នកដទៃទេ។',
        ],
      },
      {
        id: 'daily',
        title: 'សរសេរ ToDo ប្រចាំថ្ងៃ',
        intro: 'ToDo ប្រាប់ក្រុមថាថ្ងៃនេះអ្នកធ្វើអ្វី។ សរសេរក្នុងប្រអប់តែមួយ នៅទំព័រ «ទិដ្ឋភាពទូទៅ» ឬ «ToDo ប្រចាំថ្ងៃ»។',
        steps: [
          'សរសេរ «ចំណុចគោល» មួយក្នុងមួយបន្ទាត់ ដោយមិនដាក់ «-»។ វាអាចជាឈ្មោះគម្រោង ឬផ្នែកមួយនៃគម្រោង។',
          'ក្រោមវា សរសេរចំណុចតូចៗដែលត្រូវធីក។ ចាប់ផ្តើមដោយ «-» មួយបន្ទាត់ក្នុងមួយចំណុច។',
          'មិនចង់បានចំណុចគោលទេ? សរសេរតែបន្ទាត់ «-» ប៉ុណ្ណោះ។ បន្ទាត់នីមួយៗនឹងក្លាយជាកិច្ចការដែលអាចធីកបាន។',
          'ធ្វើគម្រោងតែមួយ តែមានច្រើនផ្នែក? សូមដាក់ចំណុចគោលបន្ថែម។ កិច្ចការក្រោមចំណុចគោលនីមួយៗនឹងត្រូវដាក់ជាក្រុម។',
          'ចង់ប្រាប់ថាធ្វើបានប៉ុន្មាន? សរសេរ «- 80%» នៅចុងបន្ទាត់។ ធ្វើរួចហើយ? ដាក់ [x] ឬ 100%។',
          'ពេលអ្នកវាយ ប្រអប់ «មើលជាមុន» នឹងលេចឡើងក្រោមអក្សរ។ សូមពិនិត្យឱ្យត្រូវ រួចចុច «បង្ហោះ ToDo» (ឬចុច Ctrl+Enter)។',
        ],
        example: 'គម្រោងបញ្ចប់ការសិក្សា\nវេបសាយ\n- រចនាទំព័រ Login - 80%\n- [x] រៀបចំ Database\nកម្មវិធីទូរស័ព្ទ\n- សាងសង់ទំព័រដើម',
        mistakes: [
          {
            wrong: 'វេបសាយ\n- រចនា 80%',
            right: 'វេបសាយ\n- រចនា - 80%',
            why: 'ត្រូវមានសញ្ញា «-» មុនលេខ។ ឬសរសេរ «(80%)» ក៏បាន។',
          },
          {
            wrong: 'វេបសាយ\n- រចនា 80% រួចសរសេរបន្ត',
            right: 'វេបសាយ\n- រចនាបន្ត - 80%',
            why: 'ភាគរយត្រូវនៅចុងបំផុតនៃបន្ទាត់ ទើបប្រព័ន្ធអានបាន។',
          },
          {
            wrong: 'វេបសាយ\n- រចនា, សរសេរ, តេស្ត',
            right: 'វេបសាយ\n- រចនា\n- សរសេរ\n- តេស្ត',
            why: 'មួយបន្ទាត់ត្រូវមានតែមួយកិច្ចការ ដើម្បីឱ្យធីក និងគិតភាគរយបាន។',
          },
        ],
        tips: ['លេខរៀង «1.» «2.» ក៏ត្រូវបានអានជាកិច្ចការដែរ។', 'ភាគរយរបស់ ToDo គឺមធ្យមភាគនៃកិច្ចការទាំងអស់ (កិច្ចការដែលធ្វើរួចរាប់ជា ១០០%)។'],
      },
      {
        id: 'fix',
        title: 'ខុស? អាចកែបាន',
        intro: 'អ្នកអាចកែ ToDo ដែលបានបង្ហោះ។ មិនចាំបាច់លុបហើយសរសេរថ្មីទេ។',
        steps: [
          'ចុចរូបខ្មៅដៃនៅជ្រុងខាងលើស្តាំនៃ ToDo របស់អ្នក (ក្នុងទំព័រ «ToDo ប្រចាំថ្ងៃ»)។',
          'កែអត្ថបទ មើលលទ្ធផលក្នុង «មើលជាមុន» រួចចុច «រក្សាទុក»។',
          'កិច្ចការដែលអ្នកបានធីករួច នៅតែធីក ប្រសិនបើអត្ថបទរបស់វាមិនប្តូរ។',
          'ចង់ធីក ឬដកធីក? ចុចលើកិច្ចការនោះក្នុងបញ្ជី។',
          'ពេលធីកគ្រប់កិច្ចការ ToDo នឹងរួចដោយស្វ័យប្រវត្តិ។ ឬអ្នកអាចចុច «បញ្ជាក់ថាបានធ្វើរួច» ដើម្បីឱ្យប្រធានក្រុមមកពិនិត្យ។',
        ],
        tips: [
          'ពេលប្រធានក្រុមអនុម័តហើយ ToDo នឹងត្រូវចាក់សោ គ្មានអ្នកណាកែបានទេ។ បើត្រូវកែ ប្រធានក្រុមអាចចុច «បើកឡើងវិញដើម្បីកែ»។',
          'ចង់លុបទាំងមូល? ចុចរូបធុងសំរាម។',
        ],
      },
      {
        id: 'tasks',
        title: 'កិច្ចការដែលបានចាត់ឱ្យអ្នក',
        intro: 'ប្រធានក្រុមចាត់កិច្ចការឱ្យអ្នក ហើយអ្នកប្រាប់ក្រុមថាធ្វើបានប៉ុន្មាន។',
        steps: [
          'បើកទំព័រ «កិច្ចការ» ដើម្បីមើលកិច្ចការរបស់អ្នក និងថ្ងៃកំណត់។',
          'ចុច «ចាប់ផ្តើម» ពេលអ្នកចាប់ផ្តើមធ្វើ។',
          'រំកិលរបារ «វឌ្ឍនភាព» ឬចុច 25% 50% 75%។ ប្រព័ន្ធរក្សាទុកដោយខ្លួនឯង មិនចាំបាច់ចុចរក្សាទុកទេ។',
          'ធ្វើរួចហើយ? ចុច «រួចរាល់» (១០០%) ឬ «ធ្វើរួច ផ្ញើឱ្យពិនិត្យ»។ កិច្ចការនឹងទៅរង់ចាំប្រធានក្រុមពិនិត្យ។',
          'បើត្រឹមត្រូវ ប្រធានក្រុមនឹងអនុម័ត ហើយកិច្ចការត្រូវចាក់សោ។ បើមិនទាន់ត្រូវ គាត់ចុច «ស្នើសុំកែ» ជាមួយមូលហេតុ ហើយកិច្ចការត្រឡប់ទៅ «កំពុងធ្វើ»។ អ្នកនឹងទទួលដំណឹង សូមកែ រួចផ្ញើម្តងទៀត។',
        ],
        tips: [
          'ពណ៌ក្រហមមានន័យថាហួសកំណត់។ ចង់សួរសំណួរ សូមសរសេរមតិយោបល់ក្នុងកិច្ចការ។',
          'ចង់ដឹងថាថ្ងៃនេះមានអ្វីត្រូវធ្វើ? ទំព័រ «ទិដ្ឋភាពទូទៅ» មានជួរ «ថ្ងៃនេះ» បង្ហាញចំនួន «ខ្ញុំម្នាក់ឯង» «ខ្ញុំរួមក្រុម» និង «ហួសកំណត់»។ ចុចលើវា ដើម្បីបើកទំព័រកិច្ចការដែលត្រងរួចហើយ។',
          'ទំព័រ «កិច្ចការ» និង «ToDo ប្រចាំថ្ងៃ» មានតម្រងដូចគ្នា៖ ទាំងអស់ ឬខ្ញុំម្នាក់ឯង គ្រប់ពេល ថ្ងៃនេះ ឬជ្រើសថ្ងៃ និងស្ថានភាព។ ក្នុងទំព័រ «កិច្ចការ» ចុច «តម្រងបន្ថែម» សម្រាប់សមាជិក ប្រភេទ និងលំដាប់។',
          'ពិពណ៌នាវែង? ចុច «បង្ហាញបន្ថែម» ក្រោមកិច្ចការ ដើម្បីមើលទាំងអស់។',
        ],
      },
      {
        id: 'team',
        title: 'កិច្ចការរួម (ទាំងអស់គ្នា)',
        intro: 'កិច្ចការតែមួយដែលសមាជិកម្នាក់ៗត្រូវធ្វើ ឧទាហរណ៍ «ដំឡើងកម្មវិធី»។',
        steps: [
          'ពេលកំណត់កិច្ចការថ្មី ប្រធានក្រុមជ្រើស «ទាំងអស់គ្នា» ឬ «ជ្រើសរើស»។',
          'កាតតែមួយបង្ហាញវឌ្ឍនភាពរួមរបស់ក្រុម (មធ្យមភាគ) និងផ្នែករបស់ម្នាក់ៗ។',
          'អ្នករំកិលបានតែវឌ្ឍនភាពរបស់ខ្លួនឯង។ ប្រធានក្រុមកែបានរបស់គ្រប់គ្នា។',
          'ចុច «មើលជាកិច្ចការនីមួយៗ» ដើម្បីមើលកំណត់ចំណាំ មតិយោបល់ និងថ្ងៃកំណត់របស់ម្នាក់ៗ។',
        ],
      },
      {
        id: 'talk',
        title: 'មតិយោបល់ និងប្រតិកម្ម',
        steps: [
          'ចុច «មតិយោបល់» ក្រោមកិច្ចការ ឬ ToDo រួចសរសេរក្នុងប្រអប់។ ចុចព្រួញនៅខាងស្តាំ (ឬ Ctrl+Enter) ដើម្បីផ្ញើ។',
          'អ្នកអាចកែ ឬលុបមតិរបស់ខ្លួនឯង។ ប្រធានក្រុមអាចលុបមតិរបស់អ្នកដទៃ ប៉ុន្តែមិនអាចកែបានទេ។',
          'ចុចរូបញញឹមក្បែរ ToDo ដើម្បីដាក់ប្រតិកម្ម។ ចុចម្តងទៀតដើម្បីដកចេញ។',
          'រូបកណ្ដឹងនៅខាងលើ ប្រាប់អ្នកពីកិច្ចការ និងមតិយោបល់ថ្មី។ ពេលអ្នកចុចអាន ការជូនដំណឹងនោះនឹងបាត់ពីបញ្ជី ដូច្នេះបញ្ជីមានតែអ្វីដែលអ្នកមិនទាន់អាន។',
        ],
      },
      {
        id: 'streak',
        title: 'Streak និងការ Poke',
        intro: 'Streak គឺចំនួនថ្ងៃជាប់គ្នាដែលអ្នកបង្ហោះ ToDo ប្រចាំថ្ងៃ។ វាជួយឱ្យអ្នកមានទម្លាប់ល្អ ហើយក្រុមឃើញថាអ្នកណាខំប្រឹង។',
        steps: [
          'បង្ហោះ ToDo យ៉ាងតិចម្តងក្នុងមួយថ្ងៃ (ម៉ោងកម្ពុជា)។ ថ្ងៃនោះនឹងរាប់ ហើយ Streak កើនមួយថ្ងៃ។',
          'Streak របស់អ្នកបង្ហាញលើប្រអប់បង្ហោះ (🔥 ៥ ថ្ងៃជាប់គ្នា)។ ចំណាត់ថ្នាក់របស់ក្រុមនៅទំព័រ «ទិដ្ឋភាពទូទៅ»។',
          'បើខាន ១ ថ្ងៃពេញ Streak ត្រឡប់ទៅ ០។ ប៉ុន្តែបើថ្ងៃនេះមិនទាន់ផុត អ្នកនៅមានពេលបង្ហោះដើម្បីរក្សាវា។',
          'ឃើញសមាជិកមិនទាន់បង្ហោះថ្ងៃនេះ? ចុច «Poke» ក្បែរឈ្មោះគាត់។ គាត់នឹងទទួលការជូនដំណឹង (និងសារ Telegram បើគាត់បានភ្ជាប់)។',
          'អ្នក Poke មនុស្សតែមួយបានម្តងក្នុងមួយថ្ងៃ។ ពេលគាត់បង្ហោះរួច ប៊ូតុង Poke នឹងបាត់។',
          'ចង់ទទួលការជូនដំណឹងក្នុង Telegram? ចុច «ភ្ជាប់ Telegram» លើកាតចំណាត់ថ្នាក់ (ឬក្នុង «ការកំណត់ផ្ទាល់ខ្លួន») រួចចុច Start ក្នុង Telegram ម្តង។ មុខងារនេះដំណើរការបានតែពេលប្រព័ន្ធបានដំឡើង bot។',
          'ក្រោយភ្ជាប់ អ្នកនឹងទទួលការ Poke និងការជូនដំណឹងដូចរូបកណ្ដឹង (កិច្ចការថ្មី ការអនុម័ត មតិយោបល់) ជាភាសាដែលអ្នកកំពុងប្រើ។ ចង់បានតែការ Poke? សូមដកធីក «ផ្ញើការជូនដំណឹងផ្សេងៗមក Telegram ផង»។',
        ],
        tips: ['Streak រាប់តាមថ្ងៃដែលអ្នកបង្ហោះពិតប្រាកដ។ អ្នកមើលមិនមាន Streak ទេ។'],
      },
      {
        id: 'leader',
        title: 'សម្រាប់ប្រធានក្រុម',
        steps: [
          'បង្កើតក្រុម រួចចុច «បន្ថែមសមាជិក»។ ពាក្យសម្ងាត់បណ្តោះអាសន្នបង្ហាញតែម្តង ដូច្នេះសូមចម្លងវាភ្លាម។',
          'ចាត់កិច្ចការដោយចុច «កំណត់កិច្ចការថ្មី» ហើយជ្រើស «ម្នាក់» «ជ្រើសរើស» ឬ «ទាំងអស់គ្នា»។',
          'មានកិច្ចការច្រើន? ចុច «នាំចូលកិច្ចការ» ក្នុងទំព័រ «កិច្ចការ» រួចដាក់តារាងពី Google Sheets ឬ Excel (ឬជ្រើសឯកសារ CSV)។ មួយជួរដេកគឺមួយកិច្ចការ។',
          'តារាងត្រូវមានយ៉ាងតិចជួរឈរ Task title និង Due date។ ជួរឈរផ្សេងៗ (Module, Assign to, Members, Priority, Start date, Due time, Details) ជាជម្រើស។ ចុច «ទាញយកគំរូ» ដើម្បីបានទម្រង់ត្រឹមត្រូវ។',
          'ប្រព័ន្ធបង្ហាញលទ្ធផលជាមុន ហើយរំលងជួរដែលមានបញ្ហា។ បន្ទាប់មកចុចប៊ូតុងនាំចូល ដើម្បីបង្កើតកិច្ចការទាំងអស់ក្នុងពេលតែមួយ។',
          'ចង់ប្តូរថ្ងៃកំណត់? ចុចលើថ្ងៃនោះ។ ចង់ប្តូរអ្នកទទួល? ចុច «ប្តូរអ្នកទទួល»។',
          'ពិនិត្យកិច្ចការដែលមានស្លាក «រង់ចាំត្រួតពិនិត្យ»៖ ចុច «អនុម័ត» ឬ «ស្នើសុំកែ» (ត្រូវសរសេរមូលហេតុ)។ មានច្រើន? ចុច «អនុម័តទាំងអស់»។ កិច្ចការដែលអនុម័តរួចត្រូវចាក់សោ។ បើត្រូវកែ សូមចុច «បើកឡើងវិញដើម្បីកែ»។',
          'ចង់កែចំណងជើង ពិពណ៌នា ប្រភេទ ឬភាពសំខាន់? ចុចរូបខ្មៅដៃលើកាតកិច្ចការ។ កិច្ចការរួមនឹងប្តូរសម្រាប់មនុស្សគ្រប់គ្នា។ ចុចរូបអំពូលក្នុងទំព័រកិច្ចការ ដើម្បីមើល «របៀបដំណើរការកិច្ចការ»។',
          'បើកទំព័រ «របាយការណ៍» រួចចុច «បោះពុម្ព / PDF» ដើម្បីបានសេចក្តីសង្ខេបសម្រាប់បង្ហាញគ្រូ។',
        ],
      },
      {
        id: 'help',
        title: 'សំណួរញឹកញាប់',
        faq: [
          { q: 'ភ្លេចពាក្យសម្ងាត់?', a: 'សូមប្រាប់ប្រធានក្រុម។ គាត់នឹងបង្កើតពាក្យសម្ងាត់បណ្តោះអាសន្នថ្មីឱ្យអ្នក។' },
          { q: 'ចូលគណនីមិនបាន?', a: 'សូមពិនិត្យអ៊ីមែល ឬឈ្មោះអ្នកប្រើ និងពាក្យសម្ងាត់ (ប្រយ័ត្នអក្សរធំ និងអក្សរតូចក្នុងពាក្យសម្ងាត់)។ បើនៅតែមិនបាន សូមប្រាប់ប្រធានក្រុម។' },
          { q: 'មិនអាចសរសេរ ឬកែអ្វីទេ?', a: 'អ្នកប្រហែលជា «អ្នកមើល» ដែលអានបានតែប៉ុណ្ណោះ។ ឬកញ្ចប់របស់ប្រធានក្រុមបានផុតកំណត់ ដូច្នេះក្រុមមើលបានតែប៉ុណ្ណោះ។' },
          { q: 'ToDo ត្រូវបានអនុម័តហើយ តែចង់កែ?', a: 'សូមប្រាប់ប្រធានក្រុម។ គាត់ត្រូវចុច «បើកឡើងវិញដើម្បីកែ» ជាមុន អ្នកទើបកែបាន។' },
          { q: 'ភាគរយរបស់ ToDo ខុស?', a: 'សូមសរសេរ «- 80%» នៅចុងបន្ទាត់ ហើយមើល «មើលជាមុន» មុនបង្ហោះ។' },
          { q: 'មិនទទួលសារ Telegram?', a: 'សូមពិនិត្យថា «ការកំណត់ផ្ទាល់ខ្លួន» បង្ហាញ «បានភ្ជាប់»។ ប្រសិនបើអ្នកបាន block bot សូមលែង block រួចភ្ជាប់ម្តងទៀត។' },
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
        intro: 'You can start in 4 simple steps.',
        steps: [
          'Log in with your email or username and the password your leader gave you.',
          'The first time, the app asks you to change your password. Choose a new one that you can remember.',
          'To change the language, tap the flag at the top right and pick "ខ្មែរ" or "English". The button next to it switches between light and dark mode.',
          'Have a group code? Tap "Join a Group" and enter it. If not, wait for your leader to add you.',
        ],
        tips: [
          'Tap the eye in a password box to see what you typed.',
          'Want a different picture? Tap your name at the bottom left, then tap "Change avatar". There are 30 to choose from, including Khmer people through the ages, from the Funan kingdom and Angkor to today.',
          'Tired of typing a long email? Tap your name at the bottom left, open "My settings", and set a short "Username" (for example sopheak). Next time you can log in with it instead of your email. It cannot be the same as anyone else\'s.',
        ],
      },
      {
        id: 'daily',
        title: 'Write your daily ToDo',
        intro: 'A ToDo tells your team what you are doing today. Write it in the one box on the "Overview" or "Daily ToDo" page.',
        steps: [
          'Write a "main point" on its own line, without "-". It can be a project name or one part of a project.',
          'Under it, write the small things to tick. Start each one with "-", one per line.',
          'Do not want a main point? Write only "-" lines. Each line becomes a task you can tick.',
          'One project with several parts? Add more main points. The tasks under each main point are grouped together.',
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
            why: 'Write one task per line, so each one can be ticked and counted.',
          },
        ],
        tips: ['Numbers like "1." and "2." are read as tasks too.', 'The percent of a ToDo is the average of all its tasks (a finished task counts as 100%).'],
      },
      {
        id: 'fix',
        title: 'Made a mistake? You can edit it',
        intro: 'You can edit a ToDo after you post it. There is no need to delete it and write it again.',
        steps: [
          'Tap the pencil at the top right of your ToDo (on the "Daily ToDo" page).',
          'Change the text, check the "Preview", then tap "Save".',
          'Tasks you already ticked stay ticked if their text does not change.',
          'Want to tick or untick a task? Tap it in the list.',
          'When every task is ticked, the ToDo is marked as done automatically. Or tap "Mark as done" so your leader can review it.',
        ],
        tips: [
          'Once your leader approves a ToDo, it is locked and nobody can edit it. If a change is needed, a leader can tap "Reopen to edit".',
          'Want to remove it completely? Tap the bin.',
        ],
      },
      {
        id: 'tasks',
        title: 'Tasks given to you',
        intro: 'Your leader gives you tasks, and you tell the team how far you are.',
        steps: [
          'Open "Tasks" to see your tasks and their due dates.',
          'Tap "Start" when you begin.',
          'Drag the "Progress" bar or tap 25%, 50% or 75%. It saves by itself, so there is no save button.',
          'Finished? Tap "Done" (100%) or "Done, send for review". The task then waits for your leader.',
          'If it is right, your leader approves it and it is locked. If not, they tap "Request changes" and give a reason. The task goes back to "In progress" and you get a notification. Fix it and send it again.',
        ],
        tips: [
          'Red means overdue. To ask a question, write a comment on the task.',
          'Want to know what to do today? The "Overview" page has a "Today" row that shows how many tasks are "Just me", "With my team" and "Overdue". Tap one to open the Tasks page already filtered.',
          'The "Tasks" and "Daily ToDo" pages have the same filters: All or Just me, Any time, Today or Dates, and status. On the Tasks page, "More filters" holds the member, category and sort order.',
          'Long description? Tap "Show more" under the task to read all of it.',
        ],
      },
      {
        id: 'team',
        title: 'Team tasks (for everyone)',
        intro: 'One task that every member must do, for example "Install the software".',
        steps: [
          'When creating the task, the leader picks "Everyone" or "Choose".',
          "One card shows the team's progress (the average) and each person's part.",
          "You can move only your own progress. A leader can change everyone's.",
          'Tap "View as individual tasks" to see each person\'s notes, comments and due date.',
        ],
      },
      {
        id: 'talk',
        title: 'Comments and reactions',
        steps: [
          'Tap "Comments" under a task or ToDo and type in the box. Tap the arrow on the right (or press Ctrl+Enter) to send.',
          "You can edit or delete your own comments. A leader can delete other people's comments but cannot edit them.",
          'Tap the smiley next to a ToDo to react. Tap it again to remove your reaction.',
          'The bell at the top tells you about new tasks and comments. When you read a notification, it leaves the list, so the list shows only what you have not read yet.',
        ],
      },
      {
        id: 'streak',
        title: 'Streaks and pokes',
        intro: 'A streak is the number of days in a row that you posted your daily ToDo. It helps you build a good habit, and your team can see who is working hard.',
        steps: [
          'Post a ToDo at least once a day (Cambodia time). That day counts and your streak grows by one day.',
          'Your streak shows on the post box (🔥 5-day streak). The team ranking is on the "Overview" page.',
          'If you miss one whole day, the streak goes back to 0. But while today is still open, you can post to keep it.',
          'See someone who has not posted today? Tap "Poke" next to their name. They get a notification (and a Telegram message if they connected it).',
          'You can poke the same person once a day. When they post, the Poke button goes away.',
          'Want notifications in Telegram? Tap "Connect Telegram" on the ranking card (or in "My settings"), then press Start in Telegram once. This works only when the server has a bot set up.',
          'After you connect, you get pokes and the same notifications as the bell (new tasks, approvals, comments), in the language you use in the app. Want pokes only? Untick "Send my other notifications here too".',
        ],
        tips: ['A streak counts the days you really posted. Viewers have no streak.'],
      },
      {
        id: 'leader',
        title: 'For team leaders',
        steps: [
          'Create a group, then tap "Add member". The temporary password is shown only once, so copy it right away.',
          'Assign work with "New task". Pick "One person", "Choose" or "Everyone".',
          'Many tasks? Tap "Import tasks" on the "Tasks" page, then paste a table from Google Sheets or Excel (or choose a CSV file). One row is one task.',
          'The table needs at least the columns Task title and Due date. The other columns (Module, Assign to, Members, Priority, Start date, Due time, Details) are optional. Tap "Download template" to get the right layout.',
          'The app shows a preview first and skips rows with problems. Then tap the import button to create all the tasks at once.',
          'Want to change a due date? Tap the date. Want to change who does the task? Tap "Reassign".',
          'Review tasks marked "Waiting for review": tap "Approve" or "Request changes" (a reason is required). Many at once? Tap "Approve all". Approved tasks are locked. If a change is needed, tap "Reopen to edit".',
          'Need to change a title, description, category or priority? Tap the pencil on the task card. A team task changes for everyone. Tap the light bulb on the Tasks page to read "How tasks work".',
          'Open "Report" and tap "Print / PDF" to get a summary to show your lecturer.',
        ],
      },
      {
        id: 'help',
        title: 'Common questions',
        faq: [
          { q: 'Forgot your password?', a: 'Tell your leader. They will create a new temporary password for you.' },
          { q: 'Cannot log in?', a: 'Check your email or username and your password (the password is case sensitive). If it still fails, tell your leader.' },
          { q: 'Cannot write or edit anything?', a: 'You may be a "viewer", who can only read. Or your leader\'s plan has ended, so the group is view only.' },
          { q: 'The ToDo is approved, but you want to change it?', a: 'Tell your leader. They must tap "Reopen to edit" first, then you can change it.' },
          { q: 'The percent of a ToDo is wrong?', a: 'Write "- 80%" at the end of the line and check the "Preview" before you post.' },
          { q: 'Not getting Telegram messages?', a: 'Check that "My settings" shows "Connected". If you blocked the bot, unblock it and connect again.' },
        ],
      },
    ],
  },
};
