const { extractOne } = require('./extract-one')

extractOne({
  src: 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/AddCandidatePage.tsx',
  destDir: 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/add-candidate',
  fnName: 'AddCandidatePage',
  fnLine: 36,
  handlerStart: 99,
  logicEnd: 316,
  propsType: 'AddCandidatePageProps',
  hookName: 'useAddCandidatePage',
  vmType: 'AddCandidateVm',
  stateImports: [
    "import { checkDuplicateSubmission } from '../../../data/submissionsStore'",
    "import { getSavedDrafts, SavedDraftItem } from '../../../data/savedDraftsStore'",
  ],
  handlerImports: [
    "import { Candidate } from '../../../types'",
    "import { getSavedDrafts, saveDraftItem, removeSavedDraft, SavedDraftItem } from '../../../data/savedDraftsStore'",
  ],
  viewImports: [],
  views: [
    { name: 'AddCandidateChrome', from: 319, to: 339, mode: 'block', imports: ["import { PageHeader } from '../../layout/PageHeader'"] },
    { name: 'AddCandidateParser', from: 341, to: 437, mode: 'block' },
    { name: 'AddCandidateBasic', from: 441, to: 618, mode: 'block' },
    { name: 'AddCandidateSkills', from: 620, to: 671, mode: 'block' },
    { name: 'AddCandidateExperience', from: 673, to: 763, mode: 'block' },
    { name: 'AddCandidateLocation', from: 765, to: 869, mode: 'block' },
    { name: 'AddCandidateActions', from: 871, to: 908, mode: 'block' },
    { name: 'AddCandidateDrafts', from: 912, to: 1024, mode: 'block' },
  ],
  composer: `  return (
    <div className="space-y-6 w-full pb-16 font-sans">
      <AddCandidateChrome vm={vm} />
      <AddCandidateParser vm={vm} />
      {vm.importMode !== 'drafts' && (
        <form onSubmit={vm.handleSubmit} className="space-y-6">
          <AddCandidateBasic vm={vm} />
          <AddCandidateSkills vm={vm} />
          <AddCandidateExperience vm={vm} />
          <AddCandidateLocation vm={vm} />
          <AddCandidateActions vm={vm} />
        </form>
      )}
      <AddCandidateDrafts vm={vm} />
    </div>
  )`,
})
