<div align="center">

# QueueBits

### Institutional ID Production Management

A centralized platform for Klik-A-Snap to manage subject records, photo processing, ID layouts, approvals, and production.

**Project stage · Functional prototype undergoing integration and validation**

**Estimated feature completion · 75%**

</div>

---

## Project Overview

QueueBits connects the people involved in institutional ID production through four dedicated workspaces.

The application supports the production cycle from subject-list submission and QR preparation to photo matching, proofing, institution approval, printing, and completion.

A **subject** is an ID recipient, including a student, employee, member, or other registered individual. Flexible spreadsheet fields allow institutions to provide information suited to their requirements.

## Current Project Status

| Area | Current position |
| --- | --- |
| Core application | Role-based workspaces and the main production workflow are implemented |
| Operator workflow | Layout building, photo uploads, review tools, production actions, and exports are available |
| Client participation | Subject-list submission, proofing, revision requests, and batch approval are available |
| Interface | Shared purple theme, responsive navigation, and Operator list/grid views are implemented |
| Integration | Spreadsheet compatibility, Coordinator permissions, and selected dashboard metrics require follow-up |
| Validation | Full production acceptance testing and operational reliability checks remain pending |

### Completion Estimate

**The project is approximately 75% complete at the feature level.**

This estimate reflects the implemented core workflows and the remaining integration, data-validation, reporting, and reliability work identified during the code review. Formal acceptance criteria are still needed to establish a measured completion percentage.

---

## Core Functionalities by Role

### Admin — Klik-A-Snap Head

The Admin oversees accounts, client institutions, order assignments, and production activity.

**Account and institution management**

- Create and manage Operator accounts.
- Register and manage client institutions.
- Maintain institution contract details and order quotas.
- Manage institution suspension and deactivation.
- Track cleanup progress and retry failed cleanup operations.

**Order oversight**

- View orders across institutions.
- Assign or reassign Operators.
- Filter and inspect order activity.
- Perform administrative status overrides.
- Review recorded override details in the audit trail.

**Monitoring and reporting**

- Review order-volume and production summaries.
- Monitor average order turnaround and manual review rates.
- Inspect recorded pipeline attempts and face-detection confidence.
- Review processing logs, errors, and administrative actions.

**Contract-end cleanup**

Eligible institution deactivation disables associated accounts and initiates deletion of related orders, subject records, layouts, and assets. The workflow requires a reached contract end date, completed or cancelled orders, a reason, and deletion confirmation.

### Operator — Klik-A-Snap Staff

The Operator handles the technical production work for assigned orders.

**Order Dashboard**

- View assigned orders, deadlines, subject counts, and processing progress.
- Switch between list and grid views.
- Search and sort assigned orders.
- Open the next workflow action directly for a selected order.

Each order displays one primary action.

| Order stage | Dashboard action |
| --- | --- |
| Awaiting layout | Set Up Layout |
| Awaiting photos | Upload Photos |
| Processing | View Pipeline |
| Needs review | Review Photos |
| Proofing | View Proofs |
| Approved | Send to Print |
| Printing | Mark Completed |
| Completed or cancelled | View Order |

During layout setup and photo-upload preparation, a **⋮ menu** provides **Generate test photos**. This utility produces downloadable test images with subject QR codes overlaid.

**ID Layout Builder**

- Configure front and back ID designs.
- Upload background images.
- Add and position portraits, text, QR codes, and optional barcodes.
- Resize and reposition elements.
- Adjust text size, color, and visibility.
- Use fields supplied by the institution’s spreadsheet.
- Preview layouts using dummy subject data.
- Publish configured layouts.

**Batch upload and processing**

- Select an assigned order and upload subject photos.
- Open the upload step directly from the dashboard.
- Review upload results and batch progress.
- Switch the uploaded-photo collection between list and grid views.
- Start photo processing after a front layout has been saved.
- Monitor processing updates through the pipeline workspace.

**Manual review and proofing**

- Inspect photos requiring intervention.
- Link photos to subject records.
- Replace photos, adjust crops, and retry processing.
- Review generated IDs and flag corrections.
- Resolve revision requests before production proceeds.

**Printing and export**

- Send approved orders to printing.
- Generate print-sheet outputs.
- Mark printing orders completed.
- Download available ID-card and print-sheet ZIP files.

### Institution — Client Admin

The Institution workspace supports data submission, order monitoring, and approval of final ID content.

**Subject-list submission**

- Create an order for a production batch.
- Upload an XLSX subject list.
- Preview columns from the uploaded spreadsheet.
- Retain custom fields for use in ID layouts.
- Edit imported values before submission.
- Identify missing names and browse records through pagination.
- Generate subject records and QR assets during order creation.

**Coordinator management**

- Create Coordinator invitations.
- Associate Coordinators with the institution.
- Provide account activation access for designated personnel.

