/**
 * Content for the "Experience & Credentials" section (#experience).
 * Edit here only — the section renders whatever is listed.
 */
export const workExperience = [
  {
    id: 'carecs-cybersecurity-intern',
    role: 'Cybersecurity Intern',
    company: 'CareCs',
    location: 'Hyderabad, India',
    start: 'Nov 2025',
    end: 'Jan 2026',
    highlights: [
      'Monitored enterprise network traffic and analyzed packet captures using Wireshark to identify anomalous outbound connections and protocol misconfigurations.',
      'Configured and hardened perimeter firewall rules and access control lists (ACLs) to reduce attack surface across internal subnets.',
      'Conducted systematic vulnerability audits and endpoint security assessments, documenting remediation playbooks for engineering teams.',
    ],
    stack: ['Network Traffic Analysis', 'Wireshark', 'Firewall Hardening', 'Vulnerability Auditing', 'Kali Linux'],
  },
  {
    id: 'srinidhi-fullstack-intern',
    role: 'Full-Stack Web Development Intern',
    company: 'Srinidhi Innovative and Infosoft Pvt Ltd',
    location: 'Bengaluru, India',
    start: 'Aug 2025',
    end: 'Nov 2025',
    highlights: [
      'Engineered responsive full-stack MERN applications and modular RESTful APIs serving production client workflows.',
      'Implemented JWT authentication architectures with Role-Based Access Control (RBAC) and automated Axios token-refresh interceptors to eliminate session drops.',
      'Optimized MongoDB queries, schema indexes, and Express middleware pipelines for low-latency data retrieval and strict payload validation.',
    ],
    stack: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'JWT & RBAC', 'Axios Interceptors', 'REST APIs'],
  },
];

export const education = [
  {
    id: 'simats-be-cse',
    degree: 'B.E. in Computer Science and Engineering',
    specialization: 'Specialization in Cyber Security',
    institution: 'SIMATS Engineering (Saveetha Institute of Medical and Technical Sciences), Chennai',
    timeline: 'Expected Graduation 2027',
    focusAreas: ['Network Security', 'Cryptography', 'Database Management Systems', 'Full-Stack Software Engineering'],
  },
];

/**
 * Certificates: drop the PDFs in client/public/certificates/ with the file names below.
 * "View" opens the file in a new tab, the download icon saves it as `downloadName`.
 */
export const certifications = [
  {
    id: 'oracle-sql',
    title: 'Oracle Database Management Professional in SQL',
    issuer: 'Oracle',
    file: '/certificates/oracle-sql.pdf',
    downloadName: 'Shanmukha-Aditya-Oracle-SQL-Certificate.pdf',
    summary: 'Query optimization, relational schema design, indexing, and ACID transaction control.',
    competencies: ['SQL', 'Query Optimization', 'Schema Design', 'Indexing', 'ACID Transactions'],
  },
  {
    id: 'fullstack-professional',
    title: 'Full-Stack Web Development Professional Certificate',
    issuer: 'Professional Certificate',
    file: '/certificates/full-stack-web-development.pdf',
    downloadName: 'Shanmukha-Aditya-Full-Stack-Certificate.pdf',
    summary: 'End-to-end MERN architecture, REST API security, and deployment workflows.',
    competencies: ['MERN Architecture', 'REST API Security', 'Deployment Workflows', 'CI/CD'],
  },
  {
    id: 'nptel-iot',
    title: 'NPTEL Internet of Things (IoT)',
    issuer: 'NPTEL',
    file: '/certificates/nptel-iot.pdf',
    downloadName: 'Shanmukha-Aditya-NPTEL-IoT-Certificate.pdf',
    summary: 'Embedded network protocols, sensor telemetry, and edge-to-cloud security architectures.',
    competencies: ['Embedded Protocols', 'Sensor Telemetry', 'Edge-to-Cloud Security', 'MQTT'],
  },
];

/** Filter toggle options shown at the top of the section. */
export const experienceFilters = [
  { id: 'all', label: 'All' },
  { id: 'work', label: 'Engineering & Internships' },
  { id: 'credentials', label: 'Certifications & Education' },
];
