// Project tool handlers for MCP

import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireEnv, requireSupabaseSecretKey } from '../../_shared/common.ts';
import { McpToolResult, jsonResult, errorResult } from '../mcp-protocol.ts';

type Args = Record<string, unknown>;

const getClient = () =>
  createClient(requireEnv('SUPABASE_URL'), requireSupabaseSecretKey());

export const listProjects = async (
  userId: string,
  args: Args
): Promise<McpToolResult> => {
  const supabase = getClient();
  const isActive =
    args.is_active !== undefined ? Boolean(args.is_active) : true;

  let query = supabase
    .from('projects')
    .select(
      'id, name, description, color, icon, is_active, is_inbox, project_type, ancestor_id, created_at'
    )
    .eq('owner_id', userId)
    .order('name');

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive);
  }
  if (args.ancestor_id === null) query = query.is('ancestor_id', null);
  if (typeof args.ancestor_id === 'string') {
    query = query.eq('ancestor_id', args.ancestor_id);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[tickist-mcp] Failed to list projects', error);
    return errorResult('Failed to list projects');
  }
  return jsonResult(data);
};

export const getProject = async (
  userId: string,
  args: Args
): Promise<McpToolResult> => {
  const projectId = args.project_id as string;
  if (!projectId) return errorResult('project_id is required');

  const supabase = getClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('owner_id', userId)
    .single();

  if (error) return errorResult('Project not found');
  return jsonResult(data);
};

export const createProject = async (
  userId: string,
  args: Args
): Promise<McpToolResult> => {
  const name = (args.name as string)?.trim();
  if (!name) return errorResult('name is required');

  const supabase = getClient();
  const insertData: Record<string, unknown> = {
    owner_id: userId,
    name,
  };
  if (typeof args.ancestor_id === 'string') {
    const parentError = await validateParentProject(
      supabase,
      userId,
      args.ancestor_id
    );
    if (parentError) return errorResult(parentError);
    insertData.ancestor_id = args.ancestor_id;
  }
  if (args.description !== undefined) insertData.description = args.description;
  if (args.color !== undefined) insertData.color = args.color;
  if (args.icon !== undefined) insertData.icon = args.icon;

  const { data, error } = await supabase
    .from('projects')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('[tickist-mcp] Failed to create project', error);
    return errorResult('Failed to create project');
  }
  return jsonResult(data);
};

export const updateProject = async (
  userId: string,
  args: Args
): Promise<McpToolResult> => {
  const projectId = args.project_id as string;
  if (!projectId) return errorResult('project_id is required');

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  for (const key of [
    'name',
    'description',
    'color',
    'icon',
    'is_active',
    'ancestor_id',
  ]) {
    if (args[key] !== undefined) updates[key] = args[key];
  }

  if (Object.keys(updates).length <= 1) {
    return errorResult(
      'No fields to update. Provide at least one of: name, description, color, icon, is_active, ancestor_id'
    );
  }

  const supabase = getClient();
  if (typeof updates.ancestor_id === 'string') {
    const parentError = await validateParentProject(
      supabase,
      userId,
      updates.ancestor_id,
      projectId
    );
    if (parentError) return errorResult(parentError);
  }
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .eq('owner_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[tickist-mcp] Failed to update project', error);
    return errorResult('Failed to update project');
  }
  return jsonResult(data);
};

export const deleteProject = async (
  userId: string,
  args: Args
): Promise<McpToolResult> => {
  const projectId = args.project_id as string;
  const supabase = getClient();
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, is_inbox')
    .eq('id', projectId)
    .eq('owner_id', userId)
    .maybeSingle();
  if (projectError || !project) return errorResult('Project not found');
  if (project.is_inbox) return errorResult('Inbox project cannot be deleted');

  const { data, error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('owner_id', userId)
    .select('id')
    .maybeSingle();
  if (error || !data) return errorResult('Failed to delete project');
  return jsonResult({ deleted: true, project_id: projectId });
};

const validateParentProject = async (
  supabase: ReturnType<typeof getClient>,
  userId: string,
  parentId: string,
  projectId?: string
): Promise<string | null> => {
  const [
    { data: owned, error: ownedError },
    { data: memberships, error: memberError },
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('id, ancestor_id, is_inbox')
      .eq('owner_id', userId),
    supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId)
      .eq('status', 'accepted'),
  ]);
  if (ownedError || memberError) return 'Failed to inspect project hierarchy';
  const memberIds = (memberships ?? []).map((member) => member.project_id);
  const { data: shared, error: sharedError } = memberIds.length
    ? await supabase
        .from('projects')
        .select('id, ancestor_id, is_inbox')
        .in('id', memberIds)
    : { data: [], error: null };
  if (sharedError) return 'Failed to inspect project hierarchy';
  const hierarchy = [...(owned ?? []), ...(shared ?? [])];
  const parent = hierarchy.find((project) => project.id === parentId);
  if (!parent) return 'Parent project not found';
  if (parent.is_inbox) return 'Inbox cannot be a parent project';
  if (!projectId) return null;
  if (parentId === projectId) return 'A project cannot be its own parent';

  const queue = [projectId];
  const visited = new Set(queue);
  while (queue.length > 0) {
    const current = queue.shift();
    for (const project of hierarchy) {
      if (project.ancestor_id !== current || visited.has(project.id)) continue;
      if (project.id === parentId) {
        return 'A project cannot be moved below its descendant';
      }
      visited.add(project.id);
      queue.push(project.id);
    }
  }
  return null;
};
