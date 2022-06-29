import * as core from '@actions/core';
import { Octokit } from 'octokit';
import { Organization } from './organization';

async function run(): Promise<void> {
  try {
    const organization = core.getInput('organization', { required: true });
    const accessToken = core.getInput('access-token', { required: true });
    const octokit = new Octokit({ auth: accessToken });

    const org = new Organization(organization);
    const usedActions = await org.usedActions(octokit);
    const usedWorkflows = await org.usedWorkflows(octokit);
    const actionsMetadata = await org.actionsMetadata(octokit);
    const workflowsMetadata = await org.workflowsMetadata(octokit);

    core.setOutput('results', {
      organization,
      usedActions,
      usedWorkflows,
      actionsMetadata,
      workflowsMetadata,
    });
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
