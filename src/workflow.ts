export interface WorkflowConcurrency {
  group: string;
  'cancel-in-progress': boolean;
}

export interface WorkflowDefaults {
  run?: {
    shell?: string;
    'working-directory'?: string;
  };
}

export interface WorkflowJobEnvironment {
  name: string;
  url: string;
}

export interface WorkflowJobStep {
  'continue-on-error'?: boolean;
  env?: { [key: string]: string };
  id?: string;
  if?: string;
  name?: string;
  run?: string;
  shell?: string;
  'timeout-minutes'?: number;
  uses?: string;
  with?: { [key: string]: string };
  'working-directory'?: string;
}

export interface WorkflowJob {
  concurrency?: string;
  container?: any;
  'continue-on-error'?: boolean;
  env?: { [key: string]: string };
  environment?: WorkflowJobEnvironment | string;
  if?: string;
  name?: string;
  needs?: string | string[];
  outputs?: { [output_id: string]: string };
  permissions?: WorkflowPermissions | 'read-all' | 'write-all';
  'runs-on'?: string;
  services?: any;
  strategy?: any;
  'timeout-minutes'?: number;
  uses?: string;
  secrets?: { [key: string]: string } | 'inherit';
  steps?: WorkflowJobStep[];
  with?: { [key: string]: string };
}

export interface WorflowOnWorkflowCallInput {
  description: string;
  required: boolean;
  default?: string;
  type: 'string' | 'number' | 'boolean';
}

export interface WorflowOnWorkflowCallOutput {
  description: string;
  value: string;
}

export interface WorflowOnWorkflowCallSecret {
  description: string;
  required: boolean;
}

export interface WorflowOnWorkflowCall {
  inputs?: { [input_id: string]: WorflowOnWorkflowCallInput };
  outputs?: { [output_id: string]: WorflowOnWorkflowCallOutput };
  secrets?: { [secret_id: string]: WorflowOnWorkflowCallSecret };
}

export type WorkflowPermission = 'read' | 'write' | 'none';

export interface WorkflowPermissions {
  actions?: WorkflowPermission;
  checks?: WorkflowPermission;
  contents?: WorkflowPermission;
  deployments?: WorkflowPermission;
  'id-token'?: WorkflowPermission;
  issues?: WorkflowPermission;
  discussions?: WorkflowPermission;
  packages?: WorkflowPermission;
  pages?: WorkflowPermission;
  'pull-requests'?: WorkflowPermission;
  'repository-projects'?: WorkflowPermission;
  'security-events'?: WorkflowPermission;
  statuses?: WorkflowPermission;
}

export interface WorkflowMetadata extends WorflowOnWorkflowCall {
  name?: string;
  owner: string;
  path: string;
  repository: string;
}

export interface Workflow {
  name?: string;
  on: {
    workflow_call: WorflowOnWorkflowCall;
    [key: string]: any;
  };
  defaults?: WorkflowDefaults;
  concurrency?: WorkflowConcurrency;
  env?: { [key: string]: string };
  jobs: { [key: string]: WorkflowJob };
  permissions?: WorkflowPermissions | 'read-all' | 'write-all';
}

export type WorkflowsMetadata = { [path: string]: WorkflowMetadata };
