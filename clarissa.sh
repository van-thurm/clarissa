#!/bin/bash
# ═══════════════════════════════════════════════════════
#  CLARISSA — Your Personal Astrologist
# ═══════════════════════════════════════════════════════

# ── Design tokens ──────────────────────────────────────
DIM='\033[2m'
BOLD='\033[1m'
ACCENT='\033[38;5;216m'
WARM='\033[38;5;180m'
RESET='\033[0m'

_hr() { echo -e "  ${ACCENT}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"; }

_logo() {
    echo ""
    echo -e "  ${DIM} ____ ____ ____ ____ ____ ____ ____ ____ ${RESET}"
    echo -e "  ${DIM}||${RESET}${BOLD}C ${RESET}${DIM}|||${RESET}${BOLD}L ${RESET}${DIM}|||${RESET}${BOLD}A ${RESET}${DIM}|||${RESET}${BOLD}R ${RESET}${DIM}|||${RESET}${BOLD}I ${RESET}${DIM}|||${RESET}${BOLD}S ${RESET}${DIM}|||${RESET}${BOLD}S ${RESET}${DIM}|||${RESET}${BOLD}A ${RESET}${DIM}||${RESET}"
    echo -e "  ${DIM}||__|||__|||__|||__|||__|||__|||__|||__||${RESET}"
    echo -e "  ${DIM}|/__\\|/__\\|/__\\|/__\\|/__\\|/__\\|/__\\|/__\\|${RESET}"
}

# ── Load chart config ──────────────────────────────────
CLARISSA_DIR="${HOME}/.clarissa"
CHART_CONF="${CLARISSA_DIR}/chart.conf"

if [[ -f "$CHART_CONF" ]]; then
    source "$CHART_CONF"
elif [[ "${1:-}" == "setup" ]]; then
    bash "${CLARISSA_DIR}/setup.sh"
    exit 0
else
    echo ""
    echo -e "  ${ACCENT}no chart found.${RESET} run ${BOLD}clarissa setup${RESET} to get started."
    echo ""
    exit 1
fi

# ── Shared UI ──────────────────────────────────────────

_header() {
    _logo
    _hr
}

_section() {
    echo -e "  ${WARM}▸${RESET} ${DIM}$1${RESET}"
}

_moon_line() {
    local moon=$(_moon_emoji)
    local name=$(_moon_phase_name)
    echo -e "  ${moon}  ${BOLD}${name}${RESET}"
}

# ── Moon calculations ──────────────────────────────────

_moon_phase() {
    local known_new_moon=946965600
    local lunar_cycle=2551443
    local now=$(date +%s)
    local diff=$((now - known_new_moon))
    local phase_seconds=$((diff % lunar_cycle))
    echo $((phase_seconds / 86400))
}

_moon_phase_name() {
    local d=$(_moon_phase)
    if   ((d < 2));  then echo "new moon"
    elif ((d < 7));  then echo "waxing crescent"
    elif ((d < 9));  then echo "first quarter"
    elif ((d < 14)); then echo "waxing gibbous"
    elif ((d < 16)); then echo "full moon"
    elif ((d < 21)); then echo "waning gibbous"
    elif ((d < 23)); then echo "last quarter"
    else                  echo "waning crescent"
    fi
}

_moon_emoji() {
    local d=$(_moon_phase)
    if   ((d < 2));  then echo "●"
    elif ((d < 7));  then echo "◑"
    elif ((d < 9));  then echo "◑"
    elif ((d < 14)); then echo "◑"
    elif ((d < 16)); then echo "○"
    elif ((d < 21)); then echo "◐"
    elif ((d < 23)); then echo "◐"
    else                  echo "◐"
    fi
}

_moon_guidance() {
    local name=$(_moon_phase_name)
    case "$name" in
        "new moon")         echo "set intentions. plant seeds for new beginnings." ;;
        "waxing crescent")  echo "take first steps. build momentum." ;;
        "first quarter")    echo "push through challenges. commit to action." ;;
        "waxing gibbous")   echo "refine and adjust. almost there." ;;
        "full moon")        echo "harvest results. release what doesn't serve." ;;
        "waning gibbous")   echo "share wisdom. practice gratitude." ;;
        "last quarter")     echo "let go. forgive. clear space." ;;
        "waning crescent")  echo "rest and reflect. prepare for renewal." ;;
    esac
}

_current_sun_sign() {
    local m=$((10#$(date +%m))) d=$((10#$(date +%d)))
    if   ((m==3&&d>=21||m==4&&d<=19));  then echo "Aries"
    elif ((m==4&&d>=20||m==5&&d<=20));  then echo "Taurus"
    elif ((m==5&&d>=21||m==6&&d<=20));  then echo "Gemini"
    elif ((m==6&&d>=21||m==7&&d<=22));  then echo "Cancer"
    elif ((m==7&&d>=23||m==8&&d<=22));  then echo "Leo"
    elif ((m==8&&d>=23||m==9&&d<=22));  then echo "Virgo"
    elif ((m==9&&d>=23||m==10&&d<=22)); then echo "Libra"
    elif ((m==10&&d>=23||m==11&&d<=21)); then echo "Scorpio"
    elif ((m==11&&d>=22||m==12&&d<=21)); then echo "Sagittarius"
    elif ((m==12&&d>=22||m==1&&d<=19)); then echo "Capricorn"
    elif ((m==1&&d>=20||m==2&&d<=18));  then echo "Aquarius"
    else echo "Pisces"
    fi
}

# ── Sign data ─────────────────────────────────────────

_sign_element() {
    case "$1" in
        Aries|Leo|Sagittarius)         echo "fire" ;;
        Taurus|Virgo|Capricorn)        echo "earth" ;;
        Gemini|Libra|Aquarius)         echo "air" ;;
        Cancer|Scorpio|Pisces)         echo "water" ;;
    esac
}

