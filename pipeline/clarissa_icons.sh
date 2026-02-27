#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# clarissa_icons.sh
# Auto-generated icon arrays for Clarissa.
#
# HOW TO USE IN clarissa.sh:
#   source "$(dirname "$0")/pipeline/clarissa_icons.sh"
#   clarissa_print_icon ICON_RABBIT
#
# HOW TO REGENERATE (after new Figma exports land in pipeline/icons/):
#   cd ~/.clarissa/pipeline
#   > clarissa_icons.sh                              # wipe old arrays
#   bash <(echo '#!/usr/bin/env bash')               # reset file header (or just re-copy this block manually)
#   for f in icons/*.png; do
#     name=$(basename "$f" .png | tr '[:lower:]' '[:upper:]' | tr '-' '_')
#     python3 pixel_to_cli.py "$f" "$name" >> clarissa_icons.sh
#   done
#
# HOW TO PREVIEW AN ICON:
#   source clarissa_icons.sh
#   printf '%s\n' "${ICON_RABBIT[@]}"
# ─────────────────────────────────────────────────────────────────────────────

# Helper: print any icon array by reference name
clarissa_print_icon() {
  local icon_ref="$1"
  # Use nameref if bash 4.3+, else eval fallback
  if [[ "${BASH_VERSINFO[0]}" -ge 4 && "${BASH_VERSINFO[1]}" -ge 3 ]]; then
    local -n _arr="$icon_ref"
    printf '%s\n' "${_arr[@]}"
  else
    eval 'printf "%s\n" "${'"$icon_ref"'[@]}"'
  fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Icons — appended below by pixel_to_cli.py
# Run the batch command above to populate this section.
# ─────────────────────────────────────────────────────────────────────────────
# ── ICON_RABBIT ──────────────────────────────────────
# Source : _IconBase@cli.png
# Canvas : 32×32 logical px  →  64 chars wide in terminal
# Display: printf "%s\n" "${ICON_RABBIT[@]}"
ICON_RABBIT=(
  "                  ██████                ██████                  "
  "                                                                "
  "                ██      ████        ████      ██                "
  "            ████            ██    ██            ████            "
  "            ████            ██    ██            ████            "
  "            ████  ██████    ██    ██    ██████  ████            "
  "            ████  ██████    ██    ██    ██████  ████            "
  "            ████  ██████    ██    ██    ██████  ████            "
  "            ████  ██████    ██    ██    ██████  ████            "
  "            ████  ██████    ██    ██    ██████  ████            "
  "            ████  ██████    ██    ██    ██████  ████            "
  "            ████  ██████    ██    ██    ██████  ████            "
  "            ████  ██████    ██    ██    ██████  ████            "
  "            ████  ██████    ██    ██    ██████  ████            "
  "            ████            ██    ██            ████            "
  "            ████              ████              ████            "
  "            ██                ████                ██            "
  "          ██                                        ██          "
  "          ██          ██                ██          ██          "
  "          ██          ██                ██          ██          "
  "      ████                  ████████                  ████      "
  "      ████                    ████                    ████      "
  "      ████                    ████                    ████      "
  "      ████                          ████              ████      "
  "      ████                      ████                  ████      "
  "      ████                    ██████                  ████      "
  "      ████                                            ████      "
  "          ██                                        ██          "
  "          ██                                        ██          "
  "            ██████                            ██████            "
  "                                                                "
  "                  ████████████████████████████                  "
)

