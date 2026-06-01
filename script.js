// ==========================================
// BAGIAN 1: CORE LOGIC & EVENT LISTENERS
// ==========================================

class TerminalResume {
  constructor() {
    this.output = document.getElementById("output");
    this.input = document.getElementById("command-input");
    this.terminal = document.querySelector(".terminal");
    this.terminalContainer = document.querySelector(".terminal-container");
    this.contextMenu = document.querySelector(".context-menu");
    this.terminals = [{ input: this.input, history: [], historyIndex: -1 }];
    this.activeTerminal = 0;
    this.activeTerminalContent = null;
    this.resizing = null;

    // Properties for themes and game
    this.currentTheme = localStorage.getItem("theme") || "default";
    this.projects = [];
    this.skills = {};
    this.fileSystem = {};
    this.gameActive = false;
    this.gameHandler = null;

    // Initialize modals
    this.themeModal = document.getElementById("theme-modal");
    this.projectsModal = document.getElementById("projects-modal");
    this.skillsModal = document.getElementById("skills-modal");

    // Initialize theme selector
    this.themeToggle = document.getElementById("theme-toggle");

    this.setupEventListeners();
    this.loadProjects();
    this.loadSkills();
    this.setupFileSystem();
    this.init();
  }

  init() {
    // Apply saved theme
    this.handleThemeChange(this.currentTheme);

    // Set up modal close buttons
    document.querySelectorAll(".close-button").forEach((button) => {
      button.addEventListener("click", () => {
        this.closeModal(button.closest(".modal"));
      });
    });

    // Theme toggle
    this.themeToggle.addEventListener("click", () => {
      this.showModal(this.themeModal);
    });

    // Hide language toggle
    const languageToggle = document.getElementById("language-toggle");
    if (languageToggle && languageToggle.parentElement) {
      languageToggle.parentElement.style.display = "none";
    }

    // Theme selection
    document.querySelectorAll(".theme-option").forEach((option) => {
      option.addEventListener("click", () => {
        this.handleThemeChange(option.dataset.theme);
      });
    });

    this.printWelcomeMessage();
    this.input.focus();
    this.setupContextMenu();
  }

