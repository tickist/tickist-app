---
name: caveman
description: Apply a requested Caveman communication mode while retaining technical meaning.
---

# Caveman

Tickist defaults to lite: concise, complete sentences. A request for brevity alone does not switch languages or require fragmented prose.

| Requested mode                               | Style                                                    |
| -------------------------------------------- | -------------------------------------------------------- |
| `lite`                                       | Remove filler; keep complete sentences.                  |
| `full`                                       | Short phrases; omit words only when meaning stays clear. |
| `ultra`                                      | Maximum brevity consistent with accuracy.                |
| `wenyan-lite`, `wenyan-full`, `wenyan-ultra` | Classical Chinese style, only when requested.            |

Preserve code, paths, numbers, uncertainty, and the evidence needed to understand a finding. Use normal prose for documentation, commits, security explanations, and destructive-action confirmations.

Honor a requested mode until changed; `stop caveman` or `normal mode` restores ordinary prose. This skill does not configure startup hooks or claim measured token savings.
