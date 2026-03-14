import type { TreeNode } from "@/types/tree";
import type { TreeAction } from "@/stores/chat-store";
import { useTreeStore, makeId } from "@/stores/tree-store";

interface ParsedIntent {
  action: TreeAction;
  execute: () => void;
  response: string;
}

const DEPARTMENT_ALIASES: Record<string, string> = {
  eng: "Engineering",
  engineering: "Engineering",
  dev: "Engineering",
  development: "Engineering",
  product: "Product",
  pm: "Product",
  design: "Design",
  ux: "Design",
  ui: "Design",
  sales: "Sales",
  marketing: "Marketing",
  mktg: "Marketing",
  ops: "Operations",
  operations: "Operations",
  hr: "Operations",
  people: "Operations",
  finance: "Operations",
  legal: "Legal",
  support: "Support",
  "customer success": "Customer Success",
  cs: "Customer Success",
  data: "Engineering",
  security: "Engineering",
  qa: "Engineering",
  infra: "Engineering",
  executive: "Executive",
  leadership: "Executive",
};

function normalizeDepartment(input: string): string {
  const lower = input.toLowerCase().trim();
  return DEPARTMENT_ALIASES[lower] || input.charAt(0).toUpperCase() + input.slice(1);
}

function extractNames(text: string): string[] {
  // Match "Name Name" patterns (capitalized words)
  const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
  const matches = text.match(namePattern) || [];
  // Filter out common false positives
  const blacklist = new Set(["Senior Engineer", "Junior Engineer", "Product Manager", "Vice President", "Account Executive", "Head Of", "Chief Executive", "Chief Technology", "Chief Financial", "Chief Operating", "Let Me", "I Have", "We Have", "They Are", "Can You", "Please Add"]);
  return matches.filter((m) => !blacklist.has(m));
}

function extractNumber(text: string): number | null {
  // "3 engineers", "five developers", etc.
  const wordToNum: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  };
  const wordMatch = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/i);
  if (wordMatch) return wordToNum[wordMatch[1].toLowerCase()];

  const numMatch = text.match(/\b(\d{1,2})\b/);
  if (numMatch) return parseInt(numMatch[1], 10);
  return null;
}

function extractRole(text: string): string | null {
  const rolePatterns = [
    /(?:as|titled?|role(?:\s+of)?|position(?:\s+of)?)\s+"([^"]+)"/i,
    /(?:as|titled?|role(?:\s+of)?|position(?:\s+of)?)\s+(?:a\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Engineer|Developer|Designer|Manager|Analyst|Lead|Director|VP|Chief|Head|Officer|Specialist|Coordinator|Architect|Scientist|Researcher|Writer|Marketer|Recruiter|Executive|Representative|SDR|AE|PM|EM))?)/i,
  ];
  for (const p of rolePatterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return null;
}

const ROLE_KEYWORDS: Record<string, { role: string; dept: string }> = {
  engineer: { role: "Software Engineer", dept: "Engineering" },
  developer: { role: "Software Engineer", dept: "Engineering" },
  "frontend engineer": { role: "Frontend Engineer", dept: "Engineering" },
  "backend engineer": { role: "Backend Engineer", dept: "Engineering" },
  "mobile engineer": { role: "Mobile Engineer", dept: "Engineering" },
  "data scientist": { role: "Data Scientist", dept: "Engineering" },
  "ml engineer": { role: "ML Engineer", dept: "Engineering" },
  "devops": { role: "DevOps Engineer", dept: "Engineering" },
  "sre": { role: "SRE", dept: "Engineering" },
  "qa engineer": { role: "QA Engineer", dept: "Engineering" },
  designer: { role: "Product Designer", dept: "Design" },
  "ux researcher": { role: "UX Researcher", dept: "Design" },
  "product manager": { role: "Product Manager", dept: "Product" },
  pm: { role: "Product Manager", dept: "Product" },
  marketer: { role: "Marketer", dept: "Marketing" },
  "content marketer": { role: "Content Marketer", dept: "Marketing" },
  "growth marketer": { role: "Growth Marketer", dept: "Marketing" },
  salesperson: { role: "Account Executive", dept: "Sales" },
  "account executive": { role: "Account Executive", dept: "Sales" },
  ae: { role: "Account Executive", dept: "Sales" },
  sdr: { role: "SDR", dept: "Sales" },
  recruiter: { role: "Recruiter", dept: "Operations" },
  ceo: { role: "CEO", dept: "Executive" },
  cto: { role: "CTO", dept: "Executive" },
  cfo: { role: "CFO", dept: "Executive" },
  coo: { role: "COO", dept: "Executive" },
  vp: { role: "VP", dept: "Executive" },
  intern: { role: "Intern", dept: "Engineering" },
};

