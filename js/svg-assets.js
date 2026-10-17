/**
 * Dapur Ceria Inara — Custom Pastel Chibi SVG Character & Food Renderer
 * Renders:
 * - Chef Inara (with dynamic Wardrobe hat/apron/accessory & expressions)
 * - Special Customers: Abi, Umi, Mochi Kucing, Bobo Kelinci, Kuma Beruang
 * - Sliceable Multi-Part Ingredients for Cutting Board Stage
 * - Tens Baskets (Keranjang Puluhan isi 10) & Plated Dishes
 */

window.INARA_SVG = (function () {
  function getWardrobeStyles(wardrobe) {
    const data = window.INARA_DATA.WARDROBE;
    const hat = data.hatColors.find((h) => h.id === (wardrobe && wardrobe.hatColor)) || data.hatColors[0];
    const apron = data.apronColors.find((a) => a.id === (wardrobe && wardrobe.apronColor)) || data.apronColors[0];
    const acc = data.accessories.find((x) => x.id === (wardrobe && wardrobe.accessory)) || data.accessories[0];
    return { hat, apron, acc };
  }

  /**
   * Renders Chef Inara Chibi SVG
   * @param {Object} wardrobe - { hatColor, apronColor, accessory }
   * @param {string} mood - 'happy' | 'cheering' | 'cooking' | 'sleepy'
   * @param {number} size - pixel width/height
   */
  function renderChefInara(wardrobe = {}, mood = "happy", size = 140) {
    const { hat, apron, acc } = getWardrobeStyles(wardrobe);

    const isCheering = mood === "cheering";
    const isSleepy = mood === "sleepy";

    const eyesSvg = isSleepy
      ? `<path d="M 74 102 Q 82 110 90 102" stroke="#4A3540" stroke-width="4" fill="none" stroke-linecap="round"/>
         <path d="M 110 102 Q 118 110 126 102" stroke="#4A3540" stroke-width="4" fill="none" stroke-linecap="round"/>`
      : isCheering
      ? `<path d="M 73 102 Q 82 91 91 102" stroke="#3D2632" stroke-width="4.5" fill="none" stroke-linecap="round"/>
         <path d="M 109 102 Q 118 91 127 102" stroke="#3D2632" stroke-width="4.5" fill="none" stroke-linecap="round"/>`
      : `<ellipse cx="82" cy="100" rx="7.5" ry="8.5" fill="#3D2632"/>
         <ellipse cx="118" cy="100" rx="7.5" ry="8.5" fill="#3D2632"/>
         <circle cx="84.5" cy="97" r="3" fill="#FFFFFF"/>
         <circle cx="120.5" cy="97" r="3" fill="#FFFFFF"/>
         <circle cx="79.5" cy="103" r="1.5" fill="#FFFFFF"/>
         <circle cx="115.5" cy="103" r="1.5" fill="#FFFFFF"/>`;

    const mouthSvg = isSleepy
      ? `<circle cx="100" cy="117" r="4.5" fill="#FF8FAB"/>`
      : isCheering
      ? `<path d="M 88 113 Q 100 128 112 113 Z" fill="#E63946" stroke="#3D2632" stroke-width="2.5"/>
         <path d="M 93 120 Q 100 116 107 120" fill="#FF8FAB"/>`
      : `<path d="M 90 114 Q 100 123 110 114" stroke="#3D2632" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;

    // Accessory overlay on hat
    let accSvg = "";
    if (acc.id === "crown") {
      accSvg = `<polygon points="82,48 90,32 100,44 110,32 118,48" fill="#FFD166" stroke="#F59E0B" stroke-width="2.5" stroke-linejoin="round"/>
                <circle cx="100" cy="42" r="3.5" fill="#FF4D6D"/>`;
    } else if (acc.id === "cat_ears") {
      accSvg = `<polygon points="64,62 72,38 86,54" fill="#FFB347" stroke="#3D2632" stroke-width="2.5" stroke-linejoin="round"/>
                <polygon points="136,62 128,38 114,54" fill="#FFB347" stroke="#3D2632" stroke-width="2.5" stroke-linejoin="round"/>
                <polygon points="68,58 73,44 82,54" fill="#FF8FAB"/>
                <polygon points="132,58 127,44 118,54" fill="#FF8FAB"/>`;
    } else {
      accSvg = `<text x="100" y="54" text-anchor="middle" font-size="22" dominant-baseline="central">${acc.emoji}</text>`;
    }

    return `
      <svg class="chibi-svg chef-inara-svg mood-${mood}" width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chef Inara">
        <defs>
          <radialGradient id="inaraGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FFF8F0"/>
            <stop offset="100%" stop-color="#FFE4EE"/>
          </radialGradient>
        </defs>
        <!-- Soft Backdrop Circle -->
        <circle cx="100" cy="106" r="84" fill="url(#inaraGlow)" stroke="${hat.band}" stroke-width="4"/>

        <!-- Cute Pigtails -->
        <circle cx="52" cy="108" r="18" fill="#3B232E"/>
        <circle cx="148" cy="108" r="18" fill="#3B232E"/>
        <circle cx="62" cy="96" r="6" fill="${hat.band}"/>
        <circle cx="138" cy="96" r="6" fill="${hat.band}"/>

        <!-- Body & Shirt -->
        <path d="M 60 184 Q 64 136 100 136 Q 136 136 140 184 Z" fill="#FFFFFF" stroke="#3D2632" stroke-width="3.5"/>

        <!-- Custom Apron -->
        <path d="M 70 184 L 75 138 L 125 138 L 130 184 Z" fill="${apron.color}" stroke="#3D2632" stroke-width="3.5" stroke-linejoin="round"/>
        <rect x="85" y="156" width="30" height="18" rx="7" fill="${apron.pocket}" stroke="#3D2632" stroke-width="2.5"/>
        <text x="100" y="166" text-anchor="middle" font-size="11" font-weight="900" fill="#3D2632" font-family="sans-serif">INARA</text>

        <!-- Waving Arms & Wooden Spoon -->
        <path d="${isCheering ? "M 66 146 Q 42 122 46 105" : "M 66 146 Q 48 156 52 168"}" stroke="#FFDFC4" stroke-width="12" stroke-linecap="round" fill="none"/>
        <path d="${isCheering ? "M 134 146 Q 158 122 154 105" : "M 134 146 Q 154 134 158 118"}" stroke="#FFDFC4" stroke-width="12" stroke-linecap="round" fill="none"/>
        <!-- Golden Wooden Cooking Spoon -->
        <line x1="156" y1="124" x2="172" y2="82" stroke="#D97706" stroke-width="6" stroke-linecap="round"/>
        <ellipse cx="174" cy="76" rx="10" ry="13" transform="rotate(18 174 76)" fill="#F59E0B" stroke="#3D2632" stroke-width="2.5"/>

        <!-- Head & Rosy Face -->
        <circle cx="100" cy="100" r="38" fill="#FFE2C8" stroke="#3D2632" stroke-width="3.5"/>
        <!-- Hair Bangs -->
        <path d="M 62 94 Q 72 68 100 72 Q 128 68 138 94 Q 122 80 100 84 Q 78 80 62 94 Z" fill="#3B232E"/>

        <!-- Rosy Cheeks -->
        <ellipse cx="72" cy="110" rx="8" ry="5" fill="#FF8FAB" opacity="0.75"/>
        <ellipse cx="128" cy="110" rx="8" ry="5" fill="#FF8FAB" opacity="0.75"/>

        <!-- Expressive Eyes & Smile -->
        ${eyesSvg}
        ${mouthSvg}

        <!-- Chef Hat Puffs -->
        <g class="chef-hat-group">
          <circle cx="76" cy="52" r="20" fill="${hat.color}" stroke="#3D2632" stroke-width="3.5"/>
          <circle cx="124" cy="52" r="20" fill="${hat.color}" stroke="#3D2632" stroke-width="3.5"/>
          <circle cx="100" cy="42" r="24" fill="${hat.color}" stroke="#3D2632" stroke-width="3.5"/>
          <circle cx="80" cy="52" r="17" fill="${hat.color}"/>
          <circle cx="120" cy="52" r="17" fill="${hat.color}"/>
          <rect x="65" y="58" width="70" height="17" rx="6" fill="${hat.color}" stroke="#3D2632" stroke-width="3.5"/>
          <rect x="67" y="65" width="66" height="6" rx="3" fill="${hat.band}"/>
          ${accSvg}
        </g>
      </svg>
    `;
  }

  /**
   * Renders Customer SVG (Abi, Umi, Mochi Kucing, Bobo Kelinci, Kuma Beruang)
   */
  function renderCustomer(customerId = "abi", mood = "happy", size = 125) {
    const isEating = mood === "eating";
    const isCheering = mood === "cheering";

    const mouth = isEating
      ? `<circle cx="100" cy="118" r="11" fill="#E63946" stroke="#3D2632" stroke-width="3"/>
         <ellipse cx="100" cy="123" rx="6" ry="3.5" fill="#FF8FAB"/>`
      : isCheering
      ? `<path d="M 86 112 Q 100 128 114 112 Z" fill="#E63946" stroke="#3D2632" stroke-width="3"/>`
      : `<path d="M 88 114 Q 100 124 112 114" stroke="#3D2632" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;

    if (customerId === "abi") {
      return `
        <svg class="chibi-svg customer-svg customer-abi mood-${mood}" width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Abi">
          <circle cx="100" cy="105" r="84" fill="#E6FAF8" stroke="#4ECDC4" stroke-width="4"/>
          <!-- Shirt -->
          <path d="M 55 184 Q 60 135 100 135 Q 140 135 145 184 Z" fill="#2EC4B6" stroke="#3D2632" stroke-width="3.5"/>
          <polygon points="88,136 100,154 112,136" fill="#FFFFFF" stroke="#3D2632" stroke-width="2.5"/>
          <rect x="84" y="158" width="32" height="17" rx="6" fill="#FFFFFF" stroke="#3D2632" stroke-width="2"/>
          <text x="100" y="167" text-anchor="middle" font-size="11" font-weight="900" fill="#0F766E" font-family="sans-serif">ABI</text>
          <!-- Head -->
          <circle cx="100" cy="96" r="40" fill="#F8D5B8" stroke="#3D2632" stroke-width="3.5"/>
          <!-- Neat Short Hair -->
          <path d="M 60 90 Q 62 50 100 52 Q 138 50 140 90 Q 126 68 100 70 Q 74 68 60 90 Z" fill="#2B2129" stroke="#3D2632" stroke-width="3"/>
          <!-- Friendly Glasses -->
          <rect x="68" y="86" width="26" height="18" rx="6" fill="#FFFFFF" fill-opacity="0.55" stroke="#3D2632" stroke-width="3.5"/>
          <rect x="106" y="86" width="26" height="18" rx="6" fill="#FFFFFF" fill-opacity="0.55" stroke="#3D2632" stroke-width="3.5"/>
          <line x1="94" y1="94" x2="106" y2="94" stroke="#3D2632" stroke-width="3.5"/>
          <!-- Eyes -->
          <circle cx="81" cy="95" r="5" fill="#3D2632"/>
          <circle cx="119" cy="95" r="5" fill="#3D2632"/>
          <circle cx="83" cy="93" r="2" fill="#FFFFFF"/>
          <circle cx="121" cy="93" r="2" fill="#FFFFFF"/>
          <!-- Cheeks & Smile -->
          <ellipse cx="70" cy="110" rx="7" ry="4" fill="#FF8FAB" opacity="0.6"/>
          <ellipse cx="130" cy="110" rx="7" ry="4" fill="#FF8FAB" opacity="0.6"/>
          ${mouth}
        </svg>
      `;
    }

    if (customerId === "umi") {
      return `
        <svg class="chibi-svg customer-svg customer-umi mood-${mood}" width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Umi">
          <circle cx="100" cy="105" r="84" fill="#FFF0F5" stroke="#FF6F91" stroke-width="4"/>
          <!-- Pastel Hijab Outer Drape -->
          <path d="M 48 184 Q 46 115 60 72 Q 75 44 100 44 Q 125 44 140 72 Q 154 115 152 184 Z" fill="#FF8FAB" stroke="#3D2632" stroke-width="3.5"/>
          <path d="M 65 184 Q 72 142 100 142 Q 128 142 135 184 Z" fill="#FFE5EC" stroke="#3D2632" stroke-width="3"/>
          <!-- Heart Brooch & UMI Badge -->
          <circle cx="100" cy="146" r="10" fill="#FFD166" stroke="#3D2632" stroke-width="2.5"/>
          <text x="100" y="147" text-anchor="middle" font-size="11" dominant-baseline="central">💖</text>
          <rect x="84" y="161" width="32" height="17" rx="6" fill="#FFFFFF" stroke="#3D2632" stroke-width="2"/>
          <text x="100" y="170" text-anchor="middle" font-size="11" font-weight="900" fill="#DB2777" font-family="sans-serif">UMI</text>
          <!-- Face Inside Hijab -->
          <circle cx="100" cy="98" r="35" fill="#FFE3CC" stroke="#3D2632" stroke-width="3.5"/>
          <!-- Hijab Forehead Inner Band -->
          <path d="M 66 86 Q 100 66 134 86 Q 122 62 100 62 Q 78 62 66 86 Z" fill="#FF6F91"/>
          <!-- Eyes -->
          <ellipse cx="83" cy="96" rx="6.5" ry="7.5" fill="#3D2632"/>
          <ellipse cx="117" cy="96" rx="6.5" ry="7.5" fill="#3D2632"/>
          <circle cx="85" cy="93.5" r="2.5" fill="#FFFFFF"/>
          <circle cx="119" cy="93.5" r="2.5" fill="#FFFFFF"/>
          <!-- Cheeks & Smile -->
          <ellipse cx="73" cy="108" rx="7.5" ry="4.5" fill="#FF6F91" opacity="0.65"/>
          <ellipse cx="127" cy="108" rx="7.5" ry="4.5" fill="#FF6F91" opacity="0.65"/>
          ${mouth}
        </svg>
      `;
    }

    if (customerId === "mochi") {
      return `
        <svg class="chibi-svg customer-svg customer-mochi mood-${mood}" width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mochi Kucing">
          <circle cx="100" cy="105" r="84" fill="#FFF7E8" stroke="#FFB347" stroke-width="4"/>
          <!-- Cat Ears -->
          <polygon points="56,84 62,38 92,62" fill="#FFB347" stroke="#3D2632" stroke-width="3.5" stroke-linejoin="round"/>
          <polygon points="144,84 138,38 108,62" fill="#FFB347" stroke="#3D2632" stroke-width="3.5" stroke-linejoin="round"/>
          <polygon points="63,76 66,48 86,64" fill="#FF8FAB"/>
          <polygon points="137,76 134,48 114,64" fill="#FF8FAB"/>
          <!-- Body -->
          <path d="M 62 184 Q 65 136 100 136 Q 135 136 138 184 Z" fill="#FFE8C2" stroke="#3D2632" stroke-width="3.5"/>
          <circle cx="100" cy="154" r="11" fill="#FFD166" stroke="#3D2632" stroke-width="2.5"/>
          <text x="100" y="155" text-anchor="middle" font-size="12" dominant-baseline="central">🐟</text>
          <!-- Cat Head -->
          <ellipse cx="100" cy="100" rx="44" ry="38" fill="#FFE8C2" stroke="#3D2632" stroke-width="3.5"/>
          <!-- Forehead Stripes -->
          <path d="M 92 65 L 92 76 M 100 63 L 100 78 M 108 65 L 108 76" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"/>
          <!-- Eyes -->
          <circle cx="80" cy="96" r="7" fill="#3D2632"/>
          <circle cx="120" cy="96" r="7" fill="#3D2632"/>
          <circle cx="82" cy="93.5" r="2.5" fill="#FFFFFF"/>
          <circle cx="122" cy="93.5" r="2.5" fill="#FFFFFF"/>
          <!-- Pink Nose & Whiskers -->
          <polygon points="96,104 104,104 100,110" fill="#FF6F91"/>
          <line x1="46" y1="100" x2="66" y2="104" stroke="#3D2632" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="46" y1="110" x2="66" y2="110" stroke="#3D2632" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="154" y1="100" x2="134" y2="104" stroke="#3D2632" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="154" y1="110" x2="134" y2="110" stroke="#3D2632" stroke-width="2.5" stroke-linecap="round"/>
          ${mouth}
        </svg>
      `;
    }

    if (customerId === "bobo") {
      return `
        <svg class="chibi-svg customer-svg customer-bobo mood-${mood}" width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bobo Kelinci">
          <circle cx="100" cy="105" r="84" fill="#F3EFFE" stroke="#A78BFA" stroke-width="4"/>
          <!-- Long Bunny Ears -->
          <ellipse cx="78" cy="46" rx="13" ry="32" transform="rotate(-10 78 46)" fill="#FFFFFF" stroke="#3D2632" stroke-width="3.5"/>
          <ellipse cx="122" cy="46" rx="13" ry="32" transform="rotate(10 122 46)" fill="#FFFFFF" stroke="#3D2632" stroke-width="3.5"/>
          <ellipse cx="78" cy="48" rx="7" ry="22" transform="rotate(-10 78 48)" fill="#FFB3C6"/>
          <ellipse cx="122" cy="48" rx="7" ry="22" transform="rotate(10 122 48)" fill="#FFB3C6"/>
          <!-- Body -->
          <path d="M 64 184 Q 68 138 100 138 Q 132 138 136 184 Z" fill="#A78BFA" stroke="#3D2632" stroke-width="3.5"/>
          <text x="100" y="164" text-anchor="middle" font-size="18" dominant-baseline="central">🥕</text>
          <!-- Head -->
          <ellipse cx="100" cy="102" rx="40" ry="36" fill="#FFFFFF" stroke="#3D2632" stroke-width="3.5"/>
          <circle cx="82" cy="96" r="6.5" fill="#3D2632"/>
          <circle cx="118" cy="96" r="6.5" fill="#3D2632"/>
          <circle cx="84" cy="93.5" r="2.2" fill="#FFFFFF"/>
          <circle cx="120" cy="93.5" r="2.2" fill="#FFFFFF"/>
          <ellipse cx="70" cy="108" rx="7" ry="4.5" fill="#FF8FAB" opacity="0.7"/>
          <ellipse cx="130" cy="108" rx="7" ry="4.5" fill="#FF8FAB" opacity="0.7"/>
          <ellipse cx="100" cy="105" rx="4.5" ry="3.5" fill="#FF6F91"/>
          ${mouth}
        </svg>
      `;
    }

    // Default: Kuma Beruang
    return `
      <svg class="chibi-svg customer-svg customer-kuma mood-${mood}" width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kuma Beruang">
        <circle cx="100" cy="105" r="84" fill="#FEF6E4" stroke="#F59E0B" stroke-width="4"/>
        <!-- Round Bear Ears -->
        <circle cx="64" cy="64" r="18" fill="#D97706" stroke="#3D2632" stroke-width="3.5"/>
        <circle cx="136" cy="64" r="18" fill="#D97706" stroke="#3D2632" stroke-width="3.5"/>
        <circle cx="64" cy="64" r="10" fill="#FDE68A"/>
        <circle cx="136" cy="64" r="10" fill="#FDE68A"/>
        <!-- Body -->
        <path d="M 60 184 Q 64 136 100 136 Q 136 136 140 184 Z" fill="#F59E0B" stroke="#3D2632" stroke-width="3.5"/>
        <text x="100" y="164" text-anchor="middle" font-size="18" dominant-baseline="central">🍯</text>
        <!-- Head -->
        <circle cx="100" cy="100" r="40" fill="#D97706" stroke="#3D2632" stroke-width="3.5"/>
        <ellipse cx="100" cy="112" rx="18" ry="15" fill="#FEF3C7"/>
        <circle cx="82" cy="92" r="6.5" fill="#3D2632"/>
        <circle cx="118" cy="92" r="6.5" fill="#3D2632"/>
        <circle cx="84" cy="89.5" r="2.2" fill="#FFFFFF"/>
        <circle cx="120" cy="89.5" r="2.2" fill="#FFFFFF"/>
        <ellipse cx="100" cy="104" rx="6" ry="4.5" fill="#3D2632"/>
        ${mouth}
      </svg>
    `;
  }

  /**
   * Renders Sheriff Labrador (BabyBus Special Guest) Chibi SVG
   * Cream retriever dog in dark blue police uniform, light blue tie, paw badge, and police cap
   */
  function renderSheriffLabrador(mood = "happy", size = 125) {
    const isEating = mood === "eating";
    const isCheering = mood === "cheering";

    const mouth = isEating
      ? `<circle cx="100" cy="116" r="11" fill="#E63946" stroke="#1E293B" stroke-width="3"/>
         <ellipse cx="100" cy="121" rx="6" ry="4" fill="#FF8FAB"/>`
      : isCheering
      ? `<path d="M 86 112 Q 100 128 114 112 Z" fill="#E63946" stroke="#1E293B" stroke-width="3"/>
         <path d="M 92 118 Q 100 114 108 118" fill="#FF8FAB"/>`
      : `<path d="M 88 112 Q 94 118 100 113 Q 106 118 112 112" stroke="#1E293B" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;

    const eyes = isCheering
      ? `<path d="M 74 94 Q 82 85 90 94" stroke="#1E293B" stroke-width="4.5" fill="none" stroke-linecap="round"/>
         <path d="M 110 94 Q 118 85 126 94" stroke="#1E293B" stroke-width="4.5" fill="none" stroke-linecap="round"/>`
      : `<circle cx="82" cy="92" r="7" fill="#1E293B"/>
         <circle cx="118" cy="92" r="7" fill="#1E293B"/>
         <circle cx="84.5" cy="89.5" r="2.5" fill="#FFFFFF"/>
         <circle cx="120.5" cy="89.5" r="2.5" fill="#FFFFFF"/>
         <circle cx="80" cy="94" r="1.2" fill="#FFFFFF"/>
         <circle cx="116" cy="94" r="1.2" fill="#FFFFFF"/>`;

    return `
      <svg class="chibi-svg customer-svg customer-labrador mood-${mood}" width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sheriff Labrador">
        <!-- Blue Police Background Circle -->
        <circle cx="100" cy="105" r="84" fill="#EFF6FF" stroke="#1D4ED8" stroke-width="4"/>

        <!-- Floppy Retriever Dog Ears (Cream with warm golden tones) -->
        <path d="M 58 76 Q 40 92 46 126 Q 52 142 66 136 Q 74 128 72 96 Z" fill="#EAB308" stroke="#1E293B" stroke-width="3.5"/>
        <path d="M 142 76 Q 160 92 154 126 Q 148 142 134 136 Q 126 128 128 96 Z" fill="#EAB308" stroke="#1E293B" stroke-width="3.5"/>
        <path d="M 50 110 Q 52 130 62 126" stroke="#CA8A04" stroke-width="3" fill="none"/>
        <path d="M 150 110 Q 148 130 138 126" stroke="#CA8A04" stroke-width="3" fill="none"/>

        <!-- Dark Blue Police Uniform Jacket & Shoulders -->
        <path d="M 56 184 Q 60 134 100 134 Q 140 134 144 184 Z" fill="#1E3A8A" stroke="#1E293B" stroke-width="3.5"/>
        <!-- Golden Epaulets on shoulders -->
        <rect x="52" y="142" width="16" height="8" rx="3" fill="#FBBF24" stroke="#1E293B" stroke-width="2"/>
        <rect x="132" y="142" width="16" height="8" rx="3" fill="#FBBF24" stroke="#1E293B" stroke-width="2"/>

        <!-- White Shirt Collar & Light Blue Police Tie -->
        <polygon points="86,134 100,150 114,134" fill="#FFFFFF" stroke="#1E293B" stroke-width="2"/>
        <polygon points="95,142 105,142 107,172 100,178 93,172" fill="#38BDF8" stroke="#1E293B" stroke-width="2"/>

        <!-- Golden Police Paw Badge on Chest -->
        <polygon points="126,144 134,148 134,162 126,168 118,162 118,148" fill="#FCD34D" stroke="#D97706" stroke-width="2"/>
        <!-- Paw Print Icon on Badge -->
        <circle cx="126" cy="158" r="3" fill="#1E3A8A"/>
        <circle cx="122.5" cy="152.5" r="1.3" fill="#1E3A8A"/>
        <circle cx="126" cy="150.5" r="1.3" fill="#1E3A8A"/>
        <circle cx="129.5" cy="152.5" r="1.3" fill="#1E3A8A"/>

        <!-- Golden Jacket Buttons -->
        <circle cx="86" cy="162" r="3" fill="#FBBF24"/>
        <circle cx="86" cy="174" r="3" fill="#FBBF24"/>

        <!-- Friendly Retriever Head (Cream fur) -->
        <circle cx="100" cy="98" r="42" fill="#FDE68A" stroke="#1E293B" stroke-width="3.5"/>

        <!-- Snout (Lighter cream) & Black Nose -->
        <ellipse cx="100" cy="108" rx="20" ry="14" fill="#FEF3C7" stroke="#1E293B" stroke-width="2.5"/>
        <path d="M 92 102 Q 100 99 108 102 Q 104 109 100 110 Q 96 109 92 102 Z" fill="#1E293B"/>

        <!-- Rosy Cheeks -->
        <ellipse cx="72" cy="106" rx="6.5" ry="4" fill="#F87171" opacity="0.5"/>
        <ellipse cx="128" cy="106" rx="6.5" ry="4" fill="#F87171" opacity="0.5"/>

        <!-- Eyes & Mouth -->
        ${eyes}
        ${mouth}

        <!-- Dark Blue Police Cap with Golden Paw Badge -->
        <!-- Cap Top / Dome -->
        <path d="M 64 68 Q 66 38 100 36 Q 134 38 136 68 Z" fill="#1E3A8A" stroke="#1E293B" stroke-width="3.5"/>
        <!-- Cap Band -->
        <rect x="66" y="62" width="68" height="12" rx="3" fill="#172554" stroke="#1E293B" stroke-width="2.5"/>
        <!-- Black Visor -->
        <path d="M 62 72 Q 100 84 138 72 Q 124 78 100 78 Q 76 78 62 72 Z" fill="#0F172A" stroke="#1E293B" stroke-width="2"/>
        <!-- Golden Shield Badge on Cap -->
        <polygon points="100,46 108,52 106,62 100,66 94,62 92,52" fill="#FCD34D" stroke="#D97706" stroke-width="2"/>
        <!-- Paw Print on Cap Badge -->
        <circle cx="100" cy="58" r="2.4" fill="#1E3A8A"/>
        <circle cx="97" cy="53" r="1.1" fill="#1E3A8A"/>
        <circle cx="100" cy="51.5" r="1.1" fill="#1E3A8A"/>
        <circle cx="103" cy="53" r="1.1" fill="#1E3A8A"/>
      </svg>
    `;
  }

  /**
   * Renders Cartoon Police Patrol Car SVG for Sheriff Labrador arrival
   */
  function renderPatrolCar(size = 140) {
    return `
      <svg class="patrol-car-svg" width="${size}" height="${Math.round(size * 0.65)}" viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mobil Patroli Polisi">
        <!-- Shadow -->
        <ellipse cx="100" cy="116" rx="80" ry="8" fill="rgba(0,0,0,0.18)"/>

        <!-- Car Body (White and Navy Blue) -->
        <path d="M 30 96 L 25 72 Q 30 62 55 60 L 75 42 Q 85 36 125 36 L 148 42 L 175 62 Q 185 68 185 82 L 185 96 Z" fill="#FFFFFF" stroke="#1E293B" stroke-width="4"/>
        <path d="M 25 74 L 185 74 L 185 96 L 25 96 Z" fill="#1E3A8A"/>

        <!-- Police Text / Star on Door -->
        <rect x="78" y="77" width="44" height="16" rx="4" fill="#FCD34D"/>
        <text x="100" y="89" text-anchor="middle" font-size="10" font-weight="900" fill="#1E3A8A" font-family="sans-serif">POLISI</text>

        <!-- Windows (Pastel Sky Blue) -->
        <polygon points="76,60 102,60 102,42 84,42" fill="#BAE6FD" stroke="#1E293B" stroke-width="2.5"/>
        <polygon points="108,60 142,60 138,42 108,42" fill="#BAE6FD" stroke="#1E293B" stroke-width="2.5"/>

        <!-- Cute Retriever Driver Silhouette -->
        <circle cx="92" cy="52" r="7" fill="#FDE68A"/>
        <circle cx="90" cy="48" r="3" fill="#1E3A8A"/>

        <!-- Flashing Police Siren Lights (Red & Blue with Pulsing Glow) -->
        <rect x="94" y="28" width="16" height="8" rx="3" fill="#334155" stroke="#1E293B" stroke-width="2"/>
        <circle class="siren-light red" cx="95" cy="24" r="7" fill="#EF4444"/>
        <circle class="siren-light blue" cx="109" cy="24" r="7" fill="#3B82F6"/>

        <!-- Headlights -->
        <circle cx="180" cy="74" r="5" fill="#FEF08A" stroke="#1E293B" stroke-width="2"/>
        <circle cx="28" cy="74" r="4" fill="#F87171" stroke="#1E293B" stroke-width="1.5"/>

        <!-- Wheels (Black tires with Golden Rims) -->
        <circle cx="56" cy="100" r="18" fill="#1E293B"/>
        <circle cx="56" cy="100" r="9" fill="#FCD34D" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="150" cy="100" r="18" fill="#1E293B"/>
        <circle cx="150" cy="100" r="9" fill="#FCD34D" stroke="#FFFFFF" stroke-width="2"/>
      </svg>
    `;
  }

  /**
   * Renders Golden Police Patrol Badge Award SVG
   */
  function renderPoliceBadge(size = 110) {
    return `
      <svg class="police-badge-svg" width="${size}" height="${size}" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Lencana Patroli Polisi">
        <defs>
          <radialGradient id="badgeGold" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#FEF08A"/>
            <stop offset="60%" stop-color="#F59E0B"/>
            <stop offset="100%" stop-color="#B45309"/>
          </radialGradient>
        </defs>
        <!-- Shield Backdrop -->
        <path d="M 80 14 L 138 32 C 138 88 120 126 80 148 C 40 126 22 88 22 32 Z" fill="url(#badgeGold)" stroke="#78350F" stroke-width="5"/>
        <path d="M 80 22 L 130 38 C 130 84 114 118 80 138 C 46 118 30 84 30 38 Z" fill="#1E3A8A" stroke="#FDE68A" stroke-width="3"/>

        <!-- Center Golden Star -->
        <polygon points="80,42 86,58 104,58 90,68 95,86 80,74 65,86 70,68 56,58 74,58" fill="#FDE68A" stroke="#D97706" stroke-width="2.5"/>

        <!-- Paw Print in center of Star -->
        <circle cx="80" cy="70" r="4.5" fill="#1E3A8A"/>
        <circle cx="74" cy="62" r="2" fill="#1E3A8A"/>
        <circle cx="80" cy="59" r="2" fill="#1E3A8A"/>
        <circle cx="86" cy="62" r="2" fill="#1E3A8A"/>

        <!-- Ribbon Banner at Bottom -->
        <path d="M 40 102 L 120 102 L 112 120 L 80 114 L 48 120 Z" fill="#FBBF24" stroke="#78350F" stroke-width="2.5"/>
        <text x="80" y="112" text-anchor="middle" font-size="9" font-weight="900" fill="#78350F" font-family="sans-serif">PATROLI</text>
      </svg>
    `;
  }

  /**
   * Renders a woven Tens Basket (Keranjang Puluhan = 10 items)
   */
  function renderTensBasket(emoji = "🍓") {
    return `
      <div class="tens-basket-visual">
        <div class="tens-basket-items">
          <span>${emoji}</span><span>${emoji}</span><span>${emoji}</span><span>${emoji}</span><span>${emoji}</span>
          <span>${emoji}</span><span>${emoji}</span><span>${emoji}</span><span>${emoji}</span><span>${emoji}</span>
        </div>
        <div class="tens-basket-base">
          <span class="basket-badge-10">🧺 10</span>
        </div>
      </div>
    `;
  }

  /**
   * Renders Animated Cartoon Pointing Hand SVG (👆) for Toddler Zero-Text Interaction
   */
  function renderHandPointer(size = 48) {
    return `
      <svg class="hand-pointer-svg" width="${size}" height="${size}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ketuk di sini">
        <!-- Pulse glow ring around fingertip -->
        <circle class="pointer-glow-ring" cx="32" cy="14" r="10" fill="#F59E0B" opacity="0.35"/>
        <circle cx="32" cy="14" r="5" fill="#FBBF24" opacity="0.6"/>
        <!-- Glove / Hand Body -->
        <path d="M 28 14 C 28 8 36 8 36 14 L 36 32 C 38 30 46 30 46 36 L 46 44 C 46 54 38 58 32 58 C 24 58 18 52 18 42 L 18 34 C 18 30 22 28 26 31 L 28 32 Z"
              fill="#FFE0B2" stroke="#451A03" stroke-width="3" stroke-linejoin="round"/>
        <!-- Forefinger crease lines -->
        <line x1="28" y1="22" x2="36" y2="22" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
        <!-- Cuff -->
        <rect x="22" y="54" width="20" height="7" rx="3" fill="#3B82F6" stroke="#1E293B" stroke-width="2.5"/>
      </svg>
    `;
  }

  /**
   * Renders Buddy Duo Police Badge Icon for Labrador & Inara Header
   */
  function renderBuddyDuoBadge(size = 36) {
    return `
      <svg class="buddy-duo-badge-svg" width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sheriff Labrador dan Chef Inara">
        <polygon points="24,3 43,14 36,41 24,46 12,41 5,14" fill="#1D4ED8" stroke="#F59E0B" stroke-width="3"/>
        <polygon points="24,10 27,18 36,18 29,23 31,31 24,26 17,31 19,23 12,18 21,18" fill="#FDE047" stroke="#D97706" stroke-width="1.5"/>
        <circle cx="24" cy="22" r="2.8" fill="#1E3A8A"/>
        <circle cx="21.5" cy="18" r="1.1" fill="#1E3A8A"/>
        <circle cx="24" cy="16.5" r="1.1" fill="#1E3A8A"/>
        <circle cx="26.5" cy="18" r="1.1" fill="#1E3A8A"/>
      </svg>
    `;
  }

  return {
    renderChefInara,
    renderCustomer: function (customerId = "abi", mood = "happy", size = 125) {
      if (customerId === "labrador") {
        return renderSheriffLabrador(mood, size);
      }
      return renderCustomer(customerId, mood, size);
    },
    renderSheriffLabrador,
    renderPatrolCar,
    renderPoliceBadge,
    renderTensBasket,
    renderHandPointer,
    renderBuddyDuoBadge
  };
})();