  setupContextMenu() {
    this.terminalContainer.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const terminalContent = e.target.closest(".terminal-content");
      if (terminalContent) {
        this.activeTerminalContent = terminalContent;
        this.showContextMenu(e.clientX, e.clientY);
      }
    });

    document.addEventListener("click", () => {
      this.contextMenu.classList.remove("active");
    });

    this.contextMenu.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.handleContextMenuAction(action);
      }
    });
  }

  showContextMenu(x, y) {
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    this.contextMenu.classList.add("active");

    const closeOption = this.contextMenu.querySelector('[data-action="close-split"]');
    const isMainTerminal = this.activeTerminalContent === this.terminalContainer.firstElementChild;
    closeOption.style.display = isMainTerminal ? "none" : "block";
  }

  handleContextMenuAction(action) {
    if (!this.activeTerminalContent) return;
    switch (action) {
      case "split-h":
        this.splitTerminal("horizontal", this.activeTerminalContent);
        break;
      case "split-v":
        this.splitTerminal("vertical", this.activeTerminalContent);
        break;
      case "close-split":
        this.closeSplit(this.activeTerminalContent);
        break;
    }
    this.contextMenu.classList.remove("active");
  }

  setupEventListeners() {
    this.terminalContainer.addEventListener("click", (e) => {
      const terminalContent = e.target.closest(".terminal-content");
      if (terminalContent) {
        const input = terminalContent.querySelector("input");
        if (input) {
          input.focus();
          this.activeTerminal = this.terminals.findIndex((t) => t.input === input);
        }
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        const activeContent = this.terminals[this.activeTerminal].input.closest(".terminal-content");
        if (activeContent) this.splitTerminal("horizontal", activeContent);
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        const activeContent = this.terminals[this.activeTerminal].input.closest(".terminal-content");
        if (activeContent) this.splitTerminal("vertical", activeContent);
      }
    });

    this.setupInputHandlers(this.input);
  }

  setupInputHandlers(inputElement) {
    inputElement.addEventListener("keydown", (e) => {
      const terminal = this.terminals.find((t) => t.input === inputElement);
      if (!terminal) return;

      if (e.key === "Enter") {
        this.handleCommand(inputElement);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this.navigateHistory("up", terminal);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        this.navigateHistory("down", terminal);
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        const outputElement = inputElement.closest(".terminal-content").querySelector("[id^='output']");
        outputElement.innerHTML = "";
        this.printWelcomeMessage(outputElement);
      } else if (e.key === "Tab") {
        e.preventDefault();
        this.handleTabCompletion(inputElement);
      }
    });
  }

  handleTabCompletion(inputElement) {
    const currentInput = inputElement.value.toLowerCase().trim();
    const commands = [
      "help", "about", "skills", "experience", "education", "contact",
      "clear", "projects", "skills-visual", "game", "exit-game",
      "matrix", "stop-matrix", "weather", "calc", "calculate", "pdf"
    ];

    const matches = commands.filter((cmd) => cmd.startsWith(currentInput));

    if (matches.length === 1) {
      inputElement.value = matches[0];
    } else if (matches.length > 1 && currentInput) {
      const outputElement = inputElement.closest(".terminal-content").querySelector("[id^='output']");
      const matchesText = `\nPossible commands:\n${matches.join("  ")}`;
      this.printToOutput(outputElement, matchesText, "info");
    }
  }

  navigateHistory(direction, terminal) {
    if (direction === "up" && terminal.historyIndex < terminal.history.length - 1) {
      terminal.historyIndex++;
    } else if (direction === "down" && terminal.historyIndex > -1) {
      terminal.historyIndex--;
    }

    if (terminal.historyIndex >= 0 && terminal.historyIndex < terminal.history.length) {
      terminal.input.value = terminal.history[terminal.history.length - 1 - terminal.historyIndex];
    } else {
      terminal.input.value = "";
    }
  }

  splitTerminal(direction, sourceTerminal) {
    const parentContainer = sourceTerminal.parentElement;
    const isAlreadySplit = parentContainer.children.length > 1;
    const splitClass = direction === "horizontal" ? "split-h" : "split-v";

    if (!isAlreadySplit || !parentContainer.classList.contains(splitClass)) {
      const newContainer = document.createElement("div");
      newContainer.className = `terminal-container ${splitClass}`;
      sourceTerminal.parentElement.insertBefore(newContainer, sourceTerminal);
      newContainer.appendChild(sourceTerminal);
      this.createNewTerminalContent(newContainer);
    } else {
      this.createNewTerminalContent(parentContainer);
    }
  }

  createNewTerminalContent(container) {
    const newContent = document.createElement("div");
    newContent.className = "terminal-content";
    const timestamp = Date.now();
    newContent.innerHTML = `
      <div id="output-${timestamp}" class="terminal-output"></div>
      <div class="input-line">
        <span class="prompt">➜</span>
        <input type="text" id="command-input-${timestamp}" class="command-input" />
      </div>
    `;

    if (container.children.length > 0) {
      const handle = document.createElement("div");
      handle.className = `resize-handle ${container.classList.contains("split-h") ? "horizontal" : "vertical"}`;
      container.lastElementChild.appendChild(handle);
      this.setupResizeHandle(handle);
    }

    container.appendChild(newContent);
    const newInput = newContent.querySelector(".command-input");
    this.setupInputHandlers(newInput);

    this.terminals.push({ input: newInput, history: [], historyIndex: -1 });

    const newOutput = newContent.querySelector(`#output-${timestamp}`);
    this.printWelcomeMessage(newOutput);

    newInput.focus();
    this.activeTerminal = this.terminals.length - 1;
  }

  setupResizeHandle(handle) {
    const isHorizontal = handle.classList.contains("horizontal");
    const startResize = (e) => {
      e.preventDefault();
      this.resizing = {
        handle,
        startX: e.clientX,
        startY: e.clientY,
        parentContainer: handle.closest(".terminal-container"),
        element: handle.parentElement,
        initialSize: isHorizontal ? handle.parentElement.offsetWidth : handle.parentElement.offsetHeight,
      };
      document.addEventListener("mousemove", resize);
      document.addEventListener("mouseup", stopResize);
    };

    const resize = (e) => {
      if (!this.resizing) return;
      const { parentContainer, element, startX, startY, initialSize } = this.resizing;
      const containerRect = parentContainer.getBoundingClientRect();

      if (isHorizontal) {
        const deltaX = e.clientX - startX;
        const newWidth = initialSize + deltaX;
        const maxWidth = containerRect.width - 150;
        if (newWidth >= 150 && newWidth <= maxWidth) {
          const percentage = (newWidth / containerRect.width) * 100;
          element.style.flex = "none";
          element.style.width = `${percentage}%`;
        }
      } else {
        const deltaY = e.clientY - startY;
        const newHeight = initialSize + deltaY;
        const maxHeight = containerRect.height - 100;
        if (newHeight >= 100 && newHeight <= maxHeight) {
          const percentage = (newHeight / containerRect.height) * 100;
          element.style.flex = "none";
          element.style.height = `${percentage}%`;
        }
      }
    };

    const stopResize = () => {
      this.resizing = null;
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResize);
    };
    handle.addEventListener("mousedown", startResize);
  }

  printToOutput(outputElement, text, className = "", useTypewriter = false) {
    if (!text) {
      outputElement.innerHTML = "";
      return Promise.resolve();
    }
    const line = document.createElement("div");
    line.className = className;
    line.style.whiteSpace = "pre-wrap";
    line.style.marginBottom = "0.5rem";
    outputElement.appendChild(line);
    this.scrollToBottom(outputElement.closest(".terminal-content"));

    if (useTypewriter && !text.includes("<")) {
      return this.typeText(line, text, 20);
    } else if (useTypewriter && text.includes("<")) {
      return this.typeHTML(line, text, 20);
    } else {
      line.textContent = text;
      return Promise.resolve();
    }
  }

  scrollToBottom(terminalContent) {
    if (!terminalContent) return;
    if (terminalContent.scrollHeight > terminalContent.clientHeight) {
      const currentScrollTop = terminalContent.scrollTop;
      const maxScroll = terminalContent.scrollHeight - terminalContent.clientHeight;
      if (currentScrollTop < maxScroll) {
        terminalContent.scrollTop = maxScroll;
        requestAnimationFrame(() => {
          terminalContent.scrollTop = maxScroll;
        });
      }
    }
  }

  handleCommand(inputElement) {
    const terminal = this.terminals.find((t) => t.input === inputElement);
    if (!terminal) return;

    const command = inputElement.value.trim().toLowerCase();
    const outputElement = inputElement.closest(".terminal-content").querySelector("[id^='output']");

    this.printToOutput(outputElement, `➜ ${command}`, "command");
    terminal.history.push(command);
    terminal.historyIndex = -1;
    inputElement.value = "";

    const [cmd, ...args] = command.split(" ");

    switch (cmd) {
      case "help":
        this.showHelp(outputElement);
        break;
      case "about":
        this.showAbout(outputElement);
        break;
      case "experience":
        this.showExperience(outputElement);
        break;
      case "education":
        this.showEducation(outputElement);
        break;
      case "skills":
        this.showSkills(outputElement);
        break;
      case "contact":
        this.showContact(outputElement);
        break;
      case "clear":
        outputElement.innerHTML = "";
        this.printWelcomeMessage(outputElement);
        break;
      case "projects":
        this.showProjects();
        break;
      case "skills-visual":
        this.showSkillsVisualization();
        break;
      case "game":
        this.initGame();
        break;
      case "pdf":
        this.generatePDF();
        break;
      case "linkedin-cover":
        this.generateLinkedInCover(outputElement);
        break;
      case "exit-game":
        this.endGame();
        this.printToOutput(outputElement, "Game exited.", "info");
        break;
      case "matrix":
        this.startMatrixEffect(outputElement);
        break;
      case "stop-matrix":
        this.stopMatrixEffect();
        this.printToOutput(outputElement, "Matrix effect stopped.", "info");
        break;
      case "weather":
        this.showWeather(args.join(" "), outputElement);
        break;
      case "calc":
      case "calculate":
        this.calculate(args.join(" "), outputElement);
        break;
      case "":
        break;
      default:
        this.printToOutput(outputElement, `Command not found: ${command}. Type 'help' for available commands.`, "error");
    }
    this.scrollToBottom(outputElement.closest(".terminal-content"));
  }

// --- BAGIAN 1 SELESAI ---

