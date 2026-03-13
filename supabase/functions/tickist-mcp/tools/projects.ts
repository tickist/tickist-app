// Project tool handlers for MCP

import { createClient } from "npm:@supabase/supabase-js@2";
import { requireEnv, requireSupabaseSecretKey } from "../../_shared/common.ts";
import { McpToolResult, jsonResult, errorResult } from "../mcp-protocol.ts";

type Args = Record<string, unknown>;

const getClient = () =>
    createClient(
        requireEnv("SUPABASE_URL"),
        requireSupabaseSecretKey(),
    );

export const listProjects = async (
    userId: string,
    args: Args,
): Promise<McpToolResult> => {
    const supabase = getClient();
    const isActive = args.is_active !== undefined ? Boolean(args.is_active) : true;

    let query = supabase
        .from("projects")
        .select("id, name, description, color, icon, is_active, is_inbox, project_type, created_at")
        .eq("owner_id", userId)
        .order("name");

    if (isActive !== undefined) {
        query = query.eq("is_active", isActive);
    }

    const { data, error } = await query;
    if (error) return errorResult(`Failed to list projects: ${error.message}`);
    return jsonResult(data);
};

export const getProject = async (
    userId: string,
    args: Args,
): Promise<McpToolResult> => {
    const projectId = args.project_id as string;
    if (!projectId) return errorResult("project_id is required");

    const supabase = getClient();
    const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .eq("owner_id", userId)
        .single();

    if (error) return errorResult(`Project not found: ${error.message}`);
    return jsonResult(data);
};

export const createProject = async (
    userId: string,
    args: Args,
): Promise<McpToolResult> => {
    const name = (args.name as string)?.trim();
    if (!name) return errorResult("name is required");

    const supabase = getClient();
    const insertData: Record<string, unknown> = {
        owner_id: userId,
        name,
    };
    if (args.description !== undefined) insertData.description = args.description;
    if (args.color !== undefined) insertData.color = args.color;
    if (args.icon !== undefined) insertData.icon = args.icon;

    const { data, error } = await supabase
        .from("projects")
        .insert(insertData)
        .select()
        .single();

    if (error) return errorResult(`Failed to create project: ${error.message}`);
    return jsonResult(data);
};

export const updateProject = async (
    userId: string,
    args: Args,
): Promise<McpToolResult> => {
    const projectId = args.project_id as string;
    if (!projectId) return errorResult("project_id is required");

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of ["name", "description", "color", "icon", "is_active"]) {
        if (args[key] !== undefined) updates[key] = args[key];
    }

    if (Object.keys(updates).length <= 1) {
        return errorResult("No fields to update. Provide at least one of: name, description, color, icon, is_active");
    }

    const supabase = getClient();
    const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", projectId)
        .eq("owner_id", userId)
        .select()
        .single();

    if (error) return errorResult(`Failed to update project: ${error.message}`);
    return jsonResult(data);
};
