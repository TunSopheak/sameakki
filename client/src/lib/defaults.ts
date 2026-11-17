type Words = { defaultTaskDescription: string; defaultGroupDescription: string; reportGeneral: string };

// Old rows saved this English text when nothing was typed
const OLD_TASK_DESCRIPTION = 'Deliver specified module requirements.';
const OLD_GROUP_DESCRIPTION = 'Collaborative team workspace.';

export const taskDescription = (description: string | undefined, t: Words) =>
  !description || description === OLD_TASK_DESCRIPTION ? t.defaultTaskDescription : description;

export const groupDescription = (description: string | undefined, t: Words) =>
  !description || description === OLD_GROUP_DESCRIPTION ? t.defaultGroupDescription : description;

export const moduleName = (module: string, t: Words) => (module === 'General' ? t.reportGeneral : module);
