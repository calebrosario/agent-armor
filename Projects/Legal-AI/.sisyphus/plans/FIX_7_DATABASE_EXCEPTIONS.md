# Fix #7: Specific Database Exception Handling

## Summary

This plan addresses the skipped CRITICAL issue #7 from PR #4 review:
**Replace broad `except Exception` handlers with specific asyncpg exceptions** in 4 CLI commands.

---

## Problem Statement

### Current Implementation (All 4 locations use identical pattern):

```python
# Lines 126, 179, 243, 353 in main.py
state_manager = PostgresStateManager()
try:
    await state_manager.initialize()
except Exception as e:
    logger.error(f"CRITICAL: Database connection failed: {e}")
    logger.error("State tracking unavailable - progress will not be persisted")
    logger.error("Fix database connection and restart for resume functionality")
    print("\n")
    print("CRITICAL: Database connection failed")
    print("State tracking disabled - progress will be lost on restart")
    print("Fix database connection and restart for resume functionality")
    response = await asyncio.to_thread(input, "\nContinue anyway? [y/N]: ")
    if response.lower() != "y":
        sys.exit(1)
    print("Running in offline mode (state tracking disabled)")
    from src.core.state.memory import MemoryStateManager
    state_manager = MemoryStateManager()
```

### Issues with Current Approach

1. **Loss of diagnostic information** - `Exception` type is never logged
2. **No stack traces** - Impossible to debug from logs
3. **Generic error messages** - All database errors look the same
4. **No actionable guidance** - Users don't know if it's:
   - Database not running?
   - Database doesn't exist?
   - Wrong credentials?
   - Missing tables?
   - Network issues?
   - Permissions problem?

---

## Solution Design

### Approach 1: Create Reusable Helper Function (RECOMMENDED)

Create a helper function that handles database initialization with specific exception handling.