_sign_traits() {
    case "$1" in
        Aries)       echo "bold, courageous, pioneering, direct" ;;
        Taurus)      echo "steady, sensual, determined, loyal" ;;
        Gemini)      echo "curious, adaptable, communicative, witty" ;;
        Cancer)      echo "nurturing, intuitive, protective, tenacious" ;;
        Leo)         echo "generous, warm, creative, confident" ;;
        Virgo)       echo "analytical, helpful, precise, practical" ;;
        Libra)       echo "diplomatic, charming, fair-minded, aesthetic" ;;
        Scorpio)     echo "intense, passionate, perceptive, transformative" ;;
        Sagittarius) echo "adventurous, optimistic, honest, philosophical" ;;
        Capricorn)   echo "ambitious, disciplined, responsible, strategic" ;;
        Aquarius)    echo "innovative, humanitarian, independent, visionary" ;;
        Pisces)      echo "intuitive, compassionate, imaginative, mystical" ;;
    esac
}

_sign_shadow() {
    case "$1" in
        Aries)       echo "impatient, aggressive, self-centered" ;;
        Taurus)      echo "stubborn, possessive, resistant to change" ;;
        Gemini)      echo "scattered, superficial, restless" ;;
        Cancer)      echo "moody, clingy, oversensitive" ;;
        Leo)         echo "dramatic, prideful, attention-seeking" ;;
        Virgo)       echo "critical, anxious, perfectionist" ;;
        Libra)       echo "indecisive, people-pleasing, avoidant" ;;
        Scorpio)     echo "jealous, secretive, controlling" ;;
        Sagittarius) echo "tactless, restless, over-promising" ;;
        Capricorn)   echo "cold, rigid, workaholic" ;;
        Aquarius)    echo "detached, contrarian, emotionally distant" ;;
        Pisces)      echo "escapist, boundary-less, self-sacrificing" ;;
    esac
}

_sign_ruler() {
    case "$1" in
        Aries)       echo "Mars" ;;
        Taurus)      echo "Venus" ;;
        Gemini)      echo "Mercury" ;;
        Cancer)      echo "the Moon" ;;
        Leo)         echo "the Sun" ;;
        Virgo)       echo "Mercury" ;;
        Libra)       echo "Venus" ;;
        Scorpio)     echo "Pluto" ;;
        Sagittarius) echo "Jupiter" ;;
        Capricorn)   echo "Saturn" ;;
        Aquarius)    echo "Uranus" ;;
        Pisces)      echo "Neptune" ;;
    esac
}

_sun_core() {
    case "$1" in
        Aries)       echo "your core essence is that of the initiator — bold,\n  courageous, and unafraid to go first. you need action\n  and independence like oxygen." ;;
        Taurus)      echo "your core essence is rooted in the sensory world —\n  beauty, comfort, and lasting value. you build with\n  patience and extraordinary determination." ;;
        Gemini)      echo "your core essence is that of the communicator — curious,\n  quick-minded, and endlessly adaptable. you need variety\n  and mental stimulation to thrive." ;;
        Cancer)      echo "your core essence is that of the nurturer — deeply\n  intuitive, emotionally intelligent, and fiercely protective\n  of those you love. home is where your power lives." ;;
        Leo)         echo "your core essence is that of the creator — generous,\n  warm-hearted, and magnetically expressive. you are meant\n  to shine, lead, and inspire." ;;
        Virgo)       echo "your core essence is that of the analyst — precise,\n  helpful, and devoted to improvement. you see what others\n  miss and make the complex simple." ;;
        Libra)       echo "your core essence is that of the harmonizer — fair,\n  charming, and aesthetically attuned. you seek balance\n  and beauty in all things." ;;
        Scorpio)     echo "your core essence is that of the transformer — intense,\n  perceptive, and unafraid of depth. you see through\n  surfaces to the truth beneath." ;;
        Sagittarius) echo "your core essence is that of the eternal seeker — the\n  philosopher-adventurer. you possess an insatiable curiosity\n  and a deep need for meaning and truth." ;;
        Capricorn)   echo "your core essence is that of the builder — ambitious,\n  disciplined, and playing the long game. you understand\n  that lasting things take time and effort." ;;
        Aquarius)    echo "your core essence is that of the visionary — innovative,\n  independent, and ahead of the curve. you see the future\n  others haven't imagined yet." ;;
        Pisces)      echo "your core essence is that of the mystic — deeply\n  intuitive, boundlessly compassionate, and connected to\n  something larger than the material world." ;;
    esac
}

