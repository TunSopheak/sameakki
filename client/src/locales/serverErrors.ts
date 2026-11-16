// The server answers in English. This turns its messages into Khmer for the screen.
// A message that is not listed here stays as it is.

export const SERVER_ERRORS_KM: Record<string, string> = {
  // Permissions
  'Only a Super Admin can do that.': 'មានតែ Super Admin ប៉ុណ្ណោះដែលអាចធ្វើបាន។',
  'Only a Super Admin or the group leader can add members.': 'មានតែ Super Admin ឬប្រធានក្រុមប៉ុណ្ណោះដែលអាចបន្ថែមសមាជិកបាន។',
  'Only a Super Admin or the group leader can edit the group.': 'មានតែ Super Admin ឬប្រធានក្រុមប៉ុណ្ណោះដែលអាចកែក្រុមបាន។',
  'Only a Super Admin or the group leader can remove other members.': 'មានតែ Super Admin ឬប្រធានក្រុមប៉ុណ្ណោះដែលអាចដកសមាជិកផ្សេងចេញបាន។',
  'Only a Super Admin or a Team Leader can create a group.': 'មានតែ Super Admin ឬប្រធានក្រុមប៉ុណ្ណោះដែលអាចបង្កើតក្រុមបាន។',
  'Only a Super Admin can create a Team Leader.': 'មានតែ Super Admin ប៉ុណ្ណោះដែលអាចបង្កើតប្រធានក្រុមបាន។',
  'Only team leads can assign tasks.': 'មានតែប្រធានក្រុមប៉ុណ្ណោះដែលអាចចាត់តាំងកិច្ចការបាន។',
  'Only team leads can reassign tasks.': 'មានតែប្រធានក្រុមប៉ុណ្ណោះដែលអាចប្តូរអ្នកទទួលកិច្ចការបាន។',
  'An approved task cannot be reassigned.': 'កិច្ចការដែលបានអនុម័តរួចមិនអាចប្តូរអ្នកទទួលបានទេ។',
  'Only team leads can approve tasks.': 'មានតែប្រធានក្រុមប៉ុណ្ណោះដែលអាចអនុម័តកិច្ចការបាន។',
  'Only team leads can delete tasks.': 'មានតែប្រធានក្រុមប៉ុណ្ណោះដែលអាចលុបកិច្ចការបាន។',
  'Only team leads can change task deadlines.': 'មានតែប្រធានក្រុមប៉ុណ្ណោះដែលអាចកែកាលកំណត់កិច្ចការបាន។',
  'Only team leads can change the schedule.': 'មានតែប្រធានក្រុមប៉ុណ្ណោះដែលអាចកែកាលវិភាគបាន។',
  'Only team leads can approve daily updates.': 'មានតែប្រធានក្រុមប៉ុណ្ណោះដែលអាចអនុម័ត ToDo ប្រចាំថ្ងៃបាន។',
  'Only the assignee or a team lead can update this task.': 'មានតែអ្នកទទួលកិច្ចការ ឬប្រធានក្រុមប៉ុណ្ណោះដែលអាចកែកិច្ចការនេះបាន។',
  'Only the author can update this checklist.': 'មានតែអ្នកសរសេរប៉ុណ្ណោះដែលអាចកែ checklist នេះបាន។',
  'Only the author can complete this update.': 'មានតែអ្នកសរសេរប៉ុណ្ណោះដែលអាចបញ្ជាក់ថាបានធ្វើរួច។',
  'Only the author or a team lead can delete this update.': 'មានតែអ្នកសរសេរ ឬប្រធានក្រុមប៉ុណ្ណោះដែលអាចលុប ToDo នេះបាន។',
  'Only the group leader can allow Admin support access.': 'មានតែប្រធានក្រុមប៉ុណ្ណោះដែលអាចអនុញ្ញាតឱ្យ Admin ជួយក្រុមបាន។',
  'This group is view-only right now.': 'ក្រុមនេះអាចមើលបានតែប៉ុណ្ណោះនៅពេលនេះ។',
  'Viewers cannot comment.': 'អ្នកមើលតែប៉ុណ្ណោះ (Viewer) មិនអាចបញ្ចេញមតិបានទេ។',
  'Viewers cannot post daily updates.': 'អ្នកមើលតែប៉ុណ្ណោះ (Viewer) មិនអាចផ្សព្វផ្សាយ ToDo ប្រចាំថ្ងៃបានទេ។',
  'Viewers cannot react.': 'អ្នកមើលតែប៉ុណ្ណោះ (Viewer) មិនអាចឆ្លើយតបដោយ emoji បានទេ។',
  'You can only delete your own comments.': 'អ្នកអាចលុបបានតែមតិរបស់ខ្លួនឯងប៉ុណ្ណោះ។',
  'You can only reset the password of accounts you created.': 'អ្នកអាចកំណត់ពាក្យសម្ងាត់ឡើងវិញបានតែគណនីដែលអ្នកបង្កើតប៉ុណ្ណោះ។',
  'You do not have permission to do that.': 'អ្នកគ្មានសិទ្ធិធ្វើសកម្មភាពនេះទេ។',

  // Tasks and daily updates
  'The assignee must be a member of this group.': 'អ្នកទទួលកិច្ចការត្រូវជាសមាជិកក្រុមនេះ។',
  'Viewers cannot be assigned tasks.': 'មិនអាចចាត់តាំងកិច្ចការជូនអ្នកមើលតែប៉ុណ្ណោះ (Viewer) បានទេ។',
  'This person already has a copy of this team task.': 'សមាជិកនេះមានកិច្ចការរួមនេះរួចហើយ។',
  'This group has no members to assign.': 'ក្រុមនេះមិនមានសមាជិកសម្រាប់ចាត់តាំងកិច្ចការទេ។',
  'Choose who to assign the task to.': 'សូមជ្រើសរើសអ្នកទទួលកិច្ចការ។',
  'Only a task that is ready for review can be approved.': 'អនុម័តបានតែកិច្ចការដែលកំពុងរង់ចាំត្រួតពិនិត្យប៉ុណ្ណោះ។',
  'This task is already approved.': 'កិច្ចការនេះត្រូវបានអនុម័តរួចហើយ។',
  'This task has already been approved.': 'កិច្ចការនេះត្រូវបានអនុម័តរួចហើយ។',
  'This update is already approved.': 'ToDo នេះត្រូវបានអនុម័តរួចហើយ។',
  'This update has already been approved.': 'ToDo នេះត្រូវបានអនុម័តរួចហើយ។',
  'The update must be marked as done before it can be approved.': 'ត្រូវបញ្ជាក់ថាបានធ្វើរួចជាមុនសិន ទើបអាចអនុម័តបាន។',
  'The start date cannot be after the due date.': 'ថ្ងៃចាប់ផ្តើមមិនអាចក្រោយថ្ងៃកំណត់បានទេ។',
  'Write something first.': 'សូមសរសេរអ្វីមួយជាមុន។',

  // Groups and members
  'The group leader cannot leave or be removed from the group.': 'ប្រធានក្រុមមិនអាចចាកចេញ ឬត្រូវដកចេញពីក្រុមបានទេ។',
  'This group is archived and no longer accepts members.': 'ក្រុមនេះត្រូវបានរក្សាទុក (archived) ហើយលែងទទួលសមាជិកថ្មីទេ។',
  'You are already a member of this group.': 'អ្នកជាសមាជិកក្រុមនេះរួចហើយ។',
  'That user is not a member of this group.': 'អ្នកប្រើប្រាស់នោះមិនមែនជាសមាជិកក្រុមនេះទេ។',
  'No group matches that code.': 'គ្មានក្រុមណាត្រូវនឹងលេខកូដនេះទេ។',
  'This email cannot be added. Ask the person to join with the group code.': 'មិនអាចបន្ថែមអ៊ីមែលនេះបានទេ។ សូមឱ្យអ្នកនោះចូលក្រុមតាមលេខកូដក្រុម។',
  'Nothing to update.': 'គ្មានអ្វីត្រូវកែប្រែទេ។',

  // Accounts
  'You cannot change your own role.': 'អ្នកមិនអាចប្តូរតួនាទីរបស់ខ្លួនឯងបានទេ។',
  'There is only one Super Admin.': 'មាន Super Admin តែម្នាក់គត់។',
  'A Super Admin cannot be deleted.': 'មិនអាចលុប Super Admin បានទេ។',
  'A Super Admin has no plan.': 'Super Admin មិនមានផែនការប្រើប្រាស់ទេ។',
  'An account with this email already exists.': 'មានគណនីប្រើអ៊ីមែលនេះរួចហើយ។',
  'That username is already taken.': 'ឈ្មោះអ្នកប្រើនេះមានគេប្រើរួចហើយ។',
  'The Super Admin password cannot be reset here.': 'មិនអាចកំណត់ពាក្យសម្ងាត់ Super Admin ឡើងវិញនៅទីនេះបានទេ។',
  'Use "Change password" in your own settings.': 'សូមប្រើ "ប្តូរពាក្យសម្ងាត់" ក្នុងការកំណត់របស់អ្នក។',
  'Incorrect email/username or password.': 'អ៊ីមែល/ឈ្មោះអ្នកប្រើ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ។',
  'Current password is incorrect.': 'ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវ។',
  'Choose a different password from the current one.': 'សូមជ្រើសពាក្យសម្ងាត់ផ្សេងពីពាក្យសម្ងាត់បច្ចុប្បន្ន។',
  'Your session has expired. Please sign in again.': 'សម័យប្រើប្រាស់បានផុតកំណត់ សូមចូលគណនីម្តងទៀត។',
  'Please sign in to continue.': 'សូមចូលគណនីដើម្បីបន្ត។',
  'Too many attempts. Please wait a few minutes and try again.': 'ព្យាយាមច្រើនដងពេក សូមរង់ចាំបន្តិច រួចសាកល្បងម្តងទៀត។',
  'Your account has expired, so it is view-only. Please contact the admin on Telegram to renew it.':
    'គណនីរបស់អ្នកបានផុតកំណត់ ដូច្នេះអាចមើលបានតែប៉ុណ្ណោះ។ សូមទាក់ទង Admin តាម Telegram ដើម្បីបន្តសុពលភាព។',

  // Not found
  'Task not found.': 'រកមិនឃើញកិច្ចការនេះទេ។',
  'Group not found.': 'រកមិនឃើញក្រុមនេះទេ។',
  'Daily update not found.': 'រកមិនឃើញ ToDo ប្រចាំថ្ងៃនេះទេ។',
  'Comment not found.': 'រកមិនឃើញមតិនេះទេ។',
  'Checklist item not found.': 'រកមិនឃើញធាតុ checklist នេះទេ។',
  'Notification not found.': 'រកមិនឃើញការជូនដំណឹងនេះទេ។',
  'User not found.': 'រកមិនឃើញអ្នកប្រើប្រាស់នេះទេ។',
  'Not found.': 'រកមិនឃើញទេ។',

  // General
  'Cannot reach the server. Check your connection and try again.': 'មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ។ សូមពិនិត្យអ៊ីនធឺណិត រួចសាកល្បងម្តងទៀត។',
  'Internal server error.': 'ម៉ាស៊ីនមេមានបញ្ហា។ សូមសាកល្បងម្តងទៀត។',
  'Invalid request.': 'សំណើមិនត្រឹមត្រូវ។',
  'A record with the same unique value already exists.': 'ទិន្នន័យដូចគ្នានេះមានរួចហើយ។',
  'A sponsor needs a name.': 'អ្នកឧបត្ថម្ភត្រូវមានឈ្មោះ។',
  'must be a real date': 'ត្រូវជាកាលបរិច្ឆេទពិតប្រាកដ',
  'must be a date (YYYY-MM-DD)': 'ត្រូវជាកាលបរិច្ឆេទ (YYYY-MM-DD)',
  'must be a time (HH:mm)': 'ត្រូវជាម៉ោង (HH:mm)',
};