**Order monitoring and proofing**

- Track submitted orders and processing progress.
- Inspect generated subject ID proofs.
- Approve individual IDs.
- Request revisions for incorrect content.
- Approve a complete batch for the next production stage.
- View completed orders while their records remain retained.

### Coordinator — Client Liaison

The Coordinator workspace supports photography-day activities and subject verification.

**Subject lookup and QR display**

- Search for subjects within the institution’s orders.
- View subject details.
- Display QR codes for use during photography.

**Photography attendance**

- View the subject roster.
- Mark subjects as photographed.
- Monitor photographed, pending, and walk-in counts.
- Retrieve updated roster information through automatic refreshes.

**Proof review**

- Inspect available proofs.
- Request revisions for subject IDs requiring correction.

**Walk-in registration**

A Quick Add interface is available for walk-in registration. Coordinator access to this operation remains part of the pending permission alignment.

---

## Application Workflow

### 1. Institution Preparation

The Admin registers the institution and establishes account access. The Institution activates its account and invites Coordinators as needed.

### 2. Subject-List Submission

The Institution uploads its subject list, reviews the preview, corrects detected issues, and submits the order.

The system creates subject records and generates QR assets for photography preparation.

### 3. Operator Assignment and Layout Setup

The Admin assigns an Operator to the order.

The Operator configures the ID layout, places the required fields, previews the design, and saves the configured sides.

### 4. Photography and Photo Upload

Coordinators support subject lookup, QR display, and photography attendance.

The Operator uploads the collected photos to the selected order.

### 5. Automated Photo Processing

The processing engine performs the following sequence.

```text
Read Photo
    ↓
Decode QR Code
    ↓
Identify Subject Within the Order
    ↓
Detect and Crop Face
    ↓
Apply Saved Layouts
    ↓
Render ID Outputs
```

Subjects requiring intervention enter manual review.

### 6. Manual Review and Corrections

The Operator resolves photo-linking, cropping, layout, or processing issues and retries affected subjects.

The order becomes available for proofing after the processing run. Outstanding subject issues continue to block batch approval.

### 7. Proofing and Institution Approval

The Institution reviews the generated IDs and requests revisions where necessary.

A complete batch can advance to `APPROVED` when its subjects are processed and the required rendered outputs are available.

### 8. Printing and Completion

The assigned Operator sends the approved order to printing.

Print-sheet generation must succeed before the order advances to `PRINTING`. The Operator marks the order `COMPLETED` after production is finished.

### 9. Contract-End Deactivation

After the contract ends and all orders are completed or cancelled, the Admin can deactivate the institution and initiate the confirmed data-cleanup workflow.

---

## Order Lifecycle

```text
PENDING
    ↓
PROCESSING
    ↓
PROOFING
    ↓
APPROVED
    ↓
PRINTING
    ↓
COMPLETED
```

| Status | Meaning |
| --- | --- |
| `PENDING` | The order is being prepared for processing |
| `PROCESSING` | Photo processing and ID generation are running |
| `PROOFING` | Outputs and outstanding issues are available for review |
| `APPROVED` | The batch has passed the approval gate |
| `PRINTING` | The order has advanced to printing |
| `COMPLETED` | Production is complete |
| `FAILED` | An order-level processing failure occurred |
| `CANCELLED` | The order was cancelled |

**Awaiting Layout** and **Needs Review** are dashboard display stages derived from the order’s current data.

## Workflow Controls

| Control | Purpose |
| --- | --- |
| Assigned-order access | Restricts Operator production actions to assigned orders |
| Saved front layout | Establishes a layout requirement before batch processing |
| Batch completeness | Blocks approval while subjects remain unresolved or required outputs are missing |
| Approval before printing | Establishes the normal approval gate for production |
| Print-generation validation | Preserves the approved state when print-sheet generation fails |
| Status checks | Rejects production actions submitted against a changed order status |
| Audit records | Records administrative overrides and deactivation activity |
| Confirmed cleanup | Requires contract and order conditions before permanent institution cleanup |

## Remaining Work

| Priority | Work required |
| --- | --- |
| High | Complete duplicate detection for institution-selected identifiers and flexible spreadsheet fields |
| High | Define and implement the stakeholder-requested Deferred-record workflow |
| High | Align Coordinator Quick Add permissions with the intended photography-day workflow |
| High | Validate the full workflow using representative production batches |
| High | Strengthen processing recovery and background-job reliability |
| Medium | Complete flexible preview integration for CSV, XLS, and worksheet selection |
| Medium | Replace generated live confidence and Operator-productivity figures with measured data |
| Medium | Tighten administrative override conditions, required reasons, and audit consistency |
| Medium | Complete usability, responsive-layout, and operational acceptance testing |

The next project milestone is an integrated production pilot covering data submission, layout publication, photo processing, corrections, institution approval, and verified final outputs.