_moon_core() {
    case "$1" in
        Aries)       echo "your emotional nature is fiery, direct, and fast-moving.\n  you process feelings through action — when upset, you\n  need to move, to do, to confront." ;;
        Taurus)      echo "your emotional nature is steady, sensory, and grounding.\n  you process feelings slowly and need physical comfort —\n  food, touch, nature, familiar spaces." ;;
        Gemini)      echo "your emotional nature is quick, curious, and verbal.\n  you process feelings through words, ideas, and mental\n  exploration. variety feeds your soul." ;;
        Cancer)      echo "your emotional nature is deep, protective, and intuitive.\n  you feel everything — your own emotions and everyone\n  else's too. home and safety are essential." ;;
        Leo)         echo "your emotional nature is warm, expressive, and generous.\n  you need to feel appreciated and valued. your feelings\n  are big and you express them boldly." ;;
        Virgo)       echo "your emotional nature is analytical and detail-oriented.\n  you process feelings by organizing, fixing, and helping.\n  anxiety can be your emotional baseline." ;;
        Libra)       echo "your emotional nature craves harmony and partnership.\n  you process feelings through connection, conversation,\n  and creating beauty around you." ;;
        Scorpio)     echo "your emotional nature is intense, transformative, and\n  private. you feel at an oceanic depth. trust is earned\n  slowly but given completely." ;;
        Sagittarius) echo "your emotional nature is optimistic, restless, and free.\n  you process feelings through adventure, philosophy, and\n  humor. emotional claustrophobia is real." ;;
        Capricorn)   echo "your emotional nature is reserved, responsible, and\n  self-reliant. you may suppress feelings to function,\n  but they run deep beneath the discipline." ;;
        Aquarius)    echo "your emotional nature is detached, humanitarian, and\n  unconventional. you process feelings intellectually\n  first, emotionally second." ;;
        Pisces)      echo "your emotional nature is porous, empathic, and dreamy.\n  you absorb the emotions of everyone around you. solitude\n  and creative expression are essential." ;;
    esac
}

_rising_core() {
    case "$1" in
        Aries)       echo "the world sees you as bold, direct, and ready for action.\n  you approach life head-first, with courage and initiative.\n  first impressions: dynamic, pioneering, fearless." ;;
        Taurus)      echo "the world sees you as calm, grounded, and aesthetically\n  aware. you approach life at your own pace, with quiet\n  determination. first impressions: steady, sensual, solid." ;;
        Gemini)      echo "the world sees you as quick, curious, and conversational.\n  you approach life with questions and adaptability.\n  first impressions: witty, youthful, versatile." ;;
        Cancer)      echo "the world sees you as warm, approachable, and caring.\n  you approach life with emotional intelligence and\n  protectiveness. first impressions: nurturing, sensitive." ;;
        Leo)         echo "the world sees you as radiant, confident, and magnetic.\n  you approach life with dramatic flair and generosity.\n  first impressions: warm, commanding, creative." ;;
        Virgo)       echo "the world sees you as precise, helpful, and composed.\n  you approach life with attention to detail and service.\n  first impressions: modest, intelligent, capable." ;;
        Libra)       echo "the world sees you as charming, graceful, and fair.\n  you approach life seeking harmony and partnership.\n  first impressions: elegant, diplomatic, balanced." ;;
        Scorpio)     echo "the world sees you as intense, magnetic, and powerful.\n  you approach life with piercing perception and depth.\n  first impressions: mysterious, commanding, perceptive." ;;
        Sagittarius) echo "the world sees you as adventurous, jovial, and honest.\n  you approach life as a grand exploration. first\n  impressions: enthusiastic, philosophical, free-spirited." ;;
        Capricorn)   echo "the world sees you as serious, competent, and ambitious.\n  you approach life with strategy and long-term vision.\n  first impressions: mature, authoritative, reliable." ;;
        Aquarius)    echo "the world sees you as unique, independent, and cerebral.\n  you approach life on your own terms. first impressions:\n  unconventional, friendly, intellectually interesting." ;;
        Pisces)      echo "the world sees you as gentle, dreamy, and empathic.\n  you approach life with intuition and artistic sensitivity.\n  first impressions: soft, imaginative, ethereal." ;;
    esac
}

# ── Daily messages ─────────────────────────────────────

_daily_message() {
    local doy=$((10#$(date +%j)))
    local msgs=(
        "the archer's arrow flies truest when aimed at truth."
        "your ${MOON_SIGN} moon needs tending. honor what you feel."
        "${RISING_SIGN} rising: trust your first impression of things."
        "Mars in ${MARS_SIGN} whispers: go deep, not wide."
        "your Sagittarius stellium demands adventure."
        "Venus in ${VENUS_SIGN} reminds you: build something lasting."
        "Saturn conjunct your Sun: discipline IS freedom."
        "Mercury in ${MERCURY_SIGN}: your words carry weight."
        "the centaur runs toward the horizon. what calls to you?"
        "your chart is heavy with fire. create, inspire, illuminate."
        "Pluto in ${PLUTO_SIGN}: transform what needs changing."
        "Neptune in ${NEPTUNE_SIGN}: dream practically, manifest mystically."
        "Uranus in Sagittarius: your rebellion serves truth."
        "the archer needs open sky. make space for possibility."
        "your moon needs nurturing. care for yourself first."
        "fire dominant chart: you warm everyone around you."
        "Saturn lessons are hard but valuable. what are you learning?"
        "Jupiter expands whatever it touches. choose your focus."
        "Sagittarius sun: optimism is your superpower."
        "Mars in ${MARS_SIGN}: when you commit, you're unstoppable."
        "Venus in ${VENUS_SIGN}: love is built brick by brick."
        "your stellium makes you intense. that's a feature."
        "Mercury conjunct Sun: you ARE your ideas."
        "the archer's bow requires tension. embrace creative pressure."
        "${MOON_SIGN} moon: honor your feelings, they're information."
        "today is a good day to be exactly who you are."
        "your chart screams: MEANING MATTERS. seek it. create it."
    )
    echo "${msgs[$((doy % ${#msgs[@]}))]}"
}

_transits_note() {
    local m=$((10#$(date +%m)))
    case $m in
        12|1|2)  echo "Capricorn season grounds your fire. good for practical manifestation." ;;
        3|4|5)   echo "Aries season activates your chart. energy for new beginnings." ;;
        6|7|8)   echo "Cancer season touches your moon. emotional insights incoming." ;;
        9|10|11) echo "Sagittarius approaches. solar return brings renewal." ;;
    esac
}

