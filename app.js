(() => {
  const storageKey = "campus-stores.shift.v2";
  const oldStorageKey = "campus-stores.shift.v1";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);

  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      due: "Fri 8 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      due: "Sat 10 am",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      due: "Sat noon",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
    },
  ];

  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    {
      id: "PR-06",
      type: "HDMI projector",
      model: "Epson EB-X49",
      bin: "Workshop",
      repair: true,
    },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    {
      id: "AD-12",
      type: "USB-C → HDMI adapter",
      model: "Belkin AVC002",
      bin: "C4",
    },
    {
      id: "AD-15",
      type: "USB-C → HDMI adapter",
      model: "Anker A8312",
      bin: "C4",
    },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];

  const people = [
    "Isha Rao",
    "Kabir Sen",
    "Leela Das",
    "Tara Shah",
    "Dev Menon",
  ];

  const shifts = [
    {
      time: "Friday · 3:45 pm",
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
      expectedAction: "Issue kit (PR-04, SP-02, AD-12) to Kabir Sen for RQ-214.",
    },
    {
      time: "Friday · 7:30 pm",
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
      expectedAction: "Record partial return for RQ-214: receive PR-04 & SP-02; assign AD-12 to Leela Das.",
    },
    {
      time: "Saturday · 9:00 am",
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
      next: "",
      expectedAction: "Receive AD-12 from Leela Das, verify serial ID, and close slip L-404.",
    },
  ];

  const pages = [
    ["Requests", "clipboard-list"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
    ["Product decision", "file-text"],
  ];

  const original = () => ({
    version: 2,
    tab: "Requests",
    phase: 0,
    selected: "",
    filter: "All items",
    loans: [
      {
        num: 401,
        req: "RQ-209",
        asset: "MI-09",
        who: "Tara Shah",
        due: "Sat 10 am",
        back: false,
        custodian: "Tara Shah",
        expectedReturn: "Sat 10 am",
        reason: "Rehearsal runs into the evening",
        history: [{ action: "Issued", time: "Friday · 3:30 pm", by: "Tara Shah" }],
      },
    ],
    notes: [],
    handovers: [],
    editing: false,
    onlyOpen: true,
    notice: "Sample shift · All records are fictional.",
    modal: null,
  });

  let s = original();

  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);

  const esc = (x) =>
    String(x ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );

  const opts = (list) =>
    list
      .map(([v, t]) => '<option value="' + esc(v) + '">' + esc(t) + "</option>")
      .join("");

  const btn = (label, act, val = "", style = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '">' +
    esc(label) +
    "</button>";

  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2>' +
    title +
    "</h2><small>" +
    sub +
    "</small></div>" +
    control +
    "</div>";

  const row = (label, sub, right) =>
    '<div class="row"><div><strong>' +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    "</small></div><div>" +
    right +
    "</div></div>";

  const badge = (t, statusClass = "") =>
    '<span class="tag ' + statusClass + '">' + esc(t) + "</span>";

  function getLoanStatus(l) {
    if (l.back) return { text: "On shelf", cls: "good" };
    if (s.phase === 2 && l.expectedReturn && (l.expectedReturn.includes("Sat 9 am") || l.expectedReturn.includes("Sat 9:00 am"))) {
      return { text: "Return expected", cls: "status-expected" };
    }
    if (s.phase === 2 && l.due && l.due.includes("Fri 8 pm") && !l.expectedReturn?.includes("Sat")) {
      return { text: "Overdue", cls: "status-overdue" };
    }
    if (l.custodian && l.custodian !== l.who) {
      return { text: "Partially returned", cls: "status-partial" };
    }
    return { text: "On loan", cls: "status-onloan" };
  }

  function renderPulse() {
    const activeOut = s.loans.filter((l) => !l.back);
    const pendingHandovers = s.handovers.filter((h) => !h.resolved);
    const curShift = shifts[s.phase];

    let quickActionHtml = "";
    if (s.phase === 2) {
      const ad12Loan = s.loans.find((l) => l.asset === "AD-12" && !l.back);
      if (ad12Loan) {
        quickActionHtml = `
          <div style="margin-top:6px;">
            ${btn("Confirm receipt of AD-12 from Leela", "return", String(ad12Loan.num), "primary")}
          </div>
        `;
      }
    }

    return `
      <div class="pulse-bar" role="region" aria-label="Shift overview">
        <div class="pulse-card pulse-alert">
          <small>What to do now?</small>
          <strong>${esc(curShift.expectedAction)}</strong>
          ${quickActionHtml}
        </div>
        <div class="pulse-card">
          <small>Which items are still outstanding?</small>
          <strong>${activeOut.length} active physical unit(s) on loan</strong>
          <span style="font-size:11px;color:var(--quiet);margin-top:2px;">
            ${activeOut.map((l) => l.asset + " (" + (l.custodian || l.who) + ")").join(", ") || "None"}
          </span>
        </div>
        <div class="pulse-card">
          <small>What must the next shift know?</small>
          <strong>${pendingHandovers.length} active handover record(s)</strong>
          <span style="font-size:11px;color:var(--quiet);margin-top:2px;">
            ${pendingHandovers[0]?.summary.split("\n")[0] || "No urgent shift handovers"}
          </span>
        </div>
      </div>
    `;
  }

  function requestPage() {
    let html = head(
      "Approved requests",
      "Student Activities Office · 3 approved forms",
    );
    if (s.selected) {
      const r = getReq(s.selected);
      const activeForReq = s.loans.filter((l) => l.req === r.id && !l.back);
      const totalIssuedForReq = s.loans.filter((l) => l.req === r.id);

      html +=
        btn("← Back to requests", "close", "", "mb-2") +
        '<div class="record"><small>' +
        r.id +
        " · Approved Request</small><h3>" +
        r.event +
        "</h3><p><b>Club:</b> " +
        r.club +
        " · <b>Filed by:</b> " +
        r.owner +
        "</p><p><b>Approved due time:</b> " +
        r.due +
        "</p><p><b>Equipment approved for collection:</b></p><ul>" +
        r.items.map((x) => "<li>" + x + "</li>").join("") +
        "</ul><p><b>Form Note:</b> " +
        r.note +
        "</p></div>";

      if (totalIssuedForReq.length > 0) {
        html += '<div style="margin-top:16px;"><h4>Issued Units for this Request</h4>';
        for (const l of totalIssuedForReq) {
          const a = getAsset(l.asset);
          const st = getLoanStatus(l);
          html += row(
            l.asset + " · " + (a ? a.type : "Equipment"),
            `Slip L-${l.num} · Model: ${a ? a.model : ""} · Custodian: ${l.custodian || l.who} · Due: ${l.expectedReturn || l.due}`,
            badge(st.text, st.cls),
          );
        }
        html += "</div>";

        if (activeForReq.length > 0) {
          html +=
            '<div style="margin-top:12px;">' +
            btn(
              "Start Guided Return for " + r.id,
              "open-guided-return",
              r.id,
              "primary",
            ) +
            "</div>";
        }
      } else {
        html +=
          '<div style="margin-top:12px;">' +
          btn("Issue units on Loan Register", "tab", "Loan register", "primary") +
          "</div>";
      }
    } else {
      html += requests
        .map((r) => {
          const activeForReq = s.loans.filter((l) => l.req === r.id && !l.back);
          const totalForReq = s.loans.filter((l) => l.req === r.id);
          let stat = badge("Not issued", "");
          if (activeForReq.length > 0 && activeForReq.length < totalForReq.length) {
            stat = badge("Partially returned", "status-partial");
          } else if (activeForReq.length > 0) {
            stat = badge("On loan", "status-onloan");
          } else if (totalForReq.length > 0) {
            stat = badge("All returned", "good");
          }

          return row(
            r.event,
            `${r.id} · ${r.club} · Due ${r.due}`,
            `<div style="display:flex;gap:8px;align-items:center;">${stat}${btn(
              "View details",
              "request",
              r.id,
            )}</div>`,
          );
        })
        .join("");
    }
    return html;
  }

  function inventory() {
    let html = head(
      "Inventory",
      "Physical units · home shelf and operational availability",
    );
    html +=
      '<div class="buttons"><label>Show <select data-filter>' +
      opts(
        [
          "All items",
          "On shelf",
          "On loan",
          "Partially returned",
          "Return expected",
          "Overdue",
          "In repair",
        ].map((f) => [f, f]),
      ) +
      "</select></label></div>";

    for (const a of assets) {
      const activeLoan = out(a.id);
      let status = "On shelf";
      let statusClass = "good";

      if (a.repair) {
        status = "In repair";
        statusClass = "status-repair";
      } else if (activeLoan) {
        const st = getLoanStatus(activeLoan);
        status = st.text;
        statusClass = st.cls;
      }

      if (s.filter !== "All items" && s.filter !== status) continue;

      const sub = `${a.model} · Bin ${a.bin}${
        activeLoan
          ? ` · With ${activeLoan.custodian || activeLoan.who} (Slip L-${activeLoan.num})`
          : ""
      }`;

      html += row(a.id + " · " + a.type, sub, badge(status, statusClass));
    }
    return html;
  }

  function register() {
    let html = head(
      "Loan register",
      "One slip per physical unit",
      s.editing
        ? btn("Cancel", "cancel")
        : btn("New issue slip", "new", "", "primary"),
    );

    if (s.editing) {
      const available = assets.filter((a) => !a.repair && !out(a.id));
      const select = (label, key, options) =>
        "<label><span>" +
        label +
        '</span><select name="' +
        key +
        '" required><option value="">Select…</option>' +
        opts(options) +
        "</select></label>";

      return (
        html +
        '<form data-issue><div class="form">' +
        select(
          "Approved request",
          "req",
          requests.map((r) => [r.id, r.id + " · " + r.club + " (" + r.event + ")"]),
        ) +
        select(
          "Unit leaving desk",
          "asset",
          available.map((a) => [a.id, a.id + " · " + a.type + " [" + a.model + "]"]),
        ) +
        select(
          "Collected by",
          "who",
          people.map((p) => [p, p]),
        ) +
        select(
          "Return by",
          "due",
          ["Fri 8 pm", "Sat 9 am", "Sat 10 am", "Sat noon"].map((d) => [d, d]),
        ) +
        '</div><button type="submit" class="primary">Save issue slip</button></form>'
      );
    }

    html +=
      '<div class="buttons">' +
      ["Outstanding", "All slips"]
        .map(
          (v, i) =>
            '<button type="button" data-action="scope" data-val="' +
            i +
            '" aria-pressed="' +
            (s.onlyOpen === (i === 0)) +
            '">' +
            v +
            "</button>",
        )
        .join("") +
      "</div>";

    const shown = s.loans
      .filter((l) => !s.onlyOpen || !l.back)
      .slice()
      .reverse();

    if (!shown.length) {
      html += "<p>No outstanding slips.</p>";
      return html;
    }

    for (const l of shown) {
      const a = getAsset(l.asset);
      const st = getLoanStatus(l);
      let actionControl = "";

      if (l.back) {
        actionControl = badge(st.text, st.cls);
      } else {
        const isExpectedNow = st.text === "Return expected";
        actionControl =
          '<div style="display:flex;gap:6px;align-items:center;">' +
          badge(st.text, st.cls) +
          btn("Guided return", "open-guided-return", l.req) +
          btn("Close slip", "return", String(l.num), isExpectedNow ? "primary" : "") +
          "</div>";
      }

      const historySummary = (l.history || [])
        .map((h) => `<li>${esc(h.time)}: ${esc(h.action)} (${esc(h.by || "")})</li>`)
        .join("");

      html +=
        '<div class="row"><div><strong>L-' +
        l.num +
        " · " +
        l.asset +
        " (" +
        (a ? a.type : "") +
        ")</strong><small>" +
        l.req +
        " · Initial borrower: " +
        l.who +
        (l.custodian && l.custodian !== l.who
          ? ' · <b style="color:var(--sel);">Current custodian: ' + l.custodian + "</b>"
          : "") +
        " · Due: " +
        (l.expectedReturn || l.due) +
        (l.reason ? ` · Reason: ${esc(l.reason)}` : "") +
        "</small>" +
        (historySummary ? `<ul class="history-list">${historySummary}</ul>` : "") +
        "</div><div>" +
        actionControl +
        "</div></div>";
    }

    return html;
  }

  function deskbook() {
    let html = head(
      "Desk book",
      "Messages from clubs and structured shift handovers",
    );

    const entries = [
      {
        time: "Friday · 3:20 pm",
        author: "Isha Rao · Film Society",
        body: "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
        type: "club",
      },
      {
        time: "Friday · 3:30 pm",
        author: "Tara Shah · Debate Union",
        body: "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
        type: "club",
      },
    ];

    if (s.phase >= 1) {
      entries.push({
        time: "Friday · 7:30 pm",
        author: "Kabir Sen · Film Society",
        body: "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
        type: "club",
      });
    }

    for (const h of s.handovers) {
      entries.push({
        time: h.time,
        author: "Shift Handover · " + h.reqId,
        body: h.summary,
        type: "handover",
        handoverId: h.id,
      });
    }

    for (const n of s.notes) {
      entries.push({
        time: shifts[n.phase].time,
        author: "Counter note",
        body: n.text,
        type: "note",
      });
    }

    for (const item of entries.slice().reverse()) {
      html +=
        '<article class="record' +
        (item.type === "handover" ? ' style="border-left-color:var(--mark);"' : "") +
        '"><small>' +
        esc(item.time) +
        " · " +
        (item.type === "handover" ? "<b>Handover Record</b>" : "Message") +
        "</small><h3>" +
        esc(item.author) +
        "</h3><div style=\"margin-top:6px;white-space:pre-wrap;font-size:13px;line-height:1.5;\">" +
        esc(item.body) +
        "</div></article>";
    }

    return (
      html +
      '<form data-note style="margin-top:20px;"><div class="form"><label class="full"><span>Add general handover note</span><textarea name="note" rows="2" maxlength="400" placeholder="Operational note for next shift…" required></textarea></label></div><button type="submit">Add handover note</button></form>'
    );
  }

  function productDecision() {
    return `
      <div class="decision-panel">
        ${head(
          "Product Engineering Evaluation",
          "Candidate work sample review & real-world operational trade-offs",
        )}

        <div class="decision-card">
          <h3><svg aria-hidden="true" class="store-icon" style="width:18px;height:18px;"><use href="#icon-check-circle"></use></svg> 1. What Works Well in the Existing Product</h3>
          <p>
            The physical-unit loan register gives each piece of equipment its own traceable record (one loan slip per physical asset, e.g. <code>PR-04</code>, <code>SP-02</code>, <code>AD-12</code>).
          </p>
          <p>
            Treating assets as distinct units rather than an indivisible "screening kit" allows granular accountability, independent bin location tracking (<code>A2</code>, <code>B1</code>, <code>C4</code>), and accurate individual maintenance logs.
          </p>
        </div>

        <div class="decision-card" style="border-left-color: var(--mark);">
          <h3><svg aria-hidden="true" class="store-icon" style="width:18px;height:18px;"><use href="#icon-alert-triangle"></use></svg> 2. What Needed Improvement</h3>
          <p>
            <b>Friction during partial returns and handovers:</b> In the original workflow, when Kabir returned 2 of 3 items, the operator had to close slips one by one and manually record an informal text note in the Desk Book.
          </p>
          <p>
            The morning operator was forced to read through unstructured chat-like notes, guess which specific adapter model was still out (<code>AD-12</code> vs <code>AD-15</code>), search the loan register, and manually connect the person standing at the counter (Leela Das) with Kabir’s original loan.
          </p>
        </div>

        <div class="decision-card">
          <h3><svg aria-hidden="true" class="store-icon" style="width:18px;height:18px;"><use href="#icon-arrow-left-right"></use></svg> 3. The Prototype Change</h3>
          <ul>
            <li><b>Guided Partial Return Desk:</b> Displays all physical units associated with an approved request. The operator selects only what was physically received at the counter.</li>
            <li><b>Explicit Custodian, Reason &amp; Expected Time Tracking:</b> For unreturned items, captures who currently holds the equipment (Leela Das), the reason it remains out, and when it is expected (Saturday 9:00 AM).</li>
            <li><b>Automated Structured Handover:</b> Eliminates ambiguous free-text messages by generating an actionable, slip-linked handover card with an editable preview for the incoming operator.</li>
            <li><b>Morning Shift Resolution:</b> Highlights expected returns at shift start and allows direct verification and closing of the loan.</li>
          </ul>
        </div>

        <div class="decision-card">
          <h3><svg aria-hidden="true" class="store-icon" style="width:18px;height:18px;"><use href="#icon-package"></use></svg> 4. Why Retain the Existing Approach</h3>
          <p>
            We preserved the original request-approval boundaries and single-unit loan slips. Enforcing that assets return to stock strictly upon physical receipt prevents premature inventory replenishment and ensures the desk never promises an item that is still sitting in a dorm room.
          </p>
        </div>

        <div class="decision-card decision-metric">
          <h3><svg aria-hidden="true" class="store-icon" style="width:18px;height:18px;"><use href="#icon-clipboard-list"></use></svg> 5. Measurable Real-World Observation</h3>
          <p>
            <b>How to evaluate if this helped at a real campus counter:</b>
          </p>
          <ul>
            <li><b>Resolution Time at Counter:</b> Time (in seconds) taken by the incoming morning operator from when Leela arrives at the counter to when the asset is physically verified and the slip is closed.</li>
            <li><b>Handover Clarification Frequency:</b> Count of morning shifts that require texting or calling the previous operator to ask: <i>“Hey, who has adapter AD-12?”</i> or <i>“Which loan does this drop-off belong to?”</i></li>
          </ul>
        </div>
      </div>
    `;
  }

  const screens = {
    Requests: requestPage,
    Inventory: inventory,
    "Loan register": register,
    "Desk book": deskbook,
    "Product decision": productDecision,
  };

  function generateHandoverText(r, returnedLoans, outstandingLoans, custodian, expectedTime, reason, extraNote) {
    return [
      `${r.club.toUpperCase()} – ${r.event.toUpperCase()} (${r.id})`,
      "",
      "Returned:",
      ...returnedLoans.map(
        (l) => `• ${l.asset} – ${getAsset(l.asset)?.model || ""} ${getAsset(l.asset)?.type || ""}`,
      ),
      "",
      "Still outstanding:",
      ...outstandingLoans.map(
        (l) =>
          `• ${l.asset} – ${getAsset(l.asset)?.model || ""} ${getAsset(l.asset)?.type || ""} (Bin ${getAsset(l.asset)?.bin})`,
      ),
      "",
      "Current custodian:",
      custodian,
      "",
      "Expected return:",
      expectedTime,
      reason ? `\nReason outstanding:\n${reason}` : "",
      "",
      "Action for next shift:",
      `Confirm physical receipt of ${outstandingLoans
        .map((l) => l.asset)
        .join(", ")} from ${custodian}, inspect physical condition, and close corresponding loan slip ${outstandingLoans
        .map((l) => "L-" + l.num)
        .join(", ")}.`,
      extraNote ? `\nHandover note:\n${extraNote}` : "",
    ]
      .filter((line) => line !== undefined && line !== null)
      .join("\n");
  }

  function renderModal() {
    const modalEl = q("[data-modal]");
    if (!s.modal) {
      modalEl.hidden = true;
      modalEl.innerHTML = "";
      return;
    }

    const { reqId, returnedIds, custodian, expectedTime, reason, note, customHandover } = s.modal;
    const r = getReq(reqId);
    const loansForReq = s.loans.filter((l) => l.req === reqId && !l.back);

    if (!loansForReq.length) {
      s.modal = null;
      modalEl.hidden = true;
      return;
    }

    modalEl.hidden = false;

    const returnedLoans = loansForReq.filter((l) => returnedIds.includes(l.asset));
    const outstandingLoans = loansForReq.filter((l) => !returnedIds.includes(l.asset));

    const defaultHandover = outstandingLoans.length > 0
      ? generateHandoverText(r, returnedLoans, outstandingLoans, custodian || "Leela Das", expectedTime || "Saturday, 9:00 AM", reason || "Kept by team member for extended setup", note || "")
      : "";

    const previewText = customHandover ?? defaultHandover;

    modalEl.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="modal-header">
            <div>
              <h3 id="modal-title">Guided Return · ${esc(r.id)} (${esc(r.club)})</h3>
              <small>${esc(r.event)} · Borrower on file: ${esc(loansForReq[0]?.who || "")}</small>
            </div>
            <button type="button" data-action="close-modal" aria-label="Cancel return">✕</button>
          </div>

          <form data-guided-return-form>
            <p><b>Step 1: Select physical units received at the counter right now:</b></p>
            <div class="checklist">
              ${loansForReq
                .map((l) => {
                  const a = getAsset(l.asset);
                  const isChecked = returnedIds.includes(l.asset);
                  return `
                    <label class="check-item">
                      <input type="checkbox" name="returnedItem" value="${esc(l.asset)}" ${
                        isChecked ? "checked" : ""
                      }>
                      <div>
                        <strong>${esc(l.asset)} · ${esc(a ? a.type : "")}</strong>
                        <small style="display:block;">Model: ${esc(a ? a.model : "")} · Home bin: ${esc(a ? a.bin : "")} · Borrower: ${esc(l.who)} · Slip L-${l.num}</small>
                      </div>
                      <span class="tag ${isChecked ? "good" : "status-onloan"}">
                        ${isChecked ? "Physically received" : "Still outstanding"}
                      </span>
                    </label>
                  `;
                })
                .join("")}
            </div>

            ${
              outstandingLoans.length > 0
                ? `
              <div class="outstanding-box">
                <h4><svg aria-hidden="true" class="store-icon" style="width:16px;height:16px;"><use href="#icon-alert-triangle"></use></svg> Step 2: Details for outstanding equipment (${outstandingLoans.map((l) => l.asset).join(", ")})</h4>
                <div class="form">
                  <label>
                    <span>Current Custodian holding item</span>
                    <input type="text" name="custodian" value="${esc(
                      custodian || "Leela Das",
                    )}" required>
                  </label>
                  <label>
                    <span>Expected Return Date & Time</span>
                    <input type="text" name="expectedTime" value="${esc(
                      expectedTime || "Saturday, 9:00 AM",
                    )}" required>
                  </label>
                  <label class="full">
                    <span>Reason item remains outstanding</span>
                    <input type="text" name="reason" value="${esc(
                      reason || "Kept by team member for extended setup",
                    )}" required>
                  </label>
                  <label class="full">
                    <span>Structured Handover Summary (Editable preview for incoming shift)</span>
                    <textarea name="handoverSummary" rows="10" style="font-family:monospace;font-size:12px;line-height:1.45;">${esc(
                      previewText,
                    )}</textarea>
                  </label>
                </div>
              </div>
            `
                : ""
            }

            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
              <button type="button" data-action="close-modal">Cancel</button>
              <button type="submit" class="primary">Confirm Return &amp; Save Handover</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;

    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.textContent = phase.next || "";

    q("[data-pulse]").innerHTML = renderPulse();

    q("[data-nav]").innerHTML = pages
      .map(
        ([n, icon]) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '"><svg aria-hidden="true" class="store-icon"><use href="#icon-' +
          icon +
          '"></use></svg>' +
          n +
          "</button>",
      )
      .join("");

    q("[data-page]").innerHTML = screens[s.tab]();

    if (q("[data-filter]")) q("[data-filter]").value = s.filter;
    q("[data-status]").textContent = s.notice;

    renderModal();
  }

  function commit(msg) {
    if (msg) s.notice = msg;
    paint();
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      q("[data-status]").textContent +=
        " Browser storage is unavailable. Progress lasts for this visit.";
    }
  }

  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const act = b.dataset.action;
    const v = b.dataset.val;

    switch (act) {
      case "restart":
        s = original();
        break;
      case "advance":
        if (s.phase < shifts.length - 1) {
          s.phase++;
          s.notice = "Shift time advanced to " + shifts[s.phase].time + ".";
        }
        break;
      case "tab":
        s.tab = v;
        s.editing = false;
        break;
      case "close":
        s.selected = "";
        break;
      case "request":
        s.selected = v;
        break;
      case "new":
        s.editing = true;
        break;
      case "cancel":
        s.editing = false;
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
      case "close-modal":
        s.modal = null;
        break;

      case "open-guided-return": {
        const reqId = v;
        const loansForReq = s.loans.filter((l) => l.req === reqId && !l.back);
        if (!loansForReq.length) {
          s.notice = "No open loans for this request.";
          break;
        }

        let initialChecked = [];
        if (s.phase === 1 && reqId === "RQ-214") {
          initialChecked = ["PR-04", "SP-02"];
        } else {
          initialChecked = loansForReq.map((l) => l.asset);
        }

        s.modal = {
          reqId,
          returnedIds: initialChecked,
          custodian: "Leela Das",
          expectedTime: "Saturday, 9:00 AM",
          reason: "Kept by team member for extended setup",
          note: "",
          customHandover: null,
        };
        break;
      }

      case "return": {
        const l = s.loans.find((l) => l.num === Number(v));
        if (!l || l.back) return;

        const confirmMsg =
          s.phase === 2
            ? `Confirm receipt of physical unit ${l.asset} from ${l.custodian || l.who} and close slip L-${l.num}?`
            : `Confirm return of ${l.asset} to stock?`;

        if (!window.confirm(confirmMsg)) return;

        l.back = true;
        l.returnedAt = shifts[s.phase].time;
        l.history = l.history || [];
        l.history.push({
          action: "Returned & Verified",
          time: shifts[s.phase].time,
          by: l.custodian || l.who,
        });

        for (const h of s.handovers) {
          if (h.outstandingAssets && h.outstandingAssets.includes(l.asset)) {
            h.resolved = true;
          }
        }

        s.notice = `Unit ${l.asset} received and inspected. Slip L-${l.num} closed. Returned to shelf.`;
        break;
      }
    }
    commit();
  });

  root.addEventListener("change", (e) => {
    if (e.target.matches("[data-filter]")) {
      s.filter = e.target.value;
      commit();
      return;
    }

    if (e.target.name === "returnedItem" && s.modal) {
      const form = e.target.closest("form");
      const checkedBoxes = Array.from(
        form.querySelectorAll('input[name="returnedItem"]:checked'),
      ).map((el) => el.value);

      s.modal.returnedIds = checkedBoxes;
      s.modal.customHandover = null;
      renderModal();
    }
  });

  root.addEventListener("input", (e) => {
    if (s.modal && e.target.name === "handoverSummary") {
      s.modal.customHandover = e.target.value;
    }
  });

  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);

    if (f.matches("[data-note]")) {
      const text = String(form.get("note")).trim();
      if (!text) return;
      s.notes.push({ phase: s.phase, text });
      commit("Handover note saved to Desk Book.");
      return;
    }

    if (f.matches("[data-guided-return-form]")) {
      if (!s.modal) return;
      const { reqId, returnedIds } = s.modal;
      const custodian = String(form.get("custodian") || "").trim() || "Borrower";
      const expectedTime = String(form.get("expectedTime") || "").trim() || "Next Shift";
      const reason = String(form.get("reason") || "").trim();
      const handoverSummary = String(form.get("handoverSummary") || "").trim();

      const r = getReq(reqId);
      const loansForReq = s.loans.filter((l) => l.req === reqId && !l.back);

      const returnedLoans = [];
      const outstandingLoans = [];

      loansForReq.forEach((l) => {
        if (returnedIds.includes(l.asset)) {
          l.back = true;
          l.returnedAt = shifts[s.phase].time;
          l.history = l.history || [];
          l.history.push({
            action: "Returned",
            time: shifts[s.phase].time,
            by: l.who,
          });
          returnedLoans.push(l);
        } else {
          l.custodian = custodian;
          l.expectedReturn = expectedTime;
          l.reason = reason;
          l.history = l.history || [];
          l.history.push({
            action: "Transferred to Custodian",
            time: shifts[s.phase].time,
            by: custodian,
          });
          outstandingLoans.push(l);
        }
      });

      if (outstandingLoans.length > 0) {
        const finalSummary =
          handoverSummary ||
          generateHandoverText(r, returnedLoans, outstandingLoans, custodian, expectedTime, reason);

        s.handovers.push({
          id: "HO-" + (s.handovers.length + 1),
          time: shifts[s.phase].time,
          reqId: r.id,
          summary: finalSummary,
          outstandingAssets: outstandingLoans.map((l) => l.asset),
          resolved: false,
        });
      }

      s.modal = null;
      commit(
        `Recorded return of ${returnedLoans.length} unit(s). ${
          outstandingLoans.length
            ? `${outstandingLoans.length} item(s) logged as outstanding with ${custodian}. Handover saved.`
            : "All units returned to stock."
        }`,
      );
      return;
    }

    if (!f.matches("[data-issue]")) return;
    const [req, asset, who, due] = ["req", "asset", "who", "due"].map((k) =>
      form.get(k),
    );
    const unit = getAsset(asset),
      r = getReq(req);

    if (!r || !unit || unit.repair || out(asset) || !people.includes(who))
      return;

    if (!r.items.includes(unit.type)) {
      q("[data-status]").textContent =
        "This equipment type is outside the approved request. Choose an approved unit.";
      return;
    }

    if (
      s.loans.some(
        (l) => l.req === req && !l.back && getAsset(l.asset).type === unit.type,
      )
    ) {
      q("[data-status]").textContent =
        "The approved quantity of this equipment type is already on loan.";
      return;
    }

    const num = Math.max(400, ...s.loans.map((l) => l.num)) + 1;
    s.loans.push({
      num,
      req,
      asset,
      who,
      due,
      back: false,
      custodian: who,
      expectedReturn: due,
      history: [{ action: "Issued", time: shifts[s.phase].time, by: who }],
    });

    s.editing = false;
    commit("Issued " + asset + " to " + who + " on slip L-" + num + ".");
  });

  function restore(d) {
    if (!d || !Array.isArray(d.loans)) return;

    const migratedLoans = d.loans.map((l) => ({
      ...l,
      custodian: l.custodian || l.who,
      expectedReturn: l.expectedReturn || l.due,
      history: l.history || [
        { action: "Restored", time: shifts[d.phase]?.time || "Friday", by: l.who },
      ],
    }));

    s = {
      ...original(),
      ...d,
      version: 2,
      loans: migratedLoans,
      notes: Array.isArray(d.notes) ? d.notes : [],
      handovers: Array.isArray(d.handovers) ? d.handovers : [],
      modal: null,
    };
    paint();
  }

  paint();

  try {
    const raw = localStorage.getItem(storageKey) || localStorage.getItem(oldStorageKey);
    if (raw) restore(JSON.parse(raw));
  } catch {
    // Keep clean shift state if localStorage fails
  }
})();
