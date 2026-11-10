// Personal details used across the site.
// TODO: replace the placeholder email / GitHub / LinkedIn values with your own.
export const profile = {
  name: 'Shanmukha Aditya',
  brand: 'Portfolio',
  roles: ['Web Developer', 'Tech Explorer', 'UI/UX Enthusiast'],
  intro:
    'Passionate about crafting beautiful, performant web experiences. I turn ideas into elegant code and bring creative visions to life.',
  bio: 'Full-stack developer building fast web apps with React, Node.js, and MongoDB. I care about clean APIs, usable interfaces, and reliable deployments. I work in small, iterative steps and refine through feedback.',
  focusAreas: ['Web Development', 'UI/UX Design', 'Cybersecurity', 'Automation'],
  portrait: '/portrait.png',
  // Drop your PDF at client/public/resume.pdf (View opens it in a new tab, Download saves it).
  resume: '/resume.pdf',
  resumeFileName: 'Shanmukha-Aditya-Resume.pdf',
  signature: '/signature.png',
  background: '/bg-flowers.png',
  email: 'madalaadithya1056@gmail.com',
  github: 'https://github.com/ShanmukhaAditya1056',
  linkedin: 'https://www.linkedin.com/in/shanmukhaaditya-madala/'
};

export const stats = [
  { value: '12', label: 'Technologies' },
  { value: '15+', label: 'APIs Shipped' },
  { value: '3+', label: 'Years Coding' },
  { value: '5+', label: 'Projects Built' },
];

export const skillGroups = [
  {
    title: 'Frontend',
    skills: ['React.js', 'JavaScript (ES6+)', 'HTML5', 'CSS3', 'Tailwind CSS', 'Material UI', 'Bootstrap'],
  },
  {
    title: 'Backend & APIs',
    skills: [
      'Node.js',
      'Express.js',
      'MongoDB',
      'SQL (Oracle Certified)',
      'RESTful APIs',
      'JWT & RBAC Auth',
      'Axios Interceptors',
    ],
  },
  {
    title: 'Cybersecurity & Tools',
    skills: [
      'Linux (Kali/Ubuntu)',
      'Wireshark',
      'Network Traffic Analysis',
      'Git/GitHub',
      'Postman',
    ],
  },
];

export const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'contact', label: 'Contact' },
];