# ── Interpretations ────────────────────────────────────

_interp_sun() {
    echo -e "  ${ACCENT}☉${RESET}  ${BOLD}Sun in ${SUN_SIGN}${RESET}  ${DIM}${SUN_DEGREE}°${RESET}"
    echo ""
    echo -e "  $(_sun_core "$SUN_SIGN")"
    echo ""
    echo -e "  ${DIM}traits${RESET}     $(_sign_traits "$SUN_SIGN")"
    echo -e "  ${DIM}shadow${RESET}     $(_sign_shadow "$SUN_SIGN")"
    echo -e "  ${DIM}element${RESET}    $(_sign_element "$SUN_SIGN"), ruled by $(_sign_ruler "$SUN_SIGN")"
}

_interp_moon() {
    echo -e "  ${ACCENT}☽${RESET}  ${BOLD}Moon in ${MOON_SIGN}${RESET}  ${DIM}${MOON_DEGREE}°${RESET}"
    echo ""
    echo -e "  $(_moon_core "$MOON_SIGN")"
    echo ""
    echo -e "  ${DIM}needs${RESET}      $(_sign_traits "$MOON_SIGN")"
    echo -e "  ${DIM}shadow${RESET}     $(_sign_shadow "$MOON_SIGN")"
    echo -e "  ${DIM}element${RESET}    $(_sign_element "$MOON_SIGN")"
}

_interp_rising() {
    echo -e "  ${ACCENT}↑${RESET}  ${BOLD}${RISING_SIGN} Rising${RESET}  ${DIM}${RISING_DEGREE}°${RESET}"
    echo ""
    echo -e "  $(_rising_core "$RISING_SIGN")"
    echo ""
    echo -e "  ${DIM}traits${RESET}     $(_sign_traits "$RISING_SIGN")"
    echo -e "  ${DIM}element${RESET}    $(_sign_element "$RISING_SIGN"), ruled by $(_sign_ruler "$RISING_SIGN")"
}

_interp_mercury() {
    echo -e "  ${WARM}☿${RESET}  ${BOLD}Mercury in ${MERCURY_SIGN}${RESET}  ${DIM}${MERCURY_DEGREE}°${RESET}"
    echo ""
    echo "  your mind works through $(_sign_element "$MERCURY_SIGN") energy — "
    echo "  $(_sign_traits "$MERCURY_SIGN")."
    echo ""
    echo -e "  ${DIM}style${RESET}      $(_sign_traits "$MERCURY_SIGN")"
    echo -e "  ${DIM}shadow${RESET}     $(_sign_shadow "$MERCURY_SIGN")"
}

_interp_venus() {
    echo -e "  ${WARM}♀${RESET}  ${BOLD}Venus in ${VENUS_SIGN}${RESET}  ${DIM}${VENUS_DEGREE}°${RESET}"
    echo ""
    echo "  in love and aesthetics, your taste runs toward"
    echo "  $(_sign_traits "$VENUS_SIGN")."
    echo "  ruled by $(_sign_ruler "$VENUS_SIGN") — $(_sign_element "$VENUS_SIGN") shapes your heart."
    echo ""
    echo -e "  ${DIM}traits${RESET}     $(_sign_traits "$VENUS_SIGN")"
    echo -e "  ${DIM}shadow${RESET}     $(_sign_shadow "$VENUS_SIGN")"
}

_interp_mars() {
    echo -e "  ${WARM}♂${RESET}  ${BOLD}Mars in ${MARS_SIGN}${RESET}  ${DIM}${MARS_DEGREE}°${RESET}"
    echo ""
    echo "  your drive and willpower express through $(_sign_element "$MARS_SIGN")"
    echo "  energy — $(_sign_traits "$MARS_SIGN")."
    echo ""
    echo -e "  ${DIM}action${RESET}     $(_sign_traits "$MARS_SIGN")"
    echo -e "  ${DIM}shadow${RESET}     $(_sign_shadow "$MARS_SIGN")"
}

_interp_jupiter() {
    echo -e "  ${WARM}♃${RESET}  ${BOLD}Jupiter in ${JUPITER_SIGN}${RESET}  ${DIM}${JUPITER_DEGREE}°${RESET}"
    echo ""
    echo "  luck and expansion come through $(_sign_element "$JUPITER_SIGN") qualities:"
    echo "  $(_sign_traits "$JUPITER_SIGN")."
    echo ""
    echo -e "  ${DIM}growth${RESET}     through $(_sign_traits "$JUPITER_SIGN")"
    echo -e "  ${DIM}element${RESET}    $(_sign_element "$JUPITER_SIGN")"
}

_interp_saturn() {
    echo -e "  ${WARM}♄${RESET}  ${BOLD}Saturn in ${SATURN_SIGN}${RESET}  ${DIM}${SATURN_DEGREE}°${RESET}"
    echo ""
    echo "  your life lessons involve mastering the $(_sign_element "$SATURN_SIGN")"
    echo "  qualities of $(_sign_traits "$SATURN_SIGN")."
    echo ""
    echo -e "  ${DIM}lessons${RESET}    discipline through $(_sign_element "$SATURN_SIGN") energy"
    echo -e "  ${DIM}shadow${RESET}     $(_sign_shadow "$SATURN_SIGN")"
}

