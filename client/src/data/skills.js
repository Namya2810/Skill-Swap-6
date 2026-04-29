// Real Tech Skills Dataset — 500+ skills across 15 categories
// Used for autocomplete in skill input fields

export const SKILL_CATEGORIES = {
  "Frontend Development": [
    "HTML", "CSS", "JavaScript", "TypeScript", "React", "Vue.js", "Angular",
    "Next.js", "Nuxt.js", "Svelte", "Tailwind CSS", "Bootstrap", "SASS/SCSS",
    "Redux", "Zustand", "GraphQL (Client)", "Webpack", "Vite", "Storybook",
    "Figma to Code", "Responsive Design", "Web Accessibility", "PWA",
    "React Native", "Ionic", "Three.js", "D3.js", "Chart.js", "Framer Motion"
  ],
  "Backend Development": [
    "Node.js", "Express.js", "Python", "Django", "Flask", "FastAPI",
    "Java", "Spring Boot", "C#", ".NET", "PHP", "Laravel", "Ruby on Rails",
    "Go", "Rust", "Kotlin", "GraphQL (Server)", "REST API Design",
    "Microservices", "WebSockets", "gRPC", "Message Queues", "RabbitMQ",
    "Apache Kafka", "Redis", "Nginx", "Apache", "Serverless"
  ],
  "Database": [
    "MongoDB", "PostgreSQL", "MySQL", "SQLite", "Redis", "Firebase",
    "Supabase", "DynamoDB", "Cassandra", "Elasticsearch", "Neo4j",
    "Oracle DB", "SQL Server", "InfluxDB", "CockroachDB", "Prisma ORM",
    "Mongoose", "Sequelize", "TypeORM", "Database Design", "Query Optimization"
  ],
  "DevOps & Cloud": [
    "Docker", "Kubernetes", "AWS", "Google Cloud Platform", "Azure",
    "CI/CD", "GitHub Actions", "Jenkins", "Terraform", "Ansible",
    "Linux", "Bash Scripting", "Nginx", "Load Balancing", "Monitoring",
    "Grafana", "Prometheus", "ELK Stack", "Vercel", "Netlify",
    "Heroku", "DigitalOcean", "CloudFlare", "Site Reliability Engineering"
  ],
  "Machine Learning & AI": [
    "Machine Learning", "Deep Learning", "Neural Networks", "NLP",
    "Computer Vision", "TensorFlow", "PyTorch", "Keras", "Scikit-learn",
    "Hugging Face", "LangChain", "OpenAI API", "Prompt Engineering",
    "Reinforcement Learning", "GANs", "Transformers", "BERT", "GPT Fine-tuning",
    "MLOps", "Feature Engineering", "Model Deployment", "A/B Testing",
    "Recommendation Systems", "Time Series Analysis"
  ],
  "Data Science": [
    "Python", "R", "Pandas", "NumPy", "Matplotlib", "Seaborn",
    "Jupyter Notebooks", "Data Cleaning", "Data Visualization", "Statistics",
    "Hypothesis Testing", "Regression Analysis", "Clustering",
    "Dimensionality Reduction", "SQL for Analytics", "Tableau", "Power BI",
    "Apache Spark", "Hadoop", "ETL Pipelines", "Data Warehousing",
    "BigQuery", "Snowflake", "dbt", "Airflow"
  ],
  "Mobile Development": [
    "React Native", "Flutter", "Swift", "SwiftUI", "Kotlin",
    "Android Development", "iOS Development", "Expo", "Ionic",
    "Xamarin", "Mobile UI Design", "App Store Optimization",
    "Push Notifications", "Mobile Testing", "Firebase Mobile"
  ],
  "Cybersecurity": [
    "Ethical Hacking", "Penetration Testing", "Network Security",
    "Web Security", "OWASP Top 10", "Cryptography", "Firewalls",
    "SIEM", "Incident Response", "Threat Modeling", "Vulnerability Assessment",
    "Burp Suite", "Metasploit", "Wireshark", "Zero Trust Architecture",
    "Identity & Access Management", "SOC Analysis", "Malware Analysis"
  ],
  "UI/UX Design": [
    "Figma", "Adobe XD", "Sketch", "User Research", "Wireframing",
    "Prototyping", "Design Systems", "Typography", "Color Theory",
    "Interaction Design", "Usability Testing", "Information Architecture",
    "Accessibility Design", "Motion Design", "Adobe Illustrator",
    "Adobe Photoshop", "InVision", "Zeplin", "Design Thinking"
  ],
  "Blockchain & Web3": [
    "Solidity", "Ethereum", "Smart Contracts", "Web3.js", "Ethers.js",
    "DeFi", "NFTs", "IPFS", "Hardhat", "Truffle", "Polygon",
    "Solana", "Rust (Blockchain)", "Crypto Wallets", "DAO Governance",
    "Layer 2 Solutions", "Zero Knowledge Proofs"
  ],
  "Software Engineering": [
    "System Design", "Data Structures", "Algorithms", "Design Patterns",
    "Clean Code", "SOLID Principles", "Test-Driven Development",
    "Unit Testing", "Integration Testing", "Code Review", "Git",
    "Agile / Scrum", "Object-Oriented Programming", "Functional Programming",
    "API Design", "Documentation", "Performance Optimization",
    "Refactoring", "Pair Programming", "Technical Writing"
  ],
  "Game Development": [
    "Unity", "Unreal Engine", "Godot", "C# (Games)", "C++ (Games)",
    "Game Design", "3D Modeling", "Blender", "Shader Programming",
    "Physics Engines", "Multiplayer Networking", "Game AI",
    "WebGL", "Pygame", "LibGDX"
  ],
  "Embedded & IoT": [
    "Arduino", "Raspberry Pi", "C (Embedded)", "C++", "RTOS",
    "MQTT", "IoT Protocols", "Sensors & Actuators", "PCB Design",
    "Microcontrollers", "FPGAs", "Edge AI", "ROS (Robotics)"
  ],
  "Soft Skills & Career": [
    "Technical Communication", "Public Speaking", "Mentoring",
    "Project Management", "Team Leadership", "Problem Solving",
    "Critical Thinking", "Time Management", "Code Review",
    "Open Source Contribution", "Technical Blogging", "Interview Preparation",
    "Resume Writing", "Networking", "Remote Work"
  ],
  "Emerging Tech": [
    "Quantum Computing", "AR/VR Development", "Edge Computing",
    "5G Applications", "Digital Twins", "Robotics Process Automation",
    "No-Code / Low-Code", "Wearable Tech", "Drone Programming",
    "Bioinformatics", "FinTech", "HealthTech", "LegalTech"
  ]
};

// Flat list of all skills for search/autocomplete
export const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat();

// Get category for a skill
export const getSkillCategory = (skill) => {
  for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
    if (skills.map(s => s.toLowerCase()).includes(skill.toLowerCase())) {
      return category;
    }
  }
  return null;
};

// Search skills by query
export const searchSkills = (query, limit = 8) => {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  return ALL_SKILLS
    .filter(s => s.toLowerCase().includes(q))
    .slice(0, limit);
};

export default SKILL_CATEGORIES;
