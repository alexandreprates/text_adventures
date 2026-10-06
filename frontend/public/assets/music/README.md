# Music credits

Game created by Alexandre Prates, with development assistance from OpenAI Codex.

Both recordings are by Kevin MacLeod (https://incompetech.com), licensed under
Creative Commons: By Attribution 4.0:
https://creativecommons.org/licenses/by/4.0/

| File | Title | ISRC | Use |
| --- | --- | --- | --- |
| `village-consort.mp3` | Village Consort | USUAN1700007 | Town and its services |
| `darkest-child-var-a.mp3` | Darkest Child var A | USUAN1100784 | Dungeon, including combat |

Source pages:
- https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1700007
- https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100784

Original downloads (retrieved 2026-10-06):
- https://incompetech.com/music/royalty-free/mp3-royaltyfree/Village%20Consort.mp3
- https://incompetech.com/music/royalty-free/mp3-royaltyfree/Darkest%20Child%20var%20A.mp3

The MP3 recordings are unmodified. The player repeats them and applies volume
fades at runtime. These music licenses are separate from the game's source code.

Music starts after interaction, at 25% gain, and pauses while the page is hidden.
The header speaker button saves the enabled/muted preference in local storage.
The adjacent information button provides in-game attribution and license links.
Files stream through media elements and Web Audio gains rather than being fully
decoded into JavaScript buffers. No third-party audio requests are made at runtime.
