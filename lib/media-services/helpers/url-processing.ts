import { Fn } from "aws-cdk-lib";
import { CfnOriginEndpoint } from "aws-cdk-lib/aws-mediapackage";

/**
 * Split domain off emp endpoint URL.
 *
 * Returns the path from `out`
 */
export function splitUrlPathFromEmpEndpoint(empEndpoint: CfnOriginEndpoint): string {
  return `out/${Fn.select(1, Fn.split("/out/", empEndpoint.attrUrl))}`;
}

/**
 * Parse EMT Endpoint URL and return just the domain name
 */
export function getDomainFromEmtEndpointUrl(emtEndpointUrl: string) {
  return Fn.select(2, Fn.split("/", emtEndpointUrl));
}

/**
 * Fetch the path half of the URL from an EMT endpoint.
 *
 * Return the path from `v1/<prefix>`
 */
export function splitEmtPathFromUrlPrefix(prefix: string) {
  return `v1/${Fn.select(1, Fn.split("/v1/", prefix))}`;
}
