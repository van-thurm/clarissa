#!/bin/bash
# ═══════════════════════════════════════════════════════
#  Clarissa — Setup Wizard
#  Interactive birth chart configuration
# ═══════════════════════════════════════════════════════

DIM='\033[2m'
BOLD='\033[1m'
ACCENT='\033[38;5;216m'
RESET='\033[0m'

CLARISSA_DIR="${HOME}/.clarissa"
CHART_CONF="${CLARISSA_DIR}/chart.conf"
CALC_SCRIPT="${CLARISSA_DIR}/calculate.sh"

_hr() { echo -e "  ${DIM}─────────────────────────────────────────────────${RESET}"; }

_enter_manual_chart() {
    local signs=("Aries" "Taurus" "Gemini" "Cancer" "Leo" "Virgo"
                 "Libra" "Scorpio" "Sagittarius" "Capricorn" "Aquarius" "Pisces")

    echo -e "  ${DIM}Enter your placements. Look them up at${RESET}"
    echo -e "  ${ACCENT}cafeastrology.com/natal.php${RESET}"
    echo ""

    for s in "${!signs[@]}"; do
        printf "  ${DIM}%2d${RESET}  %s\n" "$((s+1))" "${signs[$s]}"
    done
    echo ""

    local planets=("SUN" "MOON" "RISING" "MERCURY" "VENUS" "MARS"
                   "JUPITER" "SATURN" "URANUS" "NEPTUNE" "PLUTO")
    local labels=("Sun" "Moon" "Rising" "Mercury" "Venus" "Mars"
                  "Jupiter" "Saturn" "Uranus" "Neptune" "Pluto")

    for i in "${!planets[@]}"; do
        read -rp "  ${labels[$i]} sign (1-12): " sign_num
        if [[ "$sign_num" =~ ^[0-9]+$ ]] && (( sign_num >= 1 && sign_num <= 12 )); then
            eval "${planets[$i]}_SIGN=\"${signs[$((sign_num-1))]}\""
        else
            eval "${planets[$i]}_SIGN=\"Aries\""
        fi
        read -rp "  ${labels[$i]} degree (0-29): " deg
        if [[ "$deg" =~ ^[0-9]+$ ]] && (( deg >= 0 && deg <= 29 )); then
            eval "${planets[$i]}_DEGREE=\"${deg}\""
        else
            eval "${planets[$i]}_DEGREE=\"0\""
        fi
    done
}

# ── Welcome ────────────────────────────────────────────

echo ""
echo -e "  ${ACCENT}CLARISSA${RESET}  ${DIM}Setup${RESET}"
_hr
echo ""
echo "  Let's set up your birth chart."
echo ""

# ── Name ───────────────────────────────────────────────
read -rp "  Your name: " user_name
if [[ -z "$user_name" ]]; then
    user_name="Friend"
fi

echo ""
echo -e "  ${DIM}Hey ${user_name}. I need your birth data.${RESET}"
echo ""

# ── Birth date ─────────────────────────────────────────
months=("January" "February" "March" "April" "May" "June"
        "July" "August" "September" "October" "November" "December")

echo -e "  ${BOLD}Birth Date${RESET}"
echo ""
for i in "${!months[@]}"; do
    printf "  ${DIM}%2d${RESET}  %s\n" "$((i+1))" "${months[$i]}"
done
echo ""
read -rp "  Month (1-12): " birth_month
if ! [[ "$birth_month" =~ ^[0-9]+$ ]] || (( birth_month < 1 || birth_month > 12 )); then
    echo -e "  ${DIM}Invalid month, defaulting to January${RESET}"
    birth_month=1
fi

read -rp "  Day (1-31): " birth_day
if ! [[ "$birth_day" =~ ^[0-9]+$ ]] || (( birth_day < 1 || birth_day > 31 )); then
    echo -e "  ${DIM}Invalid day, defaulting to 1${RESET}"
    birth_day=1
fi

read -rp "  Year (e.g. 1990): " birth_year
if ! [[ "$birth_year" =~ ^[0-9]{4}$ ]]; then
    echo -e "  ${DIM}Invalid year, defaulting to 2000${RESET}"
    birth_year=2000
fi

birth_date_display="${months[$((birth_month-1))]} ${birth_day}, ${birth_year}"
echo ""
echo -e "  ${DIM}${birth_date_display}${RESET}"

