# backend/CLAUDE.md

Backend coding conventions for ShopFlow's Express.js API.

## Module System
ESM only — `"type": "module"` is set in package.json. Every import must use `.js` extension.

```js
// Correct
import logger from "../utils/logger.js";
import { protect } from "../middlewares/auth.js";

// Wrong — breaks ESM resolution
const logger = require("../utils/logger");
```

## Controller Pattern
Every async handler must follow this exact structure:

```js
export const handlerName = async (req, res) => {
  try {
    // 1. Validate input
    const { field } = req.body;
    if (!field) return res.status(400).json({ success: false, error: "Missing required field: field" });

    // 2. Business logic
    const result = await Model.findById(req.params.id).lean();
    if (!result) return res.status(404).json({ success: false, error: "Resource not found" });

    // 3. Success response
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("handlerName error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
```

## Route Protection
- Public routes: no middleware
- Authenticated routes: `protect`
- Role-restricted: `protect, restrictTo("admin")` or `protect, restrictTo("customer")`

Always import from `../middlewares/auth.js`.

## Query Conventions
- `.lean()` on all read-only queries (returns plain objects, 5–10× faster)
- `.select("-password -__v")` to exclude sensitive/unused fields
- `escapeRegex()` from `utils/sanitize.js` before ANY `$regex` query
- Validate ObjectId format before `findById()`: `/^[0-9a-fA-F]{24}$/.test(id)`

## Response Format (mandatory)
```js
res.status(200).json({ success: true, data: result });
res.status(201).json({ success: true, data: created });
res.status(400).json({ success: false, error: "Missing required field: name" });
res.status(401).json({ success: false, error: "Not authenticated" });
res.status(403).json({ success: false, error: "Not authorized" });
res.status(404).json({ success: false, error: "Resource not found" });
res.status(500).json({ success: false, error: "Something went wrong" });
```

## File Structure
```
backend/
  server.js               # Entry point
  src/
    config/db.js          # Mongoose connection with retry
    models/               # Mongoose schemas (PascalCase files)
    controllers/          # Business logic (camelCase files)
    routes/               # Express routers (camelCase files)
    middlewares/
      auth.js             # protect + restrictTo — PRIMARY auth file
    utils/
      logger.js           # Winston logger — use everywhere
      sanitize.js         # escapeRegex, validateFileId, assertWithin
      cache.js            # In-memory TTL cache
```
