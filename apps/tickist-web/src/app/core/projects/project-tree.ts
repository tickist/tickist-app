export interface HierarchicalItem {
  id: string;
  name: string;
  ancestorId: string | null;
}

export interface HierarchyNode<T> {
  item: T;
  children: HierarchyNode<T>[];
}

export interface FlattenedHierarchyItem<T> {
  item: T;
  level: number;
  parentIds: readonly string[];
}

export function buildHierarchy<T extends HierarchicalItem>(
  items: ReadonlyArray<T>
): HierarchyNode<T>[] {
  const nodeMap = new Map<string, HierarchyNode<T>>();

  items.forEach((item) => nodeMap.set(item.id, { item, children: [] }));

  const roots: HierarchyNode<T>[] = [];
  for (const node of nodeMap.values()) {
    const parentId = node.item.ancestorId;
    const parentNode = parentId ? nodeMap.get(parentId) : undefined;
    if (parentNode && parentNode.item.id !== node.item.id) {
      parentNode.children.push(node);
      continue;
    }
    roots.push(node);
  }

  const sortNodes = (nodes: HierarchyNode<T>[]): void => {
    nodes.sort((left, right) => left.item.name.localeCompare(right.item.name));
    nodes.forEach((node) => sortNodes(node.children));
  };

  sortNodes(roots);
  return roots;
}

export function filterHierarchy<T>(
  nodes: ReadonlyArray<HierarchyNode<T>>,
  predicate: (item: T) => boolean,
  includeDescendantsOfMatch = true
): HierarchyNode<T>[] {
  return nodes.flatMap((node) => {
    const matches = predicate(node.item);
    if (matches) {
      return [
        {
          item: node.item,
          children: includeDescendantsOfMatch
            ? cloneHierarchy(node.children)
            : filterHierarchy(node.children, predicate, includeDescendantsOfMatch),
        },
      ];
    }

    const filteredChildren = filterHierarchy(
      node.children,
      predicate,
      includeDescendantsOfMatch
    );
    if (!filteredChildren.length) {
      return [];
    }

    return [
      {
        item: node.item,
        children: filteredChildren,
      },
    ];
  });
}

export function flattenHierarchy<T>(
  nodes: ReadonlyArray<HierarchyNode<T>>,
  level = 0,
  parentIds: readonly string[] = []
): FlattenedHierarchyItem<T>[] {
  return nodes.flatMap((node) => {
    const flattenedNode: FlattenedHierarchyItem<T> = {
      item: node.item,
      level,
      parentIds,
    };

    return [
      flattenedNode,
      ...flattenHierarchy(
        node.children,
        level + 1,
        [...parentIds, getItemId(node.item)]
      ),
    ];
  });
}

export function collectDescendantIds<T extends { id: string }>(
  nodes: ReadonlyArray<HierarchyNode<T>>,
  rootId: string
): Set<string> {
  const descendants = new Set<string>();

  const visit = (node: HierarchyNode<T>, collecting: boolean): void => {
    const isRoot = node.item.id === rootId;
    const shouldCollect = collecting || isRoot;

    if (collecting) {
      descendants.add(node.item.id);
    }

    node.children.forEach((child) => visit(child, shouldCollect));
  };

  nodes.forEach((node) => visit(node, false));
  return descendants;
}

function cloneHierarchy<T>(
  nodes: ReadonlyArray<HierarchyNode<T>>
): HierarchyNode<T>[] {
  return nodes.map((node) => ({
    item: node.item,
    children: cloneHierarchy(node.children),
  }));
}

function getItemId<T>(item: T): string {
  return (item as { id: string }).id;
}
