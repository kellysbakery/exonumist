# Exonumist starter

This starter project uses:
- Eleventy
- data-driven templates
- official token data split by A/C section
- lookup tables for Atwood-Coffee shorthand
- predictable image path conventions

## Commands

npm install
npm run start
npm run build

## Image conventions

Official tokens:
- src/images/official/{sec}/{sec}-{code-lower}{-var-lower?}_o.jpg
- src/images/official/{sec}/{sec}-{code-lower}{-var-lower?}_r.jpg

Examples:
- NY630A -> src/images/official/630/630-a_o.jpg
- NY630Aa -> src/images/official/630/630-a-a_o.jpg
- NY630AA -> src/images/official/630/630-aa_o.jpg
- NY630AAa -> src/images/official/630/630-aa-a_o.jpg

Unlisted:
- src/images/unlisted/{siteId-lower}_o.jpg
- src/images/unlisted/{siteId-lower}_r.jpg


Site scope: New York City transportation tokens and related pieces, including official A/C listings, unlisted items, oddities, patterns, club tour issues, and presentation material.
