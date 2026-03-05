# Data Models

All models are defined in `{BACKEND_DIR}/src/models/`. The backend uses Mongoose with MongoDB.

---

## Documentation Format

Use this format for each model:

```
## ModelName

**File:** `src/models/modelFile.js`
**Collection:** `collectionname`

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `fieldName` | Type | Yes/No | value | Description |

### Instance methods
### Static methods
### Pre-save hooks
### Indexes
### Relationships
```

---

## User

**File:** `src/models/userModel.js`
**Collection:** `users`

This is a universal model -- every project needs a User model. Customize the fields for your application.

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `firstName` | String | Yes | -- | Trimmed |
| `lastName` | String | Yes | -- | Trimmed |
| `name` | String | No | -- | Computed as `${firstName} ${lastName}` on creation |
| `email` | String | Yes | -- | Unique, lowercase, validated with `validator.isEmail` |
| `password` | String | Yes | -- | Bcrypt hashed (salt rounds: 12); `select: false` (excluded from queries by default) |
| `role` | String | No | `"{DEFAULT_ROLE}"` | Enum: {USER_ROLES} |
| `language` | String | No | `"en"` | Enum: {LANGUAGES} -- used for localization and email language |
| `telNumber` | String | No | -- | Phone number |
| `passwordChangedAt` | Date | No | -- | Set whenever password changes (used by `changedPasswordAfter`) |
| `passwordResetTokenHash` | String | No | -- | SHA-256 hash of the reset token (never stored in plain text) |
| `passwordResetExpiresAt` | Date | No | -- | Expiry of the reset token |
| `createdAt` | Date | Auto | -- | Mongoose timestamps |
| `updatedAt` | Date | Auto | -- | Mongoose timestamps |

<!-- Add project-specific user fields here (profile fields, relations, validation flags, etc.) -->

### Instance methods

| Method | Signature | Description |
|---|---|---|
| `correctPassword` | `async (candidatePassword, userPassword) -> boolean` | Uses `bcrypt.compare` to verify a plain password against the stored hash |
| `changedPasswordAfter` | `(jwtIat) -> boolean` | Returns `true` if the user changed their password after the token was issued (by comparing `passwordChangedAt` timestamp with the JWT `iat` claim) |
| `createPasswordResetToken` | `() -> string` | Generates 32 random bytes, stores their SHA-256 hash in `passwordResetTokenHash`, sets `passwordResetExpiresAt`, returns the **raw** token for inclusion in the email |

### Pre-save hook

Before saving, if `password` is modified: hashes it with `bcrypt.hash(password, 12)` and sets `passwordChangedAt = Date.now() - 1000` (if not a new document).

### toJSON transformation

The `toJSON` transform adds `id` (from `_id`), deletes `_id`, `password`, `passwordResetTokenHash`, and `passwordResetExpiresAt` from serialized output.

### Relationships

<!-- Define user relationships for your project -->

- Example: `groups` -> many-to-many with `Group`
- Example: `organization` -> belongs to `Organization`

---

## Document your models here

<!-- Copy the format above for each model in your application. Below are common patterns: -->

<!--
## ResourceName

**File:** `src/models/resourceModel.js`
**Collection:** `resources`

### Fields

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `name` | String | Yes | -- | Trimmed |
| `description` | String | No | -- | |
| `createdBy` | ObjectId | Yes | -- | References: `User` |
| `status` | String | No | `"active"` | Enum: `"active"`, `"inactive"`, `"archived"` |
| `createdAt` | Date | Auto | -- | Mongoose timestamps |
| `updatedAt` | Date | Auto | -- | Mongoose timestamps |

### Indexes

| Fields | Purpose |
|---|---|
| `{ createdBy: 1, status: 1 }` | Fast lookup by creator and status |
| `{ createdAt: -1 }` | Recent-first ordering |

### Relationships

- `createdBy` -> `User`
-->

<!--
## NestedResource (sub-documents)

If your app has deeply nested models (e.g., Course -> Module -> Lesson -> Chapter -> MediaFile),
document each level with its fields, virtuals (virtual populate), and indexes.

Example virtual populate:
**Virtual:** `children` -- virtual populate from `ChildModel` where `parentId` matches, sorted by `order`
-->

<!--
## UserProgress / Analytics

If your app tracks user progress or analytics:

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `userId` | ObjectId | Yes | -- | References: `User` |
| `resourceId` | ObjectId | Yes | -- | References: `Resource` |
| `completedItems` | ObjectId[] | No | `[]` | References: completed sub-items |
| `overallProgress` | Number | No | `0` | Percentage (0-100) |
| `lastAccessedAt` | Date | No | -- | |

**Indexes:** `{ userId: 1, resourceId: 1 }` (unique)
-->
