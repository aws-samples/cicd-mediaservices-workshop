/**
 * Allow Pipeline to start the channel automatically
 */
export const PIPELINE_START_CHANNEL_ENABLED = true;

/**
 * Allow Pipeline to stop the channel automatically
 *
 * This is done forcefully when the pipeline is executing - look at the `PIPELINE_PROD_MANUAL_APPROVAL`
 * manual approval step to stop this being applied to your production environment straightaway
 * if a commit is pushed to CodeCommit repo.
 */
export const PIPELINE_STOP_CHANNEL_ENABLED = true;

/**
 * Prod manual approval before build
 *
 * Example how to use a Manual Approval Step to stop the pipeline
 * from executing on your "production" stacks until it is explicitly approved by a user.
 */
export const PIPELINE_PROD_MANUAL_APPROVAL = false;
