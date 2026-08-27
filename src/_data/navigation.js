const site = require("./site.json");

const primaryLinks = [
  {
    label: "Collection",
    url: "/",
    activeUrls: ["/"]
  },
  {
    label: "Search",
    url: "/search/",
    activeUrls: ["/search/"]
  },
  {
    label: "Available",
    url: "/available/",
    activeUrls: ["/available/", "/available/print/"],
    setting: "showAvailableInNavigation"
  },
  {
    label: "About",
    url: "/about/",
    activeUrls: ["/about/"]
  },
  {
    label: "Contact",
    url: "/contact/",
    activeUrls: ["/contact/"]
  }
];

function visibleLinks(links) {
  return links.filter((link) => {
    if (!link.setting) return true;

    return site[link.setting] === true;
  });
}

module.exports = {
  primary: visibleLinks(primaryLinks),
  footer: visibleLinks(primaryLinks)
};
