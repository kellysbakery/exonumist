const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const nunjucks = require("nunjucks");
const view = require("../src/_data/tokenDetailView");
const pages = require("../src/_data/collectionTokenPages");
const lookups = require("../src/_data/lookups.json");

const env = new nunjucks.Environment(
  new nunjucks.FileSystemLoader(path.join(__dirname, "../src/_includes")),
  { autoescape: true }
);
require("../.eleventy.js")({
  addPassthroughCopy() {},
  addFilter(name, filter) { env.addFilter(name, filter); }
});

function renderDetail(token) {
  return env.render("token-detail.njk", {
    token,
    detailView: view.buildTokenDetailView(token, { lookups }),
    lookups,
    site: { siteUrl: "https://exonumist.com" },
    page: { url: "/collection/test/example/" }
  });
}

test("all catalog records receive factual, unique descriptions", () => {
  const descriptions = pages.map(({ token }) => {
    const description = view.buildMetaDescription(token, { lookups });
    const identifier = view.formatCatalogCrossReferenceLines(token)[0] || token.collectionId;
    assert.ok(description.includes(token.title));
    assert.ok(description.includes(identifier));
    assert.ok(description.includes(token.borough));
    assert.ok(description.includes(`${token.size} mm`));
    assert.doesNotMatch(description, /\b(?:undefined|null)\b/);
    assert.ok(description.length <= 160);
    return description;
  });
  assert.equal(descriptions.length, 135);
  assert.equal(new Set(descriptions).size, 135);
});

test("structured material and counterstamp distinctions survive description generation", () => {
  for (const id of ["EXO-NY-MAN-0002", "EXO-NY-MAN-0071", "EXO-NY-MAN-0072"]) {
    const token = pages.find((page) => page.token.collectionId === id).token;
    const description = view.buildMetaDescription(token, { lookups });
    assert.ok(description.toLowerCase().includes(token.counterstamp?.toLowerCase() || token.variantTrait.toLowerCase()));
  }
  const title = "A deliberately long issuer name ".repeat(8).trim();
  assert.ok(view.buildMetaDescription({ title, borough: "Queens", issued: null }).includes(title));
  assert.doesNotMatch(view.buildMetaDescription({ title: "Example" }), /undefined|null|Issued/);
});

test("the actual computed description escapes HTML exactly once", () => {
  const template = fs.readFileSync(path.join(__dirname, "../src/collection-token.njk"), "utf8");
  const expression = template.match(/^  description: "(.*)"$/m)[1];
  const description = env.renderString(expression, {
    tokenDetailView: view,
    collectionPage: { token: { title: 'A & B "token" <example>', collectionId: "TEST" } },
    lookups
  });
  const html = env.renderString('<meta name="description" content="{{ description }}">', { description });
  assert.match(html, /A &amp; B &quot;token&quot; &lt;example&gt;/);
  assert.doesNotMatch(html, /&amp;amp;|<example>/);
});

test("usage preserves wording and suppresses only existing matching phrases", () => {
  const token = { usage: "Used by Green Bus Lines.", notes: "Used by Green Bus Lines. Became obsolete in 1950." };
  assert.equal(view.buildTokenDetailView(token).usage, "");
  assert.equal(view.buildTokenDetailView({ ...token, notes: "Used elsewhere." }).usage, token.usage);
  assert.equal(view.buildTokenDetailView({ usage: "Fare", notes: "Fares increased." }).usage, "Fare");
  assert.equal(view.buildTokenDetailView({ usage: "  " }).usage, "");
});

test("references keep bibliographic text and allow safe, available links", () => {
  const sources = [
    "A plain bibliography entry",
    { title: "Catalog", issue: "Volume 2", page: 377, note: "Original wording.", url: "https://example.com/catalog?a=1&b=2" },
    ...["javascript:alert(1)", "data:text/html,test", "//example.com/test", "https://", "/resources/farebox/1998-05.pdf"].map((url) => ({ title: "Reference", url })),
    { title: "Local asset", url: "/assets/images/site/exonumist-banner.png" },
    null, {}, { title: " ", note: " " }
  ];
  const refs = view.buildTokenDetailView({ sources }).references;
  assert.equal(refs.length, 8);
  assert.equal(refs[0].citation, sources[0]);
  assert.equal(refs[1].citation, "Catalog, Volume 2, p. 377");
  assert.equal(refs[1].note, sources[1].note);
  assert.equal(refs[1].url, sources[1].url);
  assert.ok(refs.slice(2, 7).every((ref) => ref.url === ""));
  assert.equal(refs[7].url, sources[7].url);
});

test("new visible text is escaped and missing fields produce no empty sections", () => {
  const html = renderDetail({
    usage: 'A & B <img onerror="test">',
    sources: [{ title: '<script>alert("test")</script>', issue: "A & B", note: "<b>Original</b>", url: "https://example.com/?a=1&b=2" }]
  });
  assert.match(html, /A &amp; B &lt;img onerror=&quot;test&quot;&gt;/);
  assert.match(html, /&lt;script&gt;alert\(&quot;test&quot;\)&lt;\/script&gt;/);
  assert.match(html, /&lt;b&gt;Original&lt;\/b&gt;/);
  assert.match(html, /href="https:\/\/example.com\/\?a=1&amp;b=2"/);
  assert.doesNotMatch(html, /<img onerror=|<script>alert/);
  const empty = renderDetail({ usage: null, sources: [null, {}, " "] });
  assert.doesNotMatch(empty, /<h2>(?:Notes|Usage|References)<\/h2>/);
});
