export type UsedActions = { [action: string]: UsedCount };

export interface UsedCount {
  count: number;
  references: UsedReferencesCount;
}

export type UsedReferencesCount = { [ref: string]: number };

export type UsedWorkflows = { [workflow: string]: UsedCount };

export interface Uses {
  path: string;
  ref?: string;
  isRelative: boolean;
}

export class Used {
  actions: UsedActions = {};
  workflows: UsedWorkflows = {};

  addAction(uses: string): void {
    this.#addByUses(this.actions, uses);
  }

  addActions(usedActions: UsedActions): void {
    this.#combine(this.actions, usedActions);
  }

  addWorkflow(uses: string): void {
    this.#addByUses(this.workflows, uses);
  }

  addWorkflows(usedWorkflows: UsedWorkflows): void {
    this.#combine(this.workflows, usedWorkflows);
  }

  #add(
    used: UsedActions | UsedWorkflows,
    path: string,
    references: UsedReferencesCount,
    count = 1,
  ): void {
    if (!used[path]) {
      used[path] = {
        count,
        references: {},
      };
    } else {
      used[path].count += count;
    }
    this.#addReferences(used[path].references, references);
  }

  #addByUses(used: UsedActions | UsedWorkflows, uses: string): void {
    const workflowUses = this.#parseUses(uses);
    if (!workflowUses.isRelative) {
      const references: UsedReferencesCount = {};
      this.#addReference(references, workflowUses.ref);
      this.#add(used, workflowUses.path, references);
    }
  }

  #addReference(references: UsedReferencesCount, ref = '', count = 1): void {
    if (!references[ref]) {
      references[ref] = count;
    } else {
      references[ref] += count;
    }
  }

  #addReferences(
    references: UsedReferencesCount,
    newReferences: UsedReferencesCount,
  ): void {
    for (const ref of Object.keys(newReferences)) {
      this.#addReference(references, ref, newReferences[ref]);
    }
  }

  #combine<T extends UsedActions | UsedWorkflows>(used: T, newUsed: T): void {
    for (const path of Object.keys(newUsed)) {
      this.#add(used, path, newUsed[path].references, newUsed[path].count);
    }
  }

  #parseUses(uses: string): Uses {
    const [path, ref] = uses.split('@');
    const isRelative = /^\.\/|^\/|^\.github\//.test(uses);
    const pathArr = /^([^/]+?)\/([^/]+?)\/(.github\/workflows\/.+)/.exec(path);
    if (pathArr) {
      const normalizedPath = `${pathArr[1].toLowerCase()}/${pathArr[2].toLowerCase()}/${
        pathArr[3]
      }`;
      return { path: normalizedPath, ref, isRelative };
    } else if (!isRelative) {
      return { path: path.toLowerCase(), ref, isRelative };
    }
    return { path, ref, isRelative };
  }
}
