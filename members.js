const MEMBERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSBL4dJvTCXAPrJTXLtM2SMQV6-YQML6a0GE9bhC08DRD_AEGPbsqcUPCS0eWm9oHTAy-70aHJ68vaa/pub?gid=1941037728&single=true&output=csv";

const membersList = document.getElementById("members-list");

let allMembers = [];

Papa.parse(MEMBERS_CSV_URL, {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function(results) {
    allMembers = results.data
      .filter(member => member.name_ko || member.name_en)
      .filter(member => (member.status || "active").toLowerCase() !== "hidden")
      .sort((a, b) => Number(a.order || 999) - Number(b.order || 999));

    renderMembers(allMembers);
  },
  error: function(error) {
    membersList.innerHTML = `
      <p class="error-message">
        Members could not be loaded. Please check the spreadsheet link.
      </p>
    `;
    console.error("Members CSV loading error:", error);
  }
});

function renderMembers(members) {
  if (!members.length) {
    membersList.innerHTML = "<p>No members found.</p>";
    return;
  }

  const groupedByRole = members.reduce((groups, member) => {
    const group = member.group || "Members";
    if (!groups[group]) groups[group] = [];
    groups[group].push(member);
    return groups;
  }, {});

  const groupOrder = [
    "Professor",
    "Ph.D. Students",
    "Master’s Students",
    "Ph.D.",
    "Master"
  ];

  const groups = Object.keys(groupedByRole).sort((a, b) => {
    const aIndex = groupOrder.indexOf(a);
    const bIndex = groupOrder.indexOf(b);

    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });

  membersList.innerHTML = groups.map(group => `
    <div class="member-group">
      <h3 class="member-group-title">${escapeHTML(group)}</h3>

      <div class="member-grid">
        ${groupedByRole[group].map(member => `
          <article class="member-card">
            <div class="member-image-wrap">
              <img 
                src="${escapeAttribute(member.image || "images/default-profile.jpg")}" 
                alt="${escapeAttribute(member.name_en || member.name_ko || "Lab member")}" 
                class="member-image"
                onerror="this.src='images/default-profile.jpg'"
              />
            </div>

            <div class="member-info">
              <h4>
                ${escapeHTML(member.name_ko || "")}
                ${member.name_en ? `<span>${escapeHTML(member.name_en)}</span>` : ""}
              </h4>

              <p class="member-role">
                ${escapeHTML(member.role || "")}
              </p>

              ${member.interests ? `
                <div class="member-interests">
                  ${member.interests.split(";").map(item => `
                    <span>${escapeHTML(item.trim())}</span>
                  `).join("")}
                </div>
              ` : ""}

              <div class="member-links">
              
              ${member.email ? `
              <a 
                class="member-email"
                href="mailto:${escapeAttribute(member.email)}"
              >
                <span class="email-label">Email</span>
                ${escapeHTML(member.email)}
              </a>
              ` : ""}
              
              ${member.website ? `
              <a href="${escapeAttribute(member.website)}" target="_blank" rel="noopener">
                Website
              </a>
              ` : ""}
              
              </div>
            </div>
          </article>
        `).join("")}
      </div>
    </div>
  `).join("");
}

function escapeHTML(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
