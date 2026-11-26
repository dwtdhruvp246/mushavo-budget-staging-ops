# mushavo-budget-staging-ops

This repository runs the Mushavo Budget staging pilot. The app source is `dwtdhruvp246/mushavobudget`. The pilot catalog identifies the exact app commit and the checks it covers.

## Stage 3 / FR.3.3 / Staging offline pilot

Open **Actions → Mushavo staging offline pilot** to see the result, or use **Run workflow** on `main` to repeat it. Changes to the pilot on `main` start a run. GitHub also schedules the fixture checks nightly at 02:30 Zimbabwe time.

The pilot verifies the pinned source checkout and runs its staff-session and file-cleanup suites with synthetic fixtures in a network-isolated job. The run summary and `report.json` record the app commit, Node version, suite results, counts, and exit code. Suite output stays inside the runner. The published report uses a fixed set of fields suitable for a public repository.

The `pilot-history` branch stores one JSON record per completed run attempt under `runs/`. Each record includes the workflow commit, trigger, job result, and safe report. The Actions artifact remains available for 30 days.

| Work item | Evidence required |
| --- | --- |
| FR.3.3 offline pilot | A successful Actions run against the catalog commit. |
| Hosted Settings and owner-deletion checks | A reconciled staging build and test accounts, with results recorded in a private history. |
| Staging publication | A tested preview, compatible migrations, and a verified publication and recovery path. |
| Hosted schedules and agent follow-up | A verified hosted pilot, private evidence storage, and scoped credentials for each job. |

Update the catalog in Git when an approved source pin or test changes. Record the work item, reason, verification, and run link with each change. Keep credentials, detailed staging data, and browser traces in an access-controlled location.
