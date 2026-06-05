# Exonumist.com

Exonumist.com is a data-driven catalog of New York City transportation tokens and related exonumia from the collection of Keith Baron.

The site focuses on documenting, organizing, and sharing transportation-related tokens, including Atwood-Coffee listed tokens, unlisted varieties, patterns, counterfeits, errors, club tour issues, presentation pieces, and related material.

---

## Technology

- Eleventy (11ty)
- Nunjucks templates
- JSON data files
- Vanilla JavaScript
- Static site generation

---

## Site Organization

### Collection

The collection is organized primarily by borough:

- Manhattan
- Brooklyn
- Bronx
- Queens
- Staten Island

Each token record belongs to a borough and may also belong to one or more special-purpose groups.

### Groups

Groups are cross-cutting collections that span borough boundaries.

Examples:

- New York & Harlem Railroad
- Errors & Oddities

A token belongs to a single borough but may belong to multiple groups.

Example:

```json
{
  "borough": "Manhattan",
  "groups": ["errors", "nyhrr"]
}
```

### Spotlight

The Spotlight section highlights featured collecting areas and historically significant groups.

Groups appear in Spotlight by setting:

```json
{
  "section": "spotlight"
}
```

### Featured Collections

Groups may also be featured in the homepage hero area:

```json
{
  "featured": true
}
```

---

## Data Architecture

### Token Records

Token data is stored in:

```text
src/_data/tokens/
```

Current files:

```text
bronx.json
brooklyn.json
manhattan.json
queens.json
staten-island.json
```

### Lookups

Reference tables and display labels:

```text
src/_data/lookups.json
```

### Groups

Cross-cutting collections:

```text
src/_data/groups.json
```

### Browse View

Browse filters and presentation logic:

```text
src/_data/browseView.js
```

Responsible for filter generation, display ordering, and browse-page view models.

### Token Detail View

Shared token-detail rendering helpers:

```text
src/_data/tokenDetailView.js
```

Responsible for token summaries, detail sections, badges, metadata formatting, and display presentation.

---

## Images

### Full-Size Images

```text
src/assets/images/token/
```

Naming convention:

```text
630-a_o.jpg
630-a_r.jpg

631-e_o.jpg
631-e_r.jpg

cf-0001_o.jpg
cf-0001_r.jpg
```

Where:

- `_o` = obverse
- `_r` = reverse

### Thumbnails

```text
src/assets/images/thumb/
```

Thumbnail filenames mirror their source image names.

Example:

```text
630-a_o.webp
630-a_r.webp
```

---

## Image Strategy

Full-size token images are stored separately from generated thumbnails.

Thumbnail filenames mirror the source image names and are intended to be regenerated automatically when source images change.

---

## Main Pages

### Collection

Collection landing page and primary entry point to the site.

### Browse

Interactive filtering and searching across the collection.

### Available

Inventory currently available for sale or trade.

### Spotlight

Featured collecting areas and special-interest groups.

### About

Information about the collection and collector.

### Contact

Contact information and inquiry options.

---

## Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run start
```

Build production site:

```bash
npm run build
```

---

## Design Principles

- Data-driven architecture
- Generic templates
- Minimal special-case logic
- Boroughs are primary organization
- Groups are cross-cutting collections
- Boroughs represent geographic/catalog organization
- Groups represent cross-cutting collections and special collecting interests
- Templates should remain simple and reusable
- Collection data should drive presentation whenever possible
- Favor view-model and data-layer solutions over template complexity
- Keep schema definitions consistent and predictable
