import * as core from '@actions/core';
import * as yaml from 'js-yaml';
import { Octokit } from 'octokit';
import { ActionMetadata, ActionMetadataYaml } from './action';
import { URL } from './url';
import { Used, UsedActions, UsedWorkflows } from './used';
import { WorflowOnWorkflowCall, Workflow, WorkflowsMetadata } from './workflow';

export interface RepositoryFile {
  type: string;
  size: number;
  name: string;
  path: string;
  content?: string;
  sha: string;
  url: string;
  git_url: string | null;
  html_url: string | null;
  download_url: string | null;
}

export interface RepositoryWorkflowData {
  workflowsMetadata: WorkflowsMetadata;
  used: Used;
}

export class Repository {
  #actionMetadataPromise?: Promise<ActionMetadata | undefined>;
  #workflowDataPromise?: Promise<RepositoryWorkflowData>;

  constructor(
    public owner: string,
    public name: string,
    public visibility?: string,
  ) {}

  async actionMetdata(octokit: Octokit): Promise<ActionMetadata | undefined> {
    return this.#getActionMetadataPromise(octokit);
  }

  async isAction(octokit: Octokit): Promise<boolean> {
    return !!(await this.#getActionMetadataPromise(octokit));
  }

  async usedActions(octokit: Octokit): Promise<UsedActions> {
    const { used } = await this.#getWorkflowDataPromise(octokit);
    return used.actions;
  }

  async usedWorkflows(octokit: Octokit): Promise<UsedWorkflows> {
    const { used } = await this.#getWorkflowDataPromise(octokit);
    return used.workflows;
  }

  async workflowsMetadata(octokit: Octokit): Promise<WorkflowsMetadata> {
    const { workflowsMetadata } = await this.#getWorkflowDataPromise(octokit);
    return workflowsMetadata;
  }

  #addDataInWorkflow(
    workflow: Workflow,
    data: RepositoryWorkflowData,
    file: RepositoryFile,
  ): void {
    if (this.visibility !== 'private' && workflow.on.workflow_call) {
      this.#addWorkflowMetadata(
        workflow.on.workflow_call,
        data,
        file.path,
        workflow.name,
      );
    }
    for (const job of Object.values(workflow.jobs)) {
      if (job.uses) {
        data.used.addWorkflow(job.uses);
      } else if (job.steps) {
        for (const step of job.steps) {
          if (step.uses) {
            data.used.addAction(step.uses);
          }
        }
      }
    }
  }

  #addWorkflowMetadata(
    onWorkflowCall: WorflowOnWorkflowCall,
    data: RepositoryWorkflowData,
    relativePath: string,
    name?: string,
  ): void {
    const path = `${this.owner.toLowerCase()}/${this.name.toLowerCase()}/${relativePath}`;
    data.workflowsMetadata[path] = {
      ...onWorkflowCall,
      name,
      owner: this.owner,
      repository: this.name,
      path,
    };
  }

  async #getActionMetadata(
    octokit: Octokit,
  ): Promise<ActionMetadata | undefined> {
    let metadata: ActionMetadata | undefined;

    if (this.visibility !== 'private') {
      let file = await this.#getRepositoryPathData(octokit, 'action.yml');
      if (!file) {
        file = await this.#getRepositoryPathData(octokit, 'action.yaml');
      }

      if (file && !Array.isArray(file)) {
        const metadataYaml = await this.#parseYaml<ActionMetadataYaml>(file);
        if (metadataYaml) {
          const path = `${this.owner}/${this.name}`.toLowerCase();
          metadata = {
            ...metadataYaml,
            owner: this.owner,
            path,
            repository: this.name,
          };
        }
      }
    }

    return metadata;
  }

  async #getActionMetadataPromise(
    octokit: Octokit,
  ): Promise<ActionMetadata | undefined> {
    if (!this.#actionMetadataPromise) {
      this.#actionMetadataPromise = this.#getActionMetadata(octokit);
    }
    return this.#actionMetadataPromise;
  }

  async #getRepositoryPathData(
    octokit: Octokit,
    path: string,
  ): Promise<RepositoryFile | RepositoryFile[] | undefined> {
    try {
      return (
        await octokit.rest.repos.getContent({
          owner: this.owner,
          repo: this.name,
          path,
        })
      ).data as RepositoryFile | RepositoryFile[];
    } catch (error) {
      core.debug(
        `[${path}] not found in repository [${this.owner}/${this.name}]`,
      );
    }
  }

  async #getWorkflowData(octokit: Octokit): Promise<RepositoryWorkflowData> {
    const data: RepositoryWorkflowData = {
      workflowsMetadata: {},
      used: new Used(),
    };

    const workflowsDir = await this.#getRepositoryPathData(
      octokit,
      '.github/workflows',
    );

    if (workflowsDir && Array.isArray(workflowsDir)) {
      const workflowPromises: Promise<Workflow | undefined>[] = [];
      for (const file of workflowsDir) {
        workflowPromises.push(this.#parseYaml<Workflow>(file));
      }
      const workflows = await Promise.all(workflowPromises);
      for (let i = 0; i < workflows.length; i++) {
        const workflow = workflows[i];
        const file = workflowsDir[i];
        if (workflow) {
          this.#addDataInWorkflow(workflow, data, file);
        }
      }
    }

    return data;
  }

  async #getWorkflowDataPromise(
    octokit: Octokit,
  ): Promise<RepositoryWorkflowData> {
    if (!this.#workflowDataPromise) {
      this.#workflowDataPromise = this.#getWorkflowData(octokit);
    }
    return this.#workflowDataPromise;
  }

  async #parseYaml<T>(file: RepositoryFile): Promise<T | undefined> {
    try {
      if (file.content) {
        return yaml.load(Buffer.from(file.content, 'base64').toString()) as T;
      } else if (file.content === undefined && file.download_url) {
        const content = await new URL(file.download_url).getContent();
        return yaml.load(content) as T;
      } else {
        throw new Error('content is empty');
      }
    } catch (error) {
      core.debug(
        `Could not parse YAML [${file.path}] in repository [${this.owner}/${this.name}]`,
      );
    }
  }
}
