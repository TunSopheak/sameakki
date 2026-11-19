type Words = { defaultGroupDescription: string; reportGeneral: string };

// Old rows saved this English text when nothing was typed
const OLD_TASK_DESCRIPTION = 'Deliver specified module requirements.';
const OLD_GROUP_DESCRIPTION = 'Collaborative team workspace.';

/** A task with no description shows nothing, so cards are not filled with placeholder text. */
export const taskDescription = (description: string | undefined) => (!description || description === OLD_TASK_DESCRIPTION ? '' : description);

export const groupDescription = (description: string | undefined, t: Words) =>
  !description || description === OLD_GROUP_DESCRIPTION ? t.defaultGroupDescription : description;

export const moduleName = (module: string, t: Words) => (module === 'General' ? t.reportGeneral : module);
