import allow from '../../../lists/allow/domains.json';
import deny from '../../../lists/deny/domains.json';

export class DomainVerification {
  static allow = allow;
  static deny = deny;
  static cache: { domain: string; verify: boolean | undefined }[] = [];

  /** Returns either true, false or undefined. True if allowed, false if not allowed and undefined if unknown. */
  static verify(domain: string) {
    let existing = this.cache.find((c) => c.domain === domain);
    let result = null;

    if (existing) {
      result = existing.verify;
    } else {
      // First check the allow list, this should normally be smallest.
      if (allow.indexOf(domain) > -1) {
        result = true;
      } else if (deny.indexOf(domain) > -1) {
        result = false;
      } else {
        result = undefined;
      }

      this.cache.push({ domain: domain, verify: result });
    }

    return result;
  }
}
