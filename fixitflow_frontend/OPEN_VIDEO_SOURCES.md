# Openly Licensed DIY Repair Video Sources & Integration Survey

This document lists reputable sources/platforms for DIY electronics, home appliance, and general repair videos under Creative Commons or public domain licenses, suitable for embedding or redistribution. It also surveys the integration specifics for Vimeo and PeerTube.

---

## 1. YouTube (Creative Commons)

- **Source:** https://www.youtube.com
- **How to Find:**
  - Use YouTube search and filter results by “Creative Commons” (under Filters > Features).
  - Example Query: “electronics repair tutorial”, then apply ‘Creative Commons’ filter.
- **Licensing:**
  - YouTube’s “Creative Commons” option adds a CC BY license, allowing redistribution and remixing, *except* that direct raw downloads are not always permitted by YouTube’s terms, but videos can always be embedded in-app.
- **How to Use:**
  - Embed via iframe (`https://www.youtube.com/embed/VIDEO_ID`), or use official YouTube API.
  - Can search programmatically using the [YouTube Data API](https://developers.google.com/youtube/v3/) (requires API key).
  - **Direct download:** Sites/tools exist, but not always legal for redistribution as files.

---

## 2. Internet Archive (archive.org) – Community Video

- **Source:** https://archive.org/details/movies
- **How to Find:**
  - Search for “DIY repair”, “electronics fix”, “appliance repair”, and filter by media type (“movies”) and license (“Creative Commons” is often noted on each item under “Rights”).
  - Example: [DIY, Repair, and How-to Videos Collection](https://archive.org/details/diy) (license varies, many CC or PD).
- **Licensing:**
  - Many Archive.org videos are public domain or CC-licensed. ALWAYS check the “Rights” field of each item.
- **How to Use:**
  - Can embed, link, and sometimes download source files directly (often MP4, OGV) as permitted by the license.
  - Embedding: Use Archive.org’s native embed code or download and self-host for CC/PD items.

---

## 3. Vimeo (Creative Commons)

- **Source:** https://vimeo.com/creativecommons
- **How to Find:**
  - Vimeo allows browsing by Creative Commons license here: [Vimeo Creative Commons](https://vimeo.com/creativecommons)
  - Search for “repair”, “fix”, “diy electronics”, etc.
- **Licensing:**
  - Various Creative Commons flavors—check each (CC BY, CC BY-SA, etc.) and observe attribution rules.
- **How to Use:**
  - Direct embedding via iframe is supported, and [Vimeo Player API](https://developer.vimeo.com/player) allows programmatic control.
  - Some videos may allow direct download for redistribution as per license.
  - **API:** Vimeo API can search/filter by license, but public functionality is limited—OAuth needed for advanced queries.

---

## 4. PeerTube Instances

- **Source:** List of instances at [instances.joinpeertube.org](https://instances.joinpeertube.org/)
  - Example federated repair channels:
    - https://diymedia.fr (search for “repair”)
- **How to Find:**
  - PeerTube is a decentralized, open alternative to YouTube; many instances host DIY/repair videos under open licenses.
  - Search each instance for “repair”, “diy”, or “electronics fix”.
- **Licensing:**
  - Video creators typically select a license (including CC0, CC BY, etc.) on upload. Always review before embedding/redistributing.
- **How to Use:**
  - PeerTube supports public embedding (`/videos/embed/`) and Open API for video search ([API docs](https://docs.joinpeertube.org/api-rest-api.html)).
  - Download is allowed for open-licensed content if indicated.

---

## Usage Table

| Platform      | License Type         | Embedding | API Support           | Download | Notes                       |
|---------------|---------------------|-----------|-----------------------|----------|-----------------------------|
| YouTube       | CC BY               | Yes       | Yes (API key)         | No*      | Videos can be embedded, but not always legally downloaded directly for redistribution. |
| Archive.org   | CC, Public Domain   | Yes       | No (basic search)     | Yes      | Most CC/PD; verify per-item “Rights” info.         |
| Vimeo         | CC family           | Yes       | Yes (limited/public)  | Sometimes| CC license varies—check each.                      |
| PeerTube      | CC0, CC BY, etc     | Yes       | Yes (Open API)        | Yes      | Federated, instance license policy.                |

---

## Integration Survey: Vimeo & PeerTube

---

### Vimeo

- **Direct Embedding:**  
  - All public Vimeo videos (including Creative Commons-licensed) are embeddable via `<iframe>`. No login required for viewing or embedding.  
  - Example:  
    ```
    <iframe src="https://player.vimeo.com/video/{VIDEO_ID}" width="640" height="360" frameborder="0" allowfullscreen></iframe>
    ```
- **API Access:**  
  - Two main APIs: [Vimeo Player API](https://developer.vimeo.com/player) (for controlling embeds) and [Vimeo Data API](https://developer.vimeo.com/api/reference/videos#get_videos) (for search/list queries).
  - **Public Search**: Basic unauthenticated search is available but limited. Advanced/filtering (such as search by license) requires user-level OAuth authentication.  
  - **Discovering CC Videos**:  
    - Manual: Browse at https://vimeo.com/creativecommons (by license, tags, query).
    - Via API: Not possible for completely anonymous/public clients; requires at least an OAuth "client credentials" token even for simple queries.
- **Rate Limits:**  
  - API rate limits apply. On the free tier, typically 600 requests/15 minutes for unauthenticated, and 1500 requests/15 minutes for authenticated. See [Rate Limit Docs](https://developer.vimeo.com/api/reference#rate-limiting).
- **Licensing:**  
  - CC licenses (CC BY, SA, NC, ND, etc.) are set per video. Attribution required according to license. Embedding is always allowed (except region/country restrictions), but not all videos allow download/redistribution as files (check attributes per video).
- **Drawbacks:**  
  - API for programmatic search is not fully usable without signed-in credentials—no open anonymous programmatic discovery of content or license.  
  - Some videos might be geo-blocked or have restricted embeds.
- **Integration Guidance for FixItFlow:**  
  - Embedding known CC videos is straightforward; programmatic anonymous search/filtering is not. Best for user-copied URLs or pre-curated lists.
  - If surfacing new content dynamically, consider a human moderation pipeline, as anonymous API cannot reliably filter by license.

---

### PeerTube

- **Direct Embedding:**  
  - Any public video on a PeerTube instance can be embedded via iframe without an account.  
  - Example:  
    ```
    <iframe src="https://{INSTANCE.DOMAIN}/videos/embed/{VIDEO_ID}" width="640" height="360" frameborder="0" allowfullscreen></iframe>
    ```
- **API Access:**  
  - Each PeerTube instance exposes an Open RESTful API ([API docs](https://docs.joinpeertube.org/api-rest-api.html)).  
  - Fully anonymous search by keyword, by license, by tags, by category, etc. is supported. No login or OAuth needed for public info.  
  - Example API:  
    ```
    GET https://{INSTANCE.DOMAIN}/api/v1/videos?search=repair&licence=Creative%20Commons%20BY
    ```
- **Rate Limits:**  
  - Each instance may set its own rate limits; most public/federated instances are generous if traffic is reasonable. Heavy use may trigger per-instance throttling/bans.
- **Licensing:**  
  - Video contributors pick a license (CC0, CC BY, CC BY-SA, CC BY-NC, etc.) at upload. This is returned with video objects in API responses, enabling strict filtering for redistributable content.
- **Content Discoverability:**  
  - Fully discoverable via API and searchable publicly. Each instance is independent, and federated search needs cross-instance queries or via aggregators (e.g., SepiaSearch).
- **Drawbacks:**  
  - Video pool is spread across many smaller instances, so there is no single global directory.  
  - Some instances may have variable uptime or inconsistent moderation.  
  - No uniform user experience—UI/theme varies slightly per instance.
- **Integration Guidance for FixItFlow:**  
  - Preferred choice for in-app, open-license repair videos.  
  - Query instances directly for open-licensed DIY content; maintain a vetted instance allow-list for stability/trust.  
  - Download/redistribute or re-package videos if license permits and bandwidth/storage supports it, otherwise embed.

---

### Summary Table (Vimeo vs PeerTube)

| Feature                    | Vimeo                                  | PeerTube                                      |
|----------------------------|----------------------------------------|-----------------------------------------------|
| Embedding allowed          | Yes (iframe)                           | Yes (iframe)                                  |
| API search (license filter)| Not anonymously; OAuth needed          | Yes, fully public, no OAuth required          |
| Rate limits                | Yes (tiered; 600-1500/15min)           | Per-instance; often generous for public use   |
| Licensing granularity      | Per-video (multiple CC types)          | Per-video (wider CC/PD/other, explicit)       |
| Content discoverability    | Web, manual browsing or limited API    | API—public, federated (across instances)      |
| Downloadability            | Sometimes; as set per video/author     | Yes, if license permits (check per-video API) |
| Main drawbacks             | API search is restricted w/o account   | Decentralized, smaller pools, instance admin  |
| Guidance for FixItFlow     | Best for handpicked/video-URL lists;   | Best for in-app discovery and dynamic search  |
|                            | programmatic search is limited         | API and licensing enforcement is strong       |

---

#### Rate Limits (Direct):

- **Vimeo:**  
  - Free API: 600 requests/15min per access token (unauthenticated/public); OAuth raises this to 1500/15min.
  - Embedding does NOT hit API limits (just HTML requests).

- **PeerTube:**  
  - No central limit but each instance may limit abusive clients. Most allow 100s/minute or more if usage is non-abusive.

---

#### Typical Licensing:

- **Vimeo:**  
  - Supports all Creative Commons types, set per-video. Observe video page metadata for attribution and allowed uses.
- **PeerTube:**  
  - Wide range: CC0, BY, BY-SA, NC, ND; license returns in video API data (strict filtering possible).

---

#### Recommended FixItFlow Integration Steps

- **PeerTube (recommended for open content):**
  - Query public API endpoints from known-good instances for DIY/repair keywords; filter by license in results.
  - Embed videos via iframe. Optional: download/self-host if license permits and added stability desired.
  - Provide attribution and license info in-app.
  - Maintain fallback/embed in-app experience even if remote instance is momentarily offline.

- **Vimeo:**
  - Only embed known-licensed video URLs (manual curation or user input). Inform users not all Vimeo content is open-license or redistributable.
  - Do not rely on programmatic anonymous search for broad discovery of CC content. If dynamic discovery is desired, require a backend service for token management/OAuth.
  - Respect all per-video attribution and display license metadata clearly.

- **General:**
  - Favor embedding for performance and regulatory/legal simplicity. Only download and re-serve if license and capacity permit.
  - Comply with TOS of each platform, especially for API key use.

---

## Example Queries & Starting Points

### YouTube (Manual)
- [YouTube Creative Commons search for “electronics repair”](https://www.youtube.com/results?search_query=electronics+repair&sp=EgIwAQ%253D%253D) (then set Filter → Features → Creative Commons)

### Vimeo (Manual)
- [Vimeo Creative Commons “repair” search](https://vimeo.com/creativecommons?license=cc&sort=latest&q=repair)

### Archive.org
- [DIY/Repair collection – Archive.org](https://archive.org/details/diy)

### PeerTube
- [Public instance “repair” search](https://diymedia.fr/search?search=repair)

---

## Attribution

- Always follow the attribution and redistribution terms of the selected video’s license.
- If repackaging or downloading is required, double-check the specific item’s legal terms.
