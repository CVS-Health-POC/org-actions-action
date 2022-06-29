import * as core from '@actions/core';
import { Octokit } from 'octokit';
import { Organization } from './organization';

async function run(): Promise<void> {
  try {
    const orgName = core.getInput('organization', { required: true });
    const accessToken = core.getInput('access-token', { required: true });
    const octokit = new Octokit({ auth: accessToken });

    const org = new Organization(orgName);
    const usedActions = await org.usedActions(octokit);
    const usedWorkflows = await org.usedWorkflows(octokit);
    const actionsMetadata = await org.actionsMetadata(octokit);
    const workflowsMetadata = await org.workflowsMetadata(octokit);

    core.setOutput('used-actions', usedActions);
    core.setOutput('used-workflows', usedWorkflows);
    core.setOutput('actions-metadata', actionsMetadata);
    core.setOutput('workflows-metadata', workflowsMetadata);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
