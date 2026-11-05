import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDuration,
  loadTimeSummary,
  MAX_LISTED_TIME_TASKS,
  renderTimeSummaryHtml,
  renderTimeSummaryText,
} from '../../supabase/functions/notification-digest-runner/time-summary.ts';

const ME = 'user-me';
const OTHER = 'user-other';
const DAY = '2026-11-05';

// In-memory stand-in for the runner's Supabase queries; records each call.
function sources({ report, tasks, projects, memberships = [] }) {
  const calls = [];
  return {
    calls,
    fetchReport: async () => {
      calls.push(['report']);
      return report;
    },
    fetchTasks: async (ids) => {
      calls.push(['tasks', ids]);
      return tasks.filter((task) => ids.includes(task.id));
    },
    fetchProjects: async (ids) => {
      calls.push(['projects', ids]);
      return projects.filter((project) => ids.includes(project.id));
    },
    fetchAcceptedMemberships: async (ids) => {
      calls.push(['memberships', ids]);
      return memberships.filter((id) => ids.includes(id));
    },
  };
}

const project = (id, name, ancestorId = null, ownerId = ME) => ({
  id,
  name,
  ancestor_id: ancestorId,
  owner_id: ownerId,
});

test('durations read as hours and minutes', () => {
  assert.equal(formatDuration(0), '0 min');
  assert.equal(formatDuration(20), '<1 min');
  assert.equal(formatDuration(25 * 60), '25 min');
  assert.equal(formatDuration(2 * 3600), '2 h');
  assert.equal(formatDuration(85 * 60 + 10), '1 h 25 min');
});

test('the section is omitted when no time was logged', async () => {
  const empty = sources({ report: [], tasks: [], projects: [] });
  const summary = await loadTimeSummary(ME, DAY, empty);

  assert.equal(summary, null);
  assert.deepEqual(empty.calls, [['report']]);
  assert.equal(renderTimeSummaryHtml(summary), '');
  assert.equal(renderTimeSummaryText(summary), '');

  const zero = sources({
    report: [{ task_id: 't1', my_seconds: 0, everyone_seconds: 0 }],
    tasks: [{ id: 't1', name: 'Idle', project_id: null }],
    projects: [],
  });
  assert.equal(await loadTimeSummary(ME, DAY, zero), null);
});

test('subproject tasks roll up into the root project with both columns', async () => {
  const data = sources({
    report: [
      { task_id: 't-root', my_seconds: 1800, everyone_seconds: 1800 },
      // bigint values may arrive as strings
      { task_id: 't-deep', my_seconds: '600', everyone_seconds: '4500' },
      { task_id: 't-inbox', my_seconds: 300, everyone_seconds: 300 },
    ],
    tasks: [
      { id: 't-root', name: 'Plan release', project_id: 'p-root' },
      { id: 't-deep', name: 'Fix login', project_id: 'p-grandchild' },
      { id: 't-inbox', name: 'Call bank', project_id: null },
    ],
    projects: [
      project('p-root', 'Work'),
      project('p-child', 'Backend', 'p-root'),
      project('p-grandchild', 'Auth', 'p-child'),
    ],
  });

  const summary = await loadTimeSummary(ME, DAY, data);

  assert.equal(summary.mySeconds, 2700);
  assert.equal(summary.everyoneSeconds, 6600);
  assert.deepEqual(
    summary.groups.map((group) => [
      group.projectName,
      group.mySeconds,
      group.everyoneSeconds,
      group.tasks.map((task) => [task.name, task.subprojectName]),
    ]),
    [
      [
        'Work',
        2400,
        6300,
        [
          ['Fix login', 'Auth'],
          ['Plan release', null],
        ],
      ],
      [null, 300, 300, [['Call bank', null]]],
    ]
  );
  // One query per hierarchy level; all projects are owned, so no membership lookup.
  assert.deepEqual(data.calls, [
    ['report'],
    ['tasks', ['t-root', 't-deep', 't-inbox']],
    ['projects', ['p-root', 'p-grandchild']],
    ['projects', ['p-child']],
  ]);

  const html = renderTimeSummaryHtml(summary);
  assert.match(html, /<strong>Time worked today<\/strong><br>2026-11-05/);
  assert.match(html, /Me: 45 min &middot; Everyone: 1 h 50 min/);
  assert.match(html, />Me<\/th>/);
  assert.match(html, />Everyone<\/th>/);
  assert.match(
    html,
    /Fix login <span[^>]*>\(Auth\)<\/span><\/td><td[^>]*>10 min<\/td><td[^>]*>1 h 15 min<\/td>/
  );
  assert.match(html, />No project<\/td>/);

  const text = renderTimeSummaryText(summary);
  assert.match(
    text,
    /^Time worked today \(2026-11-05\):\nMe: 45 min, everyone: 1 h 50 min/
  );
  assert.match(text, /\nWork - me 40 min, everyone 1 h 45 min\n/);
  assert.match(
    text,
    /\n- Fix login \(Auth\): me 10 min, everyone 1 h 15 min\n/
  );
  assert.match(
    text,
    /\nNo project - me 5 min, everyone 5 min\n- Call bank: me 5 min/
  );
});

