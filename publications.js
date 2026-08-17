const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSBL4dJvTCXAPrJTXLtM2SMQV6-YQML6a0GE9bhC08DRD_AEGPbsqcUPCS0eWm9oHTAy-70aHJ68vaa/pub?gid=0&single=true&output=csv";

const publicationsList = document.getElementById("publications-list");
const filterButtons = document.querySelectorAll(".filter-btn");

let allPublications = [];

Papa.parse(SHEET_CSV_URL, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function(results) {
    allPublications = results.data
      .filter(pub => pub.title && pub.year)
      .sort((a, b) => Number(b.year) - Number(a.year));

    renderPublications(allPublications);
  },
  error: function(error) {
    publicationsList.innerHTML = `
      <p class="error-message">
        Publications could not be loaded. Please check the spreadsheet link.
      </p>
    `;
    console.error("CSV loading error:", error);
  }
});

function renderPublications(publications) {
  if (!publications.length) {
    publicationsList.innerHTML = "<p>No publications found.</p>";
    return;
  }

  const groupedByYear = publications.reduce((groups, pub) => {
    const year = pub.year || "Other";
    if (!groups[year]) groups[year] = [];
    groups[year].push(pub);
    return groups;
  }, {});

  const years = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a));

  publicationsList.innerHTML = years.map(year => `
    <div class="publication-year-group">
      <h3 class="publication-year">${year}</h3>

      ${groupedByYear[year].map(pub => `
        <article class="publication-item">
          <div class="publication-meta">
            <span>${escapeHTML(pub.type || "Publication")}</span>
            ${pub.status ? `<span>${escapeHTML(pub.status)}</span>` : ""}
          </div>

          <h4>${escapeHTML(pub.title)}</h4>

          <p class="publication-authors">
            ${highlightLabAuthor(pub.authors || "")}
          </p>

          <p class="publication-venue">
            ${escapeHTML(pub.venue || "")}
          </p>

          <div class="publication-links">
            ${pub.doi ? `<a href="https://doi.org/${escapeHTML(pub.doi)}" target="_blank" rel="noopener">DOI</a>` : ""}
            ${pub.link ? `<a href="${escapeHTML(pub.link)}" target="_blank" rel="noopener">Link</a>` : ""}
          </div>

          ${pub.tags ? `
            <div class="publication-tags">
              ${pub.tags.split(";").map(tag => {
                const cleanTag = tag.trim();
                const tagClass =
                  cleanTag.toUpperCase() === "SSCI" ? "tag-ssci" : "";
          
                return `
                  <span class="${tagClass}">
                    ${escapeHTML(cleanTag)}
                  </span>
                `;
              }).join("")}
            </div>
          ` : ""}
        </article>
      `).join("")}
    </div>
  `).join("");
}

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    const filter = button.dataset.filter;

    if (filter === "all") {
      renderPublications(allPublications);
    } else {
      const filteredPublications = allPublications.filter(pub => pub.type === filter);
      renderPublications(filteredPublications);
    }
  });
});

function escapeHTML(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function highlightLabAuthor(authors) {
    return escapeHTML(authors)
      .replaceAll("Yoonhee Shin", "<strong>Yoonhee Shin</strong>")
      .replaceAll("신윤희", "<strong>신윤희</strong>");
    }
}