_interp_stellium() {
    local snames=("Aries" "Taurus" "Gemini" "Cancer" "Leo" "Virgo"
                  "Libra" "Scorpio" "Sagittarius" "Capricorn" "Aquarius" "Pisces")
    local scounts=(0 0 0 0 0 0 0 0 0 0 0 0)
    local splanets=("" "" "" "" "" "" "" "" "" "" "" "")

    local psigns=("$SUN_SIGN" "$MOON_SIGN" "$MERCURY_SIGN" "$VENUS_SIGN"
                  "$MARS_SIGN" "$JUPITER_SIGN" "$SATURN_SIGN"
                  "$URANUS_SIGN" "$NEPTUNE_SIGN" "$PLUTO_SIGN")
    local pnames=("Sun" "Moon" "Mercury" "Venus" "Mars" "Jupiter"
                  "Saturn" "Uranus" "Neptune" "Pluto")

    for i in "${!psigns[@]}"; do
        for j in "${!snames[@]}"; do
            if [[ "${snames[$j]}" == "${psigns[$i]}" ]]; then
                scounts[$j]=$(( ${scounts[$j]} + 1 ))
                if [[ -n "${splanets[$j]}" ]]; then
                    splanets[$j]="${splanets[$j]} + ${pnames[$i]}"
                else
                    splanets[$j]="${pnames[$i]}"
                fi
            fi
        done
    done

    local found=false
    for j in "${!snames[@]}"; do
        if (( ${scounts[$j]} >= 3 )); then
            local sign="${snames[$j]}"
            echo -e "  ${ACCENT}✦${RESET}  ${BOLD}${sign} stellium${RESET}"
            echo -e "  ${DIM}${splanets[$j]}${RESET}"
            echo ""
            echo "  a powerful concentration of energy in ${sign}."
            echo "  multiple planets channel through $(_sign_element "$sign")"
            echo "  energy — $(_sign_traits "$sign")."
            echo ""
            echo -e "  ${DIM}element${RESET}    $(_sign_element "$sign")"
            echo -e "  ${DIM}traits${RESET}     $(_sign_traits "$sign")"
            echo -e "  ${DIM}challenge${RESET}  balancing that intensity; staying grounded"
            found=true
        fi
    done

    if [[ "$found" == false ]]; then
        echo -e "  ${DIM}no stellium detected (3+ planets in one sign).${RESET}"
    fi
}

_interp_elements() {
    echo -e "  ${ACCENT}◇${RESET}  ${BOLD}elemental balance${RESET}"
    echo ""

    local elems=("fire" "earth" "air" "water")
    local ecounts=(0 0 0 0)
    local eplanets=("" "" "" "")

    local pnames=("Sun" "Moon" "Rising" "Mercury" "Venus" "Mars"
                  "Jupiter" "Saturn" "Uranus" "Neptune" "Pluto")
    local psigns=("$SUN_SIGN" "$MOON_SIGN" "$RISING_SIGN" "$MERCURY_SIGN"
                  "$VENUS_SIGN" "$MARS_SIGN" "$JUPITER_SIGN" "$SATURN_SIGN"
                  "$URANUS_SIGN" "$NEPTUNE_SIGN" "$PLUTO_SIGN")

    for i in "${!psigns[@]}"; do
        local elem=$(_sign_element "${psigns[$i]}")
        for e in "${!elems[@]}"; do
            if [[ "${elems[$e]}" == "$elem" ]]; then
                ecounts[$e]=$(( ${ecounts[$e]} + 1 ))
                if [[ -n "${eplanets[$e]}" ]]; then
                    eplanets[$e]="${eplanets[$e]}, ${pnames[$i]}"
                else
                    eplanets[$e]="${pnames[$i]}"
                fi
            fi
        done
    done

    local max_idx=0
    for e in "${!elems[@]}"; do
        if (( ${ecounts[$e]} > ${ecounts[$max_idx]} )); then
            max_idx=$e
        fi
    done

    for e in "${!elems[@]}"; do
        local bar=""
        for ((b=0; b<${ecounts[$e]}; b++)); do bar+="█"; done
        if (( e == max_idx )); then
            printf "  ${ACCENT}%-7s${RESET} ${ACCENT}%-11s${RESET} ${DIM}(dominant)${RESET}\n" "${elems[$e]}" "$bar"
        else
            printf "  ${DIM}%-7s${RESET} ${WARM}%-11s${RESET}\n" "${elems[$e]}" "$bar"
        fi
        echo -e "  ${DIM}        ${eplanets[$e]:-—}${RESET}"
        echo ""
    done
}

# ── Commands ───────────────────────────────────────────

