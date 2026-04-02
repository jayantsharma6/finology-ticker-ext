/**
 * MatchService
 *
 * Matches extracted text chunks against the company maps
 * built from the company list.
 *
 * Pure logic — no DOM, no storage, no chrome APIs.
 * Input:  chunks (string[]), companyMaps ({ map1, map2 })
 * Output: ordered array of matched companies, in order of first appearance,
 *         deduplicated by company ID.
 *
 * Tokenisation:
 *   - Split on spaces
 *   - Strip leading and trailing non-alphanumeric chars (keep hyphens)
 *   - Lowercase
 */
const MatchService = (function () {
    'use strict';

    /**
     * Strips leading and trailing punctuation from a token.
     * Keeps hyphens and alphanumeric characters within the word.
     * "Infosys,"  → "infosys"
     * "TCS."      → "tcs"
     * "co-op,"    → "co-op"
     */
    function _cleanToken(token) {
        return token
            .toLowerCase()
            .replace(/^[^a-z0-9-]+/i, '')   // strip leading non-alphanumeric/hyphen
            .replace(/[^a-z0-9-]+$/i, '');  // strip trailing non-alphanumeric/hyphen
    }

    /**
     * Tokenises a chunk string into an ordered array of cleaned tokens.
     * Empty tokens (produced by multiple spaces or pure punctuation) are removed.
     *
     * "Infosys, TCS and Wipro." →
     * ["infosys", "tcs", "and", "wipro"]
     */
    function _tokenise(chunk) {
        return chunk
            .split(' ')
            .map(_cleanToken)
            .filter(function (t) { return t.length > 0; });
    }

    /**
     * Core matching function.
     *
     * @param  {string[]}            chunks      — raw text chunks from ExtractChunk
     * @param  {{ charFirstWord, firstWordMap }}      companyMaps — built by DataService._buildCompanyMaps
     * @returns {Array<{ id, name, ticker }>}    — ordered by first appearance, deduplicated
     */
    function matchChunks(chunks, companyMaps) {
        const { charFirstWord, firstWordMap } = companyMaps;

        const found = new Set();   // id → { id, name, ticker }

        chunks.forEach(function (chunk) {
            const tokens = _tokenise(chunk);
            let i = 0;

            while (i < tokens.length) {
                const token = tokens[i];
                const firstChar = token[0];

                // Gate 1 — first char must exist in charFirstWord
                if (!firstChar || !charFirstWord.has(firstChar) || !charFirstWord.get(firstChar).has(token)) {
                    i++;
                    continue;
                }

                // Gate 2 — token must exist as a first word in firstWordMap
                const candidates = firstWordMap.get(token);
                if (!candidates || candidates.size === 0) {
                    i++;
                    continue;
                }

                let matched = false;

                // Try each candidate — longest match first to avoid partial matches
                // e.g. "Tata Consultancy Services Ltd" before "Tata Motors Ltd"
                const sortedCandidates = Array.from(candidates).sort(function (a, b) {
                    return b[0].split(' ').length - a[0].split(' ').length;
                });

                for (const [matchText, id] of sortedCandidates) {

                    const wordCount = matchText.split(' ').length;

                    if (i + wordCount > tokens.length) continue;


                    const joined = tokens.slice(i, i + wordCount).join(' ');

                    if (joined === matchText) {
                        // Match found — add if not already in results
                        if (!found.has(id)) {
                            found.add(id);
                            i += wordCount;   // skip matched tokens
                            matched = true;
                            break;
                        }
                    }
                }

                if (!matched) i++;
            }
        });

        return Array.from(found.values());
    }

    return Object.freeze({
        matchChunks,
    });

})();