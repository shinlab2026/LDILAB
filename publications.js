const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSBL4dJvTCXAPrJTXLtM2SMQV6-YQML6a0GE9bhC08DRD_AEGPbsqcUPCS0eWm9oHTAy-70aHJ68vaa/pub?gid=0&single=true&output=csv";

const publicationsList = document.getElementById("publications-list");
const filterButtons = document.querySelectorAll(".filter-btn");

let allPublications = [];


/* =========================
   Load spreadsheet
========================= */

Papa.parse(SHEET_CSV_URL, {
  download: true,
  header: true,
  skipEmptyLines: true,

  complete: function(results) {

    allPublications = results.data

      .filter(pub => pub.title && pub.year)

      .map(pub => ({
        ...pub,
        type: (pub.type || "").trim(),
        year: (pub.year || "").trim()
      }))

      .sort((a, b) => Number(b.year) - Number(a.year));

    renderPublications(allPublications);
  },

  error: function(error) {

    publicationsList.innerHTML = `
      <p class="error-message">
        Publications could not be loaded.
        Please check the spreadsheet link.
      </p>
    `;

    console.error("CSV loading error:", error);
  }
});


/* =========================
   Render publications
========================= */

function renderPublications(publications) {

  if (!publications.length) {

    publicationsList.innerHTML =
      "<p class='no-publications'>No publications found.</p>";

    return;
  }


  /* 연도별 그룹화 */

  const groupedByYear = publications.reduce((groups, pub) => {

    const year = pub.year || "Other";

    if (!groups[year]) {
      groups[year] = [];
    }

    groups[year].push(pub);

    return groups;

  }, {});


  /* 최신 연도부터 */

  const years = Object.keys(groupedByYear)
    .sort((a, b) => Number(b) - Number(a));


  publicationsList.innerHTML = years.map((year, index) => {

    const yearItems = groupedByYear[year];

    /* 최신 연도만 기본 펼침 */
    const isOpen = index === 0;

    return `

      <div class="publication-year-group">

        <button
          class="publication-year-toggle"
          type="button"
          aria-expanded="${isOpen}"
        >

          <span class="publication-year-title">
            ${escapeHTML(year)}
          </span>

          <span class="publication-year-count">
            ${yearItems.length}
          </span>

          <span class="publication-year-icon" aria-hidden="true">
            ${isOpen ? "−" : "+"}
          </span>

        </button>


        <div
          class="publication-year-content
          ${isOpen ? "" : "is-collapsed"}"
        >

          ${yearItems.map(pub => `

            <article class="publication-item">


              <div class="publication-meta">
               
                 <span class="publication-type">
                   ${escapeHTML(pub.type || "Publication")}
                 </span>
               
                 ${pub.status
                   ? `
                     <span class="publication-status">
                       ${escapeHTML(pub.status)}
                     </span>
                   `
                   : ""
                 }
               
                 ${pub.tags
                   ? pub.tags
                       .split(";")
                       .map(tag => {
               
                         const cleanTag = tag.trim();
               
                         if (!cleanTag) return "";
               
                         const tagClass =
                           cleanTag.toUpperCase() === "SSCI"
                             ? "tag-ssci"
                             : "publication-tag";
               
                         return `
                           <span class="${tagClass}">
                             ${escapeHTML(cleanTag)}
                           </span>
                         `;
               
                       })
                       .join("")
                   : ""
                 }
               
               </div>


              <h4>
                ${escapeHTML(pub.title)}
              </h4>


              ${pub.authors ? `

                <p class="publication-authors">
                  ${highlightLabAuthor(pub.authors)}
                </p>

              ` : ""}


              ${pub.venue ? `

                <p class="publication-venue">
                  ${escapeHTML(pub.venue)}
                </p>

              ` : ""}


              ${
                pub.doi || pub.link 
                ? `

                <div class="publication-bottom">

                  <div class="publication-links">

                    ${pub.doi
                       ? `
                         <a
                           class="publication-doi"
                           href="https://doi.org/${escapeHTML(pub.doi)}"
                           target="_blank"
                           rel="noopener"
                         >
                           DOI: ${escapeHTML(pub.doi)}
                         </a>
                       `
                       : ""
                     }

                  </div>
             

            </article>

          `).join("")}

        </div>

      </div>

    `;

  }).join("");


  /* =========================
     Year toggle
  ========================= */

  publicationsList
    .querySelectorAll(".publication-year-toggle")
    .forEach(button => {

      button.addEventListener("click", () => {

        const content = button.nextElementSibling;
        const icon = button.querySelector(
          ".publication-year-icon"
        );

        const isCollapsed =
          content.classList.toggle("is-collapsed");

        button.setAttribute(
          "aria-expanded",
          String(!isCollapsed)
        );

        icon.textContent =
          isCollapsed ? "+" : "−";

      });

    });

}


/* =========================
   Filter
========================= */

filterButtons.forEach(button => {

  button.addEventListener("click", () => {

    filterButtons.forEach(btn =>
      btn.classList.remove("active")
    );

    button.classList.add("active");

    const filter = button.dataset.filter;


    if (filter === "all") {

      renderPublications(allPublications);

      return;
    }


    const filteredPublications =
      allPublications.filter(pub =>
        String(pub.type).trim() === filter
      );


    renderPublications(filteredPublications);

  });

});


/* =========================
   Escape HTML
========================= */

function escapeHTML(text) {

  return String(text)

    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================
   Highlight PI
========================= */

function highlightLabAuthor(authors) {

  return escapeHTML(authors)

    .replaceAll(
      "Yoonhee Shin",
      "<strong>Yoonhee Shin</strong>"
    )

    .replaceAll(
      "신윤희",
      "<strong>신윤희</strong>"
    );

}