// ==========================================
// BAGIAN 2: KONTEN PROFIL & IDENTITAS (NANDITO)
// ==========================================

  printWelcomeMessage(outputElement = this.output) {
    // ASCII Art untuk DITO
    const asciiArt = `██████╗  ██╗ ████████╗ ██████╗ 
██╔══██╗ ██║ ╚══██╔══╝██╔═══██╗
██║  ██║ ██║    ██║   ██║   ██║
██║  ██║ ██║    ██║   ██║   ██║
██████╔╝ ██║    ██║   ╚██████╔╝
╚═════╝  ╚═╝    ╚═╝    ╚═════╝ `;

    const divider = "─────────────────────────────────────────────────";

    const welcome =
      this.wrapWithColor(asciiArt + "\n", "#66d9ef") +
      this.wrapWithColor(divider + "\n", "#555555") +
      this.wrapWithColor(
        "              Interactive Terminal Portfolio\n",
        "#888888"
      ) +
      this.wrapWithColor(
        "           System Analyst\n",
        "#666666"
      ) +
      this.wrapWithColor(divider + "\n\n", "#555555") +
      this.wrapWithColor("Ketik ", "#666666") +
      this.wrapWithColor("'help'", "#a8e6cf") +
      this.wrapWithColor(" untuk melihat daftar perintah\n", "#666666") +
      this.wrapWithColor("Tekan ", "#666666") +
      this.wrapWithColor("'tab'", "#a8e6cf") +
      this.wrapWithColor(" untuk auto-complete perintah", "#666666");

    const helpDiv = document.createElement("div");
    helpDiv.innerHTML = welcome;
    outputElement.appendChild(helpDiv);
    this.scrollToBottom(outputElement.closest(".terminal-content"));
  }

  showHelp(outputElement = this.output) {
    const title = this.wrapWithColor("🚀 Perintah yang Tersedia\n\n", "#ffd93d");

    const mainCommands =
      this.wrapWithColor("Perintah Utama:\n", "#66d9ef") +
      this.wrapWithColor("• help", "#a8e6cf") +
      "       " +
      this.wrapWithColor("Tampilkan pesan bantuan ini\n", "#ffffff") +
      this.wrapWithColor("• about", "#a8e6cf") +
      "      " +
      this.wrapWithColor("Tampilkan ringkasan profilku\n", "#ffffff") +
      this.wrapWithColor("• skills", "#a8e6cf") +
      "     " +
      this.wrapWithColor("Lihat keahlian teknisku\n", "#ffffff") +
      this.wrapWithColor("• experience", "#a8e6cf") +
      " " +
      this.wrapWithColor("Tampilkan riwayat pengalaman/project\n", "#ffffff") +
      this.wrapWithColor("• education", "#a8e6cf") +
      "  " +
      this.wrapWithColor("Lihat latar belakang pendidikan\n", "#ffffff") +
      this.wrapWithColor("• contact", "#a8e6cf") +
      "    " +
      this.wrapWithColor("Dapatkan informasi kontakku\n", "#ffffff") +
      this.wrapWithColor("• clear", "#a8e6cf") +
      "      " +
      this.wrapWithColor("Bersihkan layar terminal\n", "#ffffff");

    const utilityCommands =
      "\n" +
      this.wrapWithColor("Perintah Tambahan:\n", "#66d9ef") +
      this.wrapWithColor("• projects", "#a8e6cf") +
      "   " +
      this.wrapWithColor("Lihat showcase project (UI Modal)\n", "#ffffff") +
      this.wrapWithColor("• skills-visual", "#a8e6cf") +
      "" +
      this.wrapWithColor("Lihat visualisasi skill (UI Modal)\n", "#ffffff") +
      this.wrapWithColor("• game", "#a8e6cf") +
      "      " +
      this.wrapWithColor("Mainkan mini-game Snake\n", "#ffffff") +
      this.wrapWithColor("• matrix", "#a8e6cf") +
      "    " +
      this.wrapWithColor("Mulai efek digital rain ala Matrix\n", "#ffffff") +
      this.wrapWithColor("• calc", "#a8e6cf") +
      "      " +
      this.wrapWithColor("Kalkulator matematika (misal: calc 5+5)\n", "#ffffff");

    const shortcuts =
      "\n" +
      this.wrapWithColor("Shortcuts:\n", "#666666") +
      this.wrapWithColor("• ", "#666666") +
      this.wrapWithColor("↑/↓", "#666666") +
      "         " +
      this.wrapWithColor("Navigasi riwayat perintah\n", "#444444") +
      this.wrapWithColor("• ", "#666666") +
      this.wrapWithColor("Tab", "#666666") +
      "         " +
      this.wrapWithColor("Auto-complete perintah\n", "#444444") +
      this.wrapWithColor("• ", "#666666") +
      this.wrapWithColor("Ctrl+L", "#666666") +
      "      " +
      this.wrapWithColor("Bersihkan layar\n", "#444444");

    const help = title + mainCommands + utilityCommands + shortcuts;

    const helpDiv = document.createElement("div");
    helpDiv.innerHTML = help;
    outputElement.appendChild(helpDiv);
    this.scrollToBottom(outputElement.closest(".terminal-content"));
  }

  showAbout(outputElement = this.output) {
    const about = `<span style="color: #ffd93d; font-weight: bold;">✨ About Me</span>

${this.wrapWithColor("┌─────────────────────────────────────────────────────────┐", "#ffd93d")}
${this.wrapWithColor("│", "#ffd93d")} ${this.wrapWithColor("Halo! Aku Dito, seorang System Analyst", "#ffffff")}
${this.wrapWithColor("│", "#ffd93d")} ${this.wrapWithColor("berbasis di Jakarta, Indonesia.", "#ffffff")}
${this.wrapWithColor("└─────────────────────────────────────────────────────────┘", "#ffd93d")}

${this.wrapWithColor("⚡ Focus & Expertise", "#ffd93d")}
${this.wrapWithColor("   Merancang alur sistem, struktur data, dan kebutuhan teknis", "#ffffff")}
${this.wrapWithColor("   agar aplikasi web lebih rapi, aman, dan mudah dikembangkan.", "#ffffff")}

${this.wrapWithColor("⚡ Daily Routine", "#ffd93d")}
${this.wrapWithColor("   Membedah kebutuhan user, menyusun flow, menjaga akurasi data,", "#ffffff")}
${this.wrapWithColor("   dan menjembatani komunikasi antara kebutuhan bisnis dan tim teknis.", "#ffffff")}

${this.wrapWithColor("╭───────────────────────────────────────────────────────╮", "#ffd93d")}
${this.wrapWithColor("│", "#ffd93d")} ${this.wrapWithColor("Punya kebutuhan sistem yang perlu dirancang lebih rapi? Mari diskusi.", "#ffffff")} ${this.wrapWithColor("│", "#ffd93d")}
${this.wrapWithColor("╰───────────────────────────────────────────────────────╯", "#ffd93d")}`;

    const aboutDiv = document.createElement("div");
    aboutDiv.innerHTML = about;
    outputElement.appendChild(aboutDiv);
    this.scrollToBottom(outputElement.closest(".terminal-content"));
  }

  wrapWithColor(text, color) {
    return `<span style="color: ${color}">${text}</span>`;
  }

  typeText(element, text, speed = 30) {
    if (!element || !text) return Promise.resolve();
    return new Promise((resolve) => {
      let index = 0;
      element.textContent = "";
      element.style.display = "inline-block";
      const interval = setInterval(() => {
        if (index < text.length) {
          element.textContent += text.charAt(index);
          index++;
        } else {
          clearInterval(interval);
          resolve();
        }
      }, speed);
    });
  }

  async typeHTML(element, html, speed = 30) {
    if (!element || !html) return Promise.resolve();
    const temp = document.createElement("div");
    temp.innerHTML = html;
    const walker = document.createTreeWalker(
      temp,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      null,
      false
    );
    const nodes = [];
    let currentNode;
    while ((currentNode = walker.nextNode())) {
      nodes.push(currentNode);
    }
    element.innerHTML = "";
    for (const node of nodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        const span = document.createElement("span");
        element.appendChild(span);
        await this.typeText(span, node.textContent, speed);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const clone = node.cloneNode(false);
        element.appendChild(clone);
        if (node.tagName === "STYLE" || !node.hasChildNodes()) {
          clone.innerHTML = node.innerHTML;
        }
      }
    }
    return Promise.resolve();
  }

  showExperience(outputElement = this.output) {
    const experience = `<span style="color: #ffff00; font-weight: bold;">💼 Project & Experience</span>

<span style="color: #66d9ef;">SYSTEM ANALYST</span>
${this.wrapWithColor("2023 - Present | Jakarta, Indonesia", "#ffffff")}

• ${this.wrapWithColor("Sistem Manajemen Kas", "#ff6b9d")} - ${this.wrapWithColor("App pencatatan arus kas end-to-end (CI4, AJAX)", "#ffffff")}
• ${this.wrapWithColor("Sistem Plotting Akademik", "#ff6b9d")} - ${this.wrapWithColor("Logic penjadwalan & deteksi bentrok ruangan", "#ffffff")}
• ${this.wrapWithColor("Freelance OS", "#ff6b9d")} - ${this.wrapWithColor("CRM untuk tracking project dan kalkulasi invoice", "#ffffff")}

<span style="color: #66d9ef;">FREELANCE WEB DEVELOPER</span>
${this.wrapWithColor("2021 - 2023 | Jakarta, Indonesia", "#ffffff")}

• ${this.wrapWithColor("Fana Market", "#ff6b9d")} - ${this.wrapWithColor("Marketplace akun digital dengan Auto-delivery & Gateway", "#ffffff")}
• ${this.wrapWithColor("BrewBuddy F&B", "#ff6b9d")} - ${this.wrapWithColor("Sistem order coffee shop, State Management & UI/UX", "#ffffff")}
• ${this.wrapWithColor("Portal Berita Gamified", "#ff6b9d")} - ${this.wrapWithColor("Integrasi Read-to-Earn dan sistem reward", "#ffffff")}

<span style="color: #66d9ef;">KITCHEN STAFF (F&B)</span>
${this.wrapWithColor("2023 - 2024 | Jakarta, Indonesia", "#ffffff")}

• ${this.wrapWithColor("Flow Operational", "#ff6b9d")} - ${this.wrapWithColor("Mengelola alur dapur sebelum terjun penuh ke Web Dev", "#ffffff")}`;

    const experienceDiv = document.createElement("div");
    experienceDiv.innerHTML = experience;
    outputElement.appendChild(experienceDiv);
    this.scrollToBottom(outputElement.closest(".terminal-content"));
  }

  showEducation(outputElement = this.output) {
    const education = `<span style="color: #ffd93d; font-weight: bold;">🎓 Education</span>

${this.wrapWithColor("┌──────────────────────────────────────────────────┐", "#ffd93d")}
${this.wrapWithColor("│", "#ffd93d")}${this.wrapWithColor(" Bachelor of Management Information ", "#ffffff")}${this.wrapWithColor("               │", "#ffd93d")}
${this.wrapWithColor("└──────────────────────────────────────────────────┘", "#ffd93d")}

${this.wrapWithColor("🏛️ Status: ", "#ffd93d")}  ${this.wrapWithColor("Undergraduate Student", "#ffffff")}
${this.wrapWithColor("📅 Time: ", "#ffd93d")}    ${this.wrapWithColor("Present", "#ffffff")}
${this.wrapWithColor("📍 Location: ", "#ffd93d")}${this.wrapWithColor("Jakarta, Indonesia", "#ffffff")}

${this.wrapWithColor("╭──────────────────────────────────────────────────╮", "#ffd93d")}
${this.wrapWithColor("│", "#ffd93d")}${this.wrapWithColor(" Focused on system analysis and web design     ", "#ffffff")}${this.wrapWithColor("│", "#ffd93d")}
${this.wrapWithColor("╰──────────────────────────────────────────────────╯", "#ffd93d")}`;

    const educationDiv = document.createElement("div");
    educationDiv.innerHTML = education;
    outputElement.appendChild(educationDiv);
    this.scrollToBottom(outputElement.closest(".terminal-content"));
  }

  showSkills(outputElement = this.output) {
    const skills = `<span style="color: #ffff00; font-weight: bold;">🛠️ TECHNICAL SKILLS</span>

<span style="color: #66d9ef;">[ Logical Architecture ]</span>
• ${this.wrapWithColor("System Flow", "#ffffff")}
• ${this.wrapWithColor("Business Logic", "#ffffff")}
• ${this.wrapWithColor("Laravel / CodeIgniter", "#ffffff")}
• ${this.wrapWithColor("Use Case Mapping", "#ffffff")}

<span style="color: #66d9ef;">[ Data Integrity & Security ]</span>
• ${this.wrapWithColor("Database Design", "#ffffff")}
• ${this.wrapWithColor("Data Integrity", "#ffffff")}
• ${this.wrapWithColor("Security Mindset", "#ffffff")}
• ${this.wrapWithColor("API Logic", "#ffffff")}

<span style="color: #66d9ef;">[ Accuracy & Team Communication ]</span>
• ${this.wrapWithColor("Data Classification", "#ffffff")}
• ${this.wrapWithColor("Validation Logic", "#ffffff")}
• ${this.wrapWithColor("Technical Documentation", "#ffffff")}
• ${this.wrapWithColor("Task Direction", "#ffffff")}
• ${this.wrapWithColor("Requirement Communication", "#ffffff")}`;

    const skillsDiv = document.createElement("div");
    skillsDiv.innerHTML = skills;
    outputElement.appendChild(skillsDiv);
    this.scrollToBottom(outputElement.closest(".terminal-content"));
  }

  showContact(outputElement = this.output) {
    const contact = `<span style="color: #ffd93d; font-weight: bold;">📫 Contact Information</span>

${this.wrapWithColor("┌────────────────────────────────────────┐", "#ffd93d")}
${this.wrapWithColor("│", "#ffd93d")} ${this.wrapWithColor("Mari diskusi soal rancangan sistem.", "#ffffff")}        ${this.wrapWithColor("│", "#ffd93d")}
${this.wrapWithColor("└────────────────────────────────────────┘", "#ffd93d")}

${this.wrapWithColor("✉", "#ffd93d")}  ${this.wrapWithColor("Email:", "#ffd93d")}    ${this.wrapWithColor('<a href="mailto:nanditogianza@gmail.com" style="color: #ffffff; text-decoration: none;">nanditogianza@gmail.com</a>', "#ffffff")}
${this.wrapWithColor("🌐", "#ffd93d")}  ${this.wrapWithColor("Website:", "#ffd93d")}  ${this.wrapWithColor('<a href="https://gianagni.my.id" target="_blank" style="color: #ffffff; text-decoration: none;">gianagni.my.id</a>', "#ffffff")}
${this.wrapWithColor("⚡", "#ffd93d")}  ${this.wrapWithColor("Github:", "#ffd93d")}   ${this.wrapWithColor('<a href="https://github.com/gianagni" target="_blank" style="color: #ffffff; text-decoration: none;">github.com/gianagni</a>', "#ffffff")}
${this.wrapWithColor("💼", "#ffd93d")}  ${this.wrapWithColor("LinkedIn:", "#ffd93d")} ${this.wrapWithColor('<a href="https://www.linkedin.com/in/nanditogianza?utm_source=share_via&utm_content=profile&utm_medium=member_ios" target="_blank" style="color: #ffffff; text-decoration: none;">linkedin.com/in/nanditogianza</a>', "#ffffff")}`;

    const contactDiv = document.createElement("div");
    contactDiv.innerHTML = contact;
    outputElement.appendChild(contactDiv);
    this.scrollToBottom(outputElement.closest(".terminal-content"));
  }

