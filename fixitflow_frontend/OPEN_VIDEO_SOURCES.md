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

### Vimeo

- **Search:** Yes, via web and API, but advanced API requires OAuth (not anonymous).
- **Embed:** Full iframe/embed support for public videos.
- **Embedding Example:**
  ```
  <iframe src="https://player.vimeo.com/video/{VIDEO_ID}" ... ></iframe>
  ```
- **API Link:** https://developer.vimeo.com/

### PeerTube

- **Search:** Public RESTful API ([API docs](https://docs.joinpeertube.org/api-rest-api.html)).
- **Embed:** All public videos embeddable via instance’s `videos/embed/` endpoint.
- **Embedding Example:**
  ```
  <iframe src="https://peertube.instance/videos/embed/{VIDEO_ID}" ... ></iframe>
  ```
- **API Link:** https://docs.joinpeertube.org/api-rest-api.html

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
