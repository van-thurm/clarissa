#!/bin/bash
# ═══════════════════════════════════════════════════════
#  Clarissa Installer
#  Usage: curl -fsSL <url>/install.sh | bash
# ═══════════════════════════════════════════════════════

set -e

DIM='\033[2m'
BOLD='\033[1m'
ACCENT='\033[38;5;216m'
RESET='\033[0m'

CLARISSA_DIR="${HOME}/.clarissa"
REPO_URL="${CLARISSA_REPO_URL:-https://raw.githubusercontent.com/van-thurm/clarissa/main}"

echo ""
echo -e "  ${ACCENT}CLARISSA${RESET}  ${DIM}Installer${RESET}"
echo -e "  ${DIM}─────────────────────────────────────────────────${RESET}"
echo ""

# ── Check dependencies ─────────────────────────────────
if ! command -v bash &>/dev/null; then
    echo "  Error: bash is required."
    exit 1
fi

if ! command -v awk &>/dev/null; then
    echo "  Error: awk is required (for chart calculations)."
    exit 1
fi

# ── Create directory ───────────────────────────────────
echo -e "  ${DIM}Creating ${CLARISSA_DIR}${RESET}"
mkdir -p "$CLARISSA_DIR"

# ── Download files ─────────────────────────────────────
download() {
    local file="$1"
    local url="${REPO_URL}/${file}"
    local dest="${CLARISSA_DIR}/${file}"

    echo -e "  ${DIM}Downloading ${file}${RESET}"

    if command -v curl &>/dev/null; then
        curl -fsSL "$url" -o "$dest"
    elif command -v wget &>/dev/null; then
        wget -q "$url" -O "$dest"
    else
        echo "  Error: curl or wget required."
        exit 1
    fi

    chmod +x "$dest"
}

download "clarissa.sh"
download "calculate.sh"
download "setup.sh"

# ── Add shell alias ────────────────────────────────────
add_alias() {
    local rc_file="$1"
    local alias_line="alias clarissa=\"~/.clarissa/clarissa.sh\""

    if [[ -f "$rc_file" ]]; then
        if ! grep -q "alias clarissa=" "$rc_file" 2>/dev/null; then
            echo "" >> "$rc_file"
            echo "# Clarissa — your personal astrologist" >> "$rc_file"
            echo "$alias_line" >> "$rc_file"
            echo -e "  ${DIM}Added alias to $(basename "$rc_file")${RESET}"
            return 0
        else
            echo -e "  ${DIM}Alias already exists in $(basename "$rc_file")${RESET}"
            return 0
        fi
    fi
    return 1
}

echo ""
alias_added=false

if [[ "$SHELL" == *"zsh"* ]] || [[ -f "${HOME}/.zshrc" ]]; then
    add_alias "${HOME}/.zshrc" && alias_added=true
elif [[ "$SHELL" == *"bash"* ]] || [[ -f "${HOME}/.bashrc" ]]; then
    add_alias "${HOME}/.bashrc" && alias_added=true
fi

if [[ "$alias_added" == false ]]; then
    for rc in "${HOME}/.zshrc" "${HOME}/.bashrc" "${HOME}/.bash_profile"; do
        add_alias "$rc" && alias_added=true && break
    done
fi

if [[ "$alias_added" == false ]]; then
    echo -e "  ${DIM}Could not find shell config. Add this manually:${RESET}"
    echo -e "  ${BOLD}alias clarissa=\"~/.clarissa/clarissa.sh\"${RESET}"
fi

# ── Done ───────────────────────────────────────────────
echo ""
echo -e "  ${ACCENT}Installed.${RESET}"
echo ""
echo -e "  ${DIM}─────────────────────────────────────────────────${RESET}"
echo ""
echo -e "  Next: run the setup wizard to configure your chart."
echo ""
echo -e "  ${BOLD}~/.clarissa/setup.sh${RESET}"
echo ""
echo -e "  Or restart your shell and run:"
echo ""
echo -e "  ${BOLD}clarissa setup${RESET}"
echo ""
echo -e "  ${DIM}na na nananaaaaa ♪${RESET}"
echo ""
