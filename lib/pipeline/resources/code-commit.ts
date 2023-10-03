import { Stack } from "aws-cdk-lib";
import { Repository } from "aws-cdk-lib/aws-codecommit";
import { ManagedPolicy, User } from "aws-cdk-lib/aws-iam";

/**
 *
 * @param scope
 * @returns Respostory
 *
 * Defined a CodeCommit Repo for you to use - this is a pre-requesite deploy
 */
export function createCodeCommitRepo(scope: Stack): Repository {
  return new Repository(scope, "live-streaming-workshop-repository", {
    repositoryName: "live-streaming-workshop-repository",
  });
}

/**
 * Create IAM User for user to be able to commit code to CodeCommit.
 *
 * Along with this user in the workshop will need to generate credentials under `HTTPS Git credentials for AWS CodeCommit` in the Console. This will allow a user to push with these credentials.
 *
 * @param scope
 * @returns User
 */
export function createIamUserForCodeCommit(scope: Stack): User {
  return new User(scope, "workshop-code-commit-user", {
    managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("AWSCodeCommitPowerUser")],
  });
}
