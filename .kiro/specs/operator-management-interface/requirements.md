# Requirements Document

## Introduction

This document specifies the requirements for an operator management interface in the admin dashboard of a Django + React ID card printing management system. The interface enables administrators to perform comprehensive CRUD operations on operator accounts, including creation, viewing, activation/deactivation, password reset, and deletion with business rule enforcement.

## Glossary

- **Admin**: A user with the ADMIN role who has full access to operator management functions
- **Operator**: A user with the OPERATOR role who processes ID card printing orders
- **Operator_Management_Interface**: The React-based UI component system for managing operators
- **Backend_API**: The Django REST API endpoints that handle operator data operations
- **Status**: The activation state of an operator account (Active or Inactive)
- **Temporary_Password**: A randomly generated 12-character password containing alphanumeric and special characters
- **Assigned_Order**: An ID card printing order that has been assigned to a specific operator
- **Deactivation**: The process of setting an operator's is_active flag to false, preventing login while preserving data
- **Audit_Trail**: Historical record of who deactivated an operator and when

## Requirements

### Requirement 1: Operator List Display

**User Story:** As an admin, I want to view all operators in a searchable and filterable table, so that I can quickly find and manage operator accounts.

#### Acceptance Criteria

1. WHEN the admin navigates to /admin/operators, THE Operator_Management_Interface SHALL display a table containing all operators
2. THE Operator_Table SHALL display the following columns: Username, Email, Status, Date Joined, Last Password Reset
3. THE Status_Badge SHALL display "Active" in green WHEN is_active is true
4. THE Status_Badge SHALL display "Inactive" in gray WHEN is_active is false
5. THE Operator_Table SHALL display action buttons for each operator: View, Deactivate/Activate, Reset Password, Delete
6. WHEN the operator list contains more than 10 operators, THE Pagination_Controls SHALL display page navigation
7. THE Operator_Table SHALL sort operators by date_joined in descending order by default

### Requirement 2: Operator Search

**User Story:** As an admin, I want to search operators by username or email, so that I can quickly locate specific operator accounts.

#### Acceptance Criteria

1. THE Operator_Search_Bar SHALL accept text input for search queries
2. WHEN the admin types in the search bar, THE Operator_Search_Bar SHALL debounce input by 300 milliseconds
3. WHEN a search query is submitted, THE Operator_Management_Interface SHALL filter operators WHERE username contains the query OR email contains the query
4. THE Operator_Table SHALL display only operators matching the search criteria
5. WHEN the search query is empty, THE Operator_Table SHALL display all operators

### Requirement 3: Operator Status Filtering

**User Story:** As an admin, I want to filter operators by their active status, so that I can focus on active or inactive accounts.

#### Acceptance Criteria

1. THE Status_Filter SHALL provide three options: "All", "Active", "Inactive"
2. WHEN "All" is selected, THE Operator_Table SHALL display all operators regardless of status
3. WHEN "Active" is selected, THE Operator_Table SHALL display only operators WHERE is_active is true
4. WHEN "Inactive" is selected, THE Operator_Table SHALL display only operators WHERE is_active is false
5. THE Status_Filter SHALL default to "All" on initial page load

### Requirement 4: Create Operator

**User Story:** As an admin, I want to create new operator accounts with auto-generated passwords, so that I can onboard new operators securely.

#### Acceptance Criteria

