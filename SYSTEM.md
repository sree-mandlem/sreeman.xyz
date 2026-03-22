# Publishing System

## 🧠 The System

This file defines how I work on `sreeman.xyz`, with the goal to make publishing consistent, simple, and sustainable.

Everything I publish is treated as a **deployment**. A deployment is any meaningful change that improves the site.

---

## 🔁 Deployment Types

### 1. Content Deployment
- new blog post
- new project or experiment entry
- update to existing content

### 2. Feature Deployment
- new functionality (e.g., read time, search, tag filtering)
- new page routes or detail pages

### 3. Design Deployment
- homepage changes
- layout improvements
- styling updates

### 4. Maintenance Deployment
- fixing typos
- broken links
- cleanup or refactoring

---
## ⚡ Deployment Playbook

Treat every meaningful change as a deployment.

---

### 1. Identify the Change
What are you shipping?

- learning → blog  
- feature/work → project  
- quick test → experiment  
- fix/improvement → site update  

👉 If it adds value → it's deployable  

---

### 2. Define Scope
Keep it small and focused.

- single idea  
- single improvement  
- single update  

👉 Avoid bundling unrelated changes  

---

### 3. Implement
Make the change locally.

- add/update content  
- modify structure or UI  
- add new features  

👉 Think: small commit, clear intent  

---

### 4. Validate
Before committing:

- `npm run build` → does it build?
- `npx playwright test` → do all tests pass?
- is it readable?  
- is it correct?  
- does it render properly?  
- are links working?  

👉 Always run build + tests before deploying  

---

### 5. Commit
Use clear, intent-driven messages:

- `deploy: add post on RAG basics`  
- `deploy: add AI agent project`  
- `deploy: update homepage layout`  
- `fix: broken links on blog index`  

👉 One commit = one logical change  
👉 Use `Co-authored-by: Copilot` trailer when AI-assisted  

---

### 6. Deploy & Push
Run:

    npm run build && npm run deploy
    git push origin main

👉 `npm run deploy` does NOT rebuild — always build first  
👉 Push to GitHub after deploying so the repo stays in sync  

---

### 7. Verify in Production
After deploy:

- page loads correctly at https://sreeman.xyz
- content is visible  
- no regressions  
- navigation works  
- new pages are accessible  

👉 If broken → fix fast, redeploy  

---

## 🧠 Rules

- ship small changes frequently  
- prefer clarity over completeness  
- don't wait for "perfect"  
- treat content like code  
- always run tests before deploying  
- build before deploy (they're separate commands)