# ── Birth time ─────────────────────────────────────────
echo ""
echo -e "  ${BOLD}Birth Time${RESET}"
echo -e "  ${DIM}Check your birth certificate if you're not sure.${RESET}"
echo ""
read -rp "  Hour (1-12): " birth_hour
if ! [[ "$birth_hour" =~ ^[0-9]+$ ]] || (( birth_hour < 1 || birth_hour > 12 )); then
    echo -e "  ${DIM}Invalid hour, defaulting to 12${RESET}"
    birth_hour=12
fi

read -rp "  Minute (0-59): " birth_min
if ! [[ "$birth_min" =~ ^[0-9]+$ ]] || (( birth_min < 0 || birth_min > 59 )); then
    birth_min=0
fi

echo -e "  ${DIM}1${RESET}  AM"
echo -e "  ${DIM}2${RESET}  PM"
read -rp "  AM/PM (1 or 2): " ampm_choice
if [[ "$ampm_choice" == "2" ]]; then
    ampm="PM"
    if (( birth_hour != 12 )); then
        hour_24=$((birth_hour + 12))
    else
        hour_24=12
    fi
else
    ampm="AM"
    if (( birth_hour == 12 )); then
        hour_24=0
    else
        hour_24=$birth_hour
    fi
fi

birth_time_display="${birth_hour}:$(printf '%02d' "$birth_min") ${ampm}"

# ── Timezone ───────────────────────────────────────────
echo ""
echo -e "  ${BOLD}Timezone${RESET} ${DIM}(at time of birth, not current)${RESET}"
echo ""
echo -e "  ${DIM} 1${RESET}  Eastern (EST)"
echo -e "  ${DIM} 2${RESET}  Central (CST)"
echo -e "  ${DIM} 3${RESET}  Mountain (MST)"
echo -e "  ${DIM} 4${RESET}  Pacific (PST)"
echo -e "  ${DIM} 5${RESET}  Alaska (AKST)"
echo -e "  ${DIM} 6${RESET}  Hawaii (HST)"
echo -e "  ${DIM} 7${RESET}  GMT/UTC"
echo -e "  ${DIM} 8${RESET}  CET (Central Europe)"
echo -e "  ${DIM} 9${RESET}  Other"
echo ""
read -rp "  Timezone (1-9): " tz_choice

tz_name=""
case "$tz_choice" in
    1) tz_offset=-5; tz_name="EST" ;;
    2) tz_offset=-6; tz_name="CST" ;;
    3) tz_offset=-7; tz_name="MST" ;;
    4) tz_offset=-8; tz_name="PST" ;;
    5) tz_offset=-9; tz_name="AKST" ;;
    6) tz_offset=-10; tz_name="HST" ;;
    7) tz_offset=0;  tz_name="UTC" ;;
    8) tz_offset=1;  tz_name="CET" ;;
    9)
        read -rp "  UTC offset (e.g. -5, 5.5, 9): " tz_offset
        tz_name="UTC${tz_offset}"
        ;;
    *) tz_offset=0; tz_name="UTC" ;;
esac

birth_time_display="${birth_time_display} ${tz_name}"

# ── Birth place ────────────────────────────────────────
echo ""
echo -e "  ${BOLD}Birth Place${RESET}"
echo ""
read -rp "  City: " birth_city
read -rp "  State/Country: " birth_region
birth_place="${birth_city}, ${birth_region}"

# ── Calculate chart ────────────────────────────────────
echo ""
_hr
echo ""
echo -e "  ${ACCENT}Calculating your chart...${RESET}"
echo ""

calc_success=false

