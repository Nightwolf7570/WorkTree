import type { TreeNode } from "@/types/tree";
import type { AnalysisResult } from "@/types/analysis";

export const mockTreeData: TreeNode = {
  id: "company",
  name: "Acme Technologies",
  type: "company",
  children: [
    {
      id: "eng",
      name: "Engineering",
      type: "department",
      children: [
        {
          id: "eng-frontend",
          name: "Frontend",
          type: "team",
          children: [
            { id: "e1", name: "Sarah Chen", type: "employee", role: "Senior Frontend Engineer", department: "Engineering", socials: { github: "https://github.com/sarahchen", linkedin: "https://linkedin.com/in/sarahchen" } },
            { id: "e2", name: "Marcus Johnson", type: "employee", role: "Frontend Engineer", department: "Engineering", socials: { github: "https://github.com/marcusj", linkedin: "https://linkedin.com/in/marcusjohnson" } },
            { id: "e3", name: "Priya Patel", type: "employee", role: "Frontend Engineer", department: "Engineering", socials: { github: "https://github.com/priyap", linkedin: "https://linkedin.com/in/priyapatel" } },
            { id: "r1", name: "Senior React Engineer", type: "recommended_role", role: "Senior React Engineer", department: "Engineering", priority: "high", description: "Team needs a senior engineer to lead component architecture and mentor junior devs." },
          ],
        },
        {
          id: "eng-backend",
          name: "Backend",
          type: "team",
          children: [
            { id: "e4", name: "Alex Rivera", type: "employee", role: "Staff Backend Engineer", department: "Engineering", socials: { github: "https://github.com/arivera", linkedin: "https://linkedin.com/in/alexrivera", twitter: "https://x.com/arivera_dev" } },
            { id: "e5", name: "Jordan Lee", type: "employee", role: "Backend Engineer", department: "Engineering", socials: { github: "https://github.com/jordanlee", linkedin: "https://linkedin.com/in/jordanlee" } },
            { id: "e6", name: "Olivia Kim", type: "employee", role: "Backend Engineer", department: "Engineering", socials: { linkedin: "https://linkedin.com/in/oliviakim" } },
            { id: "e7", name: "Raj Mehta", type: "employee", role: "Backend Engineer", department: "Engineering", socials: { github: "https://github.com/rajmehta", linkedin: "https://linkedin.com/in/rajmehta" } },
            { id: "r2", name: "DevOps / SRE Engineer", type: "recommended_role", role: "DevOps / SRE Engineer", department: "Engineering", priority: "critical", description: "No dedicated infrastructure person. Backend team is splitting time on ops, slowing feature development." },
          ],
        },
        {
          id: "eng-mobile",
          name: "Mobile",
          type: "team",
          children: [
            { id: "e8", name: "Liam O'Brien", type: "employee", role: "Mobile Engineer", department: "Engineering", socials: { github: "https://github.com/liamob", linkedin: "https://linkedin.com/in/liamobrien" } },
            { id: "e9", name: "Aisha Nakamura", type: "employee", role: "Mobile Engineer", department: "Engineering", socials: { github: "https://github.com/aishanakamura", linkedin: "https://linkedin.com/in/aishanakamura", website: "https://aisha.dev" } },
          ],
        },
        {
          id: "eng-data",
          name: "Data / ML",
          type: "team",
          children: [
            { id: "e10", name: "David Park", type: "employee", role: "Data Scientist", department: "Engineering", socials: { github: "https://github.com/dpark", linkedin: "https://linkedin.com/in/davidpark" } },
            { id: "e11", name: "Emma Torres", type: "employee", role: "ML Engineer", department: "Engineering", socials: { github: "https://github.com/emmatorres", linkedin: "https://linkedin.com/in/emmatorres", twitter: "https://x.com/emma_ml" } },
            { id: "r3", name: "Data Engineer", type: "recommended_role", role: "Data Engineer", department: "Engineering", priority: "medium", description: "Growing data pipeline complexity warrants a dedicated data engineer." },
          ],
        },
      ],
    },
    {
      id: "product",
      name: "Product",
      type: "department",
      children: [
        {
          id: "prod-core",
          name: "Core Product",
          type: "team",
          children: [
            { id: "e12", name: "Nicole Foster", type: "employee", role: "Head of Product", department: "Product", socials: { linkedin: "https://linkedin.com/in/nicolefoster", twitter: "https://x.com/nicolefoster" } },
            { id: "e13", name: "Ethan Wright", type: "employee", role: "Product Manager", department: "Product", socials: { linkedin: "https://linkedin.com/in/ethanwright" } },
            { id: "e14", name: "Maya Gupta", type: "employee", role: "Product Analyst", department: "Product", socials: { linkedin: "https://linkedin.com/in/mayagupta" } },
          ],
        },
      ],
    },
    {
      id: "design",
      name: "Design",
      type: "department",
      children: [
        {
          id: "design-core",
          name: "Design Team",
          type: "team",
          children: [
            { id: "e15", name: "Chris Andersson", type: "employee", role: "Head of Design", department: "Design", socials: { linkedin: "https://linkedin.com/in/chrisandersson", website: "https://chrisandersson.design" } },
            { id: "e16", name: "Zoe Mitchell", type: "employee", role: "Product Designer", department: "Design", socials: { linkedin: "https://linkedin.com/in/zoemitchell", twitter: "https://x.com/zoe_designs" } },
            { id: "e17", name: "Sam Okoro", type: "employee", role: "UX Researcher", department: "Design", socials: { linkedin: "https://linkedin.com/in/samokoro" } },
            { id: "r4", name: "Visual / Brand Designer", type: "recommended_role", role: "Visual / Brand Designer", department: "Design", priority: "low", description: "As the company scales, brand consistency across marketing and product will need a dedicated designer." },
          ],
        },
      ],
    },
    {
      id: "sales",
      name: "Sales",
      type: "department",
      children: [
        {
          id: "sales-team",
          name: "Sales Team",
          type: "team",
          children: [
            { id: "e18", name: "Rachel Green", type: "employee", role: "VP Sales", department: "Sales", socials: { linkedin: "https://linkedin.com/in/rachelgreen" } },
            { id: "e19", name: "Tom Bradley", type: "employee", role: "Account Executive", department: "Sales", socials: { linkedin: "https://linkedin.com/in/tombradley" } },
            { id: "e20", name: "Nina Volkov", type: "employee", role: "Account Executive", department: "Sales", socials: { linkedin: "https://linkedin.com/in/ninavolkov" } },
            { id: "e21", name: "Jake Morrison", type: "employee", role: "SDR", department: "Sales", socials: { linkedin: "https://linkedin.com/in/jakemorrison" } },
            { id: "e22", name: "Lisa Chang", type: "employee", role: "SDR", department: "Sales", socials: { linkedin: "https://linkedin.com/in/lisachang" } },
            { id: "r5", name: "Sales Engineer", type: "recommended_role", role: "Sales Engineer", department: "Sales", priority: "high", description: "Technical demos are currently handled by engineers, pulling them from product work. A sales engineer bridges this gap." },
          ],
        },
      ],
    },
    {
      id: "marketing",
      name: "Marketing",
      type: "department",
      children: [
        {
          id: "mktg-team",
          name: "Marketing Team",
          type: "team",
          children: [
            { id: "e23", name: "Amanda Price", type: "employee", role: "Head of Marketing", department: "Marketing", socials: { linkedin: "https://linkedin.com/in/amandaprice", twitter: "https://x.com/amandaprice" } },
            { id: "e24", name: "Ben Flores", type: "employee", role: "Content Marketer", department: "Marketing", socials: { linkedin: "https://linkedin.com/in/benflores", website: "https://benflores.blog" } },
            { id: "e25", name: "Chloe Davis", type: "employee", role: "Growth Marketer", department: "Marketing", socials: { linkedin: "https://linkedin.com/in/chloedavis" } },
            { id: "r6", name: "Product Marketing Manager", type: "recommended_role", role: "Product Marketing Manager", department: "Marketing", priority: "medium", description: "Positioning and go-to-market messaging is ad hoc. A PMM will sharpen competitive positioning." },
          ],
        },
      ],
    },
    {
      id: "ops",
      name: "Operations",
      type: "department",
      children: [
        {
          id: "ops-team",
          name: "Operations Team",
          type: "team",
          children: [
            { id: "e26", name: "Diana Reyes", type: "employee", role: "Head of Operations", department: "Operations", socials: { linkedin: "https://linkedin.com/in/dianareyes" } },
            { id: "e27", name: "Michael Scott", type: "employee", role: "People Ops", department: "Operations", socials: { linkedin: "https://linkedin.com/in/michaelscott" } },
            { id: "e28", name: "Laura Bennett", type: "employee", role: "Finance & Accounting", department: "Operations", socials: { linkedin: "https://linkedin.com/in/laurabennett" } },
            { id: "r7", name: "Recruiter", type: "recommended_role", role: "Technical Recruiter", department: "Operations", priority: "critical", description: "With 7 open roles recommended, a dedicated recruiter is essential to scale hiring." },
          ],
        },
      ],
    },
  ],
};

