import { McpServer, type CallToolResult } from '@modelcontextprotocol/server';
import { z } from 'zod';

import {
  TickistDataAccess,
  type TickistConnection,
} from '@tickist/data-access-tickist';
import { toolError, toolResult } from './result';

type ToolFields = NonNullable<Parameters<typeof z.object>[0]>;

const Empty = z.object({});

const Uuid = z.string().uuid();

const Priority = z.enum(['A', 'B', 'C', 'normal']);

const Repeat = z.object({
  interval_days: z.number().int().positive(),
  from: z.enum(['completion_date', 'due_date']),
});

function operation<T extends ToolFields, Result>(
  server: McpServer,
  name: string,
  description: string,
  schema: z.ZodObject<T>,
  requiredScope: string | readonly string[],
  grantedScopes: readonly string[],
  handler: (input: z.output<z.ZodObject<T>>) => Promise<Result>,
  readOnly = true
): void {
  server.registerTool(
    name,
    {
      description,
      inputSchema: schema,
      annotations: {
        readOnlyHint: readOnly,
        destructiveHint: name === 'delete_task' || name === 'delete_project',
        idempotentHint:
          readOnly || name === 'suspend_task' || name === 'resume_task',
        openWorldHint: false,
      },
    },
    async (input): Promise<CallToolResult> => {
      try {
        const requiredScopes = Array.isArray(requiredScope)
          ? requiredScope
          : [requiredScope];

        const missingScopes = requiredScopes.filter(
          (scope) => !grantedScopes.includes(scope)
        );

        if (missingScopes.length > 0) {
          throw new Error(
            `Missing required scope${
              missingScopes.length === 1 ? '' : 's'
            }: ${missingScopes.join(', ')}.`
          );
        }

        return toolResult(await handler(schema.parse(input)));
      } catch (error) {
        return toolError(error);
      }
    }
  );
}