test('a shared subproject does not reveal its parent project to a member', async () => {
  const data = sources({
    report: [{ task_id: 't1', my_seconds: 0, everyone_seconds: 3600 }],
    tasks: [{ id: 't1', name: 'Design review', project_id: 'p-shared' }],
    projects: [
      project('p-secret', 'Secret parent', null, OTHER),
      project('p-shared', 'Shared board', 'p-secret', OTHER),
    ],
    memberships: ['p-shared'],
  });

  const summary = await loadTimeSummary(ME, DAY, data);

  assert.equal(summary.groups[0].projectName, 'Shared board');
  assert.equal(summary.groups[0].tasks[0].subprojectName, null);
  assert.equal(summary.mySeconds, 0);
  assert.doesNotMatch(renderTimeSummaryHtml(summary), /Secret parent/);
  assert.doesNotMatch(renderTimeSummaryText(summary), /Secret parent/);
  assert.match(
    renderTimeSummaryText(summary),
    /- Design review: me 0 min, everyone 1 h/
  );
});

test('names from collaborators are stripped of control and bidi characters and escaped', async () => {
  const malicious =
    '<img src=x onerror=alert(1)>‮gnp.exe\u0007\nBcc: x@evil.test';
  const summary = await loadTimeSummary(
    ME,
    DAY,
    sources({
      report: [{ task_id: 't1', my_seconds: 60, everyone_seconds: 120 }],
      tasks: [{ id: 't1', name: malicious, project_id: 'p1' }],
      projects: [project('p1', '"Team" ⁦& co⁩', null, OTHER)],
      memberships: ['p1'],
    })
  );

  const html = renderTimeSummaryHtml(summary);
  const text = renderTimeSummaryText(summary);
  for (const output of [html, text]) {
    assert.doesNotMatch(output, /[\u0000-\u0009\u000b-\u001f\u007f؜‎‏‪-‮⁦-⁩]/u);
  }
  assert.doesNotMatch(html, /<img/);
  assert.match(
    html,
    /&lt;img src=x onerror=alert\(1\)&gt;gnp\.exe  Bcc: x@evil\.test/
  );
  assert.match(html, /&quot;Team&quot; &amp; co/);
  // Each task stays on its own text line.
  assert.match(
    text,
    /\n- <img src=x onerror=alert\(1\)>gnp\.exe  Bcc: x@evil\.test: me 1 min, everyone 2 min$/
  );
});

test('long days list the largest tasks and count the rest in the totals', async () => {
  const count = MAX_LISTED_TIME_TASKS + 3;
  const ids = Array.from({ length: count }, (_, index) => `t${index}`);
  const summary = await loadTimeSummary(
    ME,
    DAY,
    sources({
      report: ids.map((id, index) => ({
        task_id: id,
        my_seconds: 60,
        everyone_seconds: 60 * (count - index),
      })),
      tasks: ids.map((id) => ({ id, name: id, project_id: null })),
      projects: [],
    })
  );

  assert.equal(summary.groups[0].tasks.length, MAX_LISTED_TIME_TASKS);
  assert.equal(summary.hiddenTaskCount, 3);
  assert.equal(summary.mySeconds, 60 * count);
  assert.match(
    renderTimeSummaryText(summary),
    /\n3 more tasks are not listed\.$/
  );
});