1. WHEN the admin clicks the "Create Operator" button, THE Create_Operator_Modal SHALL open
2. THE Create_Operator_Modal SHALL display input fields for username and email
3. WHEN the admin submits the form with valid data, THE Backend_API SHALL create a new operator account
4. THE Backend_API SHALL generate a Temporary_Password containing 12 characters from the set [a-z, A-Z, 2-9, !@#$%]
5. WHEN operator creation succeeds, THE Create_Operator_Modal SHALL display the Temporary_Password to the admin
6. THE Create_Operator_Modal SHALL provide a copy-to-clipboard button for the Temporary_Password
7. WHEN the admin closes the modal after creation, THE Operator_Table SHALL refresh to display the new operator
8. IF the username already exists, THEN THE Create_Operator_Modal SHALL display error message "Username already taken"
9. IF the email already exists, THEN THE Create_Operator_Modal SHALL display error message "Email already in use"

### Requirement 5: Deactivate Operator

**User Story:** As an admin, I want to deactivate operator accounts, so that I can prevent login while preserving historical data.

#### Acceptance Criteria

1. WHEN the admin clicks "Deactivate" for an active operator, THE Deactivate_Confirmation_Modal SHALL open
2. THE Deactivate_Confirmation_Modal SHALL display the operator's username and email
3. THE Deactivate_Confirmation_Modal SHALL explain that deactivation prevents login but preserves data
4. WHEN the admin confirms deactivation, THE Backend_API SHALL set is_active to false
5. THE Backend_API SHALL set deactivated_at to the current timestamp
6. THE Backend_API SHALL set deactivated_by to the admin's user ID
7. THE Backend_API SHALL set the User.is_active field to false
8. WHEN deactivation succeeds, THE Operator_Table SHALL refresh and display the operator with "Inactive" status
9. THE Operator_Management_Interface SHALL display a success message "Operator deactivated successfully"

### Requirement 6: Activate Operator

**User Story:** As an admin, I want to reactivate deactivated operator accounts, so that operators can resume work.

#### Acceptance Criteria

1. WHEN the admin clicks "Activate" for an inactive operator, THE Activate_Confirmation_Modal SHALL open
2. THE Activate_Confirmation_Modal SHALL display the operator's username and deactivation information
3. WHEN the admin confirms activation, THE Backend_API SHALL set is_active to true
4. THE Backend_API SHALL set deactivated_at to null
5. THE Backend_API SHALL set deactivated_by to null
6. THE Backend_API SHALL set the User.is_active field to true
7. WHEN activation succeeds, THE Operator_Table SHALL refresh and display the operator with "Active" status
8. THE Operator_Management_Interface SHALL display a success message "Operator activated successfully"

### Requirement 7: Reset Operator Password

**User Story:** As an admin, I want to reset operator passwords, so that operators can regain access to their accounts.

#### Acceptance Criteria

1. WHEN the admin clicks "Reset Password" for an operator, THE Reset_Password_Modal SHALL open
2. THE Reset_Password_Modal SHALL display the operator's username and email
3. THE Reset_Password_Modal SHALL warn that the current password will be invalidated
4. WHEN the admin confirms the reset, THE Backend_API SHALL generate a new Temporary_Password
5. THE Temporary_Password SHALL contain 12 characters from the set [a-z, A-Z, 2-9, !@#$%]
6. THE Backend_API SHALL update the operator's password hash
7. THE Backend_API SHALL set last_password_reset to the current timestamp
8. WHEN password reset succeeds, THE Reset_Password_Modal SHALL display the new Temporary_Password
9. THE Reset_Password_Modal SHALL provide a copy-to-clipboard button for the Temporary_Password
10. THE Operator_Table SHALL refresh to display the updated last_password_reset timestamp

### Requirement 8: Delete Operator with Business Rule Enforcement

**User Story:** As an admin, I want to delete operator accounts that have no assigned orders, so that I can remove accounts that are no longer needed.

#### Acceptance Criteria

1. WHEN the admin clicks "Delete" for an operator, THE Delete_Confirmation_Modal SHALL open
2. THE Delete_Confirmation_Modal SHALL display the operator's username and email
3. THE Delete_Confirmation_Modal SHALL warn that deletion is permanent and irreversible
4. WHEN the admin confirms deletion, THE Backend_API SHALL check if the operator has any Assigned_Orders
5. IF the operator has one or more Assigned_Orders, THEN THE Backend_API SHALL return error "Cannot delete — operator has N assigned order(s). Deactivate instead."
6. IF the operator has zero Assigned_Orders, THEN THE Backend_API SHALL delete the operator's User record
7. WHEN deletion succeeds, THE Operator_Table SHALL refresh and remove the deleted operator
8. THE Operator_Management_Interface SHALL display a success message "Operator deleted successfully"
9. IF deletion fails due to assigned orders, THEN THE Delete_Confirmation_Modal SHALL display the error message and suggest deactivation

### Requirement 9: Operator Detail View (Optional)

**User Story:** As an admin, I want to view detailed information about an operator, so that I can review their account history and audit trail.

#### Acceptance Criteria

1. WHEN the admin clicks "View" for an operator, THE Operator_Management_Interface SHALL navigate to /admin/operators/:id
2. THE Operator_Detail_Page SHALL display: username, email, status, date joined, last password reset
3. WHERE the operator is inactive, THE Operator_Detail_Page SHALL display the Audit_Trail including deactivated_at and deactivated_by
4. THE Operator_Detail_Page SHALL provide action buttons: Activate/Deactivate, Reset Password, Delete, Back to List
5. WHEN the admin clicks an action button, THE Operator_Management_Interface SHALL open the corresponding modal

### Requirement 10: Access Control

**User Story:** As a system administrator, I want to restrict operator management to admin users only, so that unauthorized users cannot modify operator accounts.

#### Acceptance Criteria

1. WHEN a non-admin user attempts to access /admin/operators, THE Operator_Management_Interface SHALL redirect to the dashboard
2. WHEN a non-admin user attempts to call operator management API endpoints, THE Backend_API SHALL return HTTP 403 with error "Admin access required"
3. THE Backend_API SHALL verify the user's role is ADMIN before processing any operator management request
4. IF the user is not authenticated, THEN THE Backend_API SHALL return HTTP 401 with error "Session expired. Please log in again."

### Requirement 11: Form Validation

**User Story:** As an admin, I want to receive clear validation feedback when creating or updating operators, so that I can correct errors before submission.

#### Acceptance Criteria

1. WHEN the admin submits the Create_Operator_Modal with an empty username, THE form SHALL display error "Username is required"
2. WHEN the admin submits the Create_Operator_Modal with an empty email, THE form SHALL display error "Email is required"
3. WHEN the admin enters an invalid email format, THE form SHALL display error "Invalid email format"
4. THE Create_Operator_Modal SHALL disable the submit button WHILE the form contains validation errors
5. THE Create_Operator_Modal SHALL display inline validation errors below each input field

### Requirement 12: Responsive Design and Accessibility

**User Story:** As an admin using various devices, I want the operator management interface to be responsive and accessible, so that I can manage operators from any device.

#### Acceptance Criteria

1. THE Operator_Management_Interface SHALL display correctly on screen widths from 320px to 2560px
2. WHEN viewed on mobile devices (width < 768px), THE Operator_Table SHALL stack columns vertically or use horizontal scrolling
3. THE Operator_Management_Interface SHALL support keyboard navigation for all interactive elements
4. THE Operator_Management_Interface SHALL provide ARIA labels for all buttons and form inputs
5. THE Status_Badge SHALL use both color and text to convey status (not color alone)
6. THE Operator_Management_Interface SHALL maintain a color contrast ratio of at least 4.5:1 for text
7. WHEN a modal is open, THE Operator_Management_Interface SHALL trap focus within the modal
8. WHEN a modal is closed, THE Operator_Management_Interface SHALL return focus to the triggering element

### Requirement 13: Error Handling and User Feedback

**User Story:** As an admin, I want to receive clear feedback on all operations, so that I understand whether my actions succeeded or failed.

#### Acceptance Criteria

1. WHEN any operator management operation succeeds, THE Operator_Management_Interface SHALL display a success toast notification
2. WHEN any operator management operation fails, THE Operator_Management_Interface SHALL display an error toast notification with the error message
3. THE success toast SHALL auto-dismiss after 3 seconds
4. THE error toast SHALL remain visible until the admin dismisses it
5. WHEN the Backend_API is unreachable, THE Operator_Management_Interface SHALL display error "Failed to connect. Check your network connection."
6. WHEN a network request times out, THE Operator_Management_Interface SHALL display error "Request timed out. Please try again."
7. THE Operator_Table SHALL display a loading spinner WHILE fetching operator data
8. THE Operator_Table SHALL display "No operators found" WHEN the operator list is empty

### Requirement 14: Data Refresh and Synchronization

**User Story:** As an admin, I want the operator list to automatically refresh after operations, so that I always see the current state of operator accounts.

#### Acceptance Criteria

1. WHEN an operator is created, THE Operator_Table SHALL refetch the operator list from the Backend_API
2. WHEN an operator is updated, THE Operator_Table SHALL refetch the operator list from the Backend_API
3. WHEN an operator is deleted, THE Operator_Table SHALL refetch the operator list from the Backend_API
4. WHEN the admin manually clicks a "Refresh" button, THE Operator_Table SHALL refetch the operator list
5. THE Operator_Management_Interface SHALL preserve the current page, search query, and filter state after refresh