// Messages that carry a value
const PATTERNS: [RegExp, (...m: string[]) => string][] = [
  [/^Group code "(.+)" is already in use\.$/, (_, code) => `លេខកូដក្រុម "${code}" មានគេប្រើរួចហើយ។`],
  [
    /^This group has reached its limit of (\d+) members\./,
    (_, n) => `ក្រុមនេះមានសមាជិកគ្រប់ចំនួនកំណត់ ${n} នាក់ហើយ។ សូមទាក់ទង Admin តាម Telegram ដើម្បីដំឡើងកម្រិត។`,
  ],
  [
    /^Your account has expired and the (\d+)-day view-only period has ended\./,
    (_, n) => `គណនីរបស់អ្នកបានផុតកំណត់ ហើយរយៈពេលមើលតែប៉ុណ្ណោះ ${n} ថ្ងៃក៏បានបញ្ចប់ដែរ។ សូមទាក់ទង Admin តាម Telegram ដើម្បីបន្តសុពលភាព។`,
  ],
];

const storedLanguage = () => {
  try {
    return localStorage.getItem('leadersync_language') === 'en' ? 'en' : 'km';
  } catch {
    return 'km';
  }
};

export function localizeError(message: string, language: string = storedLanguage()): string {
  if (language === 'en') return message;

  const known = SERVER_ERRORS_KM[message];
  if (known) return known;

  for (const [pattern, build] of PATTERNS) {
    const match = message.match(pattern);
    if (match) return build(...match);
  }

  // Checks on a field arrive as "field: reason"
  const field = message.match(/^([\w.]+): (.+)$/);
  if (field && SERVER_ERRORS_KM[field[2]]) return SERVER_ERRORS_KM[field[2]];

  return message;
}
