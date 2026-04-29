// ========== ORIGINAL MAPPING – provides helix, pair, description ==========
const ORIGINAL_MAPPING = [
  [0, 1, "BONES"],
  [0, 2, "BONES2"],
  [0, 3, "OSTODERM"],
  [0, 4, "OSTO_SIZE"],
  [0, 5, "GIANT_DWARF"],
  [0, 6, "TAIL_BOTTOM"],
  [0, 7, "LEG_STRETCH2"],
  [0, 8, "ARM_STRETCH2"],
  [0, 9, "HEAD_THICK_SKULL"],
  [0, 10, "NECK_STIFF"],
  [1, 1, "GUT"],
  [1, 2, "GUT_IS_UDDER"],
  [1, 3, "DERRIERE"],
  [1, 4, "LEG_IS_CIRCLE"],
  [1, 5, "FOOT_IS_CIRCLE"],
  [1, 6, "TONGUE"],
  [1, 7, "TONGUE_SEGS"],
  [1, 8, "BELLY_ALT"],
  [1, 9, "PAT_BELLY"],
  [1, 10, "LITTER_SIZE"],
  [1, 11, "OLD_AGE"],
  [1, 12, "OMNIVORE"],
  [1, 13, "LIMP"],
  [2, 1, "MUSCLE_USE"],
  [2, 2, "TAIL_STIFF"],
  [2, 3, "LEG_FLEXIBILITY"],
  [2, 4, "LEG_FLEX_BIAS"],
  [2, 5, "TAIL_FLEXIBILITY"],
  [2, 6, "TAIL_SPEED"],
  [2, 7, "LEG_AND_ARM_LIMP"],
  [2, 8, "ARM_STRENGTH"],
  [2, 9, "ARM_FLEXIBILITY"],
  [2, 10, "ARM_FLEX_BIAS"],
  [2, 11, "NECK_FLEXIBILITY"],
  [2, 12, "NECK_FLEX_BIAS"],
  [2, 13, "BRAIN_SPASTIC"],
  [3, 1, "SPLAY"],
  [3, 2, "LEG_IN"],
  [3, 3, "LEG_IN2"],
  [3, 4, "TAIL_ANGLE"],
  [3, 5, "TAIL_JOINT_TYPE"],
  [3, 6, "LEG_JOINT_TYPE"],
  [3, 7, "HAS_KNEE"],
  [3, 8, "KNEE_MIN"],
  [3, 9, "KNEE_MAX"],
  [3, 10, "ARM_JOINT_TYPE"],
  [3, 11, "HAS_ELBOW"],
  [3, 12, "ELBOW_RANGE"],
  [3, 13, "NECK_JOINT_TYPE"],
  [3, 14, "HEAD_JOINTED"],
  [3, 15, "STIFF_JOINTS"],
  [4, 1, "LEG_TAG"],
  [4, 2, "LEG_HAS_FOOT"],
  [4, 3, "LEG_COUNT"],
  [4, 4, "LEG_THRUST_BACK"],
  [4, 5, "ARM_TAG"],
  [4, 6, "ARM_HAS_HAND"],
  [4, 7, "NECK_TAG"],
  [4, 8, "NECK_SLOUCH"],
  [4, 9, "NECK_ONTOP"],
  [4, 10, "BREAK_FORCE"],
  [4, 11, "EAR_X"],
  [5, 1, "QUADRUPED"],
  [5, 2, "BIPED"],
  [5, 3, "UPARM_TAG"],
  [5, 4, "UPARM_Y"],
  [5, 5, "UPARM_GOOFY"],
  [5, 6, "ARM_FORWARD"],
  [5, 7, "UPARM_ANGLE"],
  [5, 8, "WHITE_IS_LETHAL"],
  [6, 1, "SIZE"],
  [6, 2, "ASPECT"],
  [6, 3, "SKINNY"],
  [6, 4, "CHEST_BIG"],
  [6, 5, "CHEST_SMALL"],
  [6, 6, "NECK_TYPE"],
  [6, 7, "NECK_LENGTH"],
  [6, 8, "NECK_GIRAFFE"],
  [6, 9, "NECK_THICKNESS"],
  [6, 10, "NECK_ANGLE"],
  [6, 11, "NECK_COCK"],
  [7, 1, "TAIL_TAG"],
  [7, 2, "TAIL_EXISTS"],
  [7, 3, "TAIL_SIZE"],
  [7, 4, "TAIL_SHORT"],
  [7, 5, "TAIL_ASPECT"],
  [7, 6, "TAIL_SHAPE"],
  [7, 7, "TAIL_SEGMENTS"],
  [7, 8, "TAIL_WAG"],
  [8, 1, "LEG_TYPE"],
  [8, 2, "LEG_LENGTH"],
  [8, 3, "LEG_STRETCH"],
  [8, 4, "LEG_SKEW"],
  [8, 5, "LEG_STRENGTH"],
  [8, 6, "LEG_PENCIL"],
  [8, 7, "ARM_TYPE"],
  [8, 8, "ARM_LENGTH"],
  [8, 9, "ARM_STRETCH"],
  [8, 10, "ARM_SKEW"],
  [8, 11, "ARM_NODE_SCALE"],
  [9, 1, "HAS_FOOT"],
  [9, 2, "FOOT_SIZE"],
  [9, 3, "FOOT_CLOWN"],
  [9, 4, "FOOT_THICKNESS"],
  [9, 5, "FOOT_TOE"],
  [9, 6, "FOOT_BACKWARDS"],
  [9, 7, "HAS_HAND"],
  [9, 8, "HAND_WIDTH"],
  [9, 9, "HAND_LENGTH"],
  [9, 10, "HAND_FINGER"],
  [9, 11, "SKIN_HANDS"],
  [10, 1, "HEAD_SIZE"],
  [10, 2, "HEAD_X_GROWTH"],
  [10, 3, "HEAD_Y_GROWTH"],
  [10, 4, "HEAD_ASPECT"],
  [10, 5, "HEAD_SQUARE"],
  [10, 6, "HEAD_HAS_BACK"],
  [10, 7, "HEAD_GIANT"],
  [10, 8, "HEAD_SHRUNK"],
  [10, 9, "HEAD_CHIMERA"],
  [10, 10, "EYEBOX_X"],
  [10, 11, "EYEBOX_Y"],
  [10, 12, "EYEBOX_SIZE"],
  [10, 13, "SKIN_HEAD"],
  [11, 1, "EYE_STYLE"],
  [11, 2, "BUGEYE"],
  [11, 3, "EYE_SIZE"],
  [11, 4, "PUPIL_SIZE"],
  [11, 5, "HAS_PUPIL"],
  [11, 6, "BROW_SIZE"],
  [11, 7, "BROW_SLANT"],
  [11, 8, "EYE_HUE"],
  [11, 9, "EAR_STYLE"],
  [11, 10, "EAR_SHAPE"],
  [11, 11, "EAR_SIZE"],
  [11, 12, "EAR_ASPECT"],
  [11, 13, "EAR_SLANT"],
  [11, 14, "EAR_INTERIOR"],
  [11, 15, "EAR_FLOP"],
  [12, 1, "TEETH_SHAPE"],
  [12, 2, "HAS_MOUTH"],
  [12, 3, "MOUTH_Y"],
  [12, 4, "MOUTH_SIZE"],
  [12, 5, "JAW"],
  [12, 6, "TEETH_UPPER"],
  [12, 7, "TEETH_UPPER2"],
  [12, 8, "NOSE_STYLE"],
  [12, 9, "NOSE_INNY"],
  [12, 10, "NOSE_Y"],
  [12, 11, "NOSE_SIZE"],
  [12, 12, "NOSE_INTERIOR"],
  [12, 13, "FLU_IMMUNITY"],
  [13, 1, "HAS_ANTLERS"],
  [13, 2, "ANTLER_X"],
  [13, 3, "ANTLER_W"],
  [13, 4, "ANTLER_H"],
  [13, 5, "ANTLER_TAPER"],
  [13, 6, "ANTLER_POM"],
  [13, 7, "ANTLER_COLOR"],
  [13, 8, "POM_COLOR"],
  [13, 9, "POM_USECOLOR"],
  [13, 10, "HAT_POM"],
  [13, 11, "HAT_POM_IS_LID"],
  [14, 1, "ANTLER_REC"],
  [14, 2, "ANTLER_REC2"],
  [14, 3, "ANTLER_FLIP"],
  [14, 4, "ANTLER_MOD"],
  [14, 5, "ANTLER_SCALEH"],
  [14, 6, "ANTLER_SCALEW"],
  [14, 7, "ANTLER_ANGLE"],
  [14, 8, "ANTLER_ANGLE2"],
  [14, 9, "ANTLER_ANGLE_RAND"],
  [14, 10, "ANTLER_T1"],
  [14, 11, "ANTLER_T2"],
  [15, 1, "HAT_EXISTS"],
  [15, 2, "HAT_SIZE"],
  [15, 3, "HAT_RAKE"],
  [15, 4, "HAT_ASPECT"],
  [15, 5, "HAT_TAPER"],
  [15, 6, "HAT_CLONE"],
  [15, 7, "HAT_BACK_SCALE"],
  [15, 8, "HAT_FRONT_SCALE"],
  [15, 9, "HAT_BACK_ANGLE"],
  [15, 10, "HAT_FRONT_ANGLE"],
  [15, 11, "HAT_ANGLE_RAND"],
  [15, 12, "HAT_FLIP"],
  [15, 13, "HAT_T"],
  [16, 1, "BASE_BROWN"],
  [16, 2, "BASE_BLACK"],
  [16, 3, "BASE_RED"],
  [16, 4, "BASE_GREEN"],
  [16, 5, "GREEN_KNOCKOUT"],
  [16, 6, "BASE_CREAM"],
  [16, 7, "ALT_BLUE"],
  [16, 8, "SPOT_YELLOW"],
  [16, 9, "SKIN_HUE"],
  [16, 10, "SKIN_HUE2"],
  [16, 11, "SWAP_BASE_SPOT"],
  [16, 12, "SWAP_ALT_SPOT"],
  [16, 13, "WHITE"],
  [16, 14, "NOSE_HUE"],
  [16, 15, "HOOF_COLOR"],
  [17, 1, "AGOUTI"],
  [17, 2, "FOOT_IS_HOOF"],
  [17, 3, "COON_EYE"],
  [17, 4, "EAR_COMP"],
  [17, 5, "TAIL_ALT"],
  [17, 6, "PAT_SPLIT"],
  [17, 7, "PAT_STRIPE"],
  [17, 8, "PAT_SPOT"],
  [17, 9, "PAT_PERLIN"],
  [17, 10, "PAT_PERLIN2"],
  [17, 11, "PAT_PERLIN_SIZE"],
  [18, 1, "NARCOLEPSY"],
  [18, 2, "SPEED_FACTOR"],
  [18, 3, "NECK_SPEED"],
  [18, 4, "RAMPAGE"],
  [18, 5, "SPINAL_LOCO"],
  [18, 6, "HIGH_INTELLECT"],
  [18, 7, "L_LEG_SIGNAL"],
  [18, 8, "L_ARM_SIGNAL"],
  [18, 9, "L_TAIL_SIGNAL"],
  [18, 10, "L_NECK_SIGNAL"],
  [18, 11, "LOCO_SYNC"],
  [19, 1, "L_LEG_FTOB_REACT"],
  [19, 2, "L_LEG_FTOB_EVENT"],
  [19, 3, "L_LEG_BTOF_REACT"],
  [19, 4, "L_LEG_BTOF_EVENT"],
  [19, 5, "L_ARM_FTOB_REACT"],
  [19, 6, "L_ARM_FTOB_EVENT"],
  [19, 7, "L_ARM_BTOF_REACT"],
  [19, 8, "L_ARM_BTOF_EVENT"],
  [19, 9, "L_TAIL_FTOB_REACT"],
  [19, 10, "L_TAIL_FTOB_EVENT"],
  [19, 11, "L_TAIL_BTOF_REACT"],
  [19, 12, "L_TAIL_BTOF_EVENT"],
  [19, 13, "L_NECK_FTOB_REACT"],
  [19, 14, "L_NECK_FTOB_EVENT"],
  [19, 15, "L_NECK_BTOF_REACT"],
  [19, 16, "L_NECK_BTOF_EVENT"]
];