if [[ -f "$CALC_SCRIPT" ]]; then
    source "$CALC_SCRIPT"

    coords=$(get_coordinates "$birth_city")
    if [[ -z "$coords" ]]; then
        coords=$(get_coordinates "$birth_place")
    fi

    if [[ -n "$coords" ]]; then
        lat=$(echo "$coords" | awk '{print $1}')
        lon=$(echo "$coords" | awk '{print $2}')

        result=$(calculate_chart "$birth_year" "$birth_month" "$birth_day" \
                                "$hour_24" "$birth_min" "$tz_offset" "$lat" "$lon")
        eval "$result"
        calc_success=true

        echo -e "  ${BOLD}Your Chart${RESET}  ${DIM}(estimated)${RESET}"
        echo ""
        printf "  %-11s %s %s°\n" "Sun" "$SUN_SIGN" "$SUN_DEGREE"
        printf "  %-11s %s %s°\n" "Moon" "$MOON_SIGN" "$MOON_DEGREE"
        printf "  %-11s %s %s°\n" "Rising" "$RISING_SIGN" "$RISING_DEGREE"
        printf "  %-11s %s %s°\n" "Mercury" "$MERCURY_SIGN" "$MERCURY_DEGREE"
        printf "  %-11s %s %s°\n" "Venus" "$VENUS_SIGN" "$VENUS_DEGREE"
        printf "  %-11s %s %s°\n" "Mars" "$MARS_SIGN" "$MARS_DEGREE"
        printf "  %-11s %s %s°\n" "Jupiter" "$JUPITER_SIGN" "$JUPITER_DEGREE"
        printf "  %-11s %s %s°\n" "Saturn" "$SATURN_SIGN" "$SATURN_DEGREE"
        printf "  %-11s %s %s°\n" "Uranus" "$URANUS_SIGN" "$URANUS_DEGREE"
        printf "  %-11s %s %s°\n" "Neptune" "$NEPTUNE_SIGN" "$NEPTUNE_DEGREE"
        printf "  %-11s %s %s°\n" "Pluto" "$PLUTO_SIGN" "$PLUTO_DEGREE"
        echo ""
        echo -e "  ${DIM}Mercury, Venus, and Mars may be off by one sign.${RESET}"
        echo -e "  ${DIM}Verify at ${ACCENT}cafeastrology.com/natal.php${RESET}"
        echo -e "  ${DIM}Then run ${BOLD}clarissa manual${RESET}${DIM} to correct.${RESET}"
    fi
fi

if [[ "$calc_success" == false ]]; then
    if [[ -f "$CALC_SCRIPT" ]]; then
        echo -e "  ${DIM}City not in database. Enter placements manually.${RESET}"
    else
        echo -e "  ${DIM}Calculator not found. Enter placements manually.${RESET}"
    fi
    echo ""
    _enter_manual_chart
fi

# ── Save ───────────────────────────────────────────────
echo ""
read -rp "  Save this chart? (y/n): " save_choice

if [[ "$save_choice" != "y" && "$save_choice" != "Y" ]]; then
    echo ""
    echo -e "  ${DIM}Not saved. Run ${BOLD}clarissa setup${RESET}${DIM} again anytime.${RESET}"
    echo ""
    exit 0
fi

mkdir -p "$CLARISSA_DIR"

cat > "$CHART_CONF" << CONF
# Clarissa — Birth Chart Configuration
# Generated: $(date "+%Y-%m-%d %H:%M")

USER_NAME="${user_name}"
BIRTH_DATE="${birth_date_display}"
BIRTH_TIME="${birth_time_display}"
BIRTH_PLACE="${birth_place}"

SUN_SIGN="${SUN_SIGN}"
SUN_DEGREE="${SUN_DEGREE}"
MOON_SIGN="${MOON_SIGN}"
MOON_DEGREE="${MOON_DEGREE}"
RISING_SIGN="${RISING_SIGN}"
RISING_DEGREE="${RISING_DEGREE}"
MERCURY_SIGN="${MERCURY_SIGN}"
MERCURY_DEGREE="${MERCURY_DEGREE}"
VENUS_SIGN="${VENUS_SIGN}"
VENUS_DEGREE="${VENUS_DEGREE}"
MARS_SIGN="${MARS_SIGN}"
MARS_DEGREE="${MARS_DEGREE}"
JUPITER_SIGN="${JUPITER_SIGN}"
JUPITER_DEGREE="${JUPITER_DEGREE}"
SATURN_SIGN="${SATURN_SIGN}"
SATURN_DEGREE="${SATURN_DEGREE}"
URANUS_SIGN="${URANUS_SIGN}"
URANUS_DEGREE="${URANUS_DEGREE}"
NEPTUNE_SIGN="${NEPTUNE_SIGN}"
NEPTUNE_DEGREE="${NEPTUNE_DEGREE}"
PLUTO_SIGN="${PLUTO_SIGN}"
PLUTO_DEGREE="${PLUTO_DEGREE}"
CONF

echo ""
echo -e "  ${ACCENT}Chart saved.${RESET}"
echo ""
echo -e "  Try ${BOLD}clarissa${RESET} for your daily message."
echo -e "  Try ${BOLD}clarissa me${RESET} for your Big Three."
echo -e "  Try ${BOLD}clarissa manual${RESET} to tweak placements."
echo ""
echo -e "  ${DIM}na na nananaaaaa ♪${RESET}"
echo ""