cmd_menu() {
    _logo
    _hr
    echo ""

    local hour=$(date +%H)
    local greeting
    if   (( 10#$hour < 12 )); then greeting="good morning"
    elif (( 10#$hour < 17 )); then greeting="good afternoon"
    else                           greeting="good evening"
    fi

    local today=$(date "+%A, %B %d")
    echo -e "  ${BOLD}${greeting}, ${USER_NAME}.${RESET}  ${DIM}${today}${RESET}"
    echo ""
    _moon_line
    echo -e "  ${DIM}$(_moon_guidance)${RESET}"
    echo ""
    _hr
    echo ""

    local labels=("daily reading" "birth chart" "the big three"
                  "planetary placements" "special features" "full reading"
                  "ask for advice" "setup wizard" "edit chart data")
    local hotkeys=("1" "2" "3" "4" "5" "6" "7" "s" "e")
    local sel=0
    local total=${#labels[@]}
    local menu_lines=12

    _menu_cleanup() { tput cnorm 2>/dev/null; }
    trap _menu_cleanup EXIT INT TERM
    tput civis 2>/dev/null

    _draw_menu_items() {
        local i
        for i in "${!labels[@]}"; do
            (( i == 7 )) && echo ""
            if (( i == sel )); then
                printf "  ${ACCENT}${BOLD}%s${RESET}  ${ACCENT}●${RESET}  ${ACCENT}${BOLD}%s${RESET}\n" "${hotkeys[$i]}" "${labels[$i]}"
            elif (( i >= 7 )); then
                printf "  ${DIM}%s${RESET}  ○  %s\n" "${hotkeys[$i]}" "${labels[$i]}"
            else
                printf "  ${BOLD}%s${RESET}  ○  %s\n" "${hotkeys[$i]}" "${labels[$i]}"
            fi
        done
        echo ""
        _hr
    }

    _draw_menu_items

    while true; do
        IFS= read -rsn1 key

        local done=false
        case "$key" in
            $'\033')
                read -rsn1 -t 1 c1
                read -rsn1 -t 1 c2
                case "${c1}${c2}" in
                    '[A'|'OA') (( sel > 0 )) && (( sel-- )) || sel=$(( total - 1 )) ;;
                    '[B'|'OB') (( sel < total - 1 )) && (( sel++ )) || sel=0 ;;
                esac
                ;;
            $'\t')
                (( sel < total - 1 )) && (( sel++ )) || sel=0
                ;;
            '') done=true ;;
            q|Q) sel=-1; done=true ;;
            1) sel=0; done=true ;;
            2) sel=1; done=true ;;
            3) sel=2; done=true ;;
            4) sel=3; done=true ;;
            5) sel=4; done=true ;;
            6) sel=5; done=true ;;
            7) sel=6; done=true ;;
            s|S) sel=7; done=true ;;
            e|E) sel=8; done=true ;;
        esac

        $done && break

        printf "\033[%dA" "$menu_lines"
        _draw_menu_items
    done

    _menu_cleanup
    trap - EXIT INT TERM
    echo ""

    case $sel in
        0) cmd_daily ;;
        1) cmd_chart ;;
        2) cmd_personality ;;
        3) cmd_planets ;;
        4) cmd_special ;;
        5) cmd_all ;;
        6)
            read -rp "  what would you like to ask?  " question
            cmd_advice "$question"
            ;;
        7) bash "${CLARISSA_DIR}/setup.sh" ;;
        8) cmd_manual ;;
        *) ;;
    esac
}

cmd_chart() {
    _header
    echo ""
    echo -e "  ${BOLD}natal chart${RESET}"
    echo -e "  ${DIM}${BIRTH_DATE} · ${BIRTH_TIME} · ${BIRTH_PLACE}${RESET}"
    echo ""
    _section "THE BIG THREE"
    echo ""
    printf "  ${ACCENT}☉${RESET}  %-11s ${BOLD}%s${RESET}  %s°\n" "Sun" "$SUN_SIGN" "$SUN_DEGREE"
    printf "  ${ACCENT}☽${RESET}  %-11s ${BOLD}%s${RESET}  %s°\n" "Moon" "$MOON_SIGN" "$MOON_DEGREE"
    printf "  ${ACCENT}↑${RESET}  %-11s ${BOLD}%s${RESET}  %s°\n" "Rising" "$RISING_SIGN" "$RISING_DEGREE"
    echo ""
    _section "INNER PLANETS"
    echo ""
    printf "  ${DIM}☿${RESET}  %-11s %s  %s°\n" "Mercury" "$MERCURY_SIGN" "$MERCURY_DEGREE"
    printf "  ${DIM}♀${RESET}  %-11s %s  %s°\n" "Venus" "$VENUS_SIGN" "$VENUS_DEGREE"
    printf "  ${DIM}♂${RESET}  %-11s %s  %s°\n" "Mars" "$MARS_SIGN" "$MARS_DEGREE"
    echo ""
    _section "OUTER PLANETS"
    echo ""
    printf "  ${DIM}♃${RESET}  %-11s %s  %s°\n" "Jupiter" "$JUPITER_SIGN" "$JUPITER_DEGREE"
    printf "  ${DIM}♄${RESET}  %-11s %s  %s°\n" "Saturn" "$SATURN_SIGN" "$SATURN_DEGREE"
    printf "  ${DIM}♅${RESET}  %-11s %s  %s°\n" "Uranus" "$URANUS_SIGN" "$URANUS_DEGREE"
    printf "  ${DIM}♆${RESET}  %-11s %s  %s°\n" "Neptune" "$NEPTUNE_SIGN" "$NEPTUNE_DEGREE"
    printf "  ${DIM}♇${RESET}  %-11s %s  %s°\n" "Pluto" "$PLUTO_SIGN" "$PLUTO_DEGREE"
    echo ""
}

cmd_personality() {
    _header
    echo ""
    _section "THE BIG THREE"
    echo ""
    _interp_sun
    echo ""
    _hr
    echo ""
    _interp_moon
    echo ""
    _hr
    echo ""
    _interp_rising
    echo ""
}

cmd_planets() {
    _header
    echo ""
    _section "PLANETARY PLACEMENTS"
    echo ""
    _interp_mercury
    echo ""
    _hr
    echo ""
    _interp_venus
    echo ""
    _hr
    echo ""
    _interp_mars
    echo ""
    _hr
    echo ""
    _interp_jupiter
    echo ""
    _hr
    echo ""
    _interp_saturn
    echo ""
}

cmd_special() {
    _header
    echo ""
    _section "SPECIAL CHART FEATURES"
    echo ""
    _interp_stellium
    echo ""
    _hr
    echo ""
    _interp_elements
}

cmd_daily() {
    _header
    echo ""
    local today=$(date "+%A, %B %d")
    echo -e "  ${BOLD}${today}${RESET}"
    echo ""
    _moon_line
    echo -e "  ${DIM}$(_moon_guidance)${RESET}"
    echo ""
    _hr
    echo ""
    echo "  $(_daily_message)"
    echo ""
    _hr
    echo ""
    echo -e "  ${DIM}$(_transits_note)${RESET}"
    echo ""
}

