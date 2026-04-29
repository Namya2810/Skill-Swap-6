/**
 * Tech Skills Dataset — Server Side (CommonJS)
 * Mirror of client/src/data/skills.js but for Node.js backend use.
 * Used by community detection logic for category-based grouping.
 * Do NOT import frontend ES module version here.
 */

const SKILL_CATEGORIES = {
  "Frontend Development": [
    "html", "css", "javascript", "typescript", "react", "vue.js", "angular",
    "next.js", "nuxt.js", "svelte", "tailwind css", "bootstrap", "sass/scss",
    "redux", "zustand", "graphql (client)", "webpack", "vite", "storybook",
    "figma to code", "responsive design", "web accessibility", "pwa",
    "react native", "ionic", "three.js", "d3.js", "chart.js", "framer motion"
  ],
  "Backend Development": [
    "node.js", "express.js", "python", "django", "flask", "fastapi",
    "java", "spring boot", "c#", ".net", "php", "laravel", "ruby on rails",
    "go", "rust", "kotlin", "graphql (server)", "rest api design",
    "microservices", "websockets", "grpc", "message queues", "rabbitmq",
    "apache kafka", "redis", "nginx", "apache", "serverless"
  ],
  "Database": [
    "mongodb", "postgresql", "mysql", "sqlite", "redis", "firebase",
    "supabase", "dynamodb", "cassandra", "elasticsearch", "neo4j",
    "oracle db", "sql server", "influxdb", "cockroachdb", "prisma orm",
    "mongoose", "sequelize", "typeorm", "database design", "query optimization"
  ],
  "DevOps & Cloud": [
    "docker", "kubernetes", "aws", "google cloud platform", "azure",
    "ci/cd", "github actions", "jenkins", "terraform", "ansible",
    "linux", "bash scripting", "nginx", "load balancing", "monitoring",
    "grafana", "prometheus", "elk stack", "vercel", "netlify",
    "heroku", "digitalocean", "cloudflare", "site reliability engineering"
  ],
  "Machine Learning & AI": [
    "machine learning", "deep learning", "neural networks", "nlp",
    "computer vision", "tensorflow", "pytorch", "keras", "scikit-learn",
    "hugging face", "langchain", "openai api", "prompt engineering",
    "reinforcement learning", "gans", "transformers", "bert", "gpt fine-tuning",
    "mlops", "feature engineering", "model deployment", "a/b testing",
    "recommendation systems", "time series analysis"
  ],
  "Data Science": [
    "python", "r", "pandas", "numpy", "matplotlib", "seaborn",
    "jupyter notebooks", "data cleaning", "data visualization", "statistics",
    "hypothesis testing", "regression analysis", "clustering",
    "dimensionality reduction", "sql for analytics", "tableau", "power bi",
    "apache spark", "hadoop", "etl pipelines", "data warehousing",
    "bigquery", "snowflake", "dbt", "airflow"
  ],
  "Mobile Development": [
    "react native", "flutter", "swift", "swiftui", "kotlin",
    "android development", "ios development", "expo", "ionic",
    "xamarin", "mobile ui design", "app store optimization",
    "push notifications", "mobile testing", "firebase mobile"
  ],
  "Cybersecurity": [
    "ethical hacking", "penetration testing", "network security",
    "web security", "owasp top 10", "cryptography", "firewalls",
    "siem", "incident response", "threat modeling", "vulnerability assessment",
    "burp suite", "metasploit", "wireshark", "zero trust architecture",
    "identity & access management", "soc analysis", "malware analysis"
  ],
  "UI/UX Design": [
    "figma", "adobe xd", "sketch", "user research", "wireframing",
    "prototyping", "design systems", "typography", "color theory",
    "interaction design", "usability testing", "information architecture",
    "accessibility design", "motion design", "adobe illustrator",
    "adobe photoshop", "invision", "zeplin", "design thinking"
  ],
  "Blockchain & Web3": [
    "solidity", "ethereum", "smart contracts", "web3.js", "ethers.js",
    "defi", "nfts", "ipfs", "hardhat", "truffle", "polygon",
    "solana", "rust (blockchain)", "crypto wallets", "dao governance",
    "layer 2 solutions", "zero knowledge proofs"
  ],
  "Software Engineering": [
    "system design", "data structures", "algorithms", "design patterns",
    "clean code", "solid principles", "test-driven development",
    "unit testing", "integration testing", "code review", "git",
    "agile / scrum", "object-oriented programming", "functional programming",
    "api design", "documentation", "performance optimization",
    "refactoring", "pair programming", "technical writing"
  ],
  "Game Development": [
    "unity", "unreal engine", "godot", "c# (games)", "c++ (games)",
    "game design", "3d modeling", "blender", "shader programming",
    "physics engines", "multiplayer networking", "game ai",
    "webgl", "pygame", "libgdx"
  ],
  "Embedded & IoT": [
    "arduino", "raspberry pi", "c (embedded)", "c++", "rtos",
    "mqtt", "iot protocols", "sensors & actuators", "pcb design",
    "microcontrollers", "fpgas", "edge ai", "ros (robotics)"
  ],
  "Soft Skills & Career": [
    "technical communication", "public speaking", "mentoring",
    "project management", "team leadership", "problem solving",
    "critical thinking", "time management", "code review",
    "open source contribution", "technical blogging", "interview preparation",
    "resume writing", "networking", "remote work"
  ],
  "Emerging Tech": [
    "quantum computing", "ar/vr development", "edge computing",
    "5g applications", "digital twins", "robotics process automation",
    "no-code / low-code", "wearable tech", "drone programming",
    "bioinformatics", "fintech", "healthtech", "legaltech"
  ]
};

/**
 * Get the primary tech category for a given skill (lowercase).
 * Returns the category name string or null if not found.
 */
const getSkillCategory = (skill) => {
  const lower = skill.toLowerCase().trim();
  for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
    if (skills.includes(lower)) return category;
  }
  return null;
};

/**
 * Get the dominant category for a set of skills.
 * Returns the category that appears most often across the skill list.
 */
const getDominantCategory = (skills) => {
  const counts = {};
  for (const skill of skills) {
    const cat = getSkillCategory(skill);
    if (cat) counts[cat] = (counts[cat] || 0) + 1;
  }
  if (Object.keys(counts).length === 0) return null;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
};

module.exports = { SKILL_CATEGORIES, getSkillCategory, getDominantCategory };
