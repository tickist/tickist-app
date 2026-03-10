import {
  expect,
  type Locator,
  type Page,
  test,
  type TestInfo,
} from '@playwright/test';

function uniqueSuffix(testInfo: TestInfo): string {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${testInfo.project.name}-${Date.now()}-${randomPart}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function ensureAuthenticated(page: Page): Promise<void> {
  const email = process.env['E2E_AUTH_EMAIL'] ?? 'e2e-shared-user@tickist.dev';
  const password = process.env['E2E_AUTH_PASSWORD'] ?? 'Test1234!';

  await page.goto('/');

  const pathname = new URL(page.url()).pathname;
  if (pathname.startsWith('/app')) {
    await expect(page.getByPlaceholder(/Search tasks/)).toBeVisible();
    return;
  }

  await page.goto('/auth');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/app(?:\/|$)/, { timeout: 15000 });
  await expect(page.getByPlaceholder(/Search tasks/)).toBeVisible();
}

async function ensureActiveProjectsExpanded(page: Page): Promise<void> {
  const createButtons = page.locator('button.sidebar-create');
  if ((await createButtons.count()) > 0) {
    return;
  }

  await page
    .locator('button.sidebar-link')
    .filter({ hasText: /Active projects \(\d+\)/ })
    .first()
    .click();

  await expect(page.locator('button.sidebar-create').first()).toBeVisible();
}

async function openCreateProjectModal(page: Page): Promise<Locator> {
  await ensureActiveProjectsExpanded(page);
  await page.locator('button.sidebar-create').first().click();
  const composer = page.locator('app-project-composer');
  await expect(composer).toBeVisible();
  await expect(composer.getByLabel('Project name')).toBeVisible();
  await expectSharedSheetLayout(page, composer);
  return composer;
}

async function createProject(
  page: Page,
  name: string,
  description: string
): Promise<void> {
  const composer = await openCreateProjectModal(page);
  await composer.getByLabel('Project name').fill(name);
  await composer
    .getByRole('textbox', { name: 'Description' })
    .fill(description);
  await composer.getByRole('button', { name: 'Save project' }).click();
  await expect(page.locator('app-project-composer')).toHaveCount(0);
}

