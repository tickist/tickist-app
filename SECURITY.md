# Security policy

Thank you for helping keep Tickist users safe.

## Reporting a vulnerability

Please report vulnerabilities privately, never as a public GitHub issue,
discussion or pull request.

- **Preferred:** use **Report a vulnerability** on this repository's
  [Security tab](https://github.com/tickist/tickist-app/security/advisories/new).
  It opens a private draft advisory where we can coordinate a fix, request a
  CVE and credit you.
- **Alternative:** email [security@tickist.com](mailto:security@tickist.com).
  If you want to encrypt the report, ask for a key in a first message without
  details.

Please include:

- a short description of the issue and its impact;
- minimal steps to reproduce;
- the affected commit or deployment, if known;
- proof-of-concept code, if you have it (it can follow in a later message).

Test only against your own local Supabase stack or accounts you own. Do not
access other people's data, degrade the service or send mail to addresses you
do not control.

## What to expect

- We acknowledge reports within five business days.
- Coordinated disclosure: typically 90 days from acknowledgement, or earlier
  once a fix is deployed to production.
- We credit reporters in the advisory by name or handle unless you ask us not
  to.

## Scope

In scope:

- the web application at <https://tickist.com>;
- the MCP server at <https://mcp.tickist.com/mcp>;
- this repository, including Supabase migrations and Edge Functions.

Out of scope:

- social engineering, phishing or physical attacks on maintainers or users;
- denial-of-service tests against production;
- vulnerabilities in third-party services or dependencies that do not arise
  from how Tickist uses them (please report those to the vendor);
- automated scanner output without a working proof of concept.
