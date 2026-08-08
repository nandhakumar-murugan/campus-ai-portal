const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const BUILTIN_SKILLS = [
  {
    name: "architecture-analyst",
    description: "Deep codebase structure analysis, dependency graphing, and design pattern auditing.",
    prompt: "You are an elite Software Architecture Analyst. Analyze the codebase structure, identify monolithic vs modular patterns, and output a clean architectural breakdown with Mermaid diagrams."
  },
  {
    name: "security-auditor",
    description: "OWASP Top 10 vulnerability scanner, secret detection, and memory safety analysis.",
    prompt: "You are a Senior Cybersecurity Auditor. Scan the code for SQL injection, XSS, hardcoded secrets, unsafe memory allocation, and unvalidated input endpoints."
  },
  {
    name: "fullstack-builder",
    description: "End-to-end full stack application creation (HTML/CSS/JS/Express/Python).",
    prompt: "You are a Lead Full Stack Developer. Build production-ready frontend UI and backend API endpoints with complete error handling."
  },
  {
    name: "refactor-engineer",
    description: "Automated code refactoring, dead code elimination, and performance optimization.",
    prompt: "You are a Principal Performance Engineer. Refactor the code for maximum execution speed, clean async/await patterns, and zero memory leaks."
  },
  {
    name: "test-suite-generator",
    description: "Automated unit test & integration test suite generator (Jest/PyTest/Mocha).",
    prompt: "You are a Quality Assurance Architect. Write 100% code coverage unit test suites with mocks, edge cases, and boundary condition assertions."
  }
];

function getSkills() {
  return BUILTIN_SKILLS;
}

function getSkillPrompt(skillName) {
  const s = BUILTIN_SKILLS.find(x => x.name === skillName);
  return s ? s.prompt : null;
}

module.exports = { getSkills, getSkillPrompt };