// ========== FETCH gene value data from XML (same folder) ==========
const XML_URL = 'genes.xml';   // relative path – same directory as index.html

let completeMapping = new Map();
let allEntries = [];

async function loadGeneDataFromXml() {
  const response = await fetch(XML_URL);
  if (!response.ok) throw new Error(`Failed to fetch genes.xml: ${response.status}`);
  const xmlText = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

  // Build a map from gene name → { priority, g0, g1, g2, g3, m, s }
  const xmlDataMap = new Map();
  xmlDoc.querySelectorAll('gene').forEach(gene => {
    const name = gene.getAttribute('name');
    if (!name) return;
    xmlDataMap.set(name, {
      priority: gene.getAttribute('priority') || 'TGCA',
      g0: parseInt(gene.getAttribute('g0'), 10) || 0,
      g1: parseInt(gene.getAttribute('g1'), 10) || 0,
      g2: parseInt(gene.getAttribute('g2'), 10) || 0,
      g3: parseInt(gene.getAttribute('g3'), 10) || 0,
      m: parseInt(gene.getAttribute('m'), 10) || 100,
      s: parseInt(gene.getAttribute('s'), 10) || 1
    });
  });

  // Fill completeMapping using the fixed structure from ORIGINAL_MAPPING
  completeMapping.clear();
  for (const row of ORIGINAL_MAPPING) {
    const helix = row[0];
    const pair1Based = row[1];            // 1‑based
    const zeroBasedPair = pair1Based - 1;
    const desc = row[2];

    const xmlData = xmlDataMap.get(desc);
    if (!xmlData) {
      console.warn(`XML data missing for gene "${desc}"`);
      continue;
    }

    const priorityStr = xmlData.priority;
    const priorityOrder = priorityStr.split('');
    const gValues = [xmlData.g0, xmlData.g1, xmlData.g2, xmlData.g3];
    const values = {};
    for (let i = 0; i < 4; i++) {
      const nuc = priorityOrder[i];
      values[nuc] = gValues[i];
    }
    ['A','C','G','T'].forEach(nuc => {
      if (values[nuc] === undefined) values[nuc] = 0;
    });

    completeMapping.set(`${helix}:${zeroBasedPair}`, {
      helix,
      pair: zeroBasedPair,
      desc,
      priorityStr,
      priorityOrder,
      values,
      m: xmlData.m,
      s: xmlData.s
    });
  }

  allEntries = Array.from(completeMapping.values()).sort(
    (a, b) => a.helix - b.helix || a.pair - b.pair
  );

  // Make them globally accessible (window.*) for backwards compatibility
  window.completeMapping = completeMapping;
  window.allEntries = allEntries;
}