**Advantages:**
- DRY (Don't Repeat Yourself) principle
- Single source of truth for error handling
- Easy to test and modify
- Consistent behavior across all 4 commands

**Implementation:**

```python
import asyncio
import logging
import sys
import click
from pathlib import Path
import asyncpg

logger = logging.getLogger(__name__)

async def initialize_state_manager_with_fallback() -> "MemoryStateManager | PostgresStateManager":
    """
    Initialize PostgresStateManager with specific exception handling.

    Returns:
        - PostgresStateManager if successful
        - MemoryStateManager if connection fails (after user confirmation)
    """
    from src.core.state.postgres import PostgresStateManager
    from src.core.state.memory import MemoryStateManager

    state_manager = PostgresStateManager()

    # Connection errors (network, database not running)
    try:
        await state_manager.initialize()
        return state_manager
    except asyncpg.exceptions.PostgresConnectionError as e:
        await handle_connection_error(
            "Cannot connect to PostgreSQL server",
            state_manager,
            e
        )
    except asyncpg.exceptions.ConnectionDoesNotExistError as e:
        await handle_connection_error(
            "PostgreSQL connection dropped or closed",
            state_manager,
            e
        )
    except asyncpg.exceptions.InterfaceError as e:
        await handle_connection_error(
            "Network interface error connecting to PostgreSQL",
            state_manager,
            e
        )
    except asyncpg.exceptions.CannotConnectNowError as e:
        await handle_connection_error(
            "Database is in recovery mode or starting up",
            state_manager,
            e
        )
    except asyncpg.exceptions.InvalidCatalogNameError as e:
        await handle_catalog_error(state_manager, e)
    except asyncpg.exceptions.InsufficientPrivilegeError as e:
        await handle_permission_error(state_manager, e)
    except asyncpg.exceptions.UndefinedTableError as e:
        await handle_schema_error(state_manager, e)
    except Exception as e:
        await handle_unexpected_error(state_manager, e)

    # User confirmed offline mode
    from src.core.state.memory import MemoryStateManager
    return MemoryStateManager()


async def handle_connection_error(
    message: str,
    state_manager: "PostgresStateManager",
    error: Exception
) -> None:
    """Handle connection-related errors with detailed diagnostics."""
    logger.critical(
        f"{message}: {error}\n"
        f"Host: {state_manager.host}:{state_manager.port}\n"
        f"Database: {state_manager.database}\n"
        f"User: {state_manager.user}",
        exc_info=True
    )
    print("\n")
    print(f"CRITICAL: {message}")
    print(f"  Host: {state_manager.host}:{state_manager.port}")
    print(f"  Database: {state_manager.database}")
    print(f"  User: {state_manager.user}")
    print("\nTroubleshooting:")
    print("  1. Ensure PostgreSQL is running: pg_isready -h localhost")
    print("  2. Check connection: psql -h localhost -U postgres -d legaldata")
    print("  3. Verify firewall rules")
    print("  4. Check network connectivity")
    await prompt_offline_mode()


async def handle_catalog_error(
    state_manager: "PostgresStateManager",
    error: Exception
) -> None:
    """Handle database/schema errors with specific guidance."""
    logger.critical(
        f"Database does not exist: {state_manager.database}\n"
        f"Create it with: createdb {state_manager.database}",
        exc_info=True
    )
    print("\n")
    print("CRITICAL: Database does not exist")
    print(f"  Database: {state_manager.database}")
    print(f"\nCreate database:")
    print(f"  createdb {state_manager.database}")
    print(f"  Or use: psql -U {state_manager.user} -c 'CREATE DATABASE {state_manager.database}'")
    await prompt_offline_mode()


async def handle_permission_error(
    state_manager: "PostgresStateManager",
    error: Exception
) -> None:
    """Handle permission-related errors with specific guidance."""
    logger.critical(
        f"Permission denied for database: {error}\n"
        f"User: {state_manager.user}\n"
        f"Database: {state_manager.database}",
        exc_info=True
    )
    print("\n")
    print("CRITICAL: Permission denied")
    print(f"  User: {state_manager.user}")
    print(f"  Database: {state_manager.database}")
    print("\nGrant permissions:")
    print(f"  GRANT ALL PRIVILEGES ON DATABASE {state_manager.database} TO {state_manager.user}")
    print(f"  Or run as superuser: sudo -u postgres psql")
    sys.exit(1)  # Don't allow offline mode for permission errors


async def handle_schema_error(
    state_manager: "PostgresStateManager",
    error: Exception
) -> None:
    """Handle schema/table errors with migration guidance."""
    logger.critical(
        f"Schema/table does not exist: {error}\n"
        f"Database: {state_manager.database}",
        exc_info=True
    )
    print("\n")
    print("CRITICAL: Database schema not initialized")
    print(f"  Database: {state_manager.database}")
    print(f"  Error: {type(error).__name__}: {error}")
    print("\nRun migration:")
    print("  python -m src.cli migrate")
    sys.exit(1)  # Don't allow offline mode for schema errors


async def handle_unexpected_error(
    state_manager: "PostgresStateManager",
    error: Exception
) -> None:
    """Handle unexpected errors with full diagnostic context."""
    logger.critical(
        f"Unexpected error initializing state manager: {error}\n"
        f"Error type: {type(error).__name__}",
        exc_info=True
    )
    print("\n")
    print("CRITICAL: Unexpected database error")
    print(f"  Error type: {type(error).__name__}")
    print(f"  Error: {error}")
    await prompt_offline_mode()


async def prompt_offline_mode() -> None:
    """Prompt user for offline mode confirmation."""
    logger.warning("State tracking unavailable - progress will not be persisted")
    logger.warning("Fix database connection and restart for resume functionality")
    print("\n")
    print("State tracking disabled - progress will be lost on restart")
    print("Fix database connection and restart for resume functionality")
    response = await asyncio.to_thread(input, "\nContinue anyway? [y/N]: ")
    if response.lower() != "y":
        sys.exit(1)
    print("Running in offline mode (state tracking disabled)")
```

### Usage in CLI Commands

Replace all 4 exception handlers with:

```python
# Old pattern (18 lines repeated 4 times = 72 lines total):
state_manager = PostgresStateManager()
try:
    await state_manager.initialize()
except Exception as e:
    logger.error(f"CRITICAL: Database connection failed: {e}")
    # ... 15 more lines ...

# New pattern (1 line per command):
state_manager = await initialize_state_manager_with_fallback()
```

---

## Implementation Steps

### Step 1: Add asyncpg import
```python
# Add to line 4:
import asyncpg
```

### Step 2: Create helper functions
Add all helper functions after the imports section (after line 31):
- `initialize_state_manager_with_fallback()` (main function)
- `handle_connection_error()`
- `handle_catalog_error()`
- `handle_permission_error()`
- `handle_schema_error()`
- `handle_unexpected_error()`
- `prompt_offline_mode()`

### Step 3: Replace exception handlers in 4 CLI commands

**Location 1: OpenStates command (lines 124-140)**
```python
# Replace:
# 17 lines of code

# With:
state_manager = await initialize_state_manager_with_fallback()
```

**Location 2: OneCLE command (lines 175-193)**
```python
# Replace:
# 19 lines of code

# With:
state_manager = await initialize_state_manager_with_fallback()
```

**Location 3: SEC EDGAR command (lines 239-257)**
```python
# Replace:
# 19 lines of code

# With:
state_manager = await initialize_state_manager_with_fallback()
```

**Location 4: Federal Register command (lines 349-367)**
```python
# Replace:
# 19 lines of code

# With:
state_manager = await initialize_state_manager_with_fallback()
```

---

## Testing Plan

### Test 1: Database Not Running
```bash
# Stop PostgreSQL
brew services stop postgresql

# Try to run crawler
python -m src.cli openstates --api-key KEY --jurisdictions ca --max-bills-per-jurisdiction 1

# Expected output:
# CRITICAL: Cannot connect to PostgreSQL server
# Details about host, port, database, user
# Troubleshooting steps
# Prompt for offline mode
```

### Test 2: Database Doesn't Exist
```bash
# Delete database
psql -U postgres -c "DROP DATABASE legaldata;"

# Try to run crawler
python -m src.cli openstates --api-key KEY --jurisdictions ca --max-bills-per-jurisdiction 1

# Expected output:
# CRITICAL: Database does not exist
# Create database command
# Exit with error code 1
```

### Test 3: Permission Error
```bash
# Create database without grants
psql -U postgres -c "CREATE DATABASE legaldata_test;"
psql -U postgres -c "REVOKE ALL ON DATABASE legaldata_test FROM test_user;"

# Try to run with test_user
# Expected output:
# CRITICAL: Permission denied
# Grant permissions command
# Exit with error code 1
```

### Test 4: Schema Error
```bash
# Drop tables
psql -U postgres -d legaldata -c "DROP TABLE IF EXISTS crawler_state;"

# Try to run crawler
python -m src.cli openstates --api-key KEY --jurisdictions ca --max-bills-per-jurisdiction 1

# Expected output:
# CRITICAL: Database schema not initialized
# Run migration command
# Exit with error code 1
```

### Test 5: Normal Operation
```bash
# Ensure database is running and configured
python -m src.cli openstates --api-key KEY --jurisdictions ca --max-bills-per-jurisdiction 1

# Expected output:
# No database errors
# Crawler runs successfully
```

---

## Benefits

### 1. Improved Debugging
- ✅ **Stack traces in logs** - Full exception context for debugging
- ✅ **Error type information** - Know exactly which exception occurred
- ✅ **Connection details** - Host, port, database, user logged

### 2. Better User Experience
- ✅ **Specific error messages** - Users know what's wrong
- ✅ **Actionable troubleshooting** - Step-by-step guidance for each error type
- ✅ **Appropriate fallback** - Offline mode only for connection issues, not permission/schema errors

### 3. Code Quality
- ✅ **DRY principle** - 72 lines of repeated code → 1 line per command
- ✅ **Easier maintenance** - Update error handling in one place
- ✅ **Testability** - Helper functions can be unit tested
- ✅ **Extensibility** - Easy to add new exception types

### 4. Security
- ✅ **No false offline mode** - Permission/schema errors prevent offline mode
- ✅ **Clear error messages** - Don't expose sensitive information
- ✅ **Appropriate exits** - Fail fast for unrecoverable errors

---

## Files to Modify

**File:** `scraper/src/cli/main.py`

**Changes:**
1. Add `import asyncpg` (line 4)
2. Add helper functions (after line 31, ~150 lines)
3. Replace 4 exception handlers (lines 124-140, 175-193, 239-257, 349-367)

**Net change:** -70 lines (72 removed, 2 added per command × 4 = 8 + 150 new helper code)

---

## Alternative Approaches

### Approach 2: Inline Exception Handlers (NOT RECOMMENDED)

Replace each `except Exception` with multiple specific except blocks inline.

**Disadvantages:**
- 72 lines of repeated code (same code 4 times)
- Harder to maintain
- Violates DRY principle
- Testing requires 4 separate test cases

### Approach 3: Exception Mapping (NOT RECOMMENDED)

Use a dictionary mapping exception types to handler functions.

**Disadvantages:**
- Complex to implement
- Harder to read
- Less Pythonic
- No better than helper function approach

---

## Estimated Effort

- **Implementation**: 2-3 hours
- **Testing**: 1-2 hours
- **Total**: 3-5 hours

---

## Risks and Mitigation

### Risk 1: Missing Exception Types
**Risk:** asyncpg may raise exception types not handled
**Mitigation:** Keep generic `except Exception` as final catch-all

### Risk 2: Breaking User Workflow
**Risk:** Users who rely on offline mode for all errors
**Mitigation:** Only allow offline mode for connection errors (not permission/schema errors)
**Justification:** Permission and schema errors should be fixed before continuing

### Risk 3: PostgresStateManager Interface Changes
**Risk:** PostgresStateManager may not have `host`, `port`, `database`, `user` attributes
**Mitigation:** Verify attributes exist before using
**Fallback:** Use generic error message if attributes not available

---

## Success Criteria

- [ ] All 4 CLI commands use helper function
- [ ] Specific asyncpg exceptions caught and logged
- [ ] Stack traces included in logs (exc_info=True)
- [ ] Connection errors allow offline mode
- [ ] Permission/schema errors exit with code 1
- [ ] Error messages include actionable troubleshooting
- [ ] No regression in normal operation
- [ ] All 5 test scenarios pass

---

## Commit Message

```
fix: Replace broad database exception handlers with specific asyncpg exceptions

CRITICAL Fix #7 from PR review:
- Replace broad `except Exception` with specific asyncpg exceptions
- Add helper functions for consistent error handling across 4 CLI commands
- Include stack traces (exc_info=True) for debugging
- Provide actionable troubleshooting for each error type

Specific exceptions handled:
- PostgresConnectionError - Cannot connect to server
- ConnectionDoesNotExistError - Connection dropped
- InterfaceError - Network interface errors
- CannotConnectNowError - Database in recovery mode
- InvalidCatalogNameError - Database doesn't exist
- InsufficientPrivilegeError - Permission denied
- UndefinedTableError - Schema not initialized
- Exception - Generic catch for unexpected errors

User experience improvements:
- Connection errors: Show host/port/database/user details with troubleshooting
- Catalog errors: Show database creation command
- Permission errors: Show GRANT command, exit with code 1
- Schema errors: Show migration command, exit with code 1
- Offline mode: Only available for connection errors

Code quality improvements:
- DRY principle: 72 lines of repeated code → 1 line per command
- Single source of truth for error handling
- Helper functions can be unit tested
- Easier to maintain and extend

Benefits:
- Better debugging with full error context and stack traces
- Specific error messages help users identify and fix issues
- Prevents offline mode for unrecoverable errors (permissions, schema)
- Consistent behavior across all CLI commands

Resolves: Fix #7 (specific database exception handling)
```

---

## Related Issues

- PR #4: https://github.com/calebrosario/legal-ai/pull/4
- PR review: "Catch specific database exceptions with full error details"
- Context: https://github.com/calebrosario/legal-ai/commit/a1d6e039

---

## Notes

- This fix was skipped in PR #4 due to complexity
- Current broad exception handling works but provides poor UX
- Implementation follows asyncpg best practices
- Helper function approach provides best maintainability
- Consider extracting helpers to separate module if they grow
