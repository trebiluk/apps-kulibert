      var FINE_PRINT = [
        { emoji: "🛠️", title: "Made Here", i18n: "fineMade", kidKey: "fineMadeKid", grownKey: "fineMadeGrown", ready: true,
          kid: "Mr. Kulibert and his helper bots built these apps for our class. They're free, and nobody is selling anything here.",
          grown: "The KuliNet apps are original educational software that teacher Diego Kulibert created for classroom teaching. There are no ads, no purchases, and nothing for sale, and student information is never sold. Some apps were built with help from AI coding tools and include open-source parts. Like most websites, the apps are hosted by outside services (Cloudflare and Vercel, plus the school's Google Workspace for photos) and may load shared resources such as web fonts." },
        { emoji: "🏷️", title: "Not Theirs", i18n: "fineNotTheirs", kidKey: "fineNotTheirsKid", grownKey: "fineNotTheirsGrown", ready: true,
          kid: "Bertopia is a block-building game, but it isn't Minecraft or Roblox. We're not connected to those games or the companies that make them. Berty is our own character, not anybody else's.",
          grown: "KuliNet is not affiliated with, endorsed by, or sponsored by Mojang, Microsoft, Roblox Corporation, Sesame Workshop, or any other company. Minecraft, Roblox, and any other product names mentioned here belong to their owners and are used only for description or comparison. Apps on this hub include Bertopia (with its starter world, Bertyville), HoldIt, TrussTime, ArchWorks, TechWorks, DJ Berty, Berty's Run, Baboo, Bits & Bobs, and the Bulletin Board. These are names for a classroom project. They are not registered trademarks." },
        { emoji: "⭐", title: "Credits", ready: false,
          kid: "Some of the code, fonts, sounds, and 3D models came from people who shared their work for free. We say thank you by listing their names.",
          grown: "Parts of these apps use open-source software and free-licensed assets under their licenses, and the license notices are kept with them. A full list showing each item's name, author, license, and link is on the Credits page. Some textures and images were made in-house to keep licensing simple." },
        { emoji: "🔒", title: "Your Privacy", i18n: "finePrivacy", kidKey: "finePrivacyKid", grownKey: "finePrivacyGrown", ready: true,
          kid: "You use a code name, not your real name. Don't type your real name, address, phone number, or passwords into any app here. Only Mr. Kulibert knows which code name is yours. Photos you turn in stay private until he checks them.",
          grown: "Students sign in with a class code and an alias instead of their real names.",
          points: [
            "What's saved on the device: Most apps save work only in the browser on the student's device.",
            "What's saved online: TechWorks and the teacher's control panel save aliases, progress, XP, and marks in a private Cloudflare database.",
            "Photos: Photos turned in for assignments or posted to the Bulletin Board are uploaded to a private folder in Mr. Kulibert's school Google Drive, which runs on the district's Google Workspace account. Before a photo is stored, the app re-saves it to remove location data. No classmate sees a photo until the teacher approves it.",
            "Who can see it: Only Mr. Kulibert, through a passkey-protected staff login.",
            "Matching aliases to students: The list linking aliases to real students is kept offline or in a two-factor-protected place, and never on this site.",
            "How long it's kept: Data is kept until the student graduates, or deleted sooner.",
            "Never: Student data is never sold, used for advertising, or shared, except as the law requires."
          ],
          after: "The hub is made to follow FERPA, COPPA, New York Education Law §2-d, and Solvay school district rules. For the district's data privacy policies and the Parents' Bill of Rights for Data Privacy and Security, see the Solvay Union Free School District website." },
        { emoji: "🏫", title: "School Use", i18n: "fineSchool", kidKey: "fineSchoolKid", grownKey: "fineSchoolGrown", ready: true,
          kid: "These apps are for class and learning. Your teacher decides which ones are open each day. Playing at home is optional and never counts against your grade.",
          grown: "KuliNet is a teacher-created classroom resource. It was built to follow district and New York State student data rules, but it is not an official product of the Solvay Union Free School District. Using it at home is optional and is never required for a grade." },
        { emoji: "🚧", title: "Work in Progress", i18n: "fineProgress", kidKey: "fineProgressKid", grownKey: "fineProgressGrown", ready: true,
          kid: "We keep building and fixing these apps, so sometimes things break or change. If something looks weird, tell Mr. Kulibert.",
          grown: "The apps are provided \"as is,\" without any warranty, and may change, pause, or be removed at any time. Work saved only in a browser can be lost if that browser's data is cleared or the student switches devices, so students should keep a copy of anything important." },
        { emoji: "🎨", title: "Student Creations", i18n: "fineCreations", kidKey: "fineCreationsKid", grownKey: "fineCreationsGrown", ready: true,
          kid: "What you make belongs to you. The class gets to see and remix it, and you always get credit by your code name. Nothing goes on the Bulletin Board until your teacher says OK.",
          grown: "Students keep authorship of what they create. When a student shares a creation on the hub, classmates may view and remix it for class purposes. Remixes keep credit to the original maker's alias. The teacher approves every post before it appears and can remove any content at any time, including when a student or family asks." },
        { emoji: "🤝", title: "Be Kind", i18n: "fineKind", kidKey: "fineKindKid", grownKey: "fineKindGrown", ready: true,
          kid: "Only share things that are kind, school-appropriate, and made by you or the class.",
          grown: "Shared content must follow the district's code of conduct and acceptable use policy. Don't upload copyrighted material you don't have permission to use, photos of other people, or personal information. The teacher reviews all shared content." },
        { emoji: "✉️", title: "Questions?", i18n: "fineQuestions", kidKey: "fineQuestionsKid", grownKey: "fineQuestionsGrown", ready: true,
          kid: "Questions or worries? Talk to Mr. Kulibert or a grown-up you trust.",
          grown: "Parents, guardians, and rights holders can email rkulibert@solvayschools.org with questions, privacy requests (such as viewing or deleting a student's data), or takedown requests. Please name the app and describe the issue. We'll look into it and reply promptly, and anything that appears to infringe someone's rights will be taken down while we review it." }
      ];
      (function () {
        var panel = document.getElementById("fine-print");
        var grid = document.getElementById("fine-print-grid");
        var opener = null;
        if (!panel || !grid) return;
        FINE_PRINT.forEach(function (item, index) {
          if (!item.ready) return;
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "fine-tile";
          btn.setAttribute("aria-expanded", "false");
          var emoji = document.createElement("span");
          emoji.className = "fine-emoji";
          emoji.setAttribute("aria-hidden", "true");
          emoji.textContent = item.emoji;
          var title = document.createElement("span");
          title.className = "fine-title";
          if (item.i18n) title.setAttribute("data-i18n", item.i18n);
          title.textContent = (window.KulibertI18n && item.i18n) ? KulibertI18n.t(item.i18n) : item.title;
          var kid = document.createElement("span");
          kid.className = "fine-kid";
          if (item.kidKey) kid.setAttribute("data-i18n", item.kidKey);
          kid.textContent = (window.KulibertI18n && item.kidKey) ? KulibertI18n.t(item.kidKey) : item.kid;
          var grown = document.createElement("div");
          grown.className = "fine-grown";
          grown.hidden = true;
          var lead = document.createElement("p");
          if (item.grownKey) lead.setAttribute("data-i18n", item.grownKey);
          lead.textContent = (window.KulibertI18n && item.grownKey) ? KulibertI18n.t(item.grownKey) : item.grown;
          grown.appendChild(lead);
          if (item.points) {
            var list = document.createElement("ul");
            item.points.forEach(function (line) {
              var li = document.createElement("li");
              li.textContent = line;
              list.appendChild(li);
            });
            grown.appendChild(list);
          }
          if (item.after) {
            var after = document.createElement("p");
            after.textContent = item.after;
            grown.appendChild(after);
          }
          btn.appendChild(emoji);
          btn.appendChild(title);
          btn.appendChild(kid);
          btn.appendChild(grown);
          btn.addEventListener("click", function () {
            var open = grown.hidden;
            grown.hidden = !open;
            btn.setAttribute("aria-expanded", open ? "true" : "false");
          });
          btn.setAttribute("data-fine", String(index));
          grid.appendChild(btn);
        });
        function openFine(from) {
          opener = from || document.activeElement;
          panel.hidden = false;
          document.body.classList.add("fine-print-open");
          var closeBtn = document.getElementById("fine-print-close");
          if (closeBtn) closeBtn.focus();
        }
        function closeFine() {
          panel.hidden = true;
          document.body.classList.remove("fine-print-open");
          if (opener && opener.focus) opener.focus();
        }
        var closeBtn = document.getElementById("fine-print-close");
        if (closeBtn) closeBtn.addEventListener("click", closeFine);
        function bindDoor(id) {
          var btn = document.getElementById(id);
          if (!btn || btn.getAttribute("data-fine-bound")) return;
          btn.setAttribute("data-fine-bound", "1");
          btn.addEventListener("click", function () {
            var hub = document.getElementById("hub-drawer");
            if (hub) hub.hidden = true;
            var back = document.getElementById("hub-drawer-backdrop");
            if (back) back.hidden = true;
            var menu = document.getElementById("kb-menu");
            if (menu) menu.setAttribute("aria-expanded", "false");
            openFine(btn);
          });
        }
        bindDoor("drawer-fine-print");
        bindDoor("foot-fine-print");
        document.addEventListener("DOMContentLoaded", function () { bindDoor("foot-fine-print"); });
        document.addEventListener("keydown", function (ev) {
          if (!ev || ev.key !== "Escape" || panel.hidden) return;
          ev.preventDefault();
          ev.stopPropagation();
          closeFine();
        }, true);
      })();
    