async function selectInbox(page: Page): Promise<void> {
  await page
    .locator('aside')
    .getByRole('button', { name: /Inbox \(\d+\)/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/app\/tasks\/[^/?#]+/);
}

async function selectProjectByName(
  page: Page,
  projectName: string
): Promise<void> {
  const projectButton = page
    .locator('button.sidebar-subitem')
    .filter({
      has: page.locator('.project-name', { hasText: projectName }),
    })
    .first();

  await expect(projectButton).toBeVisible();
  await projectButton.click();
  await expect(page).toHaveURL(/\/app\/tasks\/[^/?#]+/);
  await expect(page.locator('header.project-header h1')).toHaveText(
    projectName
  );
}

async function openTaskComposer(page: Page): Promise<void> {
  await page.locator('button.fab-main').click();
  const composer = page.locator('app-task-composer');
  await expect(page.getByLabel('Task name')).toBeVisible();
  await expectSharedSheetLayout(page, composer);
}

async function expectSharedSheetLayout(
  page: Page,
  host: Locator
): Promise<void> {
  const sheet = host.locator('.sheet-shell');
  await expect(sheet).toBeVisible();
  await expect(host.locator('.sheet-shell__panel-scroll')).toBeVisible();
  await expect(host.locator('.sheet-shell__footer')).toHaveCount(1);

  const viewport = page.viewportSize();
  const box = await sheet.boundingBox();
  if (!viewport || !box) {
    throw new Error('Shared sheet layout could not be measured.');
  }

  expect(box.x + box.width / 2).toBeGreaterThan(viewport.width / 2);

  const backgroundColor = await sheet.evaluate(
    (node) => window.getComputedStyle(node).backgroundColor
  );
  expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
}

async function setProjectFilter(
  page: Page,
  label: 'all tasks' | 'done' | 'not done'
): Promise<void> {
  const filterButton = page.locator('button[title="Filter"]').first();
  await filterButton.click();
  const exactLabel = new RegExp(`^\\s*${escapeRegExp(label)}\\s*$`);
  const option = page
    .locator('button.filter-option')
    .filter({ hasText: exactLabel })
    .first();
  await expect(option).toBeVisible();
  await option.click();
  await expect(option).toHaveAttribute('aria-pressed', 'true');

  // DaisyUI dropdown can stay open via :focus-within; blur and move focus outside.
  await page.evaluate(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      active.blur();
    }
  });
  await page.locator('header.project-header h1').first().click();
}

async function inboxCount(page: Page): Promise<number> {
  const text = await page
    .locator('aside')
    .getByRole('button', { name: /Inbox \(\d+\)/ })
    .first()
    .innerText();
  const match = text.match(/\((\d+)\)/);
  if (!match) {
    throw new Error(`Cannot parse Inbox count from: ${text}`);
  }
  return Number(match[1]);
}

function taskCardByName(page: Page, taskName: string) {
  return page
    .locator('article.task-card')
    .filter({ hasText: taskName })
    .first();
}

async function openTaskMenu(taskCard: ReturnType<typeof taskCardByName>) {
  await taskCard.locator('button[title="More actions"]').click();
  const menu = taskCard.locator('.task-menu');
  await expect(menu).toBeVisible();
  return menu;
}

async function openProjectContextMenu(page: Page, projectName: string) {
  const row = page
    .locator('li.sidebar-project')
    .filter({
      has: page.locator('.project-name', { hasText: projectName }),
    })
    .first();
  await expect(row).toBeVisible();
  await row.hover();

  const trigger = row.locator('button.options-trigger');
  await expect(trigger).toBeVisible();
  await trigger.click();

  const menu = page.locator('.project-menu.project-menu--overlay');
  await expect(menu).toBeVisible();
  return menu;
}

test('adds task to inbox and keeps it after reload', async ({
  page,
}, testInfo) => {
  const taskName = `Inbox task ${uniqueSuffix(testInfo)}`;

  await ensureAuthenticated(page);
  await selectInbox(page);

  const initialCount = await inboxCount(page);

  await openTaskComposer(page);
  await page.getByLabel('Task name').fill(taskName);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('app-task-composer')).toHaveCount(0);
  await expect(taskCardByName(page, taskName)).toBeVisible();
  await expect.poll(() => inboxCount(page)).toBe(initialCount + 1);

  await page.reload();
  await selectInbox(page);
  await expect(taskCardByName(page, taskName)).toBeVisible();
});

test('creates project and adds a task into that project', async ({
  page,
}, testInfo) => {
  const projectName = `Project ${uniqueSuffix(testInfo)}`;
  const projectDescription = `Description ${uniqueSuffix(testInfo)}`;
  const taskName = `Project task ${uniqueSuffix(testInfo)}`;

  await ensureAuthenticated(page);
  await createProject(page, projectName, projectDescription);
  await selectProjectByName(page, projectName);

  await page.getByPlaceholder('What needs doing?').fill(taskName);
  await page.getByRole('button', { name: 'Add task' }).click();
  await expect(taskCardByName(page, taskName)).toBeVisible();

  await page.reload();
  await selectProjectByName(page, projectName);
  await expect(taskCardByName(page, taskName)).toBeVisible();
});

test('creates task, edits it via task menu and marks done', async ({
  page,
}, testInfo) => {
  const projectName = `Project ${uniqueSuffix(testInfo)}`;
  const taskName = `Editable task ${uniqueSuffix(testInfo)}`;
  const description = `Updated description ${uniqueSuffix(testInfo)}`;

  await ensureAuthenticated(page);
  await createProject(page, projectName, `Project for ${taskName}`);
  await selectProjectByName(page, projectName);

  await page.getByPlaceholder('What needs doing?').fill(taskName);
  await page.getByRole('button', { name: 'Add task' }).click();

  const card = taskCardByName(page, taskName);
  await expect(card).toBeVisible();

  let menu = await openTaskMenu(card);
  await menu.getByRole('button', { name: 'A', exact: true }).click();

  menu = await openTaskMenu(card);
  await menu.getByRole('button', { name: /Next action/ }).click();

  menu = await openTaskMenu(card);
  await menu.getByRole('button', { name: 'Do it today' }).click();

  await card.getByTestId('task-toolbar-description').click();
  const descriptionPanel = card.locator('.task-card__panel--description');
  await descriptionPanel.getByRole('button', { name: 'Add' }).click();
  await descriptionPanel.locator('textarea').fill(description);
  await descriptionPanel.getByRole('button', { name: 'Save' }).click();

  await expect(card.locator('.task-card__task-type')).toContainText(
    'Next action'
  );
  await expect(card.locator('.task-card__date')).toBeVisible();
  await expect(card.locator('.description-content')).toContainText(description);

  await setProjectFilter(page, 'all tasks');
  const doneToggle = card.locator('.task-card__check input[type="checkbox"]');
  await doneToggle.click();
  await expect(doneToggle).toBeChecked();
  await expect(card).toHaveClass(/completed/);

  await page.reload();
  await selectProjectByName(page, projectName);
  await setProjectFilter(page, 'done');
  await expect(taskCardByName(page, taskName)).toBeVisible();
});

test('creates project, edits it from project menu and persists changes', async ({
  page,
}, testInfo) => {
  const baseName = `Project ${uniqueSuffix(testInfo)}`;
  const updatedName = `${baseName} Edited`;
  const initialDescription = `Initial ${uniqueSuffix(testInfo)}`;
  const updatedDescription = `Updated ${uniqueSuffix(testInfo)}`;

  await ensureAuthenticated(page);
  await createProject(page, baseName, initialDescription);
  await selectProjectByName(page, baseName);

  const menu = await openProjectContextMenu(page, baseName);
  await menu.getByRole('button', { name: 'Edit' }).click();

  const composer = page.locator('app-project-composer');
  await expect(composer.getByLabel('Project name')).toBeVisible();
  await composer.getByLabel('Project name').fill(updatedName);
  await composer
    .getByRole('textbox', { name: 'Description' })
    .fill(updatedDescription);
  await composer.getByRole('button', { name: 'Save project' }).click();
  await expect(page.locator('app-project-composer')).toHaveCount(0);

  await expect(page.locator('header.project-header h1')).toHaveText(
    updatedName
  );
  await expect(page.locator('.project-desc')).toContainText(updatedDescription);
  await expect(
    page
      .locator('button.sidebar-subitem')
      .filter({
        has: page.locator('.project-name', { hasText: updatedName }),
      })
      .first()
  ).toBeVisible();

  await page.getByRole('button', { name: 'Dashboard' }).click();
  await selectProjectByName(page, updatedName);
  await expect(page.locator('.project-desc')).toContainText(updatedDescription);

  await page.reload();
  await selectProjectByName(page, updatedName);
  await expect(page.locator('.project-desc')).toContainText(updatedDescription);
});

test('keeps shared sheet tabs scrollable on mobile viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ensureAuthenticated(page);
  await page.goto('/app/settings');

  const settings = page.locator('app-settings');
  const tabs = settings.locator('.sheet-shell__tabs');

  await expectSharedSheetLayout(page, settings);
  await expect(tabs).toBeVisible();

  const metrics = await tabs.evaluate((node) => ({
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }));

  expect(metrics.scrollWidth).toBeGreaterThanOrEqual(metrics.clientWidth);
});
