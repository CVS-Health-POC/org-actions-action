export interface ActionMetadataInput {
  description: string;
  required: boolean;
  default?: string;
  deprecationMessage?: string;
}

export interface ActionMetadataOutput {
  description: string;
  value?: string;
}

export interface ActionMetadataJavaScriptRuns {
  using: 'node12' | 'node16';
  main: string;
  pre?: string;
  'pre-if'?: string;
  post?: string;
  'post-if'?: string;
}

export interface ActionMetadataCompositeRuns {
  using: 'composite';
  steps: ActionMetadataCompositeStep[];
}

export interface ActionMetadataDockerRuns {
  using: 'docker';
  image: string;
  entrypoint?: string;
  'pre-entrypoint'?: string;
  'post-entrypoint'?: string;
  env?: { [key: string]: string };
  args?: string[];
}

export interface ActionMetadataCompositeStep {
  'continue-on-error'?: boolean;
  env?: { [key: string]: string };
  id?: string;
  if?: string;
  name?: string;
  run?: string;
  shell?: string;
  uses?: string;
  with?: { [key: string]: string };
  'working-directory'?: string;
}

export interface ActionMetadataBranding {
  icon: string;
  color:
    | 'white'
    | 'yellow'
    | 'blue'
    | 'green'
    | 'orange'
    | 'red'
    | 'purple'
    | 'gray-dark';
}

export interface ActionMetadataYaml {
  name: string;
  author?: string;
  description: string;
  inputs?: { [input_id: string]: ActionMetadataInput };
  outputs?: { [output_id: string]: ActionMetadataOutput };
  runs:
    | ActionMetadataJavaScriptRuns
    | ActionMetadataCompositeRuns
    | ActionMetadataDockerRuns;
  branding?: ActionMetadataBranding;
}

export interface ActionMetadata extends ActionMetadataYaml {
  owner: string;
  path: string;
  repository: string;
}

export type ActionsMetadata = { [path: string]: ActionMetadataYaml };
