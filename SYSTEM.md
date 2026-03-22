# Publishing System

## 🧠 The System

This file defines system how I work on `sreeman.xyz`, with the goal to make publishing consistent, simple, and sustainable.

Everything I publish is treated as a **deployment**. A deployment is any meaningful change that improves the site.

---

## 🔁 Deployment Types

### 1. Content Deployment
- new blog post
- new page
- update to existing content

### 2. Project Deployment
- new AI project
- updates to project details, links, or demos

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

👉 If it adds value → it’s deployable  

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

👉 Think: small commit, clear intent  

---

### 4. Validate
Before committing:

- is it readable?  
- is it correct?  
- does it render properly?  
- are links working?  

👉 Basic sanity check (no over-engineering)  

---

### 5. Commit
Use clear, intent-driven messages:

- `deploy: add post on RAG basics`  
- `deploy: add AI agent project`  
- `deploy: update homepage layout`  
- `deploy: fix broken links`  

👉 One commit = one logical change  

---

### 6. Push (Trigger Deploy)
Run:

    git add .
    git commit -m "deploy: <short description>"
    git push

👉 Push = deployment trigger  

---

### 7. Verify in Production
After deploy:

- page loads correctly  
- content is visible  
- no regressions  
- navigation works  

👉 If broken → fix fast, redeploy  

---

## 🧠 Rules

- ship small changes frequently  
- prefer clarity over completeness  
- don’t wait for “perfect”  
- treat content like code  