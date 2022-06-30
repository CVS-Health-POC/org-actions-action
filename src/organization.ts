import * as core from '@actions/core';
import { Octokit } from 'octokit';
import { ActionsMetadata } from './action';
import { Repository } from './repository';
import { Used, UsedActions, UsedWorkflows } from './used';
import { WorkflowsMetadata } from './workflow';

export interface OrganizationRepositoryData {
  actionsMetadata: ActionsMetadata;
  used: Used;
  workflowsMetadata: WorkflowsMetadata;
}

export class Organization {
  #repositoriesPromise?: Promise<Repository[]>;
  #repositoryDataPromise?: Promise<OrganizationRepositoryData>;

  constructor(public name: string) {}

  async actionsMetadata(octokit: Octokit): Promise<ActionsMetadata> {
    const { actionsMetadata } = await this.#getRepositoryDataPromise(octokit);
    return actionsMetadata;
  }

  async repositories(octokit: Octokit): Promise<Repository[]> {
    return this.#getRepositoriesPromise(octokit);
  }

  async usedActions(octokit: Octokit): Promise<UsedActions> {
    const { used } = await this.#getRepositoryDataPromise(octokit);
    return used.actions;
  }

  async usedWorkflows(octokit: Octokit): Promise<UsedWorkflows> {
    const { used } = await this.#getRepositoryDataPromise(octokit);
    return used.workflows;
  }

  async workflowsMetadata(octokit: Octokit): Promise<WorkflowsMetadata> {
    const { workflowsMetadata } = await this.#getRepositoryDataPromise(octokit);
    return workflowsMetadata;
  }

  async #getRepositories(octokit: Octokit): Promise<Repository[]> {
    const repos: Repository[] = [];
    const orgRepos = await octokit.paginate(octokit.rest.repos.listForOrg, {
      org: this.name,
      per_page: 100,
    });

    core.info(`Found [${this.name}] organization`);
    core.info(`Found [${orgRepos.length}] repositories`);

    for (const orgRepo of orgRepos) {
      const repo = new Repository(
        orgRepo.owner.login,
        orgRepo.name,
        orgRepo.visibility,
      );
      repos.push(repo);
    }

    return repos;
  }

  async #getRepositoriesPromise(octokit: Octokit): Promise<Repository[]> {
    if (!this.#repositoriesPromise) {
      this.#repositoriesPromise = this.#getRepositories(octokit);
    }
    return this.#repositoriesPromise;
  }

  async #getRepositoryData(
    octokit: Octokit,
  ): Promise<OrganizationRepositoryData> {
    const repos = await this.#getRepositoriesPromise(octokit);
    const repoData: OrganizationRepositoryData = {
      actionsMetadata: {},
      used: new Used(),
      workflowsMetadata: {},
    };

    for (const repo of repos) {
      const actionMetadata = await repo.actionMetdata(octokit);
      const usedActions = await repo.usedActions(octokit);
      const usedWorkflows = await repo.usedWorkflows(octokit);
      const workflowsMetadata = await repo.workflowsMetadata(octokit);

      if (actionMetadata) {
        repoData.actionsMetadata[actionMetadata.path] = actionMetadata;
      }
      repoData.used.addActions(usedActions);
      repoData.used.addWorkflows(usedWorkflows);
      repoData.workflowsMetadata = {
        ...repoData.workflowsMetadata,
        ...workflowsMetadata,
      };
    }

    return repoData;
  }

  async #getRepositoryDataPromise(
    octokit: Octokit,
  ): Promise<OrganizationRepositoryData> {
    if (!this.#repositoryDataPromise) {
      this.#repositoryDataPromise = this.#getRepositoryData(octokit);
    }
    return this.#repositoryDataPromise;
  }
}
