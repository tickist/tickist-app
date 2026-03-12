// Tag tool handlers for MCP

import { createClient } from "npm:@supabase/supabase-js@2";
import { McpToolResult, jsonResult, errorResult } from "../mcp-protocol.ts";

type Args = Record<string, unknown>;

const getClient = () =>
    createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

export const listTags = async (
    userId: string,
    _args: Args,
): Promise<McpToolResult> => {
    const supabase = getClient();
    const { data, error } = await supabase
        .from("tags")
        .select("id, name, created_at")
        .eq("owner_id", userId)
        .order("name");

    if (error) return errorResult(`Failed to list tags: ${error.message}`);
    return jsonResult(data);
};

export const createTag = async (
    userId: string,
    args: Args,
): Promise<McpToolResult> => {
    const name = (args.name as string)?.trim();
    if (!name) return errorResult("name is required");

    const supabase = getClient();
    const { data, error } = await supabase
        .from("tags")
        .insert({ owner_id: userId, name })
        .select()
        .single();

    if (error) return errorResult(`Failed to create tag: ${error.message}`);
    return jsonResult(data);
};

export const addTagToTask = async (
    userId: string,
    args: Args,
): Promise<McpToolResult> => {
    const taskId = args.task_id as string;
    const tagId = args.tag_id as string;
    if (!taskId || !tagId) return errorResult("task_id and tag_id are required");

    const supabase = getClient();

    // Verify task ownership
    const { data: task, error: taskError } = await supabase
        .from("tasks")
        .select("id")
        .eq("id", taskId)
        .eq("owner_id", userId)
        .single();

    if (taskError || !task) return errorResult("Task not found or not owned by you");

    // Verify tag ownership
    const { data: tag, error: tagError } = await supabase
        .from("tags")
        .select("id")
        .eq("id", tagId)
        .eq("owner_id", userId)
        .single();

    if (tagError || !tag) return errorResult("Tag not found or not owned by you");

    const { error: insertError } = await supabase
        .from("task_tags")
        .insert({ task_id: taskId, tag_id: tagId });

    if (insertError) {
        if (insertError.code === "23505") {
            return jsonResult({ already_exists: true, task_id: taskId, tag_id: tagId });
        }
        return errorResult(`Failed to add tag: ${insertError.message}`);
    }

    return jsonResult({ added: true, task_id: taskId, tag_id: tagId });
};
