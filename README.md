# Example commenting app using Cloudflare Workers

Minimal repo with no libraries.

Live URL: https://comments.mert-e13.workers.dev/

What I learned?

- How to use Wrangler
- How to initiate a worker
- How to initiate a D1 db
- How to set local and remote worker environments
- Some default Cloudflare headers such as `CF-Connecting-IP`
- `prepare()`, `bind()` and `batch()` methods
- How to inspect local DB instance under `.wrangler/state/d1` dist for local debugging
- How to query db using Wrangler CLI with `--command` flag
- How to correctly set assets directory to serve a web page