cmd_advice() {
    local question="$*"
    local today=$(date "+%A, %B %d")
    local moon_phase=$(_moon_phase_name)
    local current_sign=$(_current_sun_sign)
    local guidance=$(_moon_guidance)
    local daily=$(_daily_message)

    if [[ -z "$question" ]]; then
        echo ""
        echo -e "  ${ACCENT}clarissa needs a question.${RESET}"
        echo -e "  ${DIM}usage:${RESET} clarissa advice <your question about today>"
        echo -e "  ${DIM}example:${RESET} clarissa advice should i start that project today?"
        echo ""
        return
    fi

    local q_lower=$(echo "$question" | tr '[:upper:]' '[:lower:]')

    local is_today=true
    if [[ "$q_lower" == *"next week"* ]] || \
       [[ "$q_lower" == *"next month"* ]] || \
       [[ "$q_lower" == *"next year"* ]] || \
       [[ "$q_lower" == *"tomorrow"* ]] || \
       [[ "$q_lower" == *"yesterday"* ]] || \
       [[ "$q_lower" == *"last week"* ]] || \
       [[ "$q_lower" == *"last month"* ]] || \
       [[ "$q_lower" == *"in the future"* ]] || \
       [[ "$q_lower" == *"someday"* ]] || \
       [[ "$q_lower" == *"eventually"* ]] || \
       [[ "$q_lower" == *"when i'm older"* ]] || \
       [[ "$q_lower" == *"years from now"* ]]; then
        is_today=false
    fi

    _header
    echo ""

    if [[ "$is_today" == false ]]; then
        echo -e "  ${ACCENT}clarissa can only answer about today.${RESET}"
        echo ""
        echo "  the stars speak to the present moment, not the"
        echo "  distant future. rephrase for ${today}."
        echo ""
        echo -e "  ${DIM}example: \"should i start working on that today?\"${RESET}"
        echo ""
        return
    fi

    echo -e "  ${BOLD}${today}${RESET}"
    echo ""
    _moon_line
    echo -e "  ${DIM}${guidance}${RESET}"
    echo ""
    echo -e "  ${DIM}\"${question}\"${RESET}"
    echo ""
    echo -e "  Sun in ${current_sign} ${DIM}·${RESET} Moon is ${moon_phase}"
    echo ""
    echo -e "  ${DIM}for your chart${RESET}"
    echo -e "  ${SUN_SIGN} Sun ${DIM}·${RESET} ${MOON_SIGN} Moon ${DIM}·${RESET} ${RISING_SIGN} Rising"
    echo ""

    local pd=$(_moon_phase)

    if ((pd < 4)); then
        echo "  the new moon energy supports fresh starts. your"
        echo "  ${RISING_SIGN} rising says: trust your intuition. your"
        echo "  ${SUN_SIGN} Sun says: aim for what feels meaningful."
        echo ""
        echo -e "  ${ACCENT}→ yes, but start small. plant the seed today.${RESET}"
    elif ((pd < 8)); then
        echo "  the waxing crescent builds momentum. your Mars in"
        echo "  ${MARS_SIGN} gives you intense focus. your ${MOON_SIGN} Moon"
        echo "  wants security first. ground yourself, then act."
        echo ""
        echo -e "  ${ACCENT}→ move forward, but stay grounded. build carefully.${RESET}"
    elif ((pd < 12)); then
        echo "  first quarter moon brings challenges. your fire stellium"
        echo "  gives you courage to push through obstacles."
        echo ""
        echo -e "  ${ACCENT}→ expect resistance. push through anyway.${RESET}"
    elif ((pd < 16)); then
        echo "  the full moon illuminates truth. your ${MOON_SIGN} Moon"
        echo "  feels this intensely — emotions may be high. your"
        echo "  ${SUN_SIGN} fire keeps you moving forward."
        echo ""
        echo -e "  ${ACCENT}→ the timing is ripe. act with confidence.${RESET}"
    elif ((pd < 20)); then
        echo "  waning gibbous is for sharing and gratitude. your"
        echo "  ${SUN_SIGN} teaching energy shines now. Venus in"
        echo "  ${VENUS_SIGN} reminds you: quality over speed."
        echo ""
        echo -e "  ${ACCENT}→ share what you know. give before you take.${RESET}"
    elif ((pd < 24)); then
        echo "  last quarter asks: what needs releasing? Saturn in"
        echo "  ${SATURN_SIGN} knows discipline. let go of what's not working."
        echo ""
        echo -e "  ${ACCENT}→ clear space first. simplify, then proceed.${RESET}"
    else
        echo "  the dark moon approaches — time for rest and reflection."
        echo "  your ${RISING_SIGN} Rising feels the pull of quiet. honor it."
        echo ""
        echo -e "  ${ACCENT}→ rest today. fresh energy comes soon.${RESET}"
    fi

    echo ""
    _hr
    echo -e "  ${DIM}${daily}${RESET}"
    echo ""
}