export const mockAnalysisResult: AnalysisResult = {
  companyName: "Acme Technologies",
  totalEmployees: 28,
  recommendations: [
    {
      id: "r2",
      title: "DevOps / SRE Engineer",
      department: "Engineering",
      priority: "critical",
      reasoning: "No dedicated infrastructure person. Backend team is splitting time on ops, slowing feature velocity by an estimated 30%.",
      salaryRange: { min: 140000, max: 185000 },
      skills: ["AWS/GCP", "Kubernetes", "CI/CD", "Terraform", "Monitoring"],
    },
    {
      id: "r7",
      title: "Technical Recruiter",
      department: "Operations",
      priority: "critical",
      reasoning: "With 7+ recommended hires, the company needs a dedicated recruiter to build pipeline and manage the hiring process.",
      salaryRange: { min: 75000, max: 110000 },
      skills: ["Technical Recruiting", "ATS", "Sourcing", "Employer Branding"],
    },
    {
      id: "r1",
      title: "Senior React Engineer",
      department: "Engineering",
      priority: "high",
      reasoning: "Frontend team lacks senior leadership. Component architecture decisions are ad hoc, leading to tech debt accumulation.",
      salaryRange: { min: 150000, max: 195000 },
      skills: ["React", "TypeScript", "System Design", "Mentoring", "Performance"],
    },
    {
      id: "r5",
      title: "Sales Engineer",
      department: "Sales",
      priority: "high",
      reasoning: "Engineering team spends ~15% of their time on sales demos. A sales engineer would recover 1.5 FTEs worth of engineering time.",
      salaryRange: { min: 120000, max: 160000 },
      skills: ["Technical Demos", "API Integration", "Solution Architecture", "Communication"],
    },
    {
      id: "r3",
      title: "Data Engineer",
      department: "Engineering",
      priority: "medium",
      reasoning: "Data pipelines are maintained part-time by the ML engineer, creating a bottleneck for analytics and model training.",
      salaryRange: { min: 130000, max: 170000 },
      skills: ["Python", "SQL", "Spark", "Airflow", "dbt"],
    },
    {
      id: "r6",
      title: "Product Marketing Manager",
      department: "Marketing",
      priority: "medium",
      reasoning: "Go-to-market messaging is inconsistent. Competitive positioning is not data-driven, weakening sales enablement.",
      salaryRange: { min: 100000, max: 140000 },
      skills: ["Positioning", "Competitive Analysis", "Content Strategy", "Sales Enablement"],
    },
    {
      id: "r4",
      title: "Visual / Brand Designer",
      department: "Design",
      priority: "low",
      reasoning: "Brand consistency across marketing materials and product is starting to diverge. Not critical yet but will be as the company scales.",
      salaryRange: { min: 90000, max: 130000 },
      skills: ["Brand Design", "Illustration", "Design Systems", "Figma"],
    },
  ],
  departmentHealth: [
    { department: "Engineering", score: 62, headcount: 11, optimalHeadcount: 15, status: "understaffed" },
    { department: "Product", score: 78, headcount: 3, optimalHeadcount: 3, status: "optimal" },
    { department: "Design", score: 70, headcount: 3, optimalHeadcount: 4, status: "understaffed" },
    { department: "Sales", score: 65, headcount: 5, optimalHeadcount: 7, status: "understaffed" },
    { department: "Marketing", score: 68, headcount: 3, optimalHeadcount: 4, status: "understaffed" },
    { department: "Operations", score: 55, headcount: 3, optimalHeadcount: 5, status: "understaffed" },
  ],
  gapAnalysis: [
    { department: "Engineering", currentCapacity: 73, requiredCapacity: 100 },
    { department: "Product", currentCapacity: 90, requiredCapacity: 90 },
    { department: "Design", currentCapacity: 75, requiredCapacity: 95 },
    { department: "Sales", currentCapacity: 65, requiredCapacity: 100 },
    { department: "Marketing", currentCapacity: 70, requiredCapacity: 95 },
    { department: "Operations", currentCapacity: 50, requiredCapacity: 90 },
  ],
  budgetSuggestions: [
    { department: "Engineering", percentage: 38, amount: 495000 },
    { department: "Sales", percentage: 20, amount: 260000 },
    { department: "Operations", percentage: 17, amount: 221000 },
    { department: "Marketing", percentage: 12, amount: 156000 },
    { department: "Design", percentage: 8, amount: 104000 },
    { department: "Product", percentage: 5, amount: 65000 },
  ],
};