function findRoleKeyword(text: string): { role: string; dept: string } | null {
  const lower = text.toLowerCase();
  // Check longer matches first
  const sorted = Object.entries(ROLE_KEYWORDS).sort((a, b) => b[0].length - a[0].length);
  for (const [keyword, info] of sorted) {
    if (lower.includes(keyword)) return info;
  }
  return null;
}

export function processUserMessage(message: string): ParsedIntent | null {
  const store = useTreeStore.getState();
  const lower = message.toLowerCase();

  // --- Pattern: "We have N [role] in [dept]" / "There are N [role]" / "Add N [role]" ---
  const countRoleMatch = lower.match(
    /(?:we have|there (?:are|is)|i have|add|hire|got|bring on|need)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:more\s+)?(.+?)(?:\s+(?:in|on|to|for|at|under)\s+(?:the\s+)?(.+?))?(?:\s+(?:team|department|dept))?$/i
  );

  if (countRoleMatch) {
    const count = extractNumber(countRoleMatch[1]) || extractNumber(message);
    const roleText = countRoleMatch[2].replace(/s$/, "").trim();
    const deptText = countRoleMatch[3]?.trim();

    const roleInfo = findRoleKeyword(roleText);
    const role = roleInfo?.role || roleText.charAt(0).toUpperCase() + roleText.slice(1);
    const deptName = deptText ? normalizeDepartment(deptText) : (roleInfo?.dept || "Engineering");

    if (count && count > 0 && count <= 20) {
      return {
        action: {
          type: "add_employees",
          summary: `Adding ${count} ${role}${count > 1 ? "s" : ""} to ${deptName}`,
        },
        response: `Got it! I've added ${count} ${role}${count > 1 ? "s" : ""} to the ${deptName} department. You'll see the tree update with ${count > 1 ? "new leaves" : "a new leaf"} on the ${deptName} branch.`,
        execute: () => {
          const deptId = store.ensureDepartment(deptName);
          // Slight delay to let dept exist
          const currentStore = useTreeStore.getState();
          const teamId = currentStore.ensureTeam(deptId, `${deptName} Team`);
          for (let i = 0; i < count; i++) {
            setTimeout(() => {
              const s = useTreeStore.getState();
              const names = generateName();
              s.addNodeToParent(teamId, {
                id: makeId(),
                name: names,
                type: "employee",
                role,
                department: deptName,
              });
            }, i * 150);
          }
        },
      };
    }
  }

  // --- Pattern: "Add [Name] as [Role] in/to [Dept]" ---
  const addNamedMatch = message.match(
    /(?:add|hire|bring on|onboard)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:as\s+(?:a\s+|an\s+)?)?(.+?)(?:\s+(?:in|on|to|for|at|under)\s+(?:the\s+)?(.+?))?$/i
  );

  if (addNamedMatch) {
    const name = addNamedMatch[1];
    const roleText = addNamedMatch[2].trim().replace(/\.$/, "");
    const deptText = addNamedMatch[3]?.trim().replace(/\.$/, "");
    const roleInfo = findRoleKeyword(roleText);
    const role = roleInfo?.role || roleText;
    const deptName = deptText ? normalizeDepartment(deptText) : (roleInfo?.dept || "Engineering");

    return {
      action: {
        type: "add_employees",
        summary: `Adding ${name} as ${role} to ${deptName}`,
      },
      response: `Added ${name} as a ${role} in ${deptName}. The tree now shows them as a new leaf on the ${deptName} branch.`,
      execute: () => {
        const s = useTreeStore.getState();
        const deptId = s.ensureDepartment(deptName);
        const s2 = useTreeStore.getState();
        const teamId = s2.ensureTeam(deptId, `${deptName} Team`);
        setTimeout(() => {
          useTreeStore.getState().addNodeToParent(teamId, {
            id: makeId(),
            name,
            type: "employee",
            role,
            department: deptName,
          });
        }, 100);
      },
    };
  }

  // --- Pattern: "We need a [role]" / "We should hire a [role]" (recommended hires) ---
  const needMatch = lower.match(
    /(?:we (?:need|should hire|want|are looking for|could use)|hire|find)\s+(?:a\s+|an\s+)?(.+?)(?:\s+(?:in|for|on)\s+(?:the\s+)?(.+?))?$/i
  );

  if (needMatch && !lower.match(/^(?:add|we have|there are|i have)/)) {
    const roleText = needMatch[1].trim().replace(/\.$/, "");
    const deptText = needMatch[2]?.trim().replace(/\.$/, "");
    const roleInfo = findRoleKeyword(roleText);
    const role = roleInfo?.role || roleText.charAt(0).toUpperCase() + roleText.slice(1);
    const deptName = deptText ? normalizeDepartment(deptText) : (roleInfo?.dept || "Engineering");

    return {
      action: {
        type: "add_recommended",
        summary: `Recommending ${role} hire for ${deptName}`,
      },
      response: `I've added a ${role} as a recommended hire for the ${deptName} department. You'll see a new glowing bud on the tree indicating this open position.`,
      execute: () => {
        const s = useTreeStore.getState();
        const deptId = s.ensureDepartment(deptName);
        const s2 = useTreeStore.getState();
        const teamId = s2.ensureTeam(deptId, `${deptName} Team`);
        setTimeout(() => {
          useTreeStore.getState().addNodeToParent(teamId, {
            id: makeId(),
            name: role,
            type: "recommended_role",
            role,
            department: deptName,
            priority: "medium",
            description: `Recommended by CEO: ${message}`,
          });
        }, 100);
      },
    };
  }

  // --- Pattern: "Create/Add [dept] department" ---
  const deptMatch = lower.match(
    /(?:create|add|we have|start|set up)\s+(?:a\s+|an\s+)?(?:new\s+)?(.+?)\s+(?:department|dept|team|division)/i
  );

  if (deptMatch) {
    const deptName = normalizeDepartment(deptMatch[1]);
    return {
      action: {
        type: "add_department",
        summary: `Creating ${deptName} department`,
      },
      response: `Created the ${deptName} department. It now appears as a new branch on your company tree. You can add team members to it by telling me about the people in this department.`,
      execute: () => {
        useTreeStore.getState().ensureDepartment(deptName);
      },
    };
  }

  // --- Pattern: company name change ---
  const companyMatch = message.match(
    /(?:(?:our|the|my)\s+)?company(?:\s+(?:is|name is|is called))\s+(.+?)\.?$/i
  );
  if (companyMatch) {
    const name = companyMatch[1].trim().replace(/^"(.*)"$/, "$1");
    return {
      action: {
        type: "set_company",
        summary: `Setting company name to ${name}`,
      },
      response: `Updated your company name to "${name}". This is now reflected at the root of your tree.`,
      execute: () => {
        const s = useTreeStore.getState();
        s.setTreeData({ ...s.treeData, name });
      },
    };
  }

  // --- Fallback: try to extract any useful info ---
  return null;
}

const FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery", "Cameron", "Dakota", "Sage", "Rowan", "Finley", "Hayden", "Blake", "Drew", "Emery", "Harper", "Kai", "Logan", "Micah", "Nico", "Parker", "Reese", "Skyler", "Tatum", "Phoenix", "Wren", "Zara", "Sloane"];
const LAST_NAMES = ["Kim", "Patel", "Garcia", "Chen", "Müller", "Park", "Silva", "Nguyen", "Anderson", "Martinez", "Lee", "Thomas", "Brown", "Wilson", "Taylor", "Moore", "Clark", "Lewis", "Walker", "Hall", "Young", "Allen", "Scott", "Adams", "Hill", "Green", "Baker", "Torres", "Rivera", "Foster"];

let nameCounter = 0;
function generateName(): string {
  const first = FIRST_NAMES[(nameCounter * 7 + 3) % FIRST_NAMES.length];
  const last = LAST_NAMES[(nameCounter * 11 + 5) % LAST_NAMES.length];
  nameCounter++;
  return `${first} ${last}`;
}

export function generateFallbackResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.match(/\b(hi|hello|hey|howdy)\b/)) {
    return "Hello! I'm your WorkTree AI assistant. Tell me about your team structure and I'll build a visual tree for you. For example:\n\n- \"We have 3 engineers in the backend team\"\n- \"Add Sarah Chen as a Senior Designer in Design\"\n- \"We need a DevOps engineer\"\n- \"Create a Customer Success department\"";
  }

  if (lower.match(/\b(help|what can you|how do|how does)\b/)) {
    return "I can help you build your company tree! Here's what you can tell me:\n\n- **Add people:** \"We have 5 engineers\" or \"Add John Smith as a PM\"\n- **Create departments:** \"Create a Legal department\"\n- **Flag hiring needs:** \"We need a senior designer\"\n- **Rename company:** \"Our company is called Acme Corp\"\n\nJust describe your team in natural language and I'll update the tree in real-time.";
  }

  if (lower.match(/\b(thanks|thank you|awesome|great|perfect|cool)\b/)) {
    return "You're welcome! Keep telling me about your team and I'll keep updating the tree. You can check the Dashboard to see the full visualization.";
  }

  return "I'm not sure how to update the tree from that. Try something like:\n\n- \"We have 4 engineers\"\n- \"Add Maria Lopez as a Product Manager\"\n- \"We need a recruiter\"\n- \"Create a Data Science department\"\n\nI'll update the tree as you describe your team!";
}
