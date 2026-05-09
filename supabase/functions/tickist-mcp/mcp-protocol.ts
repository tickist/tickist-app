// MCP Protocol types and helpers (JSON-RPC 2.0 + MCP 2025-06-18)

// ─── JSON-RPC 2.0 ───────────────────────────────────────────────────────────

export interface JsonRpcRequest {
    jsonrpc: "2.0";
    id: string | number | null;
    method: string;
    params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
    jsonrpc: "2.0";
    id: string | number | null;
    result?: unknown;
    error?: JsonRpcError;
}

export interface JsonRpcError {
    code: number;
    message: string;
    data?: unknown;
}

// Standard JSON-RPC error codes
export const ERROR_PARSE = -32700;
export const ERROR_INVALID_REQUEST = -32600;
export const ERROR_METHOD_NOT_FOUND = -32601;
export const ERROR_INVALID_PARAMS = -32602;
export const ERROR_INTERNAL = -32603;

export const jsonRpcError = (
    id: string | number | null,
    code: number,
    message: string,
    data?: unknown,
): JsonRpcResponse => ({
    jsonrpc: "2.0",
    id,
    error: { code, message, ...(data !== undefined ? { data } : {}) },
});

export const jsonRpcResult = (
    id: string | number | null,
    result: unknown,
): JsonRpcResponse => ({
    jsonrpc: "2.0",
    id,
    result,
});

// ─── MCP Types ───────────────────────────────────────────────────────────────

export interface McpToolDefinition {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}

export interface McpToolResult {
    content: McpContentBlock[];
    isError?: boolean;
}

export interface McpContentBlock {
    type: "text";
    text: string;
}

export const textResult = (text: string): McpToolResult => ({
    content: [{ type: "text", text }],
});

export const errorResult = (message: string): McpToolResult => ({
    content: [{ type: "text", text: message }],
    isError: true,
});

export const jsonResult = (data: unknown): McpToolResult =>
    textResult(JSON.stringify(data, null, 2));

// ─── Server Info ─────────────────────────────────────────────────────────────

export const SERVER_INFO = {
    name: "tickist-mcp",
    version: "1.0.0",
};

export const PROTOCOL_VERSION = "2025-06-18";

// ─── Tool Definitions ────────────────────────────────────────────────────────

export const TOOL_DEFINITIONS: McpToolDefinition[] = [
    // Projects
    {
        name: "list_projects",
        description: "List all projects for the authenticated user",
        inputSchema: {
            type: "object",
            properties: {
                is_active: {
                    type: "boolean",
                    description: "Filter by active status. Defaults to true.",
                },
            },
        },
    },
    {
        name: "get_project",
        description: "Get a single project by its ID",
        inputSchema: {
            type: "object",
            properties: {
                project_id: { type: "string", format: "uuid", description: "Project UUID" },
            },
            required: ["project_id"],
        },
    },
    {
        name: "create_project",
        description: "Create a new project",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Project name" },
                description: { type: "string", description: "Project description" },
                color: { type: "string", description: "Hex color, e.g. #394264" },
                icon: { type: "string", description: "Icon identifier, e.g. tick" },
            },
            required: ["name"],
        },
    },
    {
        name: "update_project",
        description: "Update an existing project",
        inputSchema: {
            type: "object",
            properties: {
                project_id: { type: "string", format: "uuid", description: "Project UUID" },
                name: { type: "string", description: "New project name" },
                description: { type: "string", description: "New description" },
                color: { type: "string", description: "New hex color" },
                icon: { type: "string", description: "New icon identifier" },
                is_active: { type: "boolean", description: "Set active status" },
            },
            required: ["project_id"],
        },
    },

    // Tasks
    {
        name: "list_tasks",
        description:
            "List tasks. Filterable by project_id, is_done, is_active, priority. Returns up to 100 tasks by default.",
        inputSchema: {
            type: "object",
            properties: {
                project_id: { type: "string", format: "uuid", description: "Filter by project" },
                is_done: { type: "boolean", description: "Filter by completion status" },
                is_active: { type: "boolean", description: "Filter by active status" },
                priority: {
                    type: "string",
                    enum: ["low", "normal", "high", "urgent"],
                    description: "Filter by priority",
                },
                limit: { type: "integer", description: "Max results (default 100, max 500)" },
            },
        },
    },
    {
        name: "get_task",
        description: "Get a single task by ID, including its steps and tags",
        inputSchema: {
            type: "object",
            properties: {
                task_id: { type: "string", format: "uuid", description: "Task UUID" },
            },
            required: ["task_id"],
        },
    },
    {
        name: "create_task",
        description: "Create a new task",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Task name" },
                project_id: {
                    type: "string",
                    format: "uuid",
                    description: "Project to add the task to. If omitted, uses the inbox project.",
                },
                description: { type: "string", description: "Task description" },
                priority: {
                    type: "string",
                    enum: ["low", "normal", "high", "urgent"],
                    description: "Priority level (default: normal)",
                },
                finish_date: {
                    type: "string",
                    format: "date",
                    description: "Due date in YYYY-MM-DD format",
                },
                pinned: { type: "boolean", description: "Pin the task" },
            },
            required: ["name"],
        },
    },
    {
        name: "update_task",
        description: "Update fields on an existing task",
        inputSchema: {
            type: "object",
            properties: {
                task_id: { type: "string", format: "uuid", description: "Task UUID" },
                name: { type: "string", description: "New task name" },
                description: { type: "string", description: "New description" },
                project_id: { type: "string", format: "uuid", description: "Move to project" },
                priority: {
                    type: "string",
                    enum: ["low", "normal", "high", "urgent"],
                    description: "New priority",
                },
                finish_date: {
                    type: ["string", "null"],
                    format: "date",
                    description: "New due date (YYYY-MM-DD) or null to clear",
                },
                pinned: { type: "boolean", description: "Pin/unpin" },
                on_hold: { type: "boolean", description: "Put on hold / resume" },
            },
            required: ["task_id"],
        },
    },
    {
        name: "complete_task",
        description: "Mark a task as done (or reopen it)",
        inputSchema: {
            type: "object",
            properties: {
                task_id: { type: "string", format: "uuid", description: "Task UUID" },
                is_done: {
                    type: "boolean",
                    description: "true to complete, false to reopen. Default: true",
                },
            },
            required: ["task_id"],
        },
    },
    {
        name: "delete_task",
        description: "Permanently delete a task",
        inputSchema: {
            type: "object",
            properties: {
                task_id: { type: "string", format: "uuid", description: "Task UUID" },
            },
            required: ["task_id"],
        },
    },

    // Tags
    {
        name: "list_tags",
        description: "List all tags for the authenticated user",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "create_tag",
        description: "Create a new tag",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Tag name" },
            },
            required: ["name"],
        },
    },
    {
        name: "add_tag_to_task",
        description: "Associate a tag with a task",
        inputSchema: {
            type: "object",
            properties: {
                task_id: { type: "string", format: "uuid", description: "Task UUID" },
                tag_id: { type: "string", format: "uuid", description: "Tag UUID" },
            },
            required: ["task_id", "tag_id"],
        },
    },
];
