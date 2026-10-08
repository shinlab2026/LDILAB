const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSBL4dJvTCXAPrJTXLtM2SMQV6-YQML6a0GE9bhC08DRD_AEGPbsqcUPCS0eWm9oHTAy-70aHJ68vaa/pub?gid=0&single=true&output=csv";

const publicationsList = document.getElementById("publications-list");
const projectHistoryList = document.getElementById("project-history-list");
const filterButtons = document.querySelectorAll(".filter-btn");

let allPublications = [];
let allProjects = [];


/* =========================
   Load spreadsheet
========================= */

Papa.parse(SHEET_CSV_URL, {
  download: true,
  header: true,
  skipEmptyLines: true,

  complete: function(results) {

    const allEntries = results.data

      .filter(pub => pub.title && pub.year)

      .map((pub, sheetRowIndex) => ({
        ...pub,
        type: (pub.type || "").trim(),
        year: (pub.year || "").trim(),
        sheetRowIndex
      }))

      .sort((a, b) => Number(b.year) - Number(a.year));

    allProjects = allEntries
      .filter(pub => pub.type === "Project")
      .sort((a, b) => {
        const yearDifference = Number(b.year) - Number(a.year);

        return yearDifference || b.sheetRowIndex - a.sheetRowIndex;
      });
    allPublications = allEntries.filter(pub => pub.type !== "Project");

    renderPublications(allPublications);
    renderProjectHistory(allProjects);
  },

  error: function(error) {

    publicationsList.innerHTML = `
      <p class="error-message">
        Publications could not be loaded.
        Please check the spreadsheet link.
      </p>
    `;

    if (projectHistoryList) {
      projectHistoryList.innerHTML = `
        <p class="error-message">
          Project history could not be loaded.
          Please check the spreadsheet link.
        </p>
      `;
    }

    console.error("CSV loading error:", error);
  }
});


/* =========================
   Render project history
========================= */

function renderProjectHistory(projects) {
  if (!projectHistoryList) return;

  if (!projects.length) {
    projectHistoryList.innerHTML =
      "<p class='no-publications'>No project history found.</p>";
    return;
  }

  projectHistoryList.innerHTML = projects.map(project => {
    const status = (project.status || "").trim();
    const normalizedStatus = status.toLowerCase();
    const statusClass = normalizedStatus === "ongoing"
      ? "is-ongoing"
      : normalizedStatus === "completed"
        ? "is-completed"
        : "is-unknown";

    return `
      <article class="project-history-item">
        <h4 class="project-history-title">
          ${escapeHTML(project.title)}
        </h4>

        <p class="project-history-organization">
          <span class="project-history-mobile-label">Organization</span>
          ${escapeHTML(project.venue || "—")}
        </p>

        <p class="project-history-period">
          <span class="project-history-mobile-label">Period</span>
          ${escapeHTML(project.year)}
        </p>

        <p class="project-history-status">
          <span class="project-history-mobile-label">Status</span>
          <span class="project-status-badge ${statusClass}">
            ${escapeHTML(status || "—")}
          </span>
        </p>
      </article>
    `;
  }).join("");
}


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

    const yearItems = [...groupedByYear[year]].reverse();

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
                          cleanTag.toUpperCase() === "SSCI" || cleanTag === "연구책임자"
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
                  ${escapeHTML(pub.authors)}
                </p>

              ` : ""}


              ${pub.venue ? `
                 <p class="publication-venue">
                   ${escapeHTML(pub.venue)}
                 </p>
               ` : ""}
               
               
               ${pub.doi || pub.link
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
               
                       ${pub.link
                         ? `
                           <a
                             href="${escapeHTML(pub.link)}"
                             target="_blank"
                             rel="noopener"
                           >
                             Link
                           </a>
                         `
                         : ""
                       }
               
                     </div>
               
                   </div>
                 `
                 : ""
               }
               
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