cmd_manual() {
    local signs=("Aries" "Taurus" "Gemini" "Cancer" "Leo" "Virgo"
                 "Libra" "Scorpio" "Sagittarius" "Capricorn" "Aquarius" "Pisces")
    local keys=("SUN" "MOON" "RISING" "MERCURY" "VENUS" "MARS"
                "JUPITER" "SATURN" "URANUS" "NEPTUNE" "PLUTO")
    local labels=("Sun" "Moon" "Rising" "Mercury" "Venus" "Mars"
                  "Jupiter" "Saturn" "Uranus" "Neptune" "Pluto")

    while true; do
        echo ""
        echo -e "  ${ACCENT}━━${RESET} ${DIM}edit chart${RESET} ${ACCENT}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
        echo ""

        local glyphs=("☉" "☽" "↑" "☿" "♀" "♂" "♃" "♄" "♅" "♆" "♇")
        for i in "${!keys[@]}"; do
            local key="${keys[$i]}"
            local sign_var="${key}_SIGN"
            local deg_var="${key}_DEGREE"
            printf "  ${DIM}%2d${RESET}  ${WARM}%s${RESET}  %-11s ${BOLD}%s${RESET}  %s°\n" "$((i+1))" "${glyphs[$i]}" "${labels[$i]}" "${!sign_var}" "${!deg_var}"
        done

        echo ""
        echo -e "  ${DIM}enter number to edit, or q to save and quit${RESET}"
        read -rp "  > " choice

        [[ "$choice" == "q" || "$choice" == "Q" || -z "$choice" ]] && break

        if ! [[ "$choice" =~ ^[0-9]+$ ]] || (( choice < 1 || choice > 11 )); then
            echo -e "  ${DIM}invalid selection${RESET}"
            continue
        fi

        local idx=$((choice - 1))
        local key="${keys[$idx]}"
        local sign_var="${key}_SIGN"
        local deg_var="${key}_DEGREE"

        echo ""
        echo -e "  ${BOLD}${labels[$idx]}${RESET}  ${DIM}currently ${!sign_var} ${!deg_var}°${RESET}"
        echo ""

        for s in "${!signs[@]}"; do
            printf "  ${DIM}%2d${RESET}  %s\n" "$((s+1))" "${signs[$s]}"
        done

        echo ""
        read -rp "  sign (1-12): " sign_choice

        if [[ "$sign_choice" =~ ^[0-9]+$ ]] && (( sign_choice >= 1 && sign_choice <= 12 )); then
            local new_sign="${signs[$((sign_choice-1))]}"
            eval "${sign_var}=\"${new_sign}\""

            read -rp "  degree (0-29): " new_deg
            if [[ "$new_deg" =~ ^[0-9]+$ ]] && (( new_deg >= 0 && new_deg <= 29 )); then
                eval "${deg_var}=\"${new_deg}\""
            fi

            echo -e "  ${ACCENT}→${RESET} ${labels[$idx]} updated to ${!sign_var} ${!deg_var}°"
        fi
    done

    # Save to config
    cat > "$CHART_CONF" << CONF
# Clarissa — Birth Chart Configuration
# Last updated: $(date "+%Y-%m-%d %H:%M")

USER_NAME="${USER_NAME}"
BIRTH_DATE="${BIRTH_DATE}"
BIRTH_TIME="${BIRTH_TIME}"
BIRTH_PLACE="${BIRTH_PLACE}"

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
    echo -e "  ${ACCENT}chart saved.${RESET}"
    echo ""
}

cmd_help() {
    _logo
    _hr
    echo ""
    _section "COMMANDS"
    echo ""
    echo -e "  ${BOLD}clarissa${RESET}                  interactive menu"
    echo -e "  clarissa ${DIM}chart${RESET}             your birth chart"
    echo -e "  clarissa ${DIM}me${RESET}                big three interpretation"
    echo -e "  clarissa ${DIM}planets${RESET}           planetary placements"
    echo -e "  clarissa ${DIM}special${RESET}           stellium and elements"
    echo -e "  clarissa ${DIM}daily${RESET}             daily guidance and moon"
    echo -e "  clarissa ${DIM}advice${RESET} <question>  ask about today"
    echo -e "  clarissa ${DIM}manual${RESET}            edit chart placements"
    echo -e "  clarissa ${DIM}setup${RESET}             run the setup wizard"
    echo -e "  clarissa ${DIM}all${RESET}               complete reading"
    echo ""
    _hr
    echo -e "  ${DIM}your personal astrologist${RESET}"
    echo ""
}

cmd_all() {
    cmd_chart
    echo ""
    _section "THE BIG THREE"
    echo ""
    _interp_sun
    echo ""
    _hr
    echo ""
    _interp_moon
    echo ""
    _hr
    echo ""
    _interp_rising
    echo ""
    _hr
    echo ""
    _section "PLANETARY PLACEMENTS"
    echo ""
    _interp_mercury
    echo ""
    _hr
    echo ""
    _interp_venus
    echo ""
    _hr
    echo ""
    _interp_mars
    echo ""
    _hr
    echo ""
    _interp_jupiter
    echo ""
    _hr
    echo ""
    _interp_saturn
    echo ""
    _hr
    echo ""
    _section "SPECIAL FEATURES"
    echo ""
    _interp_stellium
    echo ""
    _hr
    echo ""
    _interp_elements
    echo ""
    _hr
    echo ""
    _section "TODAY"
    echo ""
    _moon_line
    echo -e "  ${DIM}$(_moon_guidance)${RESET}"
    echo ""
    echo "  $(_daily_message)"
    echo ""
    echo -e "  ${DIM}$(_transits_note)${RESET}"
    echo ""
}

# ── Main ───────────────────────────────────────────────

case "${1:-}" in
    chart)                    cmd_chart ;;
    me|personality|bigthree)  cmd_personality ;;
    planets)                  cmd_planets ;;
    special|stellium)         cmd_special ;;
    daily|today)              cmd_daily ;;
    advice)                   shift; cmd_advice "$@" ;;
    manual|edit)              cmd_manual ;;
    setup)                    bash "${CLARISSA_DIR}/setup.sh" ;;
    all|full)                 cmd_all ;;
    help|-h|--help)           cmd_help ;;
    *)                        cmd_menu ;;
esac