// --- BAGIAN 2 SELESAI ---

// ==========================================
// BAGIAN 3: MODAL, MINI-GAMES, & UTILITIES
// ==========================================

  closeSplit(terminalContent) {
    const container = terminalContent.parentElement;
    const input = terminalContent.querySelector("input");

    const terminalIndex = this.terminals.findIndex((t) => t.input === input);
    if (terminalIndex > -1) {
      this.terminals.splice(terminalIndex, 1);
    }

    terminalContent.remove();

    if (container.children.length <= 1 && container !== this.terminalContainer) {
      if (container.children.length === 1) {
        const remainingContent = container.firstElementChild;
        container.parentElement.insertBefore(remainingContent, container);
      }
      container.remove();
    }

    if (this.terminals.length > 0) {
      const newActiveIndex = Math.min(terminalIndex, this.terminals.length - 1);
      this.terminals[newActiveIndex].input.focus();
      this.activeTerminal = newActiveIndex;
    }
  }

  loadProjects() {
    this.projects = [
      {
        title: "Gianagni Lofi Bot",
        description: "Discord bot pemutar musik Lo-Fi 24/7 dengan arsitektur stream audio khusus.",
        image: "images/projects/discord-bot.png",
        technologies: ["Node.js", "Discord.js", "FFmpeg"],
        demo: "discord-bot.html",
        repo: "https://github.com/gianagni"
      },
      {
        title: "Sistem Kas UMKM",
        description: "Aplikasi pencatatan transaksi keuangan end-to-end dengan database ACID.",
        image: "images/projects/kas-manajemen.jpg",
        technologies: ["CodeIgniter 4", "AJAX", "MySQL"],
        demo: "kas-manajemen.html",
        repo: "https://github.com/gianagni"
      },
      {
        title: "Fana Market",
        description: "Platform marketplace akun digital dengan auto-delivery dan gateway pembayaran.",
        image: "images/projects/fanamarket.jpg",
        technologies: ["PHP", "MySQL", "Tripay API"],
        demo: "fanamarket.html",
        repo: "https://github.com/gianagni"
      },
      {
        title: "Plotting Akademik",
        description: "Algoritma penjadwalan dosen & kelas untuk mendeteksi bentrok ruangan.",
        image: "images/projects/plotting.jpg",
        technologies: ["PHP Native", "Logic", "PDF Gen"],
        demo: "plotting.html",
        repo: "https://github.com/gianagni"
      }
    ];
  }

  loadSkills() {
    this.skills = {
      "Logical Architecture": {
        "System Flow": 95,
        "Business Logic": 90,
        "Use Case Mapping": 88,
        "Laravel / CI4": 85
      },
      "Data Integrity": {
        "Database Design": 95,
        "Data Integrity": 90,
        "Security Mindset": 86
      },
      "Analysis Communication": {
        "Data Accuracy": 90,
        "Technical Docs": 88,
        "Team Briefing": 85
      }
    };
  }

  setupFileSystem() {
    this.fileSystem = {
      portfolio: {
        type: "directory",
        contents: {
          "about.txt": { type: "file", content: "System Analyst from Jakarta..." },
          "skills.md": { type: "file", content: "# System Analysis, Data Flow, Database Logic..." },
        }
      }
    };
  }

  // Theme handling
  handleThemeChange(theme) {
    this.terminal.className = `terminal theme-${theme}`;
    localStorage.setItem("theme", theme);
    this.currentTheme = theme;
    this.closeModal(this.themeModal);
  }

  // Modal handling
  showModal(modal) {
    modal.classList.add("active");
  }

  closeModal(modal) {
    modal.classList.remove("active");
  }

  // Projects showcase (UI UI Modal)
  showProjects() {
    const container = this.projectsModal.querySelector(".projects-container");
    container.innerHTML = this.projects.map((project) => `
      <div class="project-card">
        <img src="${project.image}" alt="${project.title}" class="project-image">
        <div class="project-details">
          <h3 class="project-title">${project.title}</h3>
          <p class="project-description">${project.description}</p>
          <div class="project-tech">
            ${project.technologies.map((tech) => `<span class="tech-tag">${tech}</span>`).join("")}
          </div>
          <div class="project-links">
            <a href="${project.demo}" class="project-link">
              <i class="fas fa-external-link-alt"></i> Detail
            </a>
            <a href="${project.repo}" class="project-link" target="_blank">
              <i class="fab fa-github"></i> Repository
            </a>
          </div>
        </div>
      </div>
    `).join("");
    this.showModal(this.projectsModal);
  }

  // Skills visualization (UI Modal)
  showSkillsVisualization() {
    const container = this.skillsModal.querySelector(".skills-container");
    container.innerHTML = Object.entries(this.skills).map(([category, skills]) => `
      <div class="skill-category">
        <h3 class="skill-category-title">${category}</h3>
        <div class="skill-bars">
          ${Object.entries(skills).map(([skill, level]) => `
            <div class="skill-item">
              <div class="skill-info">
                <span class="skill-name">${skill}</span>
                <span class="skill-level">${level}%</span>
              </div>
              <div class="skill-progress">
                <div class="skill-progress-bar" style="width: ${level}%"></div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `).join("");
    this.showModal(this.skillsModal);
  }

  // PDF Generation (Placeholder)
  async generatePDF() {
    const outputElement = this.terminals[this.activeTerminal].input.closest(".terminal-content").querySelector("[id^='output']");
    this.printToOutput(outputElement, "Menggenerate PDF CV...", "info");
    setTimeout(() => {
      this.printToOutput(outputElement, "Fitur cetak PDF akan segera hadir. Silakan cek halaman About utama.", "error");
    }, 1000);
  }

  // Mini-game - Snake game with p5.js
  initGame() {
    this.endGame();
    this.gameActive = true;

    const outputElement = this.terminals[this.activeTerminal].input.closest(".terminal-content").querySelector("[id^='output']");

    const gameContainer = document.createElement("div");
    gameContainer.className = "game-container";
    gameContainer.id = "snake-game-container";
    gameContainer.innerHTML = `
      <div class="game-instructions">
        <p>Snake Game: Gunakan Arrow Keys (Kiri/Kanan/Atas/Bawah) untuk bergerak.</p>
        <p>Tekan P (Pause), SPACE (Restart), ESC (Keluar).</p>
      </div>
      <div id="snake-game-score">Score: 0</div>
      <div id="snake-game-canvas"></div>
    `;

    outputElement.appendChild(gameContainer);
    this.initSnakeGame();
    this.scrollToBottom(outputElement.closest(".terminal-content"));
  }

  endGame() {
    if (!this.gameActive) return;
    this.gameActive = false;
    if (this.gameHandler) {
      document.removeEventListener("keydown", this.gameHandler);
      this.gameHandler = null;
    }
    if (this.p5Instance) {
      this.p5Instance.remove();
      this.p5Instance = null;
    }
    const gameContainer = document.getElementById("snake-game-container");
    if (gameContainer) gameContainer.remove();
  }

  initSnakeGame() {
    const sketch = (p) => {
      const gridSize = 20;
      const canvasWidth = 400;
      const canvasHeight = 300;
      let snake = [];
      let food;
      let direction = { x: 1, y: 0 };
      let nextDirection = { x: 1, y: 0 };
      let score = 0;
      let gameOver = false;
      let frameRate = 10;
      let isPaused = false;

      p.setup = () => {
        const canvas = p.createCanvas(canvasWidth, canvasHeight);
        canvas.parent("snake-game-canvas");
        p.frameRate(frameRate);
        resetGame();
      };

      p.draw = () => {
        p.background(0);
        if (isPaused) {
          drawGrid();
          p.fill(255); p.textSize(24); p.textAlign(p.CENTER, p.CENTER);
          p.text("PAUSED", canvasWidth / 2, canvasHeight / 2);
          p.textSize(16); p.text("Tekan P untuk lanjut", canvasWidth / 2, canvasHeight / 2 + 30);
          return;
        }
        if (gameOver) {
          drawGrid();
          p.fill(255, 0, 0); p.textSize(24); p.textAlign(p.CENTER, p.CENTER);
          p.text("Game Over!", canvasWidth / 2, canvasHeight / 2 - 20);
          p.textSize(16); p.text(`Score: ${score}`, canvasWidth / 2, canvasHeight / 2 + 20);
          p.text("Tekan SPACE untuk restart", canvasWidth / 2, canvasHeight / 2 + 50);
          return;
        }
        direction = nextDirection;
        moveSnake();
        checkCollision();
        checkFood();
        drawGrid();
        drawSnake();
        drawFood();
        updateScore();
      };

      p.keyPressed = () => {
        if (p.keyCode === 80) { isPaused = !isPaused; return false; }
        if (isPaused) return false;
        if (p.keyCode === p.UP_ARROW && direction.y !== 1) nextDirection = { x: 0, y: -1 };
        else if (p.keyCode === p.DOWN_ARROW && direction.y !== -1) nextDirection = { x: 0, y: 1 };
        else if (p.keyCode === p.LEFT_ARROW && direction.x !== 1) nextDirection = { x: -1, y: 0 };
        else if (p.keyCode === p.RIGHT_ARROW && direction.x !== -1) nextDirection = { x: 1, y: 0 };
        else if (p.keyCode === 32 && gameOver) resetGame();
        else if (p.keyCode === 27) this.endGame();
        if ([p.UP_ARROW, p.DOWN_ARROW, p.LEFT_ARROW, p.RIGHT_ARROW, 32, 27, 80].includes(p.keyCode)) return false;
      };

      function resetGame() {
        snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
        direction = { x: 1, y: 0 }; nextDirection = { x: 1, y: 0 };
        score = 0; gameOver = false;
        placeFood(); updateScore();
      }

      function moveSnake() {
        const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
        if (head.x < 0) head.x = Math.floor(canvasWidth / gridSize) - 1;
        if (head.x >= canvasWidth / gridSize) head.x = 0;
        if (head.y < 0) head.y = Math.floor(canvasHeight / gridSize) - 1;
        if (head.y >= canvasHeight / gridSize) head.y = 0;
        snake.unshift(head);
        if (head.x !== food.x || head.y !== food.y) snake.pop();
        else {
          placeFood(); score += 10;
          if (frameRate < 20) { frameRate += 0.5; p.frameRate(frameRate); }
        }
      }

      function checkCollision() {
        const head = snake[0];
        for (let i = 1; i < snake.length; i++) {
          if (head.x === snake[i].x && head.y === snake[i].y) { gameOver = true; return; }
        }
      }

      function checkFood() {
        const head = snake[0];
        if (head.x === food.x && head.y === food.y) { placeFood(); score += 10; }
      }

      function placeFood() {
        let validPosition = false;
        while (!validPosition) {
          food = { x: Math.floor(p.random(canvasWidth / gridSize)), y: Math.floor(p.random(canvasHeight / gridSize)) };
          validPosition = true;
          for (const segment of snake) {
            if (segment.x === food.x && segment.y === food.y) { validPosition = false; break; }
          }
        }
      }

      function drawSnake() {
        p.noStroke();
        for (let i = 1; i < snake.length; i++) {
          p.fill(0, 255, 0);
          p.rect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 2, gridSize - 2, 4);
        }
        p.fill(0, 200, 0);
        p.rect(snake[0].x * gridSize, snake[0].y * gridSize, gridSize - 2, gridSize - 2, 6);
      }

      function drawFood() {
        p.fill(255, 0, 0);
        p.ellipse(food.x * gridSize + gridSize / 2, food.y * gridSize + gridSize / 2, gridSize * 0.8, gridSize * 0.8);
      }

      function drawGrid() {
        p.stroke(30); p.strokeWeight(0.5);
        for (let x = 0; x <= canvasWidth; x += gridSize) p.line(x, 0, x, canvasHeight);
        for (let y = 0; y <= canvasHeight; y += gridSize) p.line(0, y, canvasWidth, y);
      }

      function updateScore() {
        const scoreElement = document.getElementById("snake-game-score");
        if (scoreElement) scoreElement.textContent = `Score: ${score}`;
      }
    };
    this.p5Instance = new p5(sketch);
  }

  // Matrix rain effect
  startMatrixEffect(outputElement) {
    this.stopMatrixEffect();
    const matrixContainer = document.createElement("div");
    matrixContainer.className = "matrix-container";
    matrixContainer.id = "matrix-container";

    const canvas = document.createElement("canvas");
    canvas.id = "matrix-canvas";
    matrixContainer.appendChild(canvas);

    const instructions = document.createElement("div");
    instructions.className = "matrix-instructions";
    instructions.textContent = "Ketik 'stop-matrix' untuk keluar";
    matrixContainer.appendChild(instructions);

    outputElement.appendChild(matrixContainer);

    const ctx = canvas.getContext("2d");
    canvas.width = matrixContainer.offsetWidth;
    canvas.height = 300;

    const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ{}[]$+-*/=%";
    const columns = Math.floor(canvas.width / 20);
    const drops = [];

    for (let i = 0; i < columns; i++) drops[i] = Math.floor(Math.random() * -20);

    const getMatrixColor = () => {
      const themeColors = { default: "#00ff00", dracula: "#50fa7b", solarized: "#859900", nord: "#a3be8c" };
      return themeColors[this.currentTheme] || "#00ff00";
    };

    const drawMatrix = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = getMatrixColor();
      ctx.font = "15px monospace";
      for (let i = 0; i < drops.length; i++) {
        const char = characters[Math.floor(Math.random() * characters.length)];
        ctx.fillText(char, i * 20, drops[i] * 20);
        if (drops[i] * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };

    this.matrixInterval = setInterval(drawMatrix, 50);
    this.scrollToBottom(outputElement.closest(".terminal-content"));
  }

  stopMatrixEffect() {
    if (this.matrixInterval) {
      clearInterval(this.matrixInterval);
      this.matrixInterval = null;
    }
    const matrixContainer = document.getElementById("matrix-container");
    if (matrixContainer) matrixContainer.remove();
  }

  // Weather command
  async showWeather(location, outputElement) {
    if (!location) {
      this.printToOutput(outputElement, "Mohon masukkan nama kota. Contoh: weather Jakarta", "error");
      return;
    }
    this.printToOutput(outputElement, `Mencari cuaca untuk ${location}...`, "info");
    try {
      const apiKey = "4331a27995f4c5b5e8d1eab1ed3d88b4"; 
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      
      const weatherHTML = `<div class="weather-container">
        <div class="weather-header">
          <span style="color: #ffff00; font-weight: bold;">🌤️ Cuaca di ${data.name}, ${data.sys.country}</span>
        </div>
        <div class="weather-body">
          <div class="weather-main">
            <span style="font-size: 2rem; color: #ffffff;">${Math.round(data.main.temp)}°C</span>
            <span style="color: #cccccc;">${data.weather[0].main}</span>
          </div>
          <div class="weather-details">
            <div><span style="color: #87cefa;">Terasa seperti:</span> ${Math.round(data.main.feels_like)}°C</div>
            <div><span style="color: #87cefa;">Kelembapan:</span> ${data.main.humidity}%</div>
            <div><span style="color: #87cefa;">Angin:</span> ${Math.round(data.wind.speed * 3.6)} km/h</div>
          </div>
        </div>
      </div>`;
      this.printToOutput(outputElement, weatherHTML, "");
    } catch (error) {
      this.printToOutput(outputElement, `Gagal mengambil data cuaca: Pastikan nama kota benar.`, "error");
    }
  }

  // Calculator command
  calculate(expression, outputElement) {
    if (!expression) {
      this.printToOutput(outputElement, "Masukkan angka. Contoh: calc 5+5", "error");
      return;
    }
    try {
      const sanitizedExpression = expression.replace(/[^0-9+\-*/().%\s]/g, "");
      const result = eval(sanitizedExpression);
      if (isNaN(result) || !isFinite(result)) throw new Error("Invalid result");

      const formattedResult = typeof result === "number" && !Number.isInteger(result) ? result.toFixed(4).replace(/\.?0+$/, "") : result.toString();
      
      const calculationHTML = `<div class="calculation">
        <div class="calculation-expression">${this.wrapWithColor(expression, "#87cefa")}</div>
        <div class="calculation-result">${this.wrapWithColor("= " + formattedResult, "#98fb98")}</div>
      </div>`;
      this.printToOutput(outputElement, calculationHTML, "");
    } catch (error) {
      this.printToOutput(outputElement, `Error: Format matematika tidak valid.`, "error");
    }
  }

  // LinkedIn Cover Generator (Disesuaikan untuk Dito)
  generateLinkedInCover(outputElement) {
    const coverContainer = document.createElement("div");
    coverContainer.className = "linkedin-cover-container";
    coverContainer.style.width = "100%";
    coverContainer.style.height = "300px";
    coverContainer.style.position = "relative";
    coverContainer.style.overflow = "hidden";
    coverContainer.style.borderRadius = "8px";
    coverContainer.style.marginTop = "10px";
    coverContainer.style.marginBottom = "20px";
    coverContainer.style.boxShadow = "0 10px 30px rgba(0,0,0,0.4)";
    coverContainer.style.border = "1px solid rgba(255,255,255,0.1)";

    const background = document.createElement("div");
    background.style.position = "absolute";
    background.style.top = "0";
    background.style.left = "0";
    background.style.width = "100%";
    background.style.height = "100%";
    background.style.backgroundColor = "#1e1e2e";
    background.style.zIndex = "1";
    coverContainer.appendChild(background);

    const terminalHeader = document.createElement("div");
    terminalHeader.style.position = "absolute";
    terminalHeader.style.top = "0";
    terminalHeader.style.left = "0";
    terminalHeader.style.width = "100%";
    terminalHeader.style.height = "30px";
    terminalHeader.style.backgroundColor = "#282a36";
    terminalHeader.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
    terminalHeader.style.display = "flex";
    terminalHeader.style.alignItems = "center";
    terminalHeader.style.padding = "0 10px";
    terminalHeader.style.zIndex = "2";

    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.display = "flex";
    buttonsContainer.style.gap = "6px";

    const colors = ["#ff5f56", "#ffbd2e", "#27c93f"];
    colors.forEach((color) => {
      const button = document.createElement("div");
      button.style.width = "12px";
      button.style.height = "12px";
      button.style.borderRadius = "50%";
      button.style.backgroundColor = color;
      buttonsContainer.appendChild(button);
    });

    terminalHeader.appendChild(buttonsContainer);

    const terminalTitle = document.createElement("div");
    terminalTitle.textContent = "dito@gianza: ~/interactive-resume";
    terminalTitle.style.color = "#f8f8f2";
    terminalTitle.style.fontSize = "12px";
    terminalTitle.style.fontFamily = "'Fira Code', monospace";
    terminalTitle.style.margin = "0 auto";
    terminalHeader.appendChild(terminalTitle);

    coverContainer.appendChild(terminalHeader);

    const terminalContent = document.createElement("div");
    terminalContent.style.position = "absolute";
    terminalContent.style.top = "30px";
    terminalContent.style.left = "0";
    terminalContent.style.width = "100%";
    terminalContent.style.height = "calc(100% - 30px)";
    terminalContent.style.padding = "15px";
    terminalContent.style.boxSizing = "border-box";
    terminalContent.style.zIndex = "2";
    terminalContent.style.overflow = "hidden";
    coverContainer.appendChild(terminalContent);

    const asciiArt = document.createElement("pre");
    asciiArt.style.color = "#66d9ef";
    asciiArt.style.margin = "0";
    asciiArt.style.fontSize = "10px";
    asciiArt.style.fontFamily = "'Fira Code', monospace";
    asciiArt.style.lineHeight = "1";
    asciiArt.innerHTML = `██████╗  ██╗ ████████╗ ██████╗ 
██╔══██╗ ██║ ╚══██╔══╝██╔═══██╗
██║  ██║ ██║    ██║   ██║   ██║
██║  ██║ ██║    ██║   ██║   ██║
██████╔╝ ██║    ██║   ╚██████╔╝
╚═════╝  ╚═╝    ╚═╝    ╚═════╝ `;
    terminalContent.appendChild(asciiArt);

    const divider = document.createElement("div");
    divider.style.width = "100%";
    divider.style.height = "1px";
    divider.style.backgroundColor = "#555555";
    divider.style.margin = "8px 0";
    terminalContent.appendChild(divider);

    const subtitle = document.createElement("div");
    subtitle.textContent = "Interactive Terminal Resume";
    subtitle.style.color = "#888888";
    subtitle.style.fontSize = "12px";
    subtitle.style.fontFamily = "'Fira Code', monospace";
    subtitle.style.textAlign = "center";
    subtitle.style.marginBottom = "5px";
    terminalContent.appendChild(subtitle);

    const role = document.createElement("div");
    role.textContent = "System Analyst";
    role.style.color = "#666666";
    role.style.fontSize = "10px";
    role.style.fontFamily = "'Fira Code', monospace";
    role.style.textAlign = "center";
    role.style.marginBottom = "10px";
    terminalContent.appendChild(role);

    const divider2 = document.createElement("div");
    divider2.style.width = "100%";
    divider2.style.height = "1px";
    divider2.style.backgroundColor = "#555555";
    divider2.style.margin = "8px 0";
    terminalContent.appendChild(divider2);

    const promptContainer = document.createElement("div");
    promptContainer.style.display = "flex";
    promptContainer.style.alignItems = "center";
    promptContainer.style.marginTop = "10px";

    const prompt = document.createElement("span");
    prompt.textContent = "➜";
    prompt.style.color = "#87af87";
    prompt.style.marginRight = "8px";
    prompt.style.fontSize = "14px";
    promptContainer.appendChild(prompt);

    const command = document.createElement("span");
    command.textContent = "help";
    command.style.color = "#f8f8f2";
    command.style.fontFamily = "'Fira Code', monospace";
    command.style.fontSize = "14px";
    promptContainer.appendChild(command);

    terminalContent.appendChild(promptContainer);

    const commandOutput = document.createElement("div");
    commandOutput.style.marginTop = "10px";

    const helpTitle = document.createElement("div");
    helpTitle.textContent = "🚀 Available Commands";
    helpTitle.style.color = "#ffff00";
    helpTitle.style.fontSize = "12px";
    helpTitle.style.fontWeight = "bold";
    helpTitle.style.marginBottom = "8px";
    commandOutput.appendChild(helpTitle);

    const mainCmdTitle = document.createElement("div");
    mainCmdTitle.textContent = "Main Commands:";
    mainCmdTitle.style.color = "#00ffff";
    mainCmdTitle.style.fontSize = "10px";
    mainCmdTitle.style.marginBottom = "4px";
    commandOutput.appendChild(mainCmdTitle);

    const mainCommands = [
      { cmd: "about", desc: "Display professional summary" },
      { cmd: "skills", desc: "View technical expertise" },
      { cmd: "experience", desc: "Show work history" },
    ];

    mainCommands.forEach((item) => {
      const cmdLine = document.createElement("div");
      cmdLine.style.display = "flex";
      cmdLine.style.fontSize = "10px";
      cmdLine.style.marginBottom = "4px";

      const cmdName = document.createElement("span");
      cmdName.textContent = "• " + item.cmd;
      cmdName.style.color = "#98fb98";
      cmdName.style.width = "80px";
      cmdLine.appendChild(cmdName);

      const cmdDesc = document.createElement("span");
      cmdDesc.textContent = item.desc;
      cmdDesc.style.color = "#ffffff";
      cmdLine.appendChild(cmdDesc);

      commandOutput.appendChild(cmdLine);
    });

    terminalContent.appendChild(commandOutput);

    const urlContainer = document.createElement("div");
    urlContainer.style.position = "absolute";
    urlContainer.style.bottom = "10px";
    urlContainer.style.left = "0";
    urlContainer.style.width = "100%";
    urlContainer.style.textAlign = "center";

    const url = document.createElement("div");
    url.textContent = "gianagni.my.id";
    url.style.color = "#87cefa";
    url.style.fontSize = "12px";
    url.style.fontFamily = "'Fira Code', monospace";
    urlContainer.appendChild(url);

    terminalContent.appendChild(urlContainer);

    outputElement.appendChild(coverContainer);
    this.scrollToBottom(outputElement.closest(".terminal-content"));
  }
}

// Inisialisasi Terminal saat file ter-load
new TerminalResume();