export function createTickistMcpServer(
  connection: TickistConnection
): McpServer {
  const access = new TickistDataAccess(connection);

  const server = new McpServer(
    { name: 'tickist-mcp', version: '2.0.0' },
    {
      capabilities: { tools: {} },
      instructions:
        "Manage the authenticated Tickist user's projects, tasks, and tags.",
    }
  );

  operation(
    server,
    'list_projects',
    'List all projects accessible to the authenticated user.',
    z.object({
      is_active: z.boolean().optional(),
      ancestor_id: Uuid.nullable().optional(),
    }),
    'projects:read',
    connection.scopes,
    (input) => access.listProjects(input)
  );
  operation(
    server,
    'list_workspaces',
    "List the authenticated user's workspaces.",
    Empty,
    'projects:read',
    connection.scopes,
    () => access.listWorkspaces()
  );
  operation(
    server,
    'get_project',
    'Get a single accessible project by its ID.',
    z.object({ project_id: Uuid }),
    'projects:read',
    connection.scopes,
    ({ project_id }) => access.getProject(project_id)
  );
  operation(
    server,
    'create_project',
    'Create a new project.',
    z.object({
      name: z.string().trim().min(1),
      description: z.string().optional(),
      color: z.string().optional(),
      icon: z.string().optional(),
      workspace_id: Uuid.optional(),
      ancestor_id: Uuid.nullable().optional(),
    }),
    'projects:write',
    connection.scopes,
    (input) => access.createProject(input),
    false
  );
  operation(
    server,
    'update_project',
    'Update an existing owned project.',
    z
      .object({
        project_id: Uuid,
        name: z.string().trim().min(1).optional(),
        description: z.string().optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
        workspace_id: Uuid.optional(),
        is_active: z.boolean().optional(),
        ancestor_id: Uuid.nullable().optional(),
      })
      .refine((value) =>
        Object.entries(value).some(
          ([key, field]) => key !== 'project_id' && field !== undefined
        )
      ),
    'projects:write',
    connection.scopes,
    ({ project_id, ...changes }) => access.updateProject(project_id, changes),
    false
  );
  operation(
    server,
    'delete_project',
    'Permanently delete an owned non-Inbox project. Tasks become unattached and direct children become root projects.',
    z.object({ project_id: Uuid }),
    'projects:write',
    connection.scopes,
    ({ project_id }) => access.deleteProject(project_id),
    false
  );

  operation(
    server,
    'list_tasks',
    'List accessible tasks with optional project, descendant-project, state, priority, and limit filters.',
    z.object({
      project_id: Uuid.optional(),
      include_descendants: z.boolean().optional(),
      is_done: z.boolean().optional(),
      is_active: z.boolean().optional(),
      priority: Priority.optional(),
      limit: z.number().int().min(1).max(500).optional(),
    }),
    'tasks:read',
    connection.scopes,
    (input) => access.listTasks(input)
  );
  operation(
    server,
    'get_task',
    'Get one accessible task with its steps and tags.',
    z.object({ task_id: Uuid }),
    'tasks:read',
    connection.scopes,
    ({ task_id }) => access.getTask(task_id)
  );
  operation(
    server,
    'create_task',
    'Create a new task; when project_id is omitted the inbox is used.',
    z.object({
      name: z.string().trim().min(1),
      project_id: Uuid.optional(),
      description: z.string().optional(),
      priority: Priority.optional(),
      finish_date: z.iso.date().optional(),
      pinned: z.boolean().optional(),
      repeat: Repeat.optional(),
    }),
    'tasks:write',
    connection.scopes,
    (input) => access.createTask(input),
    false
  );
  operation(
    server,
    'update_task',
    'Update fields on an accessible task.',
    z
      .object({
        task_id: Uuid,
        name: z.string().trim().min(1).optional(),
        description: z.string().optional(),
        project_id: Uuid.optional(),
        priority: Priority.optional(),
        finish_date: z.iso.date().nullable().optional(),
        pinned: z.boolean().optional(),
        on_hold: z.boolean().optional(),
        repeat: Repeat.nullable().optional(),
      })
      .refine((value) =>
        Object.entries(value).some(
          ([key, field]) => key !== 'task_id' && field !== undefined
        )
      ),
    'tasks:write',
    connection.scopes,
    ({ task_id, ...changes }) => access.updateTask(task_id, changes),
    false
  );
  operation(
    server,
    'complete_task',
    'Complete or reopen a task. Completing a recurring task advances its due date and resets its steps.',
    z.object({ task_id: Uuid, is_done: z.boolean().optional() }),
    'tasks:write',
    connection.scopes,
    ({ task_id, is_done }) => access.completeTask(task_id, is_done ?? true),
    false
  );
  operation(
    server,
    'suspend_task',
    'Suspend an incomplete task indefinitely or until a future date and time.',
    z.object({
      task_id: Uuid,
      until: z.iso.datetime({ offset: true }).nullable().optional(),
    }),
    'tasks:write',
    connection.scopes,
    ({ task_id, until }) => access.suspendTask(task_id, until),
    false
  );
  operation(
    server,
    'resume_task',
    'Resume a suspended incomplete task and clear its suspension deadline.',
    z.object({ task_id: Uuid }),
    'tasks:write',
    connection.scopes,
    ({ task_id }) => access.resumeTask(task_id),
    false
  );
  operation(
    server,
    'delete_task',
    'Permanently delete an accessible task.',
    z.object({ task_id: Uuid }),
    'tasks:write',
    connection.scopes,
    ({ task_id }) => access.deleteTask(task_id),
    false
  );

  operation(
    server,
    'list_tags',
    'List all tags owned by the authenticated user.',
    Empty,
    'tags:read',
    connection.scopes,
    () => access.listTags()
  );
  operation(
    server,
    'create_tag',
    'Create a new tag.',
    z.object({ name: z.string().trim().min(1) }),
    'tags:write',
    connection.scopes,
    ({ name }) => access.createTag(name),
    false
  );
  operation(
    server,
    'add_tag_to_task',
    'Associate an owned tag with an accessible task.',
    z.object({ task_id: Uuid, tag_id: Uuid }),
    ['tasks:write', 'tags:write'],
    connection.scopes,
    ({ task_id, tag_id }) => access.addTagToTask(task_id, tag_id),
    false
  );

  return server;
